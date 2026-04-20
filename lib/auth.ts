import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import crypto from "node:crypto";
import { prisma } from "@/lib/prisma";
import type { User } from "@prisma/client";
import type { AppRole } from "@/lib/roles";

const SESSION_COOKIE = "fc_session";
const SESSION_DAYS = 30;

export function hashPassword(password: string) {
  const salt = crypto.randomBytes(16);
  const hash = crypto.scryptSync(password, salt, 64);
  return `scrypt:${salt.toString("hex")}:${hash.toString("hex")}`;
}

export function verifyPassword(password: string, stored: string) {
  const parts = stored.split(":");
  if (parts.length !== 3 || parts[0] !== "scrypt") return false;
  const salt = Buffer.from(parts[1], "hex");
  const hash = Buffer.from(parts[2], "hex");
  const attempt = crypto.scryptSync(password, salt, 64);
  return crypto.timingSafeEqual(hash, attempt);
}

export async function createSession(userId: string) {
  const token = crypto.randomBytes(32).toString("hex");
  const expiresAt = new Date(Date.now() + SESSION_DAYS * 24 * 60 * 60 * 1000);
  await prisma.session.create({
    data: { userId, token, expiresAt },
  });
  const cookieStore = await cookies();
  cookieStore.set(SESSION_COOKIE, token, {
    httpOnly: true,
    sameSite: "lax",
    path: "/",
    expires: expiresAt,
  });
}

export async function clearSession() {
  const cookieStore = await cookies();
  const token = cookieStore.get(SESSION_COOKIE)?.value;
  if (token) {
    await prisma.session.deleteMany({ where: { token } });
  }
  cookieStore.set(SESSION_COOKIE, "", { path: "/", expires: new Date(0) });
}

export async function getSessionUser() {
  const cookieStore = await cookies();
  const token = cookieStore.get(SESSION_COOKIE)?.value;
  if (!token) return null;

  const session = await prisma.session.findUnique({
    where: { token },
    include: { user: { include: { member: true } } },
  });

  if (!session) return null;
  if (session.expiresAt < new Date()) {
    await prisma.session.deleteMany({ where: { id: session.id } });
    return null;
  }

  return session.user;
}

export async function requireRole(roles: AppRole[]) {
  const user = await getSessionUser();
  if (!user) redirect("/login");
  if (!roles.includes(user.role as AppRole)) redirect("/");
  return user as User & { member?: { id: string; fullName: string } | null };
}

export async function requireUser() {
  const user = await getSessionUser();
  if (!user) redirect("/login");
  return user as User & { member?: { id: string; fullName: string } | null };
}

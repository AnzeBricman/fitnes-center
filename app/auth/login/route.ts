import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { ROLE } from "@/lib/roles";
import {
  createSessionToken,
  getSessionCookieName,
  getSessionCookieOptions,
  verifyPassword,
} from "@/lib/auth";

function getString(formData: FormData, key: string) {
  return formData.get(key)?.toString().trim() ?? "";
}

function normalizeEmail(value: string) {
  return value.trim().toLowerCase();
}

function redirectWithError(request: Request, error: string) {
  return NextResponse.redirect(new URL(`/login?error=${error}`, request.url));
}

export async function POST(request: Request) {
  const formData = await request.formData();
  const email = normalizeEmail(getString(formData, "email"));
  const password = getString(formData, "password");

  if (!email || !password) {
    return redirectWithError(request, "missing");
  }

  const user = await prisma.user.findUnique({ where: { email } });
  if (!user || !verifyPassword(password, user.passwordHash)) {
    return redirectWithError(request, "invalid");
  }

  const { token, expiresAt } = await createSessionToken(user.id);
  const response = NextResponse.redirect(new URL(user.role === ROLE.MEMBER ? "/account" : "/admin", request.url));
  response.cookies.set(getSessionCookieName(), token, getSessionCookieOptions(expiresAt));

  return response;
}

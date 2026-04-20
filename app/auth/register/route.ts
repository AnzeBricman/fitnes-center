import { NextResponse } from "next/server";
import { MemberStatus, SubscriptionStatus } from "@prisma/client";
import { prisma } from "@/lib/prisma";
import { ROLE } from "@/lib/roles";
import {
  createSessionToken,
  getSessionCookieName,
  getSessionCookieOptions,
  hashPassword,
} from "@/lib/auth";

function getString(formData: FormData, key: string) {
  return formData.get(key)?.toString().trim() ?? "";
}

function normalizeEmail(value: string) {
  return value.trim().toLowerCase();
}

function redirectWithError(request: Request, error: string) {
  return NextResponse.redirect(new URL(`/register?error=${error}`, request.url));
}

export async function POST(request: Request) {
  const formData = await request.formData();
  const fullName = getString(formData, "fullName");
  const email = normalizeEmail(getString(formData, "email"));
  const password = getString(formData, "password");
  const planId = getString(formData, "planId");

  if (!fullName || !email || !password || !planId) {
    return redirectWithError(request, "missing");
  }

  if (password.length < 8) {
    return redirectWithError(request, "password");
  }

  const existingUser = await prisma.user.findUnique({ where: { email } });
  if (existingUser) {
    return redirectWithError(request, "exists");
  }

  const plan = await prisma.subscriptionPlan.findUnique({ where: { id: planId } });
  if (!plan) {
    return redirectWithError(request, "plan");
  }

  const member = await prisma.member.upsert({
    where: { email },
    update: { fullName, status: MemberStatus.ACTIVE },
    create: { fullName, email, status: MemberStatus.ACTIVE, joinedAt: new Date() },
  });

  const startDate = new Date();
  const endDate = new Date(startDate);
  endDate.setDate(endDate.getDate() + plan.durationDays);

  await prisma.subscription.create({
    data: {
      memberId: member.id,
      planId: plan.id,
      startDate,
      endDate,
      active: true,
      status: SubscriptionStatus.ACTIVE,
    },
  });

  const user = await prisma.user.create({
    data: {
      email,
      passwordHash: hashPassword(password),
      role: ROLE.MEMBER,
      memberId: member.id,
    },
  });

  const { token, expiresAt } = await createSessionToken(user.id);
  const response = NextResponse.redirect(new URL("/account", request.url));
  response.cookies.set(getSessionCookieName(), token, getSessionCookieOptions(expiresAt));

  return response;
}

import { NextResponse } from "next/server";
import { MemberStatus, PaymentProvider, PaymentStatus, SubscriptionStatus } from "@prisma/client";
import { prisma } from "@/lib/prisma";
import { ROLE } from "@/lib/roles";
import { getBaseUrl, getStripe } from "@/lib/stripe";
import {
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

  const stripe = getStripe();
  if (!stripe) {
    return redirectWithError(request, "stripe");
  }

  const member = await prisma.member.upsert({
    where: { email },
    update: { fullName, status: MemberStatus.INACTIVE },
    create: { fullName, email, status: MemberStatus.INACTIVE, joinedAt: new Date() },
  });

  const startDate = new Date();
  const endDate = new Date(startDate);
  endDate.setDate(endDate.getDate() + plan.durationDays);

  const subscription = await prisma.subscription.create({
    data: {
      memberId: member.id,
      planId: plan.id,
      startDate,
      endDate,
      active: false,
      status: SubscriptionStatus.PENDING,
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

  const payment = await prisma.payment.create({
    data: {
      memberId: member.id,
      subscriptionId: subscription.id,
      amountCents: plan.priceCents,
      provider: PaymentProvider.STRIPE,
      status: PaymentStatus.PENDING,
      description: `Narocnina ${plan.name} za ${member.fullName}`,
    },
  });

  const session = await stripe.checkout.sessions.create({
    mode: "payment",
    success_url: `${getBaseUrl()}/auth/register/success?session_id={CHECKOUT_SESSION_ID}`,
    cancel_url: `${getBaseUrl()}/register?payment=cancelled&plan=${plan.id}`,
    customer_email: email,
    metadata: {
      paymentId: payment.id,
      subscriptionId: subscription.id,
      memberId: member.id,
      userId: user.id,
      flow: "registration",
    },
    line_items: [
      {
        quantity: 1,
        price_data: {
          currency: "eur",
          unit_amount: plan.priceCents,
          product_data: {
            name: plan.name,
            description: plan.description || "Mesecna fitnes narocnina",
          },
        },
      },
    ],
  });

  await prisma.payment.update({
    where: { id: payment.id },
    data: { stripeCheckoutSessionId: session.id },
  });

  return NextResponse.redirect(
    session.url ?? new URL(`/register?error=stripe&plan=${plan.id}`, request.url),
    303,
  );
}

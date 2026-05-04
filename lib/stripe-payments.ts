import type Stripe from "stripe";
import { MemberStatus, PaymentStatus, SubscriptionStatus } from "@prisma/client";
import { prisma } from "@/lib/prisma";

function getPaymentIntentId(paymentIntent: string | Stripe.PaymentIntent | null) {
  if (!paymentIntent) return null;
  return typeof paymentIntent === "string" ? paymentIntent : paymentIntent.id;
}

export async function applyCheckoutSessionPayment(session: Stripe.Checkout.Session) {
  const paymentId = session.metadata?.paymentId;
  const subscriptionId = session.metadata?.subscriptionId;
  const memberId = session.metadata?.memberId;
  const userId = session.metadata?.userId ?? null;

  if (!paymentId || !subscriptionId || !memberId) {
    return { ok: false, reason: "missing_metadata" as const, userId };
  }

  const isPaid = session.payment_status === "paid";

  await prisma.payment.update({
    where: { id: paymentId },
    data: {
      status: isPaid ? PaymentStatus.PAID : PaymentStatus.FAILED,
      stripePaymentIntentId: getPaymentIntentId(session.payment_intent),
      paidAt: isPaid ? new Date() : null,
    },
  });

  if (!isPaid) {
    return { ok: false, reason: "not_paid" as const, userId };
  }

  await prisma.subscription.update({
    where: { id: subscriptionId },
    data: {
      active: true,
      status: SubscriptionStatus.ACTIVE,
    },
  });

  await prisma.member.update({
    where: { id: memberId },
    data: { status: MemberStatus.ACTIVE },
  });

  return { ok: true, userId };
}

export async function markCheckoutSessionFailed(session: Stripe.Checkout.Session) {
  const paymentId = session.metadata?.paymentId;
  if (!paymentId) {
    return { ok: false, reason: "missing_metadata" as const };
  }

  await prisma.payment.update({
    where: { id: paymentId },
    data: {
      status: PaymentStatus.FAILED,
      stripePaymentIntentId: getPaymentIntentId(session.payment_intent),
    },
  });

  return { ok: true };
}

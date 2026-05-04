import { NextResponse } from "next/server";
import { createSessionToken, getSessionCookieName, getSessionCookieOptions } from "@/lib/auth";
import { getStripe } from "@/lib/stripe";
import { applyCheckoutSessionPayment } from "@/lib/stripe-payments";

export async function GET(request: Request) {
  const url = new URL(request.url);
  const sessionId = url.searchParams.get("session_id");

  if (!sessionId) {
    return NextResponse.redirect(new URL("/register?error=stripe", request.url));
  }

  const stripe = getStripe();
  if (!stripe) {
    return NextResponse.redirect(new URL("/register?error=stripe", request.url));
  }

  const session = await stripe.checkout.sessions.retrieve(sessionId, {
    expand: ["payment_intent"],
  });

  const result = await applyCheckoutSessionPayment(session);
  if (!result.ok) {
    return NextResponse.redirect(new URL("/register?payment=failed", request.url));
  }

  if (!result.userId) {
    return NextResponse.redirect(new URL("/register?error=stripe", request.url));
  }

  const { token, expiresAt } = await createSessionToken(result.userId);
  const response = NextResponse.redirect(new URL("/account?payment=success", request.url));
  response.cookies.set(getSessionCookieName(), token, getSessionCookieOptions(expiresAt));
  return response;
}

import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireUser } from "@/lib/session";
import { getAppUrl, getProPriceId, getStripe } from "@/lib/billing/stripe";

export async function POST(req: Request) {
  const sessionUser = await requireUser();
  if (!sessionUser) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const body = (await req.json().catch(() => ({}))) as { interval?: string };
    const interval = body.interval === "year" ? "year" : "month";
    const priceId = getProPriceId(interval);
    const stripe = getStripe();
    const appUrl = getAppUrl();

    const user = await prisma.user.findUnique({
      where: { id: sessionUser.id },
      select: {
        id: true,
        email: true,
        stripeCustomerId: true,
      },
    });
    if (!user) {
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }

    let customerId = user.stripeCustomerId;
    if (!customerId) {
      const customer = await stripe.customers.create({
        email: user.email,
        metadata: { userId: user.id },
      });
      customerId = customer.id;
      await prisma.user.update({
        where: { id: user.id },
        data: { stripeCustomerId: customerId },
      });
    }

    const checkout = await stripe.checkout.sessions.create({
      mode: "subscription",
      customer: customerId,
      client_reference_id: user.id,
      line_items: [{ price: priceId, quantity: 1 }],
      success_url: `${appUrl}/settings?billing=success`,
      cancel_url: `${appUrl}/pricing?billing=cancel`,
      metadata: {
        userId: user.id,
        interval,
      },
      subscription_data: {
        metadata: {
          userId: user.id,
        },
      },
      allow_promotion_codes: true,
    });

    if (!checkout.url) {
      return NextResponse.json({ error: "Failed to create Checkout session" }, { status: 500 });
    }

    return NextResponse.json({ url: checkout.url, sessionId: checkout.id });
  } catch (err) {
    const message = err instanceof Error ? err.message : "Checkout failed";
    console.error("checkout error", err);
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
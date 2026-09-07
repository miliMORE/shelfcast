import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireUser } from "@/lib/session";
import { getAppUrl, getStripe } from "@/lib/billing/stripe";

export async function POST() {
  const sessionUser = await requireUser();
  if (!sessionUser) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const user = await prisma.user.findUnique({
      where: { id: sessionUser.id },
      select: { stripeCustomerId: true },
    });

    if (!user?.stripeCustomerId) {
      return NextResponse.json(
        { error: "No Stripe customer on file. Upgrade to Pro first." },
        { status: 400 }
      );
    }

    const stripe = getStripe();
    const appUrl = getAppUrl();
    const portal = await stripe.billingPortal.sessions.create({
      customer: user.stripeCustomerId,
      return_url: `${appUrl}/settings`,
    });

    return NextResponse.json({ url: portal.url });
  } catch (err) {
    const message = err instanceof Error ? err.message : "Portal session failed";
    console.error("portal error", err);
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
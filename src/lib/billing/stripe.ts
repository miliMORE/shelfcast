import Stripe from "stripe";

let stripeSingleton: Stripe | null = null;

export function getStripe(): Stripe {
  const key = process.env.STRIPE_SECRET_KEY;
  if (!key) {
    throw new Error("STRIPE_SECRET_KEY is not configured");
  }
  if (!stripeSingleton) {
    stripeSingleton = new Stripe(key, {
      apiVersion: "2026-08-26.dahlia",
      typescript: true,
    });
  }
  return stripeSingleton;
}

export function getAppUrl(): string {
  return (
    process.env.NEXT_PUBLIC_APP_URL ||
    process.env.NEXTAUTH_URL ||
    "http://localhost:3000"
  ).replace(/\/$/, "");
}

export function getProPriceId(interval: "month" | "year" = "month"): string {
  if (interval === "year") {
    const yearly = process.env.STRIPE_PRICE_PRO_YEARLY;
    if (!yearly) {
      throw new Error("STRIPE_PRICE_PRO_YEARLY is not configured");
    }
    return yearly;
  }
  const monthly = process.env.STRIPE_PRICE_PRO_MONTHLY;
  if (!monthly) {
    throw new Error("STRIPE_PRICE_PRO_MONTHLY is not configured");
  }
  return monthly;
}
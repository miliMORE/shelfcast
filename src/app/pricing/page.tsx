import Link from "next/link";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { UpgradeButton } from "@/components/UpgradeButton";
import { prisma } from "@/lib/prisma";
import { effectivePlan } from "@/lib/billing/usage";
import { planLabel } from "@/lib/billing/plans";

export default async function PricingPage({
  searchParams,
}: {
  searchParams?: Promise<{ billing?: string }>;
}) {
  const params = searchParams ? await searchParams : {};
  const session = await getServerSession(authOptions);
  let currentPlan: string | null = null;

  if (session?.user?.id) {
    const user = await prisma.user.findUnique({
      where: { id: session.user.id },
      select: { plan: true, planStatus: true },
    });
    if (user) currentPlan = planLabel(effectivePlan(user));
  }

  return (
    <div className="space-y-10">
      <div className="mx-auto max-w-2xl space-y-3 text-center">
        <h1 className="text-3xl font-bold tracking-tight text-brand-900">Pricing</h1>
        <p className="text-slate-600">
          Start free with demo voice. Upgrade to Pro for real OpenAI TTS and a full novel each month.
        </p>
        {params.billing === "cancel" && (
          <p className="text-sm font-medium text-accent-700">Checkout canceled — no charges were made.</p>
        )}
        {currentPlan && (
          <p className="text-sm text-slate-500">
            Your current plan: <span className="font-medium text-slate-800">{currentPlan}</span>
            {" · "}
            <Link href="/settings">Manage in Settings</Link>
          </p>
        )}
      </div>

      <div className="grid gap-6 md:grid-cols-2">
        <div className="flex flex-col rounded-2xl border border-slate-200 bg-white p-6 shadow-soft">
          <h2 className="text-xl font-semibold text-slate-900">Free</h2>
          <p className="mt-1 text-3xl font-bold text-slate-900">$0</p>
          <p className="mt-1 text-sm text-slate-500">No card required</p>
          <ul className="mt-4 flex-1 space-y-2 text-sm text-slate-600">
            <li>Mock TTS only (demo voice — OpenAI ignored even if configured)</li>
            <li>Up to 2 books in your library</li>
            <li>~15,000 characters synthesized per month (enough to try a short chapter)</li>
            <li>Private audio download</li>
          </ul>
          <Link
            href={session ? "/library" : "/signup"}
            className="mt-6 inline-block rounded-lg bg-brand-800 px-4 py-2.5 text-center text-sm font-medium text-white no-underline hover:bg-brand-900"
          >
            {session ? "Go to library" : "Get started free"}
          </Link>
        </div>

        <div className="relative flex flex-col rounded-2xl border-2 border-accent-400 bg-brand-50/80 p-6 shadow-soft">
          <span className="absolute -top-3 left-6 inline-flex items-center rounded-full bg-accent-500 px-2.5 py-0.5 text-xs font-semibold text-white shadow-sm">
            Recommended
          </span>
          <h2 className="text-xl font-semibold text-brand-900">Pro</h2>
          <p className="mt-1 text-3xl font-bold text-brand-900">
            $12<span className="text-base font-normal text-brand-700">/month</span>
          </p>
          <p className="mt-1 text-sm text-brand-800/70">
            or <strong>$99/year</strong> (~2 months free)
          </p>
          <ul className="mt-4 flex-1 space-y-2 text-sm text-brand-900/80">
            <li>Real OpenAI TTS when OPENAI_API_KEY is set on the server</li>
            <li>500,000 characters / month (~1 full novel)</li>
            <li>Unlimited books (soft cap 100)</li>
            <li>Stripe Checkout + Customer Portal to cancel or manage</li>
            <li>MP3 download when using OpenAI TTS</li>
          </ul>
          <div className="mt-6 flex flex-col gap-2 sm:flex-row sm:items-start">
            <UpgradeButton interval="month" label="Upgrade to Pro" />
            <UpgradeButton
              interval="year"
              label="Pro Annual — $99/yr"
              className="rounded-md border border-brand-600 bg-white px-4 py-2 text-sm font-medium text-brand-800 hover:bg-brand-50 disabled:opacity-60"
            />
          </div>
          {!session && (
            <p className="mt-2 text-xs text-brand-900/70">
              You will be asked to log in before checkout.
            </p>
          )}
        </div>
      </div>
    </div>
  );
}
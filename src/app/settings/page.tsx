import { redirect } from "next/navigation";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import Link from "next/link";
import { getUsageSnapshot } from "@/lib/billing/usage";
import { planLabel } from "@/lib/billing/plans";
import { ManageBillingButton } from "@/components/ManageBillingButton";
import { UpgradeButton } from "@/components/UpgradeButton";

export default async function SettingsPage({
  searchParams,
}: {
  searchParams?: Promise<{ billing?: string }>;
}) {
  const params = searchParams ? await searchParams : {};
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) redirect("/login");

  const user = await prisma.user.findUnique({
    where: { id: session.user.id },
    select: { email: true, name: true, createdAt: true },
  });

  const usage = await getUsageSnapshot(session.user.id);
  const planName = planLabel(usage?.effectivePlan);
  const isPro = usage?.effectivePlan === "PRO";
  const used = usage?.ttsCharsUsedMonth ?? 0;
  const limit = usage?.ttsCharsLimit ?? 15_000;
  const pct = limit > 0 ? Math.min(100, Math.round((used / limit) * 100)) : 0;

  return (
    <div className="mx-auto max-w-lg space-y-6">
      <h1 className="text-2xl font-bold">Account settings</h1>

      {params.billing === "success" && (
        <div className="rounded-lg border border-green-200 bg-green-50 px-4 py-3 text-sm text-green-800">
          Payment successful. If Pro is not showing yet, wait a few seconds for the Stripe webhook,
          then refresh.
        </div>
      )}

      <div className="rounded-xl border border-slate-200 bg-white p-6 shadow-sm space-y-3 text-sm">
        <div>
          <div className="text-slate-500">Name</div>
          <div className="font-medium">{user?.name || "—"}</div>
        </div>
        <div>
          <div className="text-slate-500">Email</div>
          <div className="font-medium">{user?.email}</div>
        </div>
        <div>
          <div className="text-slate-500">Member since</div>
          <div className="font-medium">{user?.createdAt?.toISOString().slice(0, 10)}</div>
        </div>
      </div>

      <div className="rounded-xl border border-slate-200 bg-white p-6 shadow-sm space-y-4">
        <div className="flex items-start justify-between gap-3">
          <div>
            <h2 className="font-semibold text-slate-900">Plan &amp; usage</h2>
            <p className="text-sm text-slate-600">
              Current plan: <span className="font-medium text-slate-900">{planName}</span>
              {usage?.planStatus ? (
                <span className="text-slate-500"> ({usage.planStatus})</span>
              ) : null}
            </p>
          </div>
          {!isPro && (
            <Link href="/pricing" className="text-sm no-underline text-brand-700 hover:text-brand-800">
              View pricing
            </Link>
          )}
        </div>

        {!isPro && (
          <p className="rounded-md bg-amber-50 border border-amber-100 px-3 py-2 text-sm text-amber-900">
            Free plan uses <strong>demo voice</strong> (Mock TTS) only — OpenAI is ignored even if
            configured. Upgrade to Pro for real narration when an API key is set on the server.
          </p>
        )}

        {isPro && (
          <p className="rounded-md bg-brand-50 border border-brand-100 px-3 py-2 text-sm text-brand-900">
            Pro: real OpenAI TTS when <code className="text-xs">OPENAI_API_KEY</code> is configured;
            otherwise Mock TTS is used as a fallback.
          </p>
        )}

        <div>
          <div className="mb-1 flex justify-between text-xs text-slate-500">
            <span>TTS characters this month</span>
            <span>
              {used.toLocaleString()} / {limit.toLocaleString()}
            </span>
          </div>
          <div className="h-2 overflow-hidden rounded-full bg-slate-100">
            <div
              className="h-full rounded-full bg-brand-600 transition-all"
              style={{ width: `${pct}%` }}
            />
          </div>
        </div>

        <div className="flex flex-wrap gap-3 pt-1">
          {isPro || usage?.stripeCustomerId ? <ManageBillingButton /> : null}
          {!isPro && <UpgradeButton interval="month" label="Upgrade to Pro" />}
        </div>
      </div>
    </div>
  );
}
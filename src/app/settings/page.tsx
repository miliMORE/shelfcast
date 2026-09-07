import { redirect } from "next/navigation";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import Link from "next/link";

export default async function SettingsPage() {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) redirect("/login");

  const user = await prisma.user.findUnique({
    where: { id: session.user.id },
    select: { email: true, name: true, plan: true, createdAt: true },
  });

  return (
    <div className="mx-auto max-w-lg space-y-6">
      <h1 className="text-2xl font-bold">Account settings</h1>
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
          <div className="text-slate-500">Plan</div>
          <div className="font-medium">{user?.plan}</div>
        </div>
        <div>
          <div className="text-slate-500">Member since</div>
          <div className="font-medium">{user?.createdAt?.toISOString().slice(0, 10)}</div>
        </div>
      </div>
      <p className="text-sm text-slate-600">
        Upgrade options are stubbed on the <Link href="/pricing">Pricing</Link> page. Billing is not wired in this MVP.
      </p>
    </div>
  );
}

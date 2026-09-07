"use client";

import { useState } from "react";
import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";

type Props = {
  interval?: "month" | "year";
  label?: string;
  className?: string;
};

export function UpgradeButton({
  interval = "month",
  label,
  className,
}: Props) {
  const { data: session, status } = useSession();
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const text =
    label ||
    (interval === "year" ? "Upgrade — Pro Annual" : "Upgrade to Pro");

  async function onClick() {
    setError("");
    if (status === "loading") return;
    if (!session?.user) {
      router.push("/login?callbackUrl=/pricing");
      return;
    }

    setLoading(true);
    try {
      const res = await fetch("/api/billing/checkout", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ interval }),
      });
      const data = await res.json();
      if (!res.ok) {
        setError(data.error || "Could not start checkout");
        setLoading(false);
        return;
      }
      if (data.url) {
        window.location.href = data.url;
        return;
      }
      setError("No checkout URL returned");
      setLoading(false);
    } catch {
      setError("Checkout request failed");
      setLoading(false);
    }
  }

  return (
    <div className="space-y-2">
      <button
        type="button"
        onClick={onClick}
        disabled={loading}
        className={
          className ||
          "rounded-md bg-brand-600 px-4 py-2 text-sm font-medium text-white hover:bg-brand-700 disabled:opacity-60"
        }
      >
        {loading ? "Redirecting…" : text}
      </button>
      {error && <p className="text-xs text-red-600">{error}</p>}
    </div>
  );
}
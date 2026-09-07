"use client";

import { FormEvent, useState } from "react";
import { signIn } from "next-auth/react";
import { useRouter } from "next/navigation";
import Link from "next/link";

export default function LoginPage() {
  const router = useRouter();
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  async function onSubmit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setLoading(true);
    setError("");
    const fd = new FormData(e.currentTarget);
    const res = await signIn("credentials", {
      email: String(fd.get("email") || ""),
      password: String(fd.get("password") || ""),
      redirect: false,
    });
    setLoading(false);
    if (res?.error) {
      setError("Invalid email or password");
      return;
    }
    router.push("/library");
    router.refresh();
  }

  return (
    <div className="mx-auto max-w-md space-y-6">
      <h1 className="text-2xl font-bold">Log in</h1>
      <form onSubmit={onSubmit} className="space-y-4 rounded-xl border border-slate-200 bg-white p-6 shadow-sm">
        {error && <p className="text-sm text-red-600">{error}</p>}
        <label className="block text-sm">
          <span className="mb-1 block font-medium">Email</span>
          <input name="email" type="email" required className="w-full rounded-md border border-slate-300 px-3 py-2" />
        </label>
        <label className="block text-sm">
          <span className="mb-1 block font-medium">Password</span>
          <input name="password" type="password" required className="w-full rounded-md border border-slate-300 px-3 py-2" />
        </label>
        <button
          type="submit"
          disabled={loading}
          className="w-full rounded-md bg-brand-600 py-2.5 font-medium text-white hover:bg-brand-700 disabled:opacity-60"
        >
          {loading ? "Signing in…" : "Sign in"}
        </button>
      </form>
      <p className="text-sm text-slate-600">
        No account? <Link href="/signup">Sign up</Link>
      </p>
    </div>
  );
}

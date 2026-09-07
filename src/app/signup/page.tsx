"use client";

import { FormEvent, useState } from "react";
import { signIn } from "next-auth/react";
import { useRouter } from "next/navigation";
import Link from "next/link";

export default function SignupPage() {
  const router = useRouter();
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  async function onSubmit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setLoading(true);
    setError("");
    const fd = new FormData(e.currentTarget);
    const payload = {
      name: String(fd.get("name") || ""),
      email: String(fd.get("email") || ""),
      password: String(fd.get("password") || ""),
    };
    const res = await fetch("/api/auth/signup", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    });
    const data = await res.json();
    if (!res.ok) {
      setLoading(false);
      setError(data.error || "Signup failed");
      return;
    }
    const login = await signIn("credentials", {
      email: payload.email,
      password: payload.password,
      redirect: false,
    });
    setLoading(false);
    if (login?.error) {
      router.push("/login");
      return;
    }
    router.push("/library");
    router.refresh();
  }

  return (
    <div className="mx-auto max-w-md space-y-6">
      <h1 className="text-2xl font-bold">Create your account</h1>
      <form onSubmit={onSubmit} className="space-y-4 rounded-xl border border-slate-200 bg-white p-6 shadow-sm">
        {error && <p className="text-sm text-red-600">{error}</p>}
        <label className="block text-sm">
          <span className="mb-1 block font-medium">Name</span>
          <input name="name" type="text" className="w-full rounded-md border border-slate-300 px-3 py-2" />
        </label>
        <label className="block text-sm">
          <span className="mb-1 block font-medium">Email</span>
          <input name="email" type="email" required className="w-full rounded-md border border-slate-300 px-3 py-2" />
        </label>
        <label className="block text-sm">
          <span className="mb-1 block font-medium">Password (min 8)</span>
          <input name="password" type="password" minLength={8} required className="w-full rounded-md border border-slate-300 px-3 py-2" />
        </label>
        <label className="flex items-start gap-2 text-xs text-slate-600">
          <input type="checkbox" required className="mt-0.5" />
          <span>
            I warrant I own or have rights to any books I upload, will not circumvent DRM, and
            understand audio is private to my account (ToS stub).
          </span>
        </label>
        <button
          type="submit"
          disabled={loading}
          className="w-full rounded-md bg-brand-600 py-2.5 font-medium text-white hover:bg-brand-700 disabled:opacity-60"
        >
          {loading ? "Creating…" : "Sign up"}
        </button>
      </form>
      <p className="text-sm text-slate-600">
        Already have an account? <Link href="/login">Log in</Link>
      </p>
    </div>
  );
}

"use client";

import Link from "next/link";
import { useSession, signOut } from "next-auth/react";

export function Nav() {
  const { data: session } = useSession();

  return (
    <header className="border-b border-slate-200 bg-white/80 backdrop-blur sticky top-0 z-40">
      <div className="mx-auto flex max-w-6xl items-center justify-between px-4 py-3">
        <Link href="/" className="text-lg font-semibold text-brand-800 no-underline">
          ShelfCast
        </Link>
        <nav className="flex items-center gap-4 text-sm">
          <Link href="/pricing" className="text-slate-600 hover:text-slate-900 no-underline">
            Pricing
          </Link>
          {session ? (
            <>
              <Link href="/library" className="text-slate-600 hover:text-slate-900 no-underline">
                Library
              </Link>
              <Link href="/settings" className="text-slate-600 hover:text-slate-900 no-underline">
                Settings
              </Link>
              <button
                onClick={() => signOut({ callbackUrl: "/" })}
                className="rounded-md bg-slate-100 px-3 py-1.5 text-slate-700 hover:bg-slate-200"
              >
                Sign out
              </button>
            </>
          ) : (
            <>
              <Link href="/login" className="text-slate-600 hover:text-slate-900 no-underline">
                Log in
              </Link>
              <Link
                href="/signup"
                className="rounded-md bg-brand-600 px-3 py-1.5 text-white no-underline hover:bg-brand-700"
              >
                Sign up
              </Link>
            </>
          )}
        </nav>
      </div>
    </header>
  );
}

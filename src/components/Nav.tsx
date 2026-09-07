"use client";

import Link from "next/link";
import { useSession, signOut } from "next-auth/react";

export function Nav() {
  const { data: session } = useSession();

  return (
    <header className="sticky top-0 z-40 border-b border-slate-200/80 bg-white/90 backdrop-blur-md">
      <div className="mx-auto flex h-16 max-w-6xl items-center justify-between px-4 sm:px-6">
        <Link
          href="/"
          className="flex items-center gap-2.5 text-lg font-semibold tracking-tight text-brand-900 no-underline"
        >
          {/* Plain img so the logo always renders (next/image can fail silently in some setups) */}
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src="/logo.png"
            alt="ShelfCast logo"
            width={36}
            height={36}
            className="h-9 w-9 shrink-0 object-contain"
          />
          <span>ShelfCast</span>
        </Link>
        <nav className="flex items-center gap-1 sm:gap-3 text-sm">
          <Link
            href="/pricing"
            className="rounded-md px-2.5 py-1.5 text-slate-600 no-underline hover:bg-slate-100 hover:text-slate-900"
          >
            Pricing
          </Link>
          {session ? (
            <>
              <Link
                href="/library"
                className="rounded-md px-2.5 py-1.5 text-slate-600 no-underline hover:bg-slate-100 hover:text-slate-900"
              >
                Library
              </Link>
              <Link
                href="/settings"
                className="rounded-md px-2.5 py-1.5 text-slate-600 no-underline hover:bg-slate-100 hover:text-slate-900"
              >
                Settings
              </Link>
              <button
                type="button"
                onClick={() => signOut({ callbackUrl: "/" })}
                className="ml-1 rounded-lg border border-slate-200 bg-white px-3 py-1.5 font-medium text-slate-700 shadow-sm hover:bg-slate-50"
              >
                Sign out
              </button>
            </>
          ) : (
            <>
              <Link
                href="/login"
                className="rounded-md px-2.5 py-1.5 text-slate-600 no-underline hover:bg-slate-100 hover:text-slate-900"
              >
                Log in
              </Link>
              <Link
                href="/signup"
                className="ml-1 rounded-lg bg-brand-600 px-3.5 py-1.5 font-medium text-white no-underline shadow-sm hover:bg-brand-700"
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
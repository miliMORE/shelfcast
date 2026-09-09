"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";

export function LibraryBookRow({
  id,
  title,
  meta,
}: {
  id: string;
  title: string;
  meta: string;
}) {
  const router = useRouter();
  const [busy, setBusy] = useState(false);

  async function onDelete() {
    if (!confirm("Delete this book and its audio?")) return;
    setBusy(true);
    const res = await fetch("/api/books/" + id, { method: "DELETE" });
    setBusy(false);
    if (res.ok) router.refresh();
  }

  return (
    <li className="flex flex-wrap items-center justify-between gap-3 px-5 py-4">
      <div>
        <Link
          href={"/books/" + id}
          className="font-medium text-slate-900 no-underline hover:text-brand-700"
        >
          {title}
        </Link>
        <p className="text-xs text-slate-500">{meta}</p>
      </div>
      <div className="flex gap-2">
        <Link
          href={"/books/" + id}
          className="rounded-lg border border-slate-200 px-3 py-1.5 text-sm font-medium text-slate-700 no-underline hover:bg-slate-50"
        >
          Open
        </Link>
        <button
          type="button"
          onClick={onDelete}
          disabled={busy}
          className="rounded-lg border border-red-200 px-3 py-1.5 text-sm font-medium text-red-700 hover:bg-red-50 disabled:opacity-60"
        >
          {busy ? "…" : "Delete"}
        </button>
      </div>
    </li>
  );
}

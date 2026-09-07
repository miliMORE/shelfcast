"use client";

import { useEffect, useState } from "react";
import Link from "next/link";

type Job = {
  id: string;
  status: string;
  progress: number;
  errorMessage?: string | null;
  chapterCount?: number | null;
  chunkCount?: number | null;
  ttsProvider?: string | null;
};

type Asset = { id: string; format: string; sizeBytes?: number | null };

type Book = {
  id: string;
  title: string;
  author?: string | null;
  format: string;
  originalFilename: string;
  jobs: Job[];
  assets: Asset[];
};

export function BookDetailClient({ bookId }: { bookId: string }) {
  const [book, setBook] = useState<Book | null>(null);
  const [busy, setBusy] = useState(false);

  async function load() {
    const res = await fetch("/api/books/" + bookId);
    if (!res.ok) return;
    const data = await res.json();
    setBook(data.book);
  }

  useEffect(() => {
    let cancelled = false;
    async function tick() {
      const res = await fetch("/api/books/" + bookId);
      if (!res.ok || cancelled) return;
      const data = await res.json();
      if (!cancelled) setBook(data.book);
    }
    tick();
    const t = setInterval(tick, 2000);
    return () => {
      cancelled = true;
      clearInterval(t);
    };
  }, [bookId]);

  async function reprocess() {
    setBusy(true);
    await fetch("/api/books/" + bookId + "/process", { method: "POST" });
    await load();
    setBusy(false);
  }

  if (!book) return <p className="text-sm text-slate-500">Loading…</p>;

  const job = book.jobs[0];
  const asset = book.assets[0];
  const done = job?.status === "COMPLETED" && !!asset;

  return (
    <div className="space-y-6">
      <div>
        <Link href="/library" className="text-sm text-slate-500 no-underline hover:text-brand-700">
          ← Library
        </Link>
        <h1 className="mt-2 text-2xl font-bold">{book.title}</h1>
        <p className="text-sm text-slate-600">
          {book.format} · {book.originalFilename}
          {book.author ? " · " + book.author : ""}
        </p>
      </div>

      <div className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm">
        <h2 className="mb-3 font-semibold">Conversion</h2>
        {job ? (
          <div className="space-y-3">
            <div className="flex flex-wrap gap-3 text-sm">
              <span className="rounded-full bg-slate-100 px-2.5 py-0.5">{job.status}</span>
              <span>{job.progress}%</span>
              {job.ttsProvider && <span>TTS: {job.ttsProvider}</span>}
              {job.chapterCount != null && <span>{job.chapterCount} chapters</span>}
              {job.chunkCount != null && <span>{job.chunkCount} chunks</span>}
            </div>
            <div className="h-2 overflow-hidden rounded-full bg-slate-100">
              <div
                className="h-full rounded-full bg-brand-500 transition-all"
                style={{ width: Math.min(100, job.progress) + "%" }}
              />
            </div>
            {job.errorMessage && (
              <p className="text-sm text-red-600">{job.errorMessage}</p>
            )}
          </div>
        ) : (
          <p className="text-sm text-slate-500">No job yet.</p>
        )}

        <div className="mt-4 flex flex-wrap gap-3">
          {done && (
            <a
              href={"/api/books/" + book.id + "/download"}
              className="rounded-md bg-brand-600 px-4 py-2 text-sm font-medium text-white no-underline hover:bg-brand-700"
            >
              Download audio (.{asset.format})
            </a>
          )}
          <button
            onClick={reprocess}
            disabled={busy}
            className="rounded-md border border-slate-300 px-4 py-2 text-sm hover:bg-slate-50 disabled:opacity-60"
          >
            {busy ? "Working…" : "Re-run conversion"}
          </button>
        </div>
      </div>
    </div>
  );
}

"use client";

import { FormEvent, useState } from "react";
import { useRouter } from "next/navigation";

export function UploadForm() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [message, setMessage] = useState("");

  async function onSubmit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setLoading(true);
    setError("");
    setMessage("");
    const fd = new FormData(e.currentTarget);
    const res = await fetch("/api/books", { method: "POST", body: fd });
    const data = await res.json();
    setLoading(false);
    if (!res.ok) {
      setError(data.error || "Upload failed");
      return;
    }
    setMessage("Upload started — conversion is running.");
    router.push("/books/" + data.book.id);
    router.refresh();
  }

  return (
    <form onSubmit={onSubmit} className="space-y-3 rounded-xl border border-dashed border-brand-300 bg-brand-50/50 p-5">
      <h2 className="font-semibold text-slate-900">Upload a book</h2>
      <p className="text-sm text-slate-600">EPUB or text-layer PDF. Max ~20MB for local MVP.</p>
      {error && <p className="text-sm text-red-600">{error}</p>}
      {message && <p className="text-sm text-green-700">{message}</p>}
      <input
        name="file"
        type="file"
        accept=".epub,.pdf,application/epub+zip,application/pdf"
        required
        className="block w-full text-sm"
      />
      <button
        type="submit"
        disabled={loading}
        className="rounded-md bg-brand-600 px-4 py-2 text-sm font-medium text-white hover:bg-brand-700 disabled:opacity-60"
      >
        {loading ? "Uploading…" : "Upload & convert"}
      </button>
    </form>
  );
}

import Link from "next/link";

export default function HomePage() {
  return (
    <div className="space-y-16">
      <section className="grid gap-10 md:grid-cols-2 md:items-center">
        <div className="space-y-6">
          <p className="text-sm font-medium uppercase tracking-wide text-brand-600">
            Private audiobooks from your shelf
          </p>
          <h1 className="text-4xl font-bold tracking-tight text-slate-900 sm:text-5xl">
            Turn owned EPUB &amp; PDF books into downloadable audio
          </h1>
          <p className="text-lg text-slate-600">
            ShelfCast is a web SaaS for readers who already own their books. Upload a text EPUB or
            text-layer PDF, convert with TTS, and download an MP3/WAV for personal listening.
            Audio stays private to your account.
          </p>
          <div className="flex flex-wrap gap-3">
            <Link
              href="/signup"
              className="rounded-lg bg-brand-600 px-5 py-2.5 font-medium text-white no-underline hover:bg-brand-700"
            >
              Start free
            </Link>
            <Link
              href="/pricing"
              className="rounded-lg border border-slate-300 bg-white px-5 py-2.5 font-medium text-slate-800 no-underline hover:bg-slate-50"
            >
              View pricing
            </Link>
          </div>
        </div>
        <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
          <h2 className="mb-4 text-sm font-semibold uppercase tracking-wide text-slate-500">
            How it works
          </h2>
          <ol className="space-y-4 text-slate-700">
            <li><span className="font-semibold text-brand-700">1.</span> Sign up and confirm you own the rights to the file.</li>
            <li><span className="font-semibold text-brand-700">2.</span> Upload EPUB or text PDF (scanned PDFs not supported yet).</li>
            <li><span className="font-semibold text-brand-700">3.</span> We extract chapters, synthesize speech, and assemble audio.</li>
            <li><span className="font-semibold text-brand-700">4.</span> Download your private audiobook (WAV via mock TTS; MP3 via OpenAI).</li>
          </ol>
        </div>
      </section>

      <section className="rounded-xl border border-amber-200 bg-amber-50 p-5 text-sm text-amber-900">
        <strong>Terms stub:</strong> By uploading, you warrant you own or have rights to convert the
        book for personal use. ShelfCast does not circumvent DRM. Generated audio is private to your
        account and not for redistribution.
      </section>
    </div>
  );
}

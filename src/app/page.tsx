import Link from "next/link";

export default function HomePage() {
  return (
    <div className="space-y-20">
      <section className="grid gap-12 md:grid-cols-2 md:items-center md:gap-14">
        <div className="space-y-7">
          <div className="flex items-center gap-4">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src="/logo.png"
              alt="ShelfCast logo"
              width={72}
              height={72}
              className="h-16 w-16 shrink-0 object-contain sm:h-[4.5rem] sm:w-[4.5rem]"
            />
            <p className="text-sm font-semibold uppercase tracking-wider text-accent-600">
              Private audiobooks from your shelf
            </p>
          </div>
          <h1 className="text-4xl font-bold tracking-tight text-brand-900 sm:text-5xl sm:leading-[1.1]">
            Turn owned EPUB &amp; PDF books into downloadable audio
          </h1>
          <p className="max-w-xl text-lg leading-relaxed text-slate-600">
            ShelfCast is a web SaaS for readers who already own their books. Upload a text EPUB or
            text-layer PDF, convert with TTS, and download an MP3/WAV for personal listening.
            Audio stays private to your account.
          </p>
          <div className="flex flex-wrap gap-3 pt-1">
            <Link
              href="/signup"
              className="rounded-lg bg-brand-600 px-5 py-2.5 font-medium text-white no-underline shadow-sm hover:bg-brand-700"
            >
              Start free
            </Link>
            <Link
              href="/pricing"
              className="rounded-lg border border-slate-300 bg-white px-5 py-2.5 font-medium text-slate-800 no-underline shadow-sm hover:bg-slate-50"
            >
              View pricing
            </Link>
          </div>
        </div>

        <div className="rounded-2xl border border-slate-200/80 bg-white p-7 shadow-soft">
          <div className="mb-5 flex items-center gap-2">
            <span className="inline-flex h-6 items-center rounded-full bg-accent-50 px-2.5 text-xs font-semibold text-accent-700 ring-1 ring-inset ring-accent-200">
              Simple flow
            </span>
            <h2 className="text-sm font-semibold uppercase tracking-wide text-slate-500">
              How it works
            </h2>
          </div>
          <ol className="space-y-5 text-slate-700">
            <li className="flex gap-3">
              <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-brand-900 text-xs font-bold text-white">
                1
              </span>
              <span className="pt-0.5">
                Sign up and confirm you own the rights to the file.
              </span>
            </li>
            <li className="flex gap-3">
              <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-brand-900 text-xs font-bold text-white">
                2
              </span>
              <span className="pt-0.5">
                Upload EPUB or text PDF (scanned PDFs not supported yet).
              </span>
            </li>
            <li className="flex gap-3">
              <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-brand-900 text-xs font-bold text-white">
                3
              </span>
              <span className="pt-0.5">
                We extract chapters, synthesize speech, and assemble audio.
              </span>
            </li>
            <li className="flex gap-3">
              <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-brand-900 text-xs font-bold text-white">
                4
              </span>
              <span className="pt-0.5">
                Download your private audiobook (WAV via mock TTS; MP3 via OpenAI).
              </span>
            </li>
          </ol>
        </div>
      </section>

      <section className="rounded-xl border border-accent-200/80 bg-accent-50/70 px-5 py-4 text-sm leading-relaxed text-slate-800">
        <strong className="font-semibold text-brand-900">Terms stub:</strong> By uploading, you
        warrant you own or have rights to convert the book for personal use. ShelfCast does not
        circumvent DRM. Generated audio is private to your account and not for redistribution.
      </section>
    </div>
  );
}
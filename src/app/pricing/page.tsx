import Link from "next/link";

export default function PricingPage() {
  return (
    <div className="space-y-8">
      <div className="text-center space-y-2">
        <h1 className="text-3xl font-bold">Pricing</h1>
        <p className="text-slate-600">Stub plans for the local MVP. No payments yet.</p>
      </div>
      <div className="grid gap-6 md:grid-cols-2">
        <div className="rounded-xl border border-slate-200 bg-white p-6 shadow-sm">
          <h2 className="text-xl font-semibold">Free</h2>
          <p className="mt-1 text-3xl font-bold">$0</p>
          <ul className="mt-4 space-y-2 text-sm text-slate-600">
            <li>Upload EPUB / text PDF</li>
            <li>Mock TTS (no API key)</li>
            <li>Limited chunks per book</li>
            <li>Private audio download</li>
          </ul>
          <Link href="/signup" className="mt-6 inline-block rounded-md bg-slate-900 px-4 py-2 text-sm text-white no-underline">
            Get started
          </Link>
        </div>
        <div className="rounded-xl border border-brand-300 bg-brand-50 p-6 shadow-sm">
          <h2 className="text-xl font-semibold text-brand-900">Pro</h2>
          <p className="mt-1 text-3xl font-bold text-brand-900">$12<span className="text-base font-normal">/mo</span></p>
          <ul className="mt-4 space-y-2 text-sm text-brand-900/80">
            <li>OpenAI TTS (bring your key or billed later)</li>
            <li>Longer books / more chunks</li>
            <li>MP3 download</li>
            <li>M4B (follow-up)</li>
          </ul>
          <button disabled className="mt-6 rounded-md bg-brand-600/60 px-4 py-2 text-sm text-white cursor-not-allowed">
            Coming soon
          </button>
        </div>
      </div>
    </div>
  );
}

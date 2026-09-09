import type { Metadata } from "next";
import Link from "next/link";

export const metadata: Metadata = {
  title: "Terms of Service — ShelfCast",
  description: "Terms of Service for ShelfCast private owned-book audio conversion.",
};

export default function TermsPage() {
  return (
    <article className="mx-auto max-w-3xl space-y-6 text-slate-700">
      <h1 className="text-3xl font-bold tracking-tight text-brand-900">Terms of Service</h1>
      <p className="text-sm text-slate-500">Last updated: September 9, 2026</p>

      <p>
        Welcome to ShelfCast. By creating an account or using our service, you agree to these Terms
        of Service (&quot;Terms&quot;). If you do not agree, do not use ShelfCast.
      </p>

      <h2 className="text-xl font-semibold text-brand-900">1. The service</h2>
      <p>
        ShelfCast lets you upload electronic books you own (EPUB or text-layer PDF), convert them
        into private audio using text-to-speech (TTS), and download the resulting files for personal
        listening. ShelfCast is not a public publishing or distribution platform.
      </p>

      <h2 className="text-xl font-semibold text-brand-900">2. Ownership and rights warranty</h2>
      <p>For every file you upload, you represent and warrant that:</p>
      <ul className="list-disc space-y-1 pl-5">
        <li>You own the book or have a lawful right to convert it to audio for personal use;</li>
        <li>You will not upload content that infringes copyright or other rights;</li>
        <li>You will not circumvent DRM, copy-protection, or access controls;</li>
        <li>You will not redistribute generated audio without rights to do so.</li>
      </ul>
      <p>
        ShelfCast does not provide DRM circumvention tools. We may remove content or suspend
        accounts that appear to violate these rules.
      </p>

      <h2 className="text-xl font-semibold text-brand-900">3. Accounts</h2>
      <p>
        Provide accurate registration information and keep credentials confidential. You are
        responsible for activity under your account.
      </p>

      <h2 className="text-xl font-semibold text-brand-900">4. Plans, quotas, and billing</h2>
      <p>
        Free and Pro plans include different book limits, TTS character quotas, and provider access
        as described on the pricing page. Paid subscriptions are billed through Stripe. Fees already
        paid are generally non-refundable except where required by law.
      </p>

      <h2 className="text-xl font-semibold text-brand-900">5. Acceptable use</h2>
      <p>
        Do not abuse or disrupt the service, access other users&apos; data, upload malware or illegal
        content, resell the service without agreement, or bypass rate limits.
      </p>

      <h2 className="text-xl font-semibold text-brand-900">6. Privacy</h2>
      <p>
        See our <Link href="/privacy">Privacy Policy</Link>. Uploaded books and generated audio are
        treated as private account content.
      </p>

      <h2 className="text-xl font-semibold text-brand-900">7. Intellectual property</h2>
      <p>
        ShelfCast software and branding are owned by ShelfCast or its licensors. You retain rights in
        your uploads (subject to third-party rights) and grant us a limited license to store and
        process them solely to provide conversion.
      </p>

      <h2 className="text-xl font-semibold text-brand-900">8. Disclaimers</h2>
      <p>
        THE SERVICE IS PROVIDED &quot;AS IS&quot; AND &quot;AS AVAILABLE.&quot; TO THE MAXIMUM EXTENT
        PERMITTED BY LAW WE DISCLAIM WARRANTIES OF MERCHANTABILITY, FITNESS FOR A PARTICULAR PURPOSE,
        AND NON-INFRINGEMENT. TTS output may contain errors or truncations. Scanned PDFs may be
        unsupported.
      </p>

      <h2 className="text-xl font-semibold text-brand-900">9. Limitation of liability</h2>
      <p>
        TO THE MAXIMUM EXTENT PERMITTED BY LAW, SHELFCAST WILL NOT BE LIABLE FOR INDIRECT,
        INCIDENTAL, SPECIAL, CONSEQUENTIAL, OR PUNITIVE DAMAGES. TOTAL LIABILITY WILL NOT EXCEED
        AMOUNTS YOU PAID TO US IN THE TWELVE MONTHS BEFORE THE CLAIM.
      </p>

      <h2 className="text-xl font-semibold text-brand-900">10. Suspension and termination</h2>
      <p>
        You may stop using ShelfCast at any time. We may suspend or terminate access for Terms
        violations, non-payment, legal risk, or discontinuation.
      </p>

      <h2 className="text-xl font-semibold text-brand-900">11. Changes</h2>
      <p>
        We may update these Terms by revising the date above. Continued use after changes constitutes
        acceptance.
      </p>

      <h2 className="text-xl font-semibold text-brand-900">12. Contact</h2>
      <p>
        Questions: contact the operator of your ShelfCast deployment. Also see{" "}
        <Link href="/privacy">Privacy</Link>.
      </p>
    </article>
  );
}

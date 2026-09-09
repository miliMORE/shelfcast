import type { Metadata } from "next";
import Link from "next/link";

export const metadata: Metadata = {
  title: "Privacy Policy — ShelfCast",
  description: "Privacy Policy for ShelfCast private owned-book audio conversion.",
};

export default function PrivacyPage() {
  return (
    <article className="mx-auto max-w-3xl space-y-6 text-slate-700">
      <h1 className="text-3xl font-bold tracking-tight text-brand-900">Privacy Policy</h1>
      <p className="text-sm text-slate-500">Last updated: September 9, 2026</p>

      <p>
        This Privacy Policy explains how ShelfCast (&quot;we&quot;, &quot;us&quot;) collects, uses,
        and shares information when you use our private owned-book audio conversion service.
      </p>

      <h2 className="text-xl font-semibold text-brand-900">1. Information we collect</h2>
      <ul className="list-disc space-y-1 pl-5">
        <li>
          <strong>Account data:</strong> name, email, password hash, plan and billing identifiers.
        </li>
        <li>
          <strong>Content:</strong> uploaded EPUB/PDF files, derived text for TTS, and generated
          audio stored in configured object/local storage.
        </li>
        <li>
          <strong>Usage data:</strong> job status, TTS character consumption, technical logs, and IP
          used for rate limiting.
        </li>
        <li>
          <strong>Payment data:</strong> processed by Stripe; we store customer/subscription IDs and
          status, not full card numbers.
        </li>
      </ul>

      <h2 className="text-xl font-semibold text-brand-900">2. How we use information</h2>
      <ul className="list-disc space-y-1 pl-5">
        <li>Provide uploads, conversion, downloads, and account access;</li>
        <li>Enforce plan limits, rate limits, and Terms;</li>
        <li>Process subscriptions and transactional notices;</li>
        <li>Secure the service, prevent abuse, and debug failures;</li>
        <li>Comply with legal obligations.</li>
      </ul>
      <p>We do not sell personal information or use book content for advertising profiles.</p>

      <h2 className="text-xl font-semibold text-brand-900">3. Processors</h2>
      <p>
        Depending on configuration: hosting/database (e.g. Railway + Postgres), S3-compatible storage
        (R2/MinIO), TTS providers (e.g. OpenAI for Pro), and Stripe for payments. Text is sent to TTS
        providers only as needed for synthesis.
      </p>

      <h2 className="text-xl font-semibold text-brand-900">4. Retention</h2>
      <p>
        We retain account and content while your account is active. Deleting a book removes
        associated storage objects when cleanup succeeds. After account deletion we may delete or
        anonymize data subject to backups and legal holds.
      </p>

      <h2 className="text-xl font-semibold text-brand-900">5. Security</h2>
      <p>
        We use hashed passwords, HTTPS in production, and access-controlled storage. No system is
        perfectly secure.
      </p>

      <h2 className="text-xl font-semibold text-brand-900">6. Your choices</h2>
      <ul className="list-disc space-y-1 pl-5">
        <li>Delete books and audio from the library;</li>
        <li>Manage billing via Stripe Customer Portal when enabled;</li>
        <li>Request account deletion from the deployment operator.</li>
      </ul>

      <h2 className="text-xl font-semibold text-brand-900">7. Children</h2>
      <p>
        ShelfCast is not directed to children under 16 (or the applicable minimum age). We do not
        knowingly collect their personal information.
      </p>

      <h2 className="text-xl font-semibold text-brand-900">8. Changes &amp; contact</h2>
      <p>
        We may update this Policy and revise the date above. Questions: contact your deployment
        operator. See also <Link href="/terms">Terms of Service</Link>.
      </p>
    </article>
  );
}

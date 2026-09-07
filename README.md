# ShelfCast

Private web SaaS MVP: upload owned EPUB / text-layer PDF books, convert them to downloadable audio with TTS, keep audio private to your account.

## Stack

- Next.js 15 (App Router) + TypeScript + Tailwind CSS
- Auth.js / NextAuth v4 -- email + password (Credentials) with JWT sessions
- Prisma + SQLite -- local-friendly data store
- TTS -- abstract provider; MockTtsProvider (default) or OpenAI tts-1
- Stripe Checkout + Customer Portal -- Free / Pro subscriptions
- Local filesystem storage under storage/

## Quick start

```bash
cd Desktop/ShelfCast
cp .env.example .env
npm install
npx prisma db push
npm run dev
```

Open http://localhost:3000

## Env vars

See .env.example - DATABASE_URL, NEXTAUTH_URL, NEXTAUTH_SECRET, TTS_PROVIDER (mock|openai), OPENAI_API_KEY, STORAGE_ROOT, NEXT_PUBLIC_APP_URL, STRIPE_SECRET_KEY, STRIPE_WEBHOOK_SECRET, STRIPE_PRICE_PRO_MONTHLY, STRIPE_PRICE_PRO_YEARLY, NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY.

## Auth

Credentials (email+password), bcryptjs hashes, JWT sessions. No Clerk required.

## Data model

User (plan + Stripe IDs + TTS usage), Book, AudioJob, AudioAsset (Prisma + SQLite).

## Architecture

Upload -> extract (epub2 / pdf-parse) -> chunk -> TTS (mock wav|openai mp3) -> assemble -> download.

Files under storage/users/<userId>/books/<bookId>/


## Pricing and Stripe billing

- Free ($0): Mock TTS only; max 2 books; ~15,000 TTS characters / month; no card
- Pro ($12 / month): Real OpenAI TTS when key configured; 500,000 chars / month; soft cap 100 books
- Pro Annual ($99 / year): same entitlements (~2 months free)

### Stripe test-mode setup

1. Create product **ShelfCast Pro** in Stripe Dashboard (Test mode).
2. Add recurring prices: $12/month and optional $99/year. Copy Price IDs into STRIPE_PRICE_PRO_MONTHLY / STRIPE_PRICE_PRO_YEARLY.
3. Put test Secret key in STRIPE_SECRET_KEY.
4. Enable Customer Portal (cancel / manage payment method).
5. Forward webhooks locally with Stripe CLI:
   stripe listen --forward-to localhost:3000/api/billing/webhook
   then set STRIPE_WEBHOOK_SECRET to the printed whsec_... value.
6. Sign in, open /pricing, click **Upgrade to Pro**, pay with test card 4242 4242 4242 4242.
7. Confirm /settings shows Pro + usage + Manage billing.

Webhook handlers: checkout.session.completed, customer.subscription.updated, customer.subscription.deleted.

Free users are always forced to Mock TTS. Pro uses OpenAI when TTS_PROVIDER=openai and OPENAI_API_KEY are set.

## Limitations

In-process jobs, chunk caps, scanned PDFs not supported yet, M4B deferred.

## Next steps

Worker queue, OCR, M4B, cloud storage, voice controls.

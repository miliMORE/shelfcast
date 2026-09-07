# ShelfCast

**Turn books you already own into private, downloadable audiobooks.**

ShelfCast is a web SaaS MVP: upload owned EPUB or text-layer PDF files, convert them with TTS, and download MP3/WAV audio that stays private to your account. No DRM circumvention — only files you have rights to convert.

## Screenshots

| Landing | Sign up |
| --- | --- |
| ![Landing page](docs/screens/01-landing.png) | ![Sign up](docs/screens/02-signup-or-login.png) |

| Library | Pricing |
| --- | --- |
| ![Library](docs/screens/03-library.png) | ![Pricing](docs/screens/04-pricing.png) |

## What it does

1. Sign up and confirm you own rights to the file.
2. Upload EPUB or text-layer PDF (scanned PDFs not supported yet).
3. Extract chapters → synthesize speech → assemble audio.
4. Download a private audiobook (WAV via mock TTS; MP3 via OpenAI when configured).

## Stack

- **Next.js 15** (App Router) + TypeScript + Tailwind CSS
- **Auth.js / NextAuth v4** — email + password (Credentials), JWT sessions
- **Prisma + SQLite** — local-friendly data store
- **TTS** — pluggable provider (`mock` default, or OpenAI `tts-1`)
- **Stripe** Checkout + Customer Portal — Free / Pro subscriptions
- Local filesystem storage under `storage/`

## Quick start

```bash
git clone https://github.com/miliMORE/shelfcast.git
cd shelfcast
cp .env.example .env
# set NEXTAUTH_SECRET to any long random string; keep TTS_PROVIDER=mock
npm install
npx prisma db push
npm run dev
```

Open [http://localhost:3000](http://localhost:3000).

## Environment

Copy `.env.example` to `.env`. Important vars:

| Variable | Notes |
| --- | --- |
| `DATABASE_URL` | Default SQLite file DB |
| `NEXTAUTH_URL` | Localhost URL in development |
| `NEXTAUTH_SECRET` | Long random string |
| `TTS_PROVIDER` | mock or openai |
| `OPENAI_API_KEY` | Required only for real TTS |
| `STORAGE_ROOT` | Default storage |
| `NEXT_PUBLIC_APP_URL` | Public app URL for Stripe redirects |
| Stripe keys and Price IDs | Optional for local mock-TTS demos |

Stripe keys can stay empty for local demos with mock TTS; checkout buttons will fail until configured.

## Auth & data

- Credentials (email + password), bcrypt hashes, JWT sessions — no Clerk.
- Models: User (plan + Stripe IDs + TTS usage), Book, AudioJob, AudioAsset.
- Pipeline: upload → extract (epub2 / pdf-parse) → chunk → TTS → assemble → download.
- Files live under storage/users/<userId>/books/<bookId>/.

## Pricing & Stripe

| Plan | Price | Entitlements |
| --- | --- | --- |
| Free | $0 | Mock TTS only; max 2 books; ~15k TTS chars/month |
| Pro | $12/mo | OpenAI TTS when keyed; 500k chars/month; soft cap 100 books |
| Pro Annual | $99/yr | Same as Pro (~2 months free) |

**Test-mode setup (short):** create product + monthly/yearly prices in Stripe, put Price IDs and secret key in .env, enable Customer Portal, forward webhooks with Stripe CLI to /api/billing/webhook, then pay with the Stripe test card on /pricing.

Webhooks handled: checkout.session.completed, customer.subscription.updated, customer.subscription.deleted. Free users are always forced to mock TTS.

## Limitations

In-process jobs (no worker queue), chunk caps, scanned PDFs unsupported, M4B deferred.

## Next steps

Background worker queue, OCR for scanned PDFs, M4B packaging, cloud object storage, richer voice controls.

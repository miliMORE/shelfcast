# ShelfCast

Private web SaaS MVP: upload owned EPUB / text-layer PDF books, convert them to downloadable audio with TTS, keep audio private to your account.

## Stack

- Next.js 15 (App Router) + TypeScript + Tailwind CSS
- Auth.js / NextAuth v4 -- email + password (Credentials) with JWT sessions
- Prisma + SQLite -- local-friendly data store
- TTS -- abstract provider; MockTtsProvider (default) or OpenAI tts-1
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

See .env.example - DATABASE_URL, NEXTAUTH_URL, NEXTAUTH_SECRET, TTS_PROVIDER (mock|openai), OPENAI_API_KEY, STORAGE_ROOT.

## Auth

Credentials (remail+password), bcryptjs hashes, JWT sessions. No Clerk required.

## Data model

User, Book, AudioJob, AudioAsset (PRISMA + SQLite).

## Architecture

Upload -> extract (epub2 / pdf-parse) -> chunk -> TTS (mock wav|openai mp3) -> assemble -> download.

Files under storage/users/<userId>/books/<bookId>/

## Limitations

In-process jobs, chunk caps, scanned PDFs not supported yet, no billing, M4B deferred.

## Next steps

Worker queue, Pro billing, OCR, M4B, cloud storage, voice controls.

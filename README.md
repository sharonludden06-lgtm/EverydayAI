# Everyday AI

The Everyday AI website and newsletter sign-up, as a Next.js app hosted on Vercel.

## Pages
- `/` `/resources` `/newsletter` `/about`: the public site
- `/admin`: private subscriber list (password protected), with CSV download
- `/unsubscribe?token=…`: the unsubscribe page linked from every email

## Setup on Vercel
1. Import this repo in Vercel (Framework: Next.js; the defaults are fine).
2. **Storage → Create Database → Neon (Postgres)** and connect it to this project. This adds `DATABASE_URL`.
3. **Settings → Environment Variables**: add `ADMIN_PASSWORD` (long, private).
4. Redeploy. The subscriber table is created automatically during the build (`scripts/migrate.mjs`).

## Local development
```bash
npm install
cp .env.example .env.local   # fill in DATABASE_URL and ADMIN_PASSWORD
npm run dev
```

## Database
The schema lives in `db/schema.sql`. It's written to be safe to re-run, and it runs on every build.
Each subscriber has a private `unsubscribe_token` to use in email unsubscribe links.

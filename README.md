# Everyday AI

The Everyday AI website and newsletter sign-up, as a Next.js app hosted on Vercel.

## Pages
- `/` `/resources` `/newsletter` `/about`: the public site
- `/admin`: private subscriber list (password protected), with CSV download
- `/admin/newsletter`: review, edit, test and approve each week's issue, plus a list of topic ideas
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

## The weekly newsletter
| When (UK time) | What happens |
|---|---|
| Saturday ~7am | `/api/cron/draft`: Claude writes a draft (built around your next topic idea, if you've added one) and emails you a link to review it. |
| Saturday–Sunday | You edit it if you like, email yourself a test, and click **Approve**. |
| Sunday ~8am | `/api/cron/send`: the approved issue goes to every active subscriber, each with a personal unsubscribe link. If nothing is approved, nothing is sent and you get a note saying so. |

The schedule lives in `vercel.json` (times are in UTC). Both jobs need `CRON_SECRET`.

**Rehearsal mode:** until `SENDING_ENABLED=true`, the Sunday job sends the approved issue to `ADMIN_EMAIL` only.
To go live: verify your domain in Resend, then set `NEWSLETTER_FROM` and `SENDING_ENABLED=true` in Vercel and redeploy.

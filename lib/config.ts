import "server-only";

/** The public address of the site, e.g. https://everyday-ai-cyan.vercel.app */
export function siteUrl() {
  const explicit = process.env.SITE_URL?.replace(/\/$/, "");
  if (explicit) return explicit;
  const vercel = process.env.VERCEL_PROJECT_PRODUCTION_URL || process.env.VERCEL_URL;
  return vercel ? `https://${vercel}` : "http://localhost:3000";
}

/** Where draft-ready notices and test sends go. */
export function adminEmail() {
  return process.env.ADMIN_EMAIL?.trim() || null;
}

/**
 * Until your own domain is verified in Resend, emails can only go to your own
 * address. Set SENDING_ENABLED=true (and NEWSLETTER_FROM) once the domain is ready.
 */
export function sendingEnabled() {
  return process.env.SENDING_ENABLED === "true";
}

export function fromAddress() {
  return process.env.NEWSLETTER_FROM?.trim() || "Everyday AI <onboarding@resend.dev>";
}

/** Scheduled jobs must present this secret (Vercel sends it automatically). */
export function cronAuthorised(request: Request) {
  const secret = process.env.CRON_SECRET;
  if (!secret) return false;
  return request.headers.get("authorization") === `Bearer ${secret}`;
}

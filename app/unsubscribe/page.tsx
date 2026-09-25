import Link from "next/link";
import { unsubscribeByToken } from "@/lib/unsubscribe";

export const metadata = { title: "Unsubscribe", robots: { index: false, follow: false } };
export const dynamic = "force-dynamic";

async function confirm(formData: FormData) {
  "use server";
  const { redirect } = await import("next/navigation");
  const token = String(formData.get("token") ?? "");
  const ok = await unsubscribeByToken(token);
  redirect(ok ? "/unsubscribe?done=1" : "/unsubscribe?error=1");
}

export default async function Unsubscribe({
  searchParams,
}: {
  searchParams: Promise<{ token?: string; done?: string; error?: string }>;
}) {
  const { token, done, error } = await searchParams;
  return (
    <main className="simple-page shell">
      <p className="eyebrow">The Sunday Edit</p>
      {done ? (
        <>
          <h1>You&apos;re unsubscribed.</h1>
          <p>You won&apos;t get any more emails from us. Changed your mind? You can rejoin any time.</p>
          <Link className="button button-primary" href="/newsletter#signup">Rejoin the newsletter</Link>
        </>
      ) : error || !token ? (
        <>
          <h1>That link didn&apos;t work.</h1>
          <p>Please use the unsubscribe link at the bottom of your most recent email.</p>
        </>
      ) : (
        <>
          <h1>Unsubscribe?</h1>
          <p>Click below and you won&apos;t receive the Sunday Edit any more.</p>
          <form action={confirm}>
            <input type="hidden" name="token" value={token} />
            <button className="button button-primary" type="submit">Yes, unsubscribe me</button>
          </form>
        </>
      )}
    </main>
  );
}

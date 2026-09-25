import { redirect } from "next/navigation";
import { isAdmin, passwordMatches, startAdminSession } from "@/lib/admin-auth";

export const metadata = { title: "Admin sign in", robots: { index: false, follow: false } };
export const dynamic = "force-dynamic";

async function signIn(formData: FormData) {
  "use server";
  const password = String(formData.get("password") ?? "");
  if (!passwordMatches(password)) {
    await new Promise((r) => setTimeout(r, 800)); // slow down guessing
    redirect("/admin/login?error=1");
  }
  await startAdminSession();
  redirect("/admin");
}

export default async function AdminLogin({
  searchParams,
}: {
  searchParams: Promise<{ error?: string }>;
}) {
  if (await isAdmin()) redirect("/admin");
  const { error } = await searchParams;
  const configured = (process.env.ADMIN_PASSWORD ?? "").length >= 8;
  return (
    <main className="simple-page shell">
      <p className="eyebrow">Private</p>
      <h1>Sign in</h1>
      {!configured ? (
        <p>Set an <code>ADMIN_PASSWORD</code> (at least 8 characters) in Vercel&apos;s environment variables, then redeploy.</p>
      ) : (
        <form action={signIn} className="admin-login">
          <label>
            <span>Password</span>
            <input name="password" type="password" required autoComplete="current-password" autoFocus />
          </label>
          <button className="button button-primary" type="submit">Sign in</button>
          {error && <p className="form-error" role="alert">That password isn&apos;t right.</p>}
        </form>
      )}
    </main>
  );
}

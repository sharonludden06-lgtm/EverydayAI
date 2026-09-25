import { getSql } from "@/db";

/** Marks the subscriber with this token as unsubscribed. Returns true if one was found. */
export async function unsubscribeByToken(token: string) {
  if (!/^[0-9a-f-]{36}$/i.test(token)) return false;
  const rows = await (await getSql())`
    UPDATE subscribers
       SET status = 'unsubscribed', unsubscribed_at = now()
     WHERE unsubscribe_token = ${token}
     RETURNING id`;
  return rows.length > 0;
}

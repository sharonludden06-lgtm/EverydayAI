import { neon } from "@neondatabase/serverless";

export type Subscriber = {
  id: number;
  email: string;
  first_name: string;
  source: string;
  status: "subscribed" | "unsubscribed";
  created_at: string;
};

export function getSql() {
  const url = process.env.DATABASE_URL;
  if (!url) throw new Error("DATABASE_URL is not set.");
  return neon(url);
}

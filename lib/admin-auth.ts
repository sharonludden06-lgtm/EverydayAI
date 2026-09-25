import "server-only";
import { createHmac, timingSafeEqual } from "node:crypto";
import { cookies } from "next/headers";

const COOKIE = "everyday_admin";
const MAX_AGE = 60 * 60 * 24 * 14; // 14 days

function secret() {
  const password = process.env.ADMIN_PASSWORD;
  if (!password || password.length < 8) return null;
  return password;
}

function sign(value: string, key: string) {
  return createHmac("sha256", key).update(value).digest("hex");
}

function safeEqual(a: string, b: string) {
  const ab = Buffer.from(a);
  const bb = Buffer.from(b);
  return ab.length === bb.length && timingSafeEqual(ab, bb);
}

export function passwordMatches(input: string) {
  const key = secret();
  if (!key) return false;
  // Compare hashes so lengths always match.
  return safeEqual(sign(input, "cmp"), sign(key, "cmp"));
}

export async function startAdminSession() {
  const key = secret()!;
  const expires = Date.now() + MAX_AGE * 1000;
  const payload = `admin.${expires}`;
  (await cookies()).set(COOKIE, `${payload}.${sign(payload, key)}`, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    path: "/",
    maxAge: MAX_AGE,
  });
}

export async function endAdminSession() {
  (await cookies()).delete(COOKIE);
}

export async function isAdmin() {
  const key = secret();
  if (!key) return false;
  const raw = (await cookies()).get(COOKIE)?.value;
  if (!raw) return false;
  const [role, expires, signature] = raw.split(".");
  if (role !== "admin" || !expires || !signature) return false;
  if (Number(expires) < Date.now()) return false;
  return safeEqual(signature, sign(`${role}.${expires}`, key));
}

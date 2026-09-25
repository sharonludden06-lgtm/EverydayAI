// Tables are created automatically by the app on first use (see db/index.ts).
// This build step just reports whether a database is connected.
const found = Object.entries(process.env).find(
  ([k, v]) => k.endsWith("_URL") && typeof v === "string" && v.startsWith("postgres"),
);
console.log(found ? `[db] Postgres connected via ${found[0]}.` : "[db] WARNING: no Postgres connection setting found.");

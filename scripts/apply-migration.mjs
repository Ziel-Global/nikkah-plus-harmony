/**
 * Apply a SQL migration file via Supabase pg-meta (service role).
 */
import { readFileSync } from "node:fs";
import { resolve } from "node:path";

function loadEnv() {
  const text = readFileSync(resolve(process.cwd(), ".env"), "utf8");
  for (const line of text.split(/\r?\n/)) {
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith("#")) continue;
    const eq = trimmed.indexOf("=");
    if (eq < 0) continue;
    const key = trimmed.slice(0, eq).trim();
    let value = trimmed.slice(eq + 1).trim();
    if (
      (value.startsWith('"') && value.endsWith('"')) ||
      (value.startsWith("'") && value.endsWith("'"))
    ) {
      value = value.slice(1, -1);
    }
    if (!process.env[key]) process.env[key] = value;
  }
}

loadEnv();

const url = process.env.SUPABASE_URL;
const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
const file =
  process.argv[2] || "supabase/migrations/20261020120000_multi_tenant_ssa_circles.sql";

if (!url || !serviceKey) {
  console.error("Missing SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY");
  process.exit(1);
}

const sql = readFileSync(resolve(process.cwd(), file), "utf8");
const endpoints = [
  `${url.replace(/\/$/, "")}/pg/query`,
  `${url.replace(/\/$/, "")}/pg-meta/default/query`,
];

async function run(endpoint) {
  const res = await fetch(endpoint, {
    method: "POST",
    headers: {
      apikey: serviceKey,
      Authorization: `Bearer ${serviceKey}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({ query: sql }),
  });
  const text = await res.text();
  return { ok: res.ok, status: res.status, text, endpoint };
}

async function main() {
  let last;
  for (const endpoint of endpoints) {
    console.log("Trying", endpoint);
    last = await run(endpoint);
    if (last.ok) {
      console.log("Migration applied via", endpoint);
      console.log(last.text.slice(0, 500));
      return;
    }
    console.log("Failed", last.status, last.text.slice(0, 300));
  }
  console.error("Could not apply migration automatically. Paste the SQL in the Supabase SQL Editor.");
  process.exit(1);
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});

import { createClient } from "@supabase/supabase-js";
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

const admin = createClient(process.env.SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY, {
  auth: { persistSession: false, autoRefreshToken: false },
});

const { data: orphans } = await admin
  .from("profiles")
  .select("id, email, first_name, last_name, full_name")
  .eq("role", "super_admin")
  .is("tenant_id", null);

for (const sa of orphans ?? []) {
  const name =
    sa.full_name?.trim() ||
    [sa.first_name, sa.last_name].filter(Boolean).join(" ").trim() ||
    sa.email.split("@")[0];

  const { data: tenant, error: tErr } = await admin
    .from("tenants")
    .insert({
      name: `${name} tenant`,
      is_active: true,
      created_by: sa.id,
    })
    .select("id")
    .single();
  if (tErr) throw tErr;

  const { error: pErr } = await admin
    .from("profiles")
    .update({ tenant_id: tenant.id })
    .eq("id", sa.id);
  if (pErr) throw pErr;

  console.log("Linked", sa.email, "->", tenant.id);
}

console.log("done");

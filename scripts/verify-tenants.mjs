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

const { data: tenants } = await admin.from("tenants").select("id, name, is_active");
const { data: sas } = await admin
  .from("profiles")
  .select("id, email, role, tenant_id")
  .eq("role", "super_admin");
const { count: mosques } = await admin.from("mosques").select("id", { count: "exact", head: true });
const { data: missingMosqueTenant } = await admin
  .from("mosques")
  .select("id")
  .is("tenant_id", null)
  .limit(3);
const { error: circlesErr } = await admin.from("sa_circles").select("super_admin_id").limit(1);

console.log(
  JSON.stringify(
    {
      tenants,
      superAdmins: sas,
      mosqueCount: mosques,
      mosquesMissingTenant: missingMosqueTenant?.length ?? 0,
      sa_circles_gone: Boolean(circlesErr),
      sa_circles_error: circlesErr?.message,
    },
    null,
    2,
  ),
);

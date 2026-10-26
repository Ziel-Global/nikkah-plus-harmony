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

const { data: ssa } = await admin
  .from("profiles")
  .select("id,email,role,first_name,last_name")
  .eq("email", "zieluser92@gmail.com")
  .maybeSingle();

const { data: circles } = await admin
  .from("sa_circles")
  .select("super_admin_id,circle_name,is_active");

const { count } = await admin.from("mosques").select("id", { count: "exact", head: true });
const { data: missing } = await admin.from("mosques").select("id").is("super_admin_id", null).limit(5);

console.log(
  JSON.stringify(
    {
      ssa,
      circles,
      mosqueCount: count,
      mosquesMissingSa: missing?.length ?? 0,
    },
    null,
    2,
  ),
);

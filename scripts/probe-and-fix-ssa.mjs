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

const email = "zieluser92@gmail.com";
const admin = createClient(process.env.SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY, {
  auth: { persistSession: false, autoRefreshToken: false },
});

async function main() {
  const { data: listed } = await admin.auth.admin.listUsers({ perPage: 1000 });
  const user = listed?.users?.find((u) => u.email?.toLowerCase() === email);
  console.log("auth_user", user?.id, user?.email);

  const { data: profile, error: pErr } = await admin
    .from("profiles")
    .select("*")
    .eq("email", email)
    .maybeSingle();
  console.log("profile_error", pErr?.message);
  console.log("profile", profile ? { id: profile.id, role: profile.role, email: profile.email } : null);

  const { error: circlesErr } = await admin.from("sa_circles").select("super_admin_id").limit(1);
  console.log("sa_circles_ready", !circlesErr, circlesErr?.message);

  // Temporary profile until migration adds super_super_admin + name columns
  if (user?.id) {
    const { error } = await admin.from("profiles").upsert({
      id: user.id,
      email,
      role: "male_user",
      full_name: "Platform Owner",
      account_status: "active",
    });
    console.log("temporary_profile", error?.message || "ok");
  }
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});

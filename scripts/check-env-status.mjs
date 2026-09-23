import { existsSync, readFileSync } from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const root = path.join(path.dirname(fileURLToPath(import.meta.url)), "..");
const envPath = path.join(root, ".env.local");

function status(key) {
  if (!existsSync(envPath)) return "EMPTY";
  for (const line of readFileSync(envPath, "utf8").split(/\r?\n/)) {
    if (!line || line.trimStart().startsWith("#")) continue;
    const i = line.indexOf("=");
    if (i < 0) continue;
    if (line.slice(0, i) !== key) continue;
    let v = line.slice(i + 1).trim();
    if (
      (v.startsWith('"') && v.endsWith('"')) ||
      (v.startsWith("'") && v.endsWith("'"))
    ) {
      v = v.slice(1, -1);
    }
    return v.length > 0 ? "SET" : "EMPTY";
  }
  return "EMPTY";
}

console.log("URL:", status("NEXT_PUBLIC_SUPABASE_URL"));
console.log("ANON:", status("NEXT_PUBLIC_SUPABASE_ANON_KEY"));
console.log("SERVICE_ROLE:", status("SUPABASE_SERVICE_ROLE_KEY"));

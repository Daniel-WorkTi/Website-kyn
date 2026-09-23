/** Extract NEXT_PUBLIC anon from production bundle and list media_items videos. */
import { mkdirSync, writeFileSync } from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const root = path.join(path.dirname(fileURLToPath(import.meta.url)), "..");
const BASE = "https://website-kyn.vercel.app";

const html = await (await fetch(`${BASE}/studio-space`)).text();
const scripts = [...html.matchAll(/src="(\/_next\/static\/[^"]+)"/g)].map((m) => m[1]);

let anon = "";
let supabaseUrl = "https://vnpslhbjlrhfuqajeuqx.supabase.co";

for (const s of scripts) {
  const t = await (await fetch(BASE + s)).text();
  const um = t.match(/https:\/\/[a-z0-9]+\.supabase\.co/);
  if (um) supabaseUrl = um[0];
  const matches = t.match(/eyJ[a-zA-Z0-9_-]+\.eyJ[a-zA-Z0-9_-]+\.[a-zA-Z0-9_-]+/g) || [];
  for (const m of matches) {
    if (m.length > 100) {
      try {
        const payload = JSON.parse(Buffer.from(m.split(".")[1], "base64url").toString("utf8"));
        if (payload.role === "anon" || payload.role === "authenticated") {
          anon = m;
          break;
        }
      } catch {
        /* */
      }
    }
  }
  if (anon) break;
}

if (!anon) {
  console.error("Anon key not found in bundle");
  process.exit(1);
}

console.log("supabase", supabaseUrl);
console.log("anon role ok, len", anon.length);

const res = await fetch(
  `${supabaseUrl}/rest/v1/media_items?type=eq.video&select=id,section_id,slot,storage_path,legacy_url,thumbnail_path,thumbnail_legacy_url,file_size,duration_seconds,mime_type,width,height,sort_order&order=section_id.asc,sort_order.asc`,
  {
    headers: {
      apikey: anon,
      Authorization: `Bearer ${anon}`,
    },
  }
);
console.log("status", res.status);
const data = await res.json();
if (!Array.isArray(data)) {
  console.log(data);
  process.exit(1);
}

mkdirSync(path.join(root, "tmp"), { recursive: true });
writeFileSync(path.join(root, "tmp", "media-items-videos.json"), JSON.stringify(data, null, 2));
console.log("count", data.length);
console.log(
  "sections",
  [...new Set(data.map((d) => d.section_id))].map(
    (s) => `${s}:${data.filter((d) => d.section_id === s).length}`
  )
);
console.log("storage", data.filter((d) => d.storage_path).length);
console.log("legacy", data.filter((d) => d.legacy_url).length);
console.log("duration set", data.filter((d) => d.duration_seconds != null).length);
console.log("thumbnail", data.filter((d) => d.thumbnail_path || d.thumbnail_legacy_url).length);

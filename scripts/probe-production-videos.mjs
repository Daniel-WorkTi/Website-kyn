/** Scrape production pages for video URLs and ffprobe them (read-only). */
import { execFileSync } from "node:child_process";
import { mkdirSync, writeFileSync } from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const root = path.join(path.dirname(fileURLToPath(import.meta.url)), "..");
const BASE = process.env.SITE_URL || "https://website-kyn.vercel.app";
const pages = [
  "/",
  "/studio-space",
  "/multicam",
  "/aftermovie",
  "/photography",
  "/fpv-drone",
  "/social-media",
];

function probe(url) {
  try {
    const out = execFileSync(
      "ffprobe",
      ["-v", "error", "-print_format", "json", "-show_format", "-show_streams", "-i", url],
      { encoding: "utf8", timeout: 120000, maxBuffer: 8 * 1024 * 1024 }
    );
    const p = JSON.parse(out);
    const vs = (p.streams || []).find((s) => s.codec_type === "video") || {};
    return {
      duration: Number(p.format?.duration ?? vs.duration) || null,
      size: p.format?.size ? Number(p.format.size) : null,
      codec: vs.codec_name || null,
      width: vs.width || null,
      height: vs.height || null,
      error: null,
    };
  } catch (e) {
    return { duration: null, size: null, codec: null, width: null, height: null, error: String(e.message || e).slice(0, 160) };
  }
}

const found = new Map(); // url -> pages

for (const page of pages) {
  const res = await fetch(BASE + page);
  const html = await res.text();
  const re = /https?:\/\/[^"'\\\s>]+\.(?:mp4|webm|mov)/gi;
  let m;
  while ((m = re.exec(html))) {
    const u = m[0].replace(/&amp;/g, "&");
    if (!found.has(u)) found.set(u, new Set());
    found.get(u).add(page);
  }
}

console.log(`Found ${found.size} unique video URLs on ${BASE}`);

const rows = [];
let ok = 0;
let need = 0;
let unk = 0;
let total = 0;
let estimated = 0;

for (const [src, pageSet] of found) {
  const meta = probe(src);
  const status =
    meta.duration == null || !Number.isFinite(meta.duration)
      ? "UNKNOWN"
      : meta.duration <= 10.15
        ? "OK_LE_10S"
        : "NEED_TRIM";
  if (status === "OK_LE_10S") ok++;
  else if (status === "NEED_TRIM") need++;
  else unk++;
  if (meta.size) {
    total += meta.size;
    if (status === "NEED_TRIM" && meta.duration > 0) {
      estimated += meta.size * (10 / meta.duration);
    } else {
      estimated += meta.size;
    }
  }
  const kind = /supabase/i.test(src)
    ? "supabase"
    : /cloudinary/i.test(src)
      ? "legacy_cloudinary"
      : "other";
  rows.push({
    src,
    pages: [...pageSet],
    kind,
    status,
    ...meta,
  });
  console.log(
    status,
    meta.duration != null ? `${meta.duration.toFixed(2)}s` : "?",
    meta.size != null ? `${(meta.size / 1e6).toFixed(2)}MB` : "?",
    kind,
    [...pageSet].join(","),
    src.slice(0, 90)
  );
}

const report = {
  source: "production-html-scrape",
  base: BASE,
  totals: {
    uniqueUrls: rows.length,
    alreadyLe10s: ok,
    needTrim: need,
    unknown: unk,
    currentTotalMb: Number((total / 1e6).toFixed(2)),
    estimatedAfterMb: Number((estimated / 1e6).toFixed(2)),
    supabase: rows.filter((r) => r.kind === "supabase").length,
    legacy: rows.filter((r) => r.kind === "legacy_cloudinary").length,
  },
  needTrim: rows.filter((r) => r.status === "NEED_TRIM"),
  unknown: rows.filter((r) => r.status === "UNKNOWN"),
  rows,
};

mkdirSync(path.join(root, "tmp"), { recursive: true });
const out = path.join(root, "tmp", "video-prod-scrape-dry-run.json");
writeFileSync(out, JSON.stringify(report, null, 2));
console.log("\nSUMMARY", report.totals);
console.log("Wrote", out);

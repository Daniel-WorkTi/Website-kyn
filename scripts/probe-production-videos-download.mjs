/** Download + ffprobe production videos for accurate duration (read-only). */
import { execFileSync } from "node:child_process";
import { createWriteStream, mkdirSync, readFileSync, unlinkSync, writeFileSync, statSync } from "node:fs";
import { pipeline } from "node:stream/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { Readable } from "node:stream";

const root = path.join(path.dirname(fileURLToPath(import.meta.url)), "..");
const scrapePath = path.join(root, "tmp", "video-prod-scrape-dry-run.json");
const work = path.join(root, "tmp", "video-probe-work");
mkdirSync(work, { recursive: true });

const scrape = JSON.parse(readFileSync(scrapePath, "utf8"));
const rows = [];

async function download(url, dest) {
  const res = await fetch(url);
  if (!res.ok) throw new Error(`HTTP ${res.status}`);
  await pipeline(Readable.fromWeb(res.body), createWriteStream(dest));
}

function probeFile(file) {
  const out = execFileSync(
    "ffprobe",
    ["-v", "error", "-print_format", "json", "-show_format", "-show_streams", "-i", file],
    { encoding: "utf8", timeout: 60000 }
  );
  const p = JSON.parse(out);
  const vs = (p.streams || []).find((s) => s.codec_type === "video") || {};
  let fps = null;
  if (vs.avg_frame_rate?.includes("/")) {
    const [a, b] = vs.avg_frame_rate.split("/").map(Number);
    if (b) fps = a / b;
  }
  return {
    duration: Number(p.format?.duration ?? vs.duration) || null,
    size: p.format?.size ? Number(p.format.size) : statSync(file).size,
    codec: vs.codec_name || null,
    width: vs.width || null,
    height: vs.height || null,
    fps: fps ? Math.round(fps * 100) / 100 : null,
    pix_fmt: vs.pix_fmt || null,
    format: p.format?.format_name || null,
  };
}

let ok = 0;
let need = 0;
let unk = 0;
let total = 0;
let estimated = 0;

for (const [i, row] of scrape.rows.entries()) {
  const ext = (row.src.match(/\.(mp4|webm|mov)/i) || ["", "mp4"])[1];
  const dest = path.join(work, `v-${i}.${ext}`);
  console.log(`[${i + 1}/${scrape.rows.length}] downloading…`);
  try {
    await download(row.src, dest);
    const meta = probeFile(dest);
    const status =
      meta.duration == null ? "UNKNOWN" : meta.duration <= 10.15 ? "OK_LE_10S" : "NEED_TRIM";
    if (status === "OK_LE_10S") ok++;
    else if (status === "NEED_TRIM") need++;
    else unk++;
    total += meta.size || 0;
    if (status === "NEED_TRIM" && meta.duration > 0) {
      estimated += (meta.size || 0) * (10 / meta.duration);
    } else {
      estimated += meta.size || 0;
    }
    const entry = { ...row, ...meta, status, probedLocal: true };
    rows.push(entry);
    console.log(
      status,
      `${meta.duration?.toFixed(2)}s`,
      `${((meta.size || 0) / 1e6).toFixed(2)}MB`,
      `${meta.width}x${meta.height}`,
      meta.codec,
      meta.fps,
      row.src.slice(-60)
    );
    unlinkSync(dest);
  } catch (e) {
    unk++;
    rows.push({ ...row, status: "UNKNOWN", error: String(e.message || e).slice(0, 200), probedLocal: false });
    console.log("FAIL", e.message || e);
    try {
      unlinkSync(dest);
    } catch {
      /* */
    }
  }
}

const report = {
  source: "production-download-probe",
  totals: {
    uniqueUrls: rows.length,
    alreadyLe10s: ok,
    needTrim: need,
    unknown: unk,
    currentTotalMb: Number((total / 1e6).toFixed(2)),
    estimatedAfterMb: Number((estimated / 1e6).toFixed(2)),
  },
  codecs: Object.fromEntries(
    Object.entries(
      rows.reduce((a, r) => {
        if (r.codec) a[r.codec] = (a[r.codec] || 0) + 1;
        return a;
      }, {})
    )
  ),
  resolutions: Object.fromEntries(
    Object.entries(
      rows.reduce((a, r) => {
        if (r.width && r.height) {
          const k = `${r.width}x${r.height}`;
          a[k] = (a[k] || 0) + 1;
        }
        return a;
      }, {})
    )
  ),
  needTrim: rows.filter((r) => r.status === "NEED_TRIM"),
  ok: rows.filter((r) => r.status === "OK_LE_10S"),
  unknown: rows.filter((r) => r.status === "UNKNOWN"),
  rows,
};

const out = path.join(root, "tmp", "video-dry-run-report.json");
writeFileSync(out, JSON.stringify(report, null, 2));
console.log("\n========== DRY RUN ==========");
console.log(report.totals);
console.log("CODECS", report.codecs);
console.log("RESOLUTIONS", report.resolutions);
console.log("Wrote", out);

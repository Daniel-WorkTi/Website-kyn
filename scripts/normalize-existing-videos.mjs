/**
 * Inventário + normalização de vídeos CMS (máx. 10s).
 *
 * POR DEFEITO: --dry-run (não altera Storage nem DB).
 *
 * Uso:
 *   node scripts/normalize-existing-videos.mjs
 *   node scripts/normalize-existing-videos.mjs --dry-run
 *   node scripts/normalize-existing-videos.mjs --apply   # REQUER aprovação explícita
 *
 * Requisitos: .env.local (SUPABASE_*), ffmpeg/ffprobe no PATH.
 */
import { createClient } from "@supabase/supabase-js";
import { execFileSync } from "node:child_process";
import { existsSync, mkdirSync, readFileSync, writeFileSync, unlinkSync } from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const root = path.join(path.dirname(fileURLToPath(import.meta.url)), "..");
const MAX_SECONDS = 10;
const TOLERANCE = 0.15; // encoding slack
const MEDIA_BUCKET = "media";
const APPLY = process.argv.includes("--apply");
const DRY_RUN = !APPLY;

function loadEnvLocal() {
  const envPath = path.join(root, ".env.local");
  if (!existsSync(envPath)) return;
  for (const line of readFileSync(envPath, "utf8").split("\n")) {
    const m = line.match(/^([A-Z0-9_]+)=(.*)$/);
    if (m && !process.env[m[1]]) {
      let v = m[2].trim();
      if (
        (v.startsWith('"') && v.endsWith('"')) ||
        (v.startsWith("'") && v.endsWith("'"))
      ) {
        v = v.slice(1, -1);
      }
      process.env[m[1]] = v;
    }
  }
}

loadEnvLocal();

const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
if (!url || !key) {
  console.error("NEXT_PUBLIC_SUPABASE_URL e SUPABASE_SERVICE_ROLE_KEY são obrigatórios.");
  process.exit(1);
}

const supabase = createClient(url, key, {
  auth: { autoRefreshToken: false, persistSession: false },
});

function publicUrlForPath(storagePath) {
  const base = url.replace(/\/$/, "");
  return `${base}/storage/v1/object/public/${MEDIA_BUCKET}/${String(storagePath).replace(/^\/+/, "")}`;
}

function isVideoPath(p) {
  return /\.(mp4|webm|mov|m4v|avi|mkv)(\?|$)/i.test(p || "");
}

function isCloudinary(u) {
  return /res\.cloudinary\.com|cloudinary\.com/i.test(u || "");
}

function ffprobeJson(input) {
  try {
    const out = execFileSync(
      "ffprobe",
      [
        "-v",
        "error",
        "-print_format",
        "json",
        "-show_format",
        "-show_streams",
        "-i",
        input,
      ],
      { encoding: "utf8", maxBuffer: 8 * 1024 * 1024, timeout: 120_000 }
    );
    return JSON.parse(out);
  } catch (err) {
    return { error: err instanceof Error ? err.message : String(err) };
  }
}

function probeSummary(probe) {
  if (!probe || probe.error) {
    return {
      duration: null,
      width: null,
      height: null,
      codec: null,
      fps: null,
      size: null,
      format: null,
      error: probe?.error || "probe failed",
    };
  }
  const videoStream =
    (probe.streams || []).find((s) => s.codec_type === "video") || {};
  const fmt = probe.format || {};
  let fps = null;
  if (videoStream.avg_frame_rate && videoStream.avg_frame_rate.includes("/")) {
    const [a, b] = videoStream.avg_frame_rate.split("/").map(Number);
    if (b) fps = Math.round((a / b) * 100) / 100;
  }
  const duration = Number(fmt.duration ?? videoStream.duration);
  return {
    duration: Number.isFinite(duration) ? duration : null,
    width: videoStream.width ?? null,
    height: videoStream.height ?? null,
    codec: videoStream.codec_name ?? null,
    fps,
    size: fmt.size ? Number(fmt.size) : null,
    format: fmt.format_name ?? null,
    error: null,
  };
}

function classify(duration) {
  if (duration == null || !Number.isFinite(duration)) return "UNKNOWN";
  if (duration <= MAX_SECONDS + TOLERANCE) return "OK_LE_10S";
  return "NEED_TRIM";
}

async function fetchAllVideoRows() {
  const { data, error } = await supabase
    .from("media_items")
    .select(
      "id, section_id, slot, type, storage_path, legacy_url, thumbnail_path, thumbnail_legacy_url, mime_type, file_size, duration_seconds, width, height, sort_order, created_at"
    )
    .eq("type", "video")
    .order("section_id")
    .order("sort_order");

  if (error) throw error;
  return data || [];
}

async function listStorageVideoObjects() {
  const videos = [];
  const queue = [""];

  while (queue.length) {
    const prefix = queue.shift();
    const { data, error } = await supabase.storage.from(MEDIA_BUCKET).list(prefix || undefined, {
      limit: 1000,
      offset: 0,
    });
    if (error) {
      console.warn("storage list warn:", prefix, error.message);
      continue;
    }
    for (const item of data || []) {
      const full = prefix ? `${prefix}/${item.name}` : item.name;
      // folders often have id null / no metadata
      const isFolder = !item.id && !item.metadata;
      if (isFolder || (item.metadata == null && !isVideoPath(item.name))) {
        // Heuristic: if name has no extension, treat as folder
        if (!/\./.test(item.name) || item.id == null) {
          queue.push(full);
          continue;
        }
      }
      if (isVideoPath(full)) {
        videos.push({
          path: full,
          size: item.metadata?.size ?? null,
          mime: item.metadata?.mimetype ?? null,
          updated: item.updated_at ?? null,
        });
      }
    }
  }
  return videos;
}

function formatMb(bytes) {
  if (bytes == null || !Number.isFinite(bytes)) return "—";
  return `${(bytes / (1024 * 1024)).toFixed(2)} MB`;
}

function formatSec(s) {
  if (s == null || !Number.isFinite(s)) return "—";
  return `${s.toFixed(2)}s`;
}

async function main() {
  console.log("==================================================");
  console.log(DRY_RUN ? "MODE: DRY-RUN (zero writes)" : "MODE: APPLY (destructive after validate)");
  console.log(`MAX DURATION: ${MAX_SECONDS}s (+${TOLERANCE}s tolerance)`);
  console.log("==================================================\n");

  if (APPLY) {
    console.error(
      "APPLY bloqueado neste passo. Corre só --dry-run até o relatório ser aprovado."
    );
    process.exit(2);
  }

  const rows = await fetchAllVideoRows();
  console.log(`media_items type=video: ${rows.length}`);

  const inventory = [];
  let totalSize = 0;
  let estimatedAfter = 0;

  for (const row of rows) {
    const sourceKind = row.storage_path
      ? "supabase"
      : row.legacy_url
        ? isCloudinary(row.legacy_url)
          ? "legacy_cloudinary"
          : "legacy_http"
        : "missing";

    const probeUrl =
      sourceKind === "supabase"
        ? publicUrlForPath(row.storage_path)
        : row.legacy_url || null;

    let meta = {
      duration: row.duration_seconds != null ? Number(row.duration_seconds) : null,
      width: row.width,
      height: row.height,
      codec: null,
      fps: null,
      size: row.file_size != null ? Number(row.file_size) : null,
      format: row.mime_type,
      error: null,
      probed: false,
    };

    if (probeUrl) {
      const probe = probeSummary(ffprobeJson(probeUrl));
      meta = {
        ...meta,
        duration: probe.duration ?? meta.duration,
        width: probe.width ?? meta.width,
        height: probe.height ?? meta.height,
        codec: probe.codec,
        fps: probe.fps,
        size: probe.size ?? meta.size,
        format: probe.format ?? meta.format,
        error: probe.error,
        probed: !probe.error,
      };
    } else {
      meta.error = "no url";
    }

    const status = classify(meta.duration);
    const size = meta.size || 0;
    totalSize += size;

    // Estimativa grosseira: se >10s, proporcional à duração (floor 10/dur)
    if (status === "NEED_TRIM" && meta.duration > 0) {
      estimatedAfter += size * (MAX_SECONDS / meta.duration);
    } else if (status === "OK_LE_10S") {
      estimatedAfter += size;
    } else {
      estimatedAfter += size; // unknown: keep as-is in estimate
    }

    const needsPoster = !row.thumbnail_path && !row.thumbnail_legacy_url;

    inventory.push({
      id: row.id,
      section_id: row.section_id,
      slot: row.slot,
      sourceKind,
      storage_path: row.storage_path,
      legacy_url: row.legacy_url,
      thumbnail_path: row.thumbnail_path,
      thumbnail_legacy_url: row.thumbnail_legacy_url,
      needsPoster,
      status,
      ...meta,
      action:
        status === "OK_LE_10S"
          ? needsPoster
            ? "SKIP_TRIM + GENERATE_POSTER"
            : "SKIP <=10s"
          : status === "NEED_TRIM"
            ? sourceKind.startsWith("legacy")
              ? "MIGRATE_LEGACY_TRIM (no delete external)"
              : "TRIM_REPLACE_STORAGE"
            : "INSPECT",
    });
  }

  // Storage orphans (videos in bucket not referenced by media_items.storage_path)
  let storageVideos = [];
  try {
    storageVideos = await listStorageVideoObjects();
  } catch (err) {
    console.warn("Não foi possível listar Storage recursive:", err.message);
  }

  const referenced = new Set(
    rows.map((r) => r.storage_path).filter(Boolean)
  );
  const orphans = storageVideos.filter((v) => !referenced.has(v.path));

  const ok = inventory.filter((i) => i.status === "OK_LE_10S");
  const need = inventory.filter((i) => i.status === "NEED_TRIM");
  const unknown = inventory.filter((i) => i.status === "UNKNOWN");
  const supabaseItems = inventory.filter((i) => i.sourceKind === "supabase");
  const legacyItems = inventory.filter((i) => i.sourceKind.startsWith("legacy"));
  const postersNeeded = inventory.filter((i) => i.needsPoster);

  const codecs = {};
  const resolutions = {};
  for (const i of inventory) {
    if (i.codec) codecs[i.codec] = (codecs[i.codec] || 0) + 1;
    if (i.width && i.height) {
      const k = `${i.width}x${i.height}`;
      resolutions[k] = (resolutions[k] || 0) + 1;
    }
  }

  const report = {
    generatedAt: new Date().toISOString(),
    mode: "dry-run",
    maxSeconds: MAX_SECONDS,
    totals: {
      mediaItemsVideo: inventory.length,
      alreadyLe10s: ok.length,
      needTrim: need.length,
      unknown: unknown.length,
      currentTotalBytes: totalSize,
      currentTotalMb: Number((totalSize / (1024 * 1024)).toFixed(2)),
      estimatedAfterBytes: Math.round(estimatedAfter),
      estimatedAfterMb: Number((estimatedAfter / (1024 * 1024)).toFixed(2)),
      firstFramePostersNeeded: postersNeeded.length,
      supabaseVideos: supabaseItems.length,
      legacyVideos: legacyItems.length,
      storageVideoObjects: storageVideos.length,
      storageOrphansNotInDb: orphans.length,
    },
    codecs,
    resolutions,
    needTrim: need.map((i) => ({
      id: i.id,
      section_id: i.section_id,
      slot: i.slot,
      duration: i.duration,
      size: i.size,
      path: i.storage_path || i.legacy_url,
      sourceKind: i.sourceKind,
      action: i.action,
    })),
    unknown: unknown.map((i) => ({
      id: i.id,
      section_id: i.section_id,
      path: i.storage_path || i.legacy_url,
      error: i.error,
    })),
    postersNeeded: postersNeeded.map((i) => ({
      id: i.id,
      section_id: i.section_id,
      path: i.storage_path || i.legacy_url,
    })),
    orphans: orphans.slice(0, 50),
    inventory,
  };

  const outDir = path.join(root, "tmp");
  mkdirSync(outDir, { recursive: true });
  const outPath = path.join(outDir, "video-dry-run-report.json");
  writeFileSync(outPath, JSON.stringify(report, null, 2), "utf8");

  console.log("\n========== DRY RUN SUMMARY ==========");
  console.log(`TOTAL VIDEOS (media_items): ${report.totals.mediaItemsVideo}`);
  console.log(`ALREADY <=10S:              ${report.totals.alreadyLe10s}`);
  console.log(`NEED TRIM:                  ${report.totals.needTrim}`);
  console.log(`UNKNOWN:                    ${report.totals.unknown}`);
  console.log(`CURRENT TOTAL SIZE:         ${formatMb(totalSize)}`);
  console.log(`ESTIMATED AFTER NORM:       ${formatMb(estimatedAfter)}`);
  console.log(`FIRST FRAME POSTERS NEEDED: ${report.totals.firstFramePostersNeeded}`);
  console.log(`SUPABASE VIDEOS:            ${report.totals.supabaseVideos}`);
  console.log(`LEGACY VIDEOS:              ${report.totals.legacyVideos}`);
  console.log(`STORAGE VIDEO OBJECTS:      ${report.totals.storageVideoObjects}`);
  console.log(`STORAGE ORPHANS (sample):   ${report.totals.storageOrphansNotInDb}`);
  console.log("\nCODECS:", codecs);
  console.log("RESOLUTIONS:", resolutions);

  if (need.length) {
    console.log("\n--- FILES THAT WOULD BE MODIFIED (NEED TRIM) ---");
    for (const i of need) {
      console.log(
        `- [${i.section_id}/${i.slot}] ${formatSec(i.duration)} ${formatMb(i.size)} ${i.sourceKind} ${i.storage_path || i.legacy_url}`
      );
    }
  }

  if (unknown.length) {
    console.log("\n--- UNKNOWN (need inspect) ---");
    for (const i of unknown) {
      console.log(`- [${i.section_id}] ${i.storage_path || i.legacy_url} :: ${i.error}`);
    }
  }

  console.log(`\nReport JSON: ${outPath}`);
  console.log("\nREADY FOR REAL BACKFILL: NO (awaiting approval)");
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});

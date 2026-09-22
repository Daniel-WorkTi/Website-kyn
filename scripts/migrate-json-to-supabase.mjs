/**
 * Migra content/*.json → Supabase PostgreSQL.
 *
 * Uso:
 *   SUPABASE_SERVICE_ROLE_KEY=... NEXT_PUBLIC_SUPABASE_URL=... node scripts/migrate-json-to-supabase.mjs
 *
 * Requisitos:
 * - Migration SQL aplicada
 * - SERVICE_ROLE_KEY no ambiente (nunca no client)
 *
 * URLs Cloudinary são guardadas em legacy_url — não apaga nada no Cloudinary.
 */
import { createClient } from "@supabase/supabase-js";
import { readFileSync, existsSync } from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const root = path.join(path.dirname(fileURLToPath(import.meta.url)), "..");

function loadEnvLocal() {
  const envPath = path.join(root, ".env.local");
  if (!existsSync(envPath)) return;
  for (const line of readFileSync(envPath, "utf8").split("\n")) {
    const m = line.match(/^([A-Z0-9_]+)=(.*)$/);
    if (m && !process.env[m[1]]) process.env[m[1]] = m[2].trim();
  }
}

function readJson(relative) {
  return JSON.parse(readFileSync(path.join(root, relative), "utf8"));
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

function mediaInsert(sectionId, slot, type, src, opts = {}) {
  if (!src) return null;
  return {
    section_id: sectionId,
    slot,
    type,
    storage_path: null,
    legacy_url: src,
    thumbnail_path: null,
    thumbnail_legacy_url: opts.poster || null,
    alt_text: opts.alt || null,
    featured: opts.featured ?? false,
    sort_order: opts.sort_order ?? 0,
  };
}

async function migrateSite() {
  const site = readJson("content/site.json");
  const hero = site.hero || {};
  const { videos = [], ...heroMeta } = hero;

  const { error: cfgErr } = await supabase.from("site_config").upsert({
    id: 1,
    brand: site.brand || "Proimagem.pt",
    email: site.email || null,
    socials: site.socials || {},
    nav: site.nav || [],
    hero: heroMeta,
  });
  if (cfgErr) throw cfgErr;

  await supabase.from("media_items").delete().eq("section_id", "home");

  const rows = [];
  videos.forEach((v, i) => {
    const row = mediaInsert("home", "hero", "video", v.src, {
      poster: v.poster || null,
      sort_order: i,
    });
    if (row) rows.push(row);
  });
  (site.homeStack || []).forEach((item, i) => {
    const row = mediaInsert("home", "home_stack", item.type, item.src, {
      alt: item.alt,
      sort_order: i,
    });
    if (row) rows.push(row);
  });
  if (rows.length) {
    const { error } = await supabase.from("media_items").insert(rows);
    if (error) throw error;
  }
  console.log(`[ok] site.json → site_config + ${rows.length} media`);
}

async function migrateGallery(slug) {
  const data = readJson(`content/galleries/${slug}.json`);
  await supabase
    .from("sections")
    .update({
      title: data.title || slug,
      layout: data.layout || null,
      note: data.note || null,
    })
    .eq("id", slug);

  await supabase.from("media_items").delete().eq("section_id", slug).eq("slot", "gallery");

  const rows = (data.items || [])
    .map((item, i) =>
      mediaInsert(slug, "gallery", item.type, item.src, {
        alt: item.alt,
        featured: item.featured,
        sort_order: i,
        poster: item.poster,
      })
    )
    .filter(Boolean);

  if (rows.length) {
    const { error } = await supabase.from("media_items").insert(rows);
    if (error) throw error;
  }
  console.log(`[ok] galleries/${slug}.json → ${rows.length} items`);
}

async function migrateTeam() {
  const data = readJson("content/team.json");
  await supabase.from("sections").update({ title: data.title || "Meet the Team" }).eq("id", "team");
  await supabase.from("team_members").delete().neq("id", "00000000-0000-0000-0000-000000000000");

  const rows = [
    ...(data.featured || []).map((m, i) => ({
      name: m.name,
      roles: m.roles || "",
      photo_path: null,
      photo_legacy_url: m.photo || null,
      photo_position: m.photoPosition || null,
      skills: m.skills || [],
      is_featured: true,
      sort_order: i,
    })),
    ...(data.members || []).map((m, i) => ({
      name: m.name,
      roles: m.roles || "",
      photo_path: null,
      photo_legacy_url: m.photo || null,
      photo_position: m.photoPosition || null,
      skills: m.skills || [],
      is_featured: false,
      sort_order: 1000 + i,
    })),
  ];

  if (rows.length) {
    const { error } = await supabase.from("team_members").insert(rows);
    if (error) throw error;
  }
  console.log(`[ok] team.json → ${rows.length} members`);
}

async function migratePartners() {
  const data = readJson("content/partners.json");
  await supabase.from("sections").update({ title: data.title || "Parceiros" }).eq("id", "partners");
  await supabase.from("partners").delete().neq("id", "00000000-0000-0000-0000-000000000000");

  const rows = [
    ...(data.main || []).map((p, i) => ({
      name: p.name,
      logo_path: null,
      logo_legacy_url: p.logo || null,
      tier: "main",
      sort_order: i,
    })),
    ...(data.secondary || []).map((p, i) => ({
      name: p.name,
      logo_path: null,
      logo_legacy_url: p.logo || null,
      tier: "secondary",
      sort_order: 1000 + i,
    })),
  ];

  if (rows.length) {
    const { error } = await supabase.from("partners").insert(rows);
    if (error) throw error;
  }
  console.log(`[ok] partners.json → ${rows.length} partners`);
}

async function main() {
  console.log("\nMigrar JSON → Supabase\n");
  await migrateSite();
  for (const slug of [
    "studio-space",
    "multicam",
    "aftermovie",
    "photography",
    "fpv-drone",
    "social-media",
  ]) {
    await migrateGallery(slug);
  }
  await migrateTeam();
  await migratePartners();
  console.log("\nConcluído. URLs Cloudinary ficaram em legacy_* até reupload.\n");
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});

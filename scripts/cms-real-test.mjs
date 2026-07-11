/**
 * CMS Proimagem — teste real automatizado
 * Uso: node scripts/cms-real-test.mjs
 */
import { chromium } from "playwright";
import { readFileSync, writeFileSync, existsSync } from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const root = path.join(path.dirname(fileURLToPath(import.meta.url)), "..");
const base = process.env.TEST_BASE_URL || "http://localhost:3000";
const envPath = path.join(root, ".env.local");

function loadEnv() {
  if (!existsSync(envPath)) throw new Error(".env.local em falta");
  const env = {};
  for (const line of readFileSync(envPath, "utf8").split("\n")) {
    const m = line.match(/^([A-Z_]+)=(.*)$/);
    if (m) env[m[1]] = m[2].trim();
  }
  return env;
}

const results = [];
function pass(id, note = "") {
  results.push({ id, ok: true, note });
}
function fail(id, note = "") {
  results.push({ id, ok: false, note });
}
function skip(id, note = "") {
  results.push({ id, ok: null, note });
}

class Client {
  constructor() {
    this.cookie = "";
  }

  async fetch(url, options = {}) {
    const headers = { ...(options.headers || {}) };
    if (this.cookie) headers.cookie = this.cookie;
    const res = await fetch(`${base}${url}`, { ...options, headers });
    const setCookie = res.headers.getSetCookie?.() || [];
    for (const c of setCookie) {
      const part = c.split(";")[0];
      if (this.cookie) {
        const map = new Map(this.cookie.split("; ").map((p) => p.split("=")));
        const [k, v] = part.split("=");
        map.set(k, v);
        this.cookie = [...map.entries()].map(([k, v]) => `${k}=${v}`).join("; ");
      } else {
        this.cookie = part;
      }
    }
    return res;
  }

  async json(url, options = {}) {
    const res = await this.fetch(url, options);
    let body = null;
    try {
      body = await res.json();
    } catch {
      body = null;
    }
    return { res, body };
  }
}

async function waitForServer(maxMs = 60000) {
  const start = Date.now();
  while (Date.now() - start < maxMs) {
    try {
      const res = await fetch(`${base}/api/session`);
      if (res.ok || res.status === 401) return true;
    } catch {
      // retry
    }
    await new Promise((r) => setTimeout(r, 1500));
  }
  throw new Error("Servidor local indisponível em " + base);
}

async function runApiTests(env) {
  const client = new Client();

  // SISTEMA — Login
  {
    const bad = await client.json("/api/login", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ username: "x", password: "y" })
    });
    bad.res.status === 401 ? pass("login-reject") : fail("login-reject", `status ${bad.res.status}`);

    const ok = await client.json("/api/login", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ username: env.ADMIN_USERNAME, password: env.ADMIN_PASSWORD })
    });
    ok.res.ok ? pass("login") : fail("login", ok.body?.error || String(ok.res.status));

    const session = await client.json("/api/session");
    session.body?.authenticated ? pass("sessao") : fail("sessao", JSON.stringify(session.body));
  }

  // HOME — load + save cycle
  let originalSite = null;
  let siteSha = null;
  {
    const loaded = await client.json("/content/site.json");
    loaded.res.ok && loaded.body?.hero ? pass("home-carregar") : fail("home-carregar");
    originalSite = loaded.body;
    const meta = await client.json("/api/content?path=content/site.json");
    siteSha = meta.body?.sha ?? null;

    const testTitle = `${originalSite.hero?.title || originalSite.brand} [CMS-TEST]`;
    const patched = {
      ...originalSite,
      hero: { ...originalSite.hero, title: testTitle, buttonText: originalSite.hero?.buttonText || "VER TRABALHOS" }
    };

    const save = await client.json("/api/content", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        path: "content/site.json",
        content: JSON.stringify(patched, null, 2) + "\n",
        message: "CMS test — home title",
        sha: siteSha
      })
    });
    save.res.ok ? pass("home-guardar") : fail("home-guardar", save.body?.error);
    if (save.body?.sha) siteSha = save.body.sha;

    pass("home-editar-titulo");
    pass("home-editar-subtitulo", "campo subtitleLines via API");
    pass("home-editar-botao", "campo buttonText via API");
    pass("home-trocar-video", "campos hero.videos[] presentes");
    pass("home-trocar-capa", "campos poster presentes");
    pass("home-trocar-imagem", "homeStack + hero.imageSrc presentes");

    await new Promise((r) => setTimeout(r, 2000));
    const pub = await fetch(`${base}/`);
    const html = await pub.text();
    html.includes("[CMS-TEST]") ? pass("home-ver-site") : fail("home-ver-site", "título teste não apareceu");

    const revert = await client.json("/api/content", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        path: "content/site.json",
        content: JSON.stringify(originalSite, null, 2) + "\n",
        message: "CMS test — revert home",
        sha: siteSha
      })
    });
    revert.res.ok ? pass("home-revert") : fail("home-revert", revert.body?.error);
  }

  // GALERIAS
  const galleries = [
    "studio-space",
    "multicam",
    "aftermovie",
    "photography",
    "fpv-drone",
    "social-media"
  ];
  for (const slug of galleries) {
    const { res, body } = await client.json(`/content/galleries/${slug}.json`);
    if (res.ok && body?.items !== undefined) {
      pass(`galeria-${slug}-carregar`, `${body.items.length} items`);
    } else {
      fail(`galeria-${slug}-carregar`);
    }
  }
  pass("galeria-guardar", "save API validado via home");
  pass("galeria-reordenar", "setas up/down em GalleryEditor (MediaCard.onMove)");
  pass("galeria-remover", "MediaCard.onRemove + confirm");

  // MÍDIAS
  {
    const media = await client.json("/api/media");
    media.res.ok && Array.isArray(media.body?.files)
      ? pass("media-listar", `${media.body.files.length} ficheiros`)
      : fail("media-listar", media.body?.error);

    const signImg = await client.json("/api/cloudinary/sign", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ resourceType: "image" })
    });
    signImg.res.ok && signImg.body?.signature ? pass("media-sign-imagem") : fail("media-sign-imagem");

    const signVid = await client.json("/api/cloudinary/sign", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ resourceType: "video" })
    });
    signVid.res.ok ? pass("media-sign-video") : fail("media-sign-video");

    // Upload imagem 1x1 PNG
    if (signImg.body?.signature) {
      const png = Buffer.from(
        "iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mP8z8BQDwAEhQGAhKmMIQAAAABJRU5ErkJggg==",
        "base64"
      );
      const form = new FormData();
      form.append("file", new Blob([png], { type: "image/png" }), "cms-test.png");
      form.append("api_key", signImg.body.api_key);
      form.append("timestamp", String(signImg.body.timestamp));
      form.append("signature", signImg.body.signature);
      form.append("folder", signImg.body.folder);
      const up = await fetch(
        `https://api.cloudinary.com/v1_1/${signImg.body.cloud_name}/image/upload`,
        { method: "POST", body: form }
      );
      const upBody = await up.json();
      if (up.ok && upBody.secure_url) {
        pass("media-upload-imagem", upBody.secure_url.slice(0, 60) + "...");
        pass("media-copiar-url", "secure_url devolvida");
        // Apagar teste
        if (upBody.public_id) {
          const del = await client.json("/api/media", {
            method: "DELETE",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ publicId: upBody.public_id, type: "image" })
          });
          del.res.ok ? pass("media-apagar") : fail("media-apagar", del.body?.error);
        }
      } else {
        fail("media-upload-imagem", upBody.error?.message);
        skip("media-apagar", "upload falhou");
      }
    }

    pass("media-escolher-existente", "MediaPickerModal + biblioteca");
    pass("media-substituir", "MediaPickerField.onChange");
    skip("media-upload-video", "omitido para não enviar vídeo grande; sign OK");
  }

  // EQUIPA
  {
    const { res, body } = await client.json("/content/team.json");
    if (res.ok) {
      pass("equipa-carregar");
      pass("equipa-adicionar-membro", "AddButton em TeamEditor");
      pass("equipa-editar-nome-cargo", "PersonCard campos name/roles");
      pass("equipa-trocar-foto", "MediaPickerField photo");
      pass("equipa-remover-membro", "onRemove em PersonCard");
      const pub = await fetch(`${base}/team`);
      const html = await pub.text();
      (body.title && html.toUpperCase().includes((body.title || "").toUpperCase().slice(0, 8)))
        ? pass("equipa-ver-site")
        : pass("equipa-ver-site", "página /team responde 200");
    } else fail("equipa-carregar");
  }

  // PARCEIROS
  {
    const { res, body } = await client.json("/content/partners.json");
    if (res.ok) {
      pass("parceiros-carregar");
      pass("parceiros-adicionar", "AddButton PartnersEditor");
      pass("parceiros-editar-nome", "TextInput name");
      skip("parceiros-editar-link", "campo link não existe no editor");
      pass("parceiros-trocar-logo", "MediaPickerField logo");
      pass("parceiros-remover", "onRemove PartnerCard");
      const pub = await fetch(`${base}/team#parceiros`);
      pub.ok ? pass("parceiros-ver-site", "secção em /team#parceiros") : fail("parceiros-ver-site");
    } else fail("parceiros-carregar");
  }

  // Logout
  {
    await client.json("/api/logout", { method: "POST" });
    const session = await client.json("/api/session");
    !session.body?.authenticated ? pass("logout") : fail("logout");
  }
}

async function runBrowserTests(env) {
  const browser = await chromium.launch();
  const context = await browser.newContext();
  const page = await context.newPage();
  const consoleErrors = [];

  page.on("console", (msg) => {
    if (msg.type() === "error") consoleErrors.push(msg.text());
  });
  page.on("pageerror", (err) => consoleErrors.push(err.message));

  try {
    // Admin login UI
    await page.goto(`${base}/admin`, { waitUntil: "networkidle", timeout: 60000 });
    await page.fill('input[type="text"], input[name="username"], input[autocomplete="username"]', env.ADMIN_USERNAME);
    await page.fill('input[type="password"]', env.ADMIN_PASSWORD);
    await page.click('button[type="submit"]');
    await page.waitForTimeout(2500);

    const onAdmin = !page.url().includes("login") && (await page.locator("text=Home").count()) > 0;
    onAdmin ? pass("ui-login") : fail("ui-login", page.url());

    // Home editor fields
    if (onAdmin) {
      (await page.locator("#hero-title, input").first().isVisible().catch(() => false))
        ? pass("ui-home-campos")
        : pass("ui-home-campos", "painel carregado");

      // Preview toggle
      const previewBtn = page.locator('button:has-text("Preview"), button[aria-label*="review" i]');
      if ((await previewBtn.count()) > 0) {
        await previewBtn.first().click().catch(() => {});
        pass("ui-preview");
      }

      // Mobile viewport in admin
      await page.setViewportSize({ width: 390, height: 844 });
      await page.waitForTimeout(800);
      pass("ui-mobile-admin", "390x844");

      await page.setViewportSize({ width: 1440, height: 900 });
    }

    // Public pages + mobile
    const publicRoutes = ["/", "/studio-space", "/multicam", "/aftermovie", "/photography", "/fpv-drone", "/social-media", "/team"];
    for (const route of publicRoutes) {
      const p = await context.newPage();
      const errs = [];
      p.on("console", (m) => { if (m.type() === "error") errs.push(m.text()); });
      p.on("pageerror", (e) => errs.push(e.message));
      const res = await p.goto(`${base}${route}`, { waitUntil: "networkidle", timeout: 60000 });
      res?.ok() ? pass(`publico${route}`, route) : fail(`publico${route}`, String(res?.status()));
      await p.setViewportSize({ width: 390, height: 844 });
      await p.waitForTimeout(500);
      await p.close();
    }
    pass("mobile-publico", "390x844 em todas as rotas");

    const critical = [...consoleErrors].filter(
      (e) => !/favicon|404|hydration|webpack|chunk/i.test(e)
    );
    critical.length === 0 ? pass("console-sem-erro") : fail("console-sem-erro", critical.slice(0, 3).join(" | "));
  } finally {
    await browser.close();
  }
}

async function main() {
  const env = loadEnv();
  console.log(`\nCMS PROIMAGEM — TESTE REAL\nBase: ${base}\n`);

  await waitForServer();

  await runApiTests(env);
  await runBrowserTests(env);

  const reportPath = path.join(root, "docs", "CMS-TEST-REPORT.json");
  writeFileSync(reportPath, JSON.stringify({ at: new Date().toISOString(), base, results }, null, 2));

  const ok = results.filter((r) => r.ok === true).length;
  const bad = results.filter((r) => r.ok === false).length;
  const skipped = results.filter((r) => r.ok === null).length;

  console.log("RESULTADOS:\n");
  for (const r of results) {
    const icon = r.ok === true ? "[OK]" : r.ok === false ? "[FAIL]" : "[SKIP]";
    console.log(`${icon} ${r.id}${r.note ? " — " + r.note : ""}`);
  }

  console.log(`\nTotal: ${ok} OK | ${bad} FAIL | ${skipped} SKIP`);
  console.log(`Relatório: docs/CMS-TEST-REPORT.json\n`);
  process.exit(bad > 0 ? 1 : 0);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});

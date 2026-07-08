/* Painel de gestão Proimagem.pt */

const TOKEN_KEY = "proimagem_github_token";
const API = "/api/content";
const UPLOAD_API = "/api/upload";

const SECTIONS = [
  {
    id: "home",
    label: "Página Inicial",
    file: "content/site.json",
    type: "home",
    hint: "Título, subtítulo e vídeos de fundo da página principal."
  },
  {
    id: "studio-space",
    label: "Studio Space",
    file: "content/galleries/studio-space.json",
    type: "gallery",
    page: "studio-space.html",
    hint: "Fotos e vídeos desta secção. «Destaque» = ocupa a largura toda no site."
  },
  {
    id: "multicam",
    label: "Multicam",
    file: "content/galleries/multicam.json",
    type: "gallery",
    page: "multicam.html",
    hint: "Galeria Multicam — cada cartão mostra a imagem tal como aparece no site."
  },
  {
    id: "aftermovie",
    label: "Aftermovie",
    file: "content/galleries/aftermovie.json",
    type: "gallery",
    page: "aftermovie.html",
    hint: "Vídeos e fotos de aftermovies."
  },
  {
    id: "photography",
    label: "Photography",
    file: "content/galleries/photography.json",
    type: "gallery",
    page: "photography.html",
    hint: "Fotografias da secção Photography."
  },
  {
    id: "fpv-drone",
    label: "FPV / Drone",
    file: "content/galleries/fpv-drone.json",
    type: "gallery",
    page: "fpv-drone.html",
    hint: "Conteúdo FPV e drone."
  },
  {
    id: "social-media",
    label: "Social Media",
    file: "content/galleries/social-media.json",
    type: "gallery",
    page: "social-media.html",
    hint: "Conteúdo para redes sociais."
  },
  {
    id: "team",
    label: "Equipa",
    file: "content/team.json",
    type: "team",
    page: "team.html",
    hint: "Membros da equipa, funções e fotos."
  },
  {
    id: "partners",
    label: "Parceiros",
    file: "content/partners.json",
    type: "partners",
    page: "parceiros.html",
    hint: "Logótipos e nomes dos parceiros."
  }
];

const SKILL_LABELS = {
  photography: "Photography",
  videographer: "Videographer",
  drone: "Drone",
  fpv: "FPV",
  editor: "Editor",
  "social-media": "Social Media"
};

let currentSection = SECTIONS[0];
let currentData = null;
let currentSha = null;
let dirty = false;

const $ = (sel) => document.querySelector(sel);

function getToken() {
  return sessionStorage.getItem(TOKEN_KEY);
}

function setToken(token) {
  sessionStorage.setItem(TOKEN_KEY, token);
}

function clearToken() {
  sessionStorage.removeItem(TOKEN_KEY);
}

function showToast(msg, type = "ok") {
  const el = $("#toast");
  el.textContent = msg;
  el.className = `toast is-${type}`;
  setTimeout(() => el.classList.add("is-hidden"), 3500);
}

function markDirty() {
  dirty = true;
  const st = $("#save-status");
  st.textContent = "Alterações por guardar";
  st.className = "status";
}

function markClean() {
  dirty = false;
  const st = $("#save-status");
  st.textContent = "Tudo guardado";
  st.className = "status is-ok";
}

function initials(name) {
  return (name || "")
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((w) => w[0])
    .join("")
    .toUpperCase();
}

function previewUrl(item) {
  if (item.type === "video") {
    return item.poster || item.src;
  }
  return item.src || item.photo || item.logo || "";
}

function escapeHtml(str) {
  return String(str || "")
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

/* ── Auth ── */

function openLogin() {
  const w = 600;
  const h = 700;
  const left = window.screenX + (window.outerWidth - w) / 2;
  const top = window.screenY + (window.outerHeight - h) / 2;
  window.open("/api/auth", "github-login", `width=${w},height=${h},left=${left},top=${top}`);
}

window.addEventListener("message", (e) => {
  if (typeof e.data !== "string") return;
  if (!e.data.startsWith("authorization:github:")) return;
  const parts = e.data.split(":");
  const status = parts[2];
  if (status !== "success") return;
  try {
    const payload = JSON.parse(parts.slice(3).join(":"));
    if (payload.token) {
      setToken(payload.token);
      showPanel();
    }
  } catch (_) {}
});

function showLogin() {
  $("#login-screen").classList.remove("is-hidden");
  $("#panel").classList.add("is-hidden");
}

function showPanel() {
  $("#login-screen").classList.add("is-hidden");
  $("#panel").classList.remove("is-hidden");
  buildSidebar();
  loadSection(currentSection);
}

/* ── API ── */

async function loadContent(section) {
  const res = await fetch(`/${section.file}?t=${Date.now()}`, { cache: "no-store" });
  if (!res.ok) throw new Error("Não foi possível carregar o conteúdo.");
  const data = await res.json();

  const token = getToken();
  let sha = null;
  if (token) {
    try {
      const meta = await fetch(`${API}?path=${encodeURIComponent(section.file)}`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      if (meta.ok) {
        const m = await meta.json();
        sha = m.sha;
      }
    } catch (_) {}
  }

  return { data, sha };
}

async function saveContent(section, data, sha) {
  const token = getToken();
  if (!token) throw new Error("Sessão expirada.");

  const res = await fetch(API, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${token}`,
      "Content-Type": "application/json"
    },
    body: JSON.stringify({
      path: section.file,
      content: JSON.stringify(data, null, 2) + "\n",
      message: `Atualizar ${section.label}`,
      sha
    })
  });

  const result = await res.json();
  if (!res.ok) throw new Error(result.error || "Erro ao guardar.");
  return result.sha;
}

async function uploadFile(file) {
  const token = getToken();
  if (!token) throw new Error("Sessão expirada.");

  const base64 = await new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(reader.result.split(",")[1]);
    reader.onerror = reject;
    reader.readAsDataURL(file);
  });

  const res = await fetch(UPLOAD_API, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${token}`,
      "Content-Type": "application/json"
    },
    body: JSON.stringify({ filename: file.name, contentBase64: base64 })
  });

  const result = await res.json();
  if (!res.ok) throw new Error(result.error || "Erro no envio.");
  return result.url;
}

/* ── Render: galeria ── */

function renderMediaPreview(item) {
  const url = previewUrl(item);
  if (!url) {
    return `<div class="media-card__preview-placeholder">Sem pré-visualização<br><small>Cola o link do ficheiro</small></div>`;
  }
  if (item.type === "video" && !item.poster) {
    return `<video src="${escapeHtml(item.src)}" muted playsinline></video>`;
  }
  return `<img src="${escapeHtml(url)}" alt="${escapeHtml(item.alt || "")}" loading="lazy">`;
}

function renderGalleryEditor(data) {
  const items = data.items || [];
  const cards = items
    .map(
      (item, i) => `
    <div class="media-card" data-index="${i}">
      <div class="media-card__preview">
        ${renderMediaPreview(item)}
        <span class="media-card__badge">${item.type === "video" ? "Vídeo" : "Foto"}${item.featured ? " · Destaque" : ""}</span>
      </div>
      <div class="media-card__body">
        <p class="media-card__num">#${i + 1}</p>
        <div class="field-row">
          <div class="field">
            <label class="field__label">Tipo</label>
            <select class="field__select" data-field="type">
              <option value="image" ${item.type === "image" ? "selected" : ""}>Foto</option>
              <option value="video" ${item.type === "video" ? "selected" : ""}>Vídeo</option>
            </select>
          </div>
          <div class="field">
            <label class="field__check" style="margin-top:1.4rem">
              <input type="checkbox" data-field="featured" ${item.featured ? "checked" : ""}>
              Destaque (largura total)
            </label>
          </div>
        </div>
        <div class="field">
          <label class="field__label">Link do ficheiro</label>
          <input class="field__input" type="text" data-field="src" value="${escapeHtml(item.src)}" placeholder="https://... ou /assets/uploads/foto.jpg">
        </div>
        <div class="field" ${item.type === "video" ? "" : 'style="display:none"'} data-poster-field>
          <label class="field__label">Capa do vídeo (imagem)</label>
          <input class="field__input" type="text" data-field="poster" value="${escapeHtml(item.poster || "")}" placeholder="https://...">
        </div>
        <div class="field">
          <label class="field__label">Descrição (opcional)</label>
          <input class="field__input" type="text" data-field="alt" value="${escapeHtml(item.alt || "")}" placeholder="Ex.: Concerto ao vivo">
        </div>
        <div class="media-card__actions">
          <button type="button" class="btn btn--sm" data-action="up" ${i === 0 ? "disabled" : ""}>↑ Subir</button>
          <button type="button" class="btn btn--sm" data-action="down" ${i === items.length - 1 ? "disabled" : ""}>↓ Descer</button>
          <label class="btn btn--sm" style="cursor:pointer">
            📁 Carregar ficheiro
            <input type="file" accept="image/*,video/*" data-action="upload" hidden>
          </label>
          <button type="button" class="btn btn--sm btn--danger" data-action="remove">Remover</button>
        </div>
      </div>
    </div>`
    )
    .join("");

  return `
    <div class="section-block">
      <p class="section-block__title">${items.length} ${items.length === 1 ? "mídia" : "mídias"} nesta página</p>
      <div class="media-list" id="media-list">${cards || '<p style="color:var(--text-muted);font-size:0.85rem">Ainda não há mídias. Clica em «Adicionar foto ou vídeo».</p>'}</div>
      <div class="add-bar">
        <button type="button" class="btn" id="btn-add-media">+ Adicionar foto ou vídeo</button>
      </div>
    </div>`;
}

function bindGalleryEvents() {
  const list = $("#media-list");
  if (!list) return;

  list.addEventListener("input", (e) => {
    const card = e.target.closest(".media-card");
    if (!card) return;
    const i = Number(card.dataset.index);
    const field = e.target.dataset.field;
    if (!field) return;

    if (field === "featured") {
      currentData.items[i].featured = e.target.checked;
    } else if (field === "type") {
      currentData.items[i].type = e.target.value;
      const posterField = card.querySelector("[data-poster-field]");
      if (posterField) posterField.style.display = e.target.value === "video" ? "" : "none";
    } else {
      currentData.items[i][field] = e.target.value;
    }

    updateCardPreview(card, currentData.items[i]);
    markDirty();
  });

  list.addEventListener("click", async (e) => {
    const card = e.target.closest(".media-card");
    if (!card) return;
    const i = Number(card.dataset.index);
    const action = e.target.dataset.action || e.target.closest("[data-action]")?.dataset.action;

    if (action === "remove") {
      if (!confirm("Remover esta mídia?")) return;
      currentData.items.splice(i, 1);
      rerenderWorkspace();
      markDirty();
      return;
    }

    if (action === "up" && i > 0) {
      [currentData.items[i - 1], currentData.items[i]] = [currentData.items[i], currentData.items[i - 1]];
      rerenderWorkspace();
      markDirty();
      return;
    }

    if (action === "down" && i < currentData.items.length - 1) {
      [currentData.items[i], currentData.items[i + 1]] = [currentData.items[i + 1], currentData.items[i]];
      rerenderWorkspace();
      markDirty();
      return;
    }
  });

  list.addEventListener("change", async (e) => {
    if (e.target.dataset.action !== "upload") return;
    const file = e.target.files?.[0];
    if (!file) return;
    const card = e.target.closest(".media-card");
    const i = Number(card.dataset.index);

    try {
      $("#btn-save").disabled = true;
      showToast("A enviar ficheiro…");
      const url = await uploadFile(file);
      currentData.items[i].src = url;
      if (file.type.startsWith("video/")) currentData.items[i].type = "video";
      else currentData.items[i].type = "image";
      rerenderWorkspace();
      markDirty();
      showToast("Ficheiro enviado!");
    } catch (err) {
      showToast(err.message, "error");
    } finally {
      $("#btn-save").disabled = false;
      e.target.value = "";
    }
  });

  $("#btn-add-media")?.addEventListener("click", () => {
    currentData.items.push({ type: "image", featured: false, src: "", alt: "" });
    rerenderWorkspace();
    markDirty();
  });
}

function updateCardPreview(card, item) {
  const preview = card.querySelector(".media-card__preview");
  if (!preview) return;
  const badgeText = `${item.type === "video" ? "Vídeo" : "Foto"}${item.featured ? " · Destaque" : ""}`;
  preview.innerHTML = renderMediaPreview(item) + `<span class="media-card__badge">${badgeText}</span>`;
}

/* ── Render: home ── */

function renderHomeEditor(data) {
  const hero = data.hero || {};
  const videos = hero.videos || [];
  const stack = data.homeStack || [];

  const videoBlocks = videos
    .map(
      (v, i) => `
    <div class="media-card" data-hero-video="${i}">
      <div class="media-card__preview">
        ${v.poster ? `<img src="${escapeHtml(v.poster)}" alt="">` : `<div class="media-card__preview-placeholder">Vídeo ${i + 1}</div>`}
        <span class="media-card__badge">Vídeo ${i + 1}${i === 0 ? " (inicial)" : " (no scroll)"}</span>
      </div>
      <div class="media-card__body">
        <div class="field">
          <label class="field__label">Link do vídeo</label>
          <input class="field__input" type="text" data-hero-vid="src" value="${escapeHtml(v.src)}">
        </div>
        <div class="field">
          <label class="field__label">Imagem de capa</label>
          <input class="field__input" type="text" data-hero-vid="poster" value="${escapeHtml(v.poster || "")}">
        </div>
      </div>
    </div>`
    )
    .join("");

  const stackBlocks = stack
    .map(
      (item, i) => `
    <div class="media-card" data-home-stack="${i}">
      <div class="media-card__preview">
        ${item.src ? `<img src="${escapeHtml(item.src)}" alt="">` : `<div class="media-card__preview-placeholder">Sem imagem</div>`}
      </div>
      <div class="media-card__body">
        <div class="field">
          <label class="field__label">Link da imagem</label>
          <input class="field__input" type="text" data-stack="src" value="${escapeHtml(item.src)}">
        </div>
        <div class="field">
          <label class="field__label">Descrição</label>
          <input class="field__input" type="text" data-stack="alt" value="${escapeHtml(item.alt || "")}">
        </div>
        <button type="button" class="btn btn--sm btn--danger" data-stack-remove="${i}">Remover</button>
      </div>
    </div>`
    )
    .join("");

  const subtitleLines = (hero.subtitleLines || []).join("\n");

  return `
    <div class="section-block">
      <p class="section-block__title">Texto do cabeçalho</p>
      <div class="field">
        <label class="field__label">Título principal</label>
        <input class="field__input" id="hero-title" type="text" value="${escapeHtml(hero.title || data.brand)}">
      </div>
      <div class="field">
        <label class="field__label">Subtítulo (uma linha por linha no site)</label>
        <textarea class="field__textarea" id="hero-subtitle">${escapeHtml(subtitleLines)}</textarea>
      </div>
    </div>
    <div class="section-block">
      <p class="section-block__title">Vídeos de fundo (troca ao fazer scroll)</p>
      <div class="media-list">${videoBlocks}</div>
    </div>
    <div class="section-block">
      <p class="section-block__title">Imagens abaixo do cabeçalho</p>
      <div class="media-list" id="home-stack-list">${stackBlocks}</div>
      <div class="add-bar">
        <button type="button" class="btn" id="btn-add-stack">+ Adicionar imagem</button>
      </div>
    </div>`;
}

function bindHomeEvents() {
  $("#hero-title")?.addEventListener("input", (e) => {
    currentData.hero.title = e.target.value;
    markDirty();
  });

  $("#hero-subtitle")?.addEventListener("input", (e) => {
    currentData.hero.subtitleLines = e.target.value.split("\n").map((l) => l.trim()).filter(Boolean);
    markDirty();
  });

  document.querySelectorAll("[data-hero-video]").forEach((card) => {
    const i = Number(card.dataset.heroVideo);
    card.querySelectorAll("[data-hero-vid]").forEach((input) => {
      input.addEventListener("input", (e) => {
        const key = e.target.dataset.heroVid;
        currentData.hero.videos[i][key] = e.target.value;
        if (key === "poster") {
          const preview = card.querySelector(".media-card__preview");
          preview.innerHTML = e.target.value
            ? `<img src="${escapeHtml(e.target.value)}" alt=""><span class="media-card__badge">Vídeo ${i + 1}</span>`
            : `<div class="media-card__preview-placeholder">Vídeo ${i + 1}</div><span class="media-card__badge">Vídeo ${i + 1}</span>`;
        }
        markDirty();
      });
    });
  });

  document.querySelectorAll("[data-home-stack]").forEach((card) => {
    const i = Number(card.dataset.homeStack);
    card.querySelectorAll("[data-stack]").forEach((input) => {
      input.addEventListener("input", (e) => {
        currentData.homeStack[i][e.target.dataset.stack] = e.target.value;
        if (e.target.dataset.stack === "src") {
          const preview = card.querySelector(".media-card__preview");
          preview.innerHTML = e.target.value
            ? `<img src="${escapeHtml(e.target.value)}" alt="">`
            : `<div class="media-card__preview-placeholder">Sem imagem</div>`;
        }
        markDirty();
      });
    });
  });

  document.querySelectorAll("[data-stack-remove]").forEach((btn) => {
    btn.addEventListener("click", () => {
      const i = Number(btn.dataset.stackRemove);
      currentData.homeStack.splice(i, 1);
      rerenderWorkspace();
      markDirty();
    });
  });

  $("#btn-add-stack")?.addEventListener("click", () => {
    currentData.homeStack.push({ type: "image", src: "", alt: "" });
    rerenderWorkspace();
    markDirty();
  });
}

/* ── Render: equipa ── */

function renderTeamEditor(data) {
  const featured = (data.featured || [])
    .map(
      (m, i) => `
    <div class="person-card" data-featured="${i}">
      <div class="person-card__avatar">${m.photo ? `<img src="${escapeHtml(m.photo)}" alt="">` : initials(m.name)}</div>
      <div class="person-card__fields">
        <input class="field__input" data-f="name" value="${escapeHtml(m.name)}" placeholder="Nome">
        <input class="field__input" data-f="roles" value="${escapeHtml(m.roles)}" placeholder="Funções (ex.: Cam OP · Editor)">
        <input class="field__input" data-f="photo" value="${escapeHtml(m.photo || "")}" placeholder="Link da foto (opcional)">
      </div>
    </div>`
    )
    .join("");

  const members = (data.members || [])
    .map((m, i) => {
      const skills = (m.skills || [])
        .map(
          (s) => `
        <label class="skill-tag">
          <input type="checkbox" data-skill="${s}" ${(m.skills || []).includes(s) ? "checked" : ""}>
          ${SKILL_LABELS[s] || s}
        </label>`
        )
        .join("");

      return `
      <div class="person-card" data-member="${i}">
        <div class="person-card__avatar">${m.photo ? `<img src="${escapeHtml(m.photo)}" alt="">` : initials(m.name)}</div>
        <div class="person-card__fields">
          <input class="field__input" data-f="name" value="${escapeHtml(m.name)}" placeholder="Nome">
          <input class="field__input" data-f="roles" value="${escapeHtml(m.roles)}" placeholder="Funções">
          <input class="field__input" data-f="photo" value="${escapeHtml(m.photo || "")}" placeholder="Link da foto">
          <div class="skills-row">${skills}</div>
        </div>
        <button type="button" class="btn btn--sm btn--danger" data-member-remove="${i}">Remover</button>
      </div>`;
    })
    .join("");

  return `
    <div class="section-block">
      <p class="section-block__title">Destaques (topo da página)</p>
      ${featured}
    </div>
    <div class="section-block">
      <p class="section-block__title">Todos os membros</p>
      ${members}
      <div class="add-bar">
        <button type="button" class="btn" id="btn-add-member">+ Adicionar membro</button>
      </div>
    </div>`;
}

function bindTeamEvents() {
  document.querySelectorAll("[data-featured]").forEach((card) => {
    const i = Number(card.dataset.featured);
    card.querySelectorAll("[data-f]").forEach((input) => {
      input.addEventListener("input", (e) => {
        currentData.featured[i][e.target.dataset.f] = e.target.value;
        if (e.target.dataset.f === "photo" || e.target.dataset.f === "name") {
          const av = card.querySelector(".person-card__avatar");
          const photo = currentData.featured[i].photo;
          av.innerHTML = photo ? `<img src="${escapeHtml(photo)}" alt="">` : initials(currentData.featured[i].name);
        }
        markDirty();
      });
    });
  });

  document.querySelectorAll("[data-member]").forEach((card) => {
    const i = Number(card.dataset.member);
    card.querySelectorAll("[data-f]").forEach((input) => {
      input.addEventListener("input", (e) => {
        currentData.members[i][e.target.dataset.f] = e.target.value;
        if (e.target.dataset.f === "photo" || e.target.dataset.f === "name") {
          const av = card.querySelector(".person-card__avatar");
          const photo = currentData.members[i].photo;
          av.innerHTML = photo ? `<img src="${escapeHtml(photo)}" alt="">` : initials(currentData.members[i].name);
        }
        markDirty();
      });
    });
    card.querySelectorAll("[data-skill]").forEach((cb) => {
      cb.addEventListener("change", () => {
        currentData.members[i].skills = [...card.querySelectorAll("[data-skill]:checked")].map((c) => c.dataset.skill);
        markDirty();
      });
    });
  });

  document.querySelectorAll("[data-member-remove]").forEach((btn) => {
    btn.addEventListener("click", () => {
      currentData.members.splice(Number(btn.dataset.memberRemove), 1);
      rerenderWorkspace();
      markDirty();
    });
  });

  $("#btn-add-member")?.addEventListener("click", () => {
    currentData.members.push({ name: "", roles: "", skills: [], photo: "" });
    rerenderWorkspace();
    markDirty();
  });
}

/* ── Render: parceiros ── */

function renderPartnerList(items, dataAttr) {
  return (items || [])
    .map(
      (p, i) => `
    <div class="partner-card-edit" data-${dataAttr}="${i}">
      <div class="partner-card-edit__logo">${p.logo ? `<img src="${escapeHtml(p.logo)}" alt="">` : escapeHtml(p.name).slice(0, 2)}</div>
      <div class="partner-card-edit__fields">
        <input class="field__input" data-f="name" value="${escapeHtml(p.name)}" placeholder="Nome">
        <input class="field__input" data-f="logo" value="${escapeHtml(p.logo || "")}" placeholder="Link do logótipo (opcional)">
      </div>
      <button type="button" class="btn btn--sm btn--danger" data-partner-remove="${dataAttr}:${i}">Remover</button>
    </div>`
    )
    .join("");
}

function renderPartnersEditor(data) {
  return `
    <div class="section-block">
      <p class="section-block__title">Parceiros principais</p>
      ${renderPartnerList(data.main, "main")}
      <div class="add-bar"><button type="button" class="btn" data-add-partner="main">+ Adicionar principal</button></div>
    </div>
    <div class="section-block">
      <p class="section-block__title">Parceiros secundários</p>
      ${renderPartnerList(data.secondary, "secondary")}
      <div class="add-bar"><button type="button" class="btn" data-add-partner="secondary">+ Adicionar secundário</button></div>
    </div>`;
}

function bindPartnersEvents() {
  ["main", "secondary"].forEach((group) => {
    document.querySelectorAll(`[data-${group}]`).forEach((card) => {
      const i = Number(card.dataset[group]);
      card.querySelectorAll("[data-f]").forEach((input) => {
        input.addEventListener("input", (e) => {
          currentData[group][i][e.target.dataset.f] = e.target.value;
          if (e.target.dataset.f === "logo" || e.target.dataset.f === "name") {
            const logo = card.querySelector(".partner-card-edit__logo");
            const l = currentData[group][i].logo;
            logo.innerHTML = l ? `<img src="${escapeHtml(l)}" alt="">` : escapeHtml(currentData[group][i].name).slice(0, 2);
          }
          markDirty();
        });
      });
    });
  });

  document.querySelectorAll("[data-partner-remove]").forEach((btn) => {
    btn.addEventListener("click", () => {
      const [group, i] = btn.dataset.partnerRemove.split(":");
      currentData[group].splice(Number(i), 1);
      rerenderWorkspace();
      markDirty();
    });
  });

  document.querySelectorAll("[data-add-partner]").forEach((btn) => {
    btn.addEventListener("click", () => {
      const group = btn.dataset.addPartner;
      currentData[group].push({ name: "", logo: "" });
      rerenderWorkspace();
      markDirty();
    });
  });
}

/* ── Workspace ── */

function rerenderWorkspace() {
  const ws = $("#workspace-content");
  if (currentSection.type === "gallery") {
    ws.innerHTML = renderGalleryEditor(currentData);
    bindGalleryEvents();
  } else if (currentSection.type === "home") {
    ws.innerHTML = renderHomeEditor(currentData);
    bindHomeEvents();
  } else if (currentSection.type === "team") {
    ws.innerHTML = renderTeamEditor(currentData);
    bindTeamEvents();
  } else if (currentSection.type === "partners") {
    ws.innerHTML = renderPartnersEditor(currentData);
    bindPartnersEvents();
  }
}

async function loadSection(section) {
  if (dirty && !confirm("Tens alterações por guardar. Continuar sem guardar?")) return;

  currentSection = section;
  $("#page-title").textContent = section.label;
  $("#page-hint").textContent = section.hint + (section.page ? ` · Ver: /${section.page}` : "");

  document.querySelectorAll(".sidebar__btn").forEach((btn) => {
    btn.classList.toggle("is-active", btn.dataset.id === section.id);
  });

  $("#workspace-content").innerHTML = '<p style="color:var(--text-muted)">A carregar…</p>';

  try {
    const { data, sha } = await loadContent(section);
    currentData = data;
    currentSha = sha;
    dirty = false;
    markClean();
    rerenderWorkspace();
  } catch (err) {
    $("#workspace-content").innerHTML = `<p style="color:var(--danger)">${err.message}</p>`;
  }
}

function buildSidebar() {
  const nav = $("#sidebar-nav");
  nav.innerHTML = SECTIONS.map(
    (s) => `<button type="button" class="sidebar__btn${s.id === currentSection.id ? " is-active" : ""}" data-id="${s.id}">${s.label}</button>`
  ).join("");

  nav.querySelectorAll(".sidebar__btn").forEach((btn) => {
    btn.addEventListener("click", () => {
      const section = SECTIONS.find((s) => s.id === btn.dataset.id);
      if (section) loadSection(section);
    });
  });
}

/* ── Save ── */

async function handleSave() {
  const btn = $("#btn-save");
  btn.disabled = true;
  try {
    currentSha = await saveContent(currentSection, currentData, currentSha);
    markClean();
    showToast("Alterações guardadas! O site atualiza em ~1 minuto.");
  } catch (err) {
    showToast(err.message, "error");
    if (err.message.includes("Sessão")) showLogin();
  } finally {
    btn.disabled = false;
  }
}

/* ── Boot ── */

function init() {
  $("#btn-login")?.addEventListener("click", openLogin);
  $("#btn-logout")?.addEventListener("click", () => {
    clearToken();
    showLogin();
  });
  $("#btn-save")?.addEventListener("click", handleSave);

  if (getToken()) showPanel();
  else showLogin();
}

document.addEventListener("DOMContentLoaded", init);

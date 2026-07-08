/* Painel de gestão Proimagem.pt */

const API = "/api/content";
const UPLOAD_API = "/api/upload";
const MAX_UPLOAD_MB = 4;
const MAX_UPLOAD_BYTES = MAX_UPLOAD_MB * 1024 * 1024;
const FETCH_OPTS = { credentials: "include" };

/* ── Ícones SVG inline ── */

const ICONS = {
  upload: '<svg viewBox="0 0 24 24"><path d="M12 16V4M12 4l-4 4M12 4l4 4"/><path d="M4 17v2a2 2 0 002 2h12a2 2 0 002-2v-2"/></svg>',
  save: '<svg viewBox="0 0 24 24"><path d="M19 21H5a2 2 0 01-2-2V5a2 2 0 012-2h11l5 5v11a2 2 0 01-2 2z"/><polyline points="17 21 17 13 7 13 7 21"/><polyline points="7 3 7 8 15 8"/></svg>',
  logout: '<svg viewBox="0 0 24 24"><path d="M9 21H5a2 2 0 01-2-2V5a2 2 0 012-2h4"/><polyline points="16 17 21 12 16 7"/><line x1="21" y1="12" x2="9" y2="12"/></svg>',
  pages: '<svg viewBox="0 0 24 24"><rect x="3" y="3" width="7" height="9" rx="1"/><rect x="14" y="3" width="7" height="5" rx="1"/><rect x="14" y="12" width="7" height="9" rx="1"/><rect x="3" y="16" width="7" height="5" rx="1"/></svg>',
  photo: '<svg viewBox="0 0 24 24"><rect x="3" y="3" width="18" height="18" rx="2"/><circle cx="8.5" cy="8.5" r="1.5"/><polyline points="21 15 16 10 5 21"/></svg>',
  video: '<svg viewBox="0 0 24 24"><polygon points="23 7 16 12 23 17 23 7"/><rect x="1" y="5" width="15" height="14" rx="2"/></svg>',
  team: '<svg viewBox="0 0 24 24"><path d="M17 21v-2a4 4 0 00-4-4H5a4 4 0 00-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M23 21v-2a4 4 0 00-3-3.87"/><path d="M16 3.13a4 4 0 010 7.75"/></svg>',
  partners: '<svg viewBox="0 0 24 24"><path d="M16 21v-2a4 4 0 00-4-4H6a4 4 0 00-4 4v2"/><circle cx="9" cy="7" r="4"/><line x1="19" y1="8" x2="19" y2="14"/><line x1="22" y1="11" x2="16" y2="11"/></svg>',
  dragDrop: '<svg viewBox="0 0 24 24"><path d="M12 3v12"/><path d="M8 7l4-4 4 4"/><rect x="4" y="17" width="16" height="4" rx="1"/></svg>',
  success: '<svg viewBox="0 0 24 24"><path d="M22 11.08V12a10 10 0 11-5.93-9.14"/><polyline points="22 4 12 14.01 9 11.01"/></svg>',
  warning: '<svg viewBox="0 0 24 24"><path d="M10.29 3.86L1.82 18a2 2 0 001.71 3h16.94a2 2 0 001.71-3L13.71 3.86a2 2 0 00-3.42 0z"/><line x1="12" y1="9" x2="12" y2="13"/><line x1="12" y1="17" x2="12.01" y2="17"/></svg>',
  spinner: '<svg viewBox="0 0 24 24"><path d="M12 2v4M12 18v4M4.93 4.93l2.83 2.83M16.24 16.24l2.83 2.83M2 12h4M18 12h4M4.93 19.07l2.83-2.83M16.24 7.76l2.83-2.83"/></svg>',
  home: '<svg viewBox="0 0 24 24"><path d="M3 9l9-7 9 7v11a2 2 0 01-2 2H5a2 2 0 01-2-2z"/><polyline points="9 22 9 12 15 12 15 22"/></svg>',
  gallery: '<svg viewBox="0 0 24 24"><rect x="2" y="2" width="20" height="20" rx="2"/><circle cx="8" cy="8" r="2"/><path d="M21 15l-5-5L5 21"/></svg>',
  arrowUp: '<svg viewBox="0 0 24 24"><line x1="12" y1="19" x2="12" y2="5"/><polyline points="5 12 12 5 19 12"/></svg>',
  arrowDown: '<svg viewBox="0 0 24 24"><line x1="12" y1="5" x2="12" y2="19"/><polyline points="19 12 12 19 5 12"/></svg>',
  trash: '<svg viewBox="0 0 24 24"><polyline points="3 6 5 6 21 6"/><path d="M19 6v14a2 2 0 01-2 2H7a2 2 0 01-2-2V6m3 0V4a2 2 0 012-2h4a2 2 0 012 2v2"/></svg>',
  plus: '<svg viewBox="0 0 24 24"><line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/></svg>'
};

function icon(name, extraClass = "") {
  const svg = ICONS[name] || "";
  return `<span class="icon${extraClass ? " " + extraClass : ""}" aria-hidden="true">${svg}</span>`;
}

function sectionTitle(text, iconName) {
  return `<h2 class="section-block__title">${iconName ? icon(iconName) : ""}${escapeHtml(text)}</h2>`;
}

function emptyState(iconName, title, text) {
  return `
    <div class="empty-state">
      <span class="empty-state__icon">${ICONS[iconName] || ""}</span>
      <p class="empty-state__title">${escapeHtml(title)}</p>
      <p class="empty-state__text">${escapeHtml(text)}</p>
    </div>`;
}

function loadingHtml(text = "A carregar…") {
  return `<div class="loading-state">${icon("spinner", "icon--spin")}<span>${escapeHtml(text)}</span></div>`;
}

function renderDropZone(id, accept = "image/*,video/*", multiple = true) {
  const multi = multiple ? "multiple" : "";
  return `
    <div class="dropzone" id="${id}" data-dropzone>
      <input type="file" accept="${accept}" ${multi} hidden>
      <div class="dropzone__icon">${icon("dragDrop", "icon--lg")}</div>
      <p class="dropzone__title">Arrasta ficheiros para aqui</p>
      <p class="dropzone__hint">ou clica para escolher do teu computador · máximo ${MAX_UPLOAD_MB} MB por ficheiro</p>
    </div>`;
}

function bindDropZone(el, onFiles) {
  if (!el) return;
  const input = el.querySelector('input[type="file"]');

  el.addEventListener("click", (e) => {
    if (e.target.tagName !== "INPUT") input?.click();
  });

  input?.addEventListener("change", () => {
    const files = [...(input.files || [])];
    if (files.length) onFiles(files);
    input.value = "";
  });

  el.addEventListener("dragover", (e) => {
    e.preventDefault();
    el.classList.add("is-dragover");
  });
  el.addEventListener("dragleave", () => el.classList.remove("is-dragover"));
  el.addEventListener("drop", (e) => {
    e.preventDefault();
    el.classList.remove("is-dragover");
    const files = [...e.dataTransfer.files];
    if (files.length) onFiles(files);
  });
}

function bindPreviewUpload(previewEl, accept, onUploaded) {
  if (!previewEl) return;
  const input = document.createElement("input");
  input.type = "file";
  input.accept = accept;
  input.hidden = true;
  previewEl.appendChild(input);

  previewEl.addEventListener("click", () => input.click());
  input.addEventListener("change", async () => {
    const file = input.files?.[0];
    input.value = "";
    if (!file) return;
    try {
      await processUpload(file, onUploaded);
    } catch (err) {
      showToast(err.message, "error");
    }
  });
}

let uploadCount = 0;

function setUploading(active) {
  if (active) uploadCount++;
  else uploadCount = Math.max(0, uploadCount - 1);
  const saving = $("#btn-save")?.classList.contains("is-loading");
  $("#btn-save").disabled = uploadCount > 0 || saving;
}

async function processUpload(file, onSuccess) {
  if (file.size > MAX_UPLOAD_BYTES) {
    throw new Error(`Este ficheiro é demasiado grande (máximo ${MAX_UPLOAD_MB} MB). Tenta comprimir antes de enviar.`);
  }
  showToast(`A enviar ${file.name}…`, "pending");
  setUploading(true);
  try {
    const url = await uploadFile(file);
    onSuccess(url, file);
    markDirty();
    showToast("Ficheiro enviado! Não te esqueças de guardar.", "ok");
  } finally {
    setUploading(false);
  }
}

async function uploadManyFiles(files, onEach) {
  for (const file of files) {
    try {
      await processUpload(file, onEach);
    } catch (err) {
      showToast(`${file.name}: ${err.message}`, "error");
    }
  }
}

const SIDEBAR_GROUPS = [
  {
    label: "Site",
    icon: "home",
    sections: ["home"]
  },
  {
    label: "Galerias",
    icon: "gallery",
    sections: ["studio-space", "multicam", "aftermovie", "photography", "fpv-drone", "social-media"]
  },
  {
    label: "Equipa",
    icon: "team",
    sections: ["team"]
  },
  {
    label: "Parceiros",
    icon: "partners",
    sections: ["partners"]
  }
];

const SECTIONS = [
  {
    id: "home",
    label: "Página Inicial",
    file: "content/site.json",
    type: "home",
    sidebarIcon: "home",
    hint: "Textos e imagens da página principal do site."
  },
  {
    id: "studio-space",
    label: "Studio Space",
    file: "content/galleries/studio-space.json",
    type: "gallery",
    page: "studio-space.html",
    sidebarIcon: "photo",
    hint: "Fotos e vídeos da galeria Studio Space."
  },
  {
    id: "multicam",
    label: "Multicam",
    file: "content/galleries/multicam.json",
    type: "gallery",
    page: "multicam.html",
    sidebarIcon: "video",
    hint: "Conteúdo da galeria Multicam."
  },
  {
    id: "aftermovie",
    label: "Aftermovie",
    file: "content/galleries/aftermovie.json",
    type: "gallery",
    page: "aftermovie.html",
    sidebarIcon: "video",
    hint: "Vídeos e fotos de aftermovies."
  },
  {
    id: "photography",
    label: "Photography",
    file: "content/galleries/photography.json",
    type: "gallery",
    page: "photography.html",
    sidebarIcon: "photo",
    hint: "Fotografias da secção Photography."
  },
  {
    id: "fpv-drone",
    label: "FPV / Drone",
    file: "content/galleries/fpv-drone.json",
    type: "gallery",
    page: "fpv-drone.html",
    sidebarIcon: "video",
    hint: "Conteúdo FPV e drone."
  },
  {
    id: "social-media",
    label: "Social Media",
    file: "content/galleries/social-media.json",
    type: "gallery",
    page: "social-media.html",
    sidebarIcon: "photo",
    hint: "Conteúdo para redes sociais."
  },
  {
    id: "team",
    label: "Equipa",
    file: "content/team.json",
    type: "team",
    page: "team.html",
    sidebarIcon: "team",
    hint: "Membros da equipa, funções e fotos de perfil."
  },
  {
    id: "partners",
    label: "Parceiros",
    file: "content/partners.json",
    type: "partners",
    page: "parceiros.html",
    sidebarIcon: "partners",
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

function showToast(msg, type = "ok") {
  const el = $("#toast");
  const toastIcon = type === "error" ? "warning" : type === "pending" ? "spinner" : "success";
  const spinClass = type === "pending" ? " icon--spin" : "";
  el.innerHTML = `${icon(toastIcon, spinClass)}<span>${escapeHtml(msg)}</span>`;
  el.className = `toast is-${type === "pending" ? "ok" : type}`;
  el.classList.remove("is-hidden");
  if (type !== "pending") {
    setTimeout(() => el.classList.add("is-hidden"), 3500);
  }
}

function markDirty() {
  dirty = true;
  const st = $("#save-status");
  st.innerHTML = `${icon("warning")} Alterações por guardar`;
  st.className = "status is-pending";
}

function markClean() {
  dirty = false;
  const st = $("#save-status");
  st.innerHTML = `${icon("success")} Tudo guardado`;
  st.className = "status is-ok";
}

function setSaveLoading(loading) {
  const btn = $("#btn-save");
  const label = $("#save-label");
  const saveIcon = $("#save-icon");
  if (!btn || !label || !saveIcon) return;
  if (loading) {
    btn.classList.add("is-loading");
    btn.disabled = true;
    label.textContent = "A guardar…";
    saveIcon.innerHTML = ICONS.spinner;
    saveIcon.classList.add("icon--spin");
  } else {
    btn.classList.remove("is-loading");
    btn.disabled = uploadCount > 0;
    label.textContent = "Guardar alterações";
    saveIcon.innerHTML = ICONS.save;
    saveIcon.classList.remove("icon--spin");
  }
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

function injectStaticIcons() {
  $("#logout-icon").innerHTML = ICONS.logout;
  $("#save-icon").innerHTML = ICONS.save;
  $("#banner-icon").innerHTML = ICONS.warning;
}

/* ── Auth ── */

async function checkSession() {
  try {
    const res = await fetch("/api/session", FETCH_OPTS);
    if (res.ok) {
      const data = await res.json();
      if (data.authenticated) {
        showPanel();
        return;
      }
    }
  } catch (_) {}
  showLogin();
}

async function handleLogin(e) {
  e.preventDefault();
  const username = $("#login-user").value.trim();
  const password = $("#login-pass").value;
  const errEl = $("#login-error");
  const btn = $("#login-form button[type=submit]");
  errEl.textContent = "";
  btn.disabled = true;
  btn.textContent = "A entrar…";

  try {
    const res = await fetch("/api/login", {
      method: "POST",
      ...FETCH_OPTS,
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ username, password })
    });
    const data = await res.json();
    if (!res.ok) throw new Error(data.error || "Não foi possível entrar. Verifica os dados.");
    $("#login-pass").value = "";
    showPanel();
  } catch (err) {
    errEl.textContent = err.message;
  } finally {
    btn.disabled = false;
    btn.textContent = "Entrar";
  }
}

async function handleLogout() {
  await fetch("/api/logout", { method: "POST", ...FETCH_OPTS });
  showLogin();
}

function showLogin() {
  $("#login-screen").classList.remove("is-hidden");
  $("#panel").classList.add("is-hidden");
}

function showPanel() {
  $("#login-screen").classList.add("is-hidden");
  $("#panel").classList.remove("is-hidden");
  injectStaticIcons();
  buildSidebar();
  loadSection(currentSection);
}

/* ── API ── */

async function loadContent(section) {
  const res = await fetch(`/${section.file}?t=${Date.now()}`, { cache: "no-store" });
  if (!res.ok) throw new Error("Não foi possível carregar o conteúdo.");
  const data = await res.json();

  let sha = null;
  try {
    const meta = await fetch(`${API}?path=${encodeURIComponent(section.file)}`, FETCH_OPTS);
    if (meta.ok) {
      const m = await meta.json();
      sha = m.sha;
    }
  } catch (_) {}

  return { data, sha };
}

async function saveContent(section, data, sha) {
  const res = await fetch(API, {
    method: "POST",
    ...FETCH_OPTS,
    headers: { "Content-Type": "application/json" },
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
  const base64 = await new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(reader.result.split(",")[1]);
    reader.onerror = reject;
    reader.readAsDataURL(file);
  });

  const res = await fetch(UPLOAD_API, {
    method: "POST",
    ...FETCH_OPTS,
    headers: { "Content-Type": "application/json" },
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
    return `<div class="media-card__preview-placeholder">${icon("photo")}<span>Clica para carregar<br><small>foto ou vídeo</small></span></div>`;
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
    <article class="media-card" data-index="${i}">
      <div class="media-card__preview media-card__preview--upload" data-preview="${i}">
        ${renderMediaPreview(item)}
        <span class="media-card__badge">${icon(item.type === "video" ? "video" : "photo")}${item.type === "video" ? "Vídeo" : "Foto"}${item.featured ? " · Destaque" : ""}</span>
        <span class="media-card__upload-overlay">${icon("upload")} Trocar ficheiro</span>
      </div>
      <div class="media-card__body">
        <p class="media-card__num">Item ${i + 1}</p>
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
        <div class="field" ${item.type === "video" ? "" : 'style="display:none"'} data-poster-field>
          <label class="field__label">Capa do vídeo</label>
          <div class="upload-row">
            ${item.poster ? `<img class="upload-row__thumb" src="${escapeHtml(item.poster)}" alt="">` : ""}
            <label class="btn btn--sm upload-row__btn">
              ${icon("upload")} Carregar capa
              <input type="file" accept="image/*" data-action="upload-poster" hidden>
            </label>
          </div>
        </div>
        <div class="field">
          <label class="field__label">Descrição (opcional)</label>
          <input class="field__input" type="text" data-field="alt" value="${escapeHtml(item.alt || "")}" placeholder="Ex.: Concerto ao vivo">
        </div>
        <div class="media-card__actions">
          <button type="button" class="btn btn--sm" data-action="up" ${i === 0 ? "disabled" : ""}>${icon("arrowUp")} Subir</button>
          <button type="button" class="btn btn--sm" data-action="down" ${i === items.length - 1 ? "disabled" : ""}>${icon("arrowDown")} Descer</button>
          <button type="button" class="btn btn--sm btn--danger" data-action="remove">${icon("trash")} Remover</button>
        </div>
      </div>
    </article>`
    )
    .join("");

  const countLabel = items.length === 1 ? "1 item" : `${items.length} itens`;

  return `
    ${renderDropZone("gallery-dropzone")}
    <section class="section-block">
      ${sectionTitle(`Conteúdo desta galeria (${countLabel})`, "gallery")}
      <div class="media-list" id="media-list">${
        cards ||
        emptyState("photo", "Ainda não há conteúdo", "Usa a área acima para carregar fotos ou vídeos. Depois clica em Guardar alterações.")
      }</div>
    </section>`;
}

function bindGalleryEvents() {
  const list = $("#media-list");
  if (!list) return;

  bindDropZone($("#gallery-dropzone"), async (files) => {
    const dz = $("#gallery-dropzone");
    dz?.classList.add("is-uploading");
    for (const file of files) {
      await processUpload(file, (url, f) => {
        currentData.items.push({
          type: f.type.startsWith("video/") ? "video" : "image",
          featured: false,
          src: url,
          alt: f.name.replace(/\.[^.]+$/, "")
        });
      });
    }
    dz?.classList.remove("is-uploading");
    rerenderWorkspace();
  });

  list.querySelectorAll("[data-preview]").forEach((preview) => {
    const i = Number(preview.dataset.preview);
    bindPreviewUpload(preview, "image/*,video/*", (url, file) => {
      currentData.items[i].src = url;
      currentData.items[i].type = file.type.startsWith("video/") ? "video" : "image";
      rerenderWorkspace();
    });
  });

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

  list.addEventListener("click", (e) => {
    const card = e.target.closest(".media-card");
    if (!card) return;
    const i = Number(card.dataset.index);
    const action = e.target.dataset.action || e.target.closest("[data-action]")?.dataset.action;

    if (action === "remove") {
      if (!confirm("Queres remover este item?")) return;
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
    }
  });

  list.addEventListener("change", async (e) => {
    if (e.target.dataset.action !== "upload-poster") return;
    const file = e.target.files?.[0];
    e.target.value = "";
    if (!file) return;
    const card = e.target.closest(".media-card");
    const i = Number(card.dataset.index);
    try {
      await processUpload(file, (url) => {
        currentData.items[i].poster = url;
        rerenderWorkspace();
      });
    } catch (err) {
      showToast(err.message, "error");
    }
  });
}

function updateCardPreview(card, item) {
  const preview = card.querySelector(".media-card__preview");
  if (!preview) return;
  const badgeIcon = item.type === "video" ? icon("video") : icon("photo");
  const badgeText = `${item.type === "video" ? "Vídeo" : "Foto"}${item.featured ? " · Destaque" : ""}`;
  preview.innerHTML =
    renderMediaPreview(item) +
    `<span class="media-card__badge">${badgeIcon}${badgeText}</span>` +
    `<span class="media-card__upload-overlay">${icon("upload")} Trocar ficheiro</span>`;
}

/* ── Render: home ── */

function renderHomeEditor(data) {
  const hero = data.hero || {};
  const videos = hero.videos || [];
  const stack = data.homeStack || [];

  const videoBlocks = videos
    .map(
      (v, i) => `
    <article class="media-card" data-hero-video="${i}">
      <div class="media-card__preview">
        ${v.poster ? `<img src="${escapeHtml(v.poster)}" alt="">` : `<div class="media-card__preview-placeholder">${icon("video")}<span>Vídeo ${i + 1}</span></div>`}
        <span class="media-card__badge">${icon("video")}Vídeo ${i + 1}${i === 0 ? " (inicial)" : " (no scroll)"}</span>
      </div>
      <div class="media-card__body">
        <div class="field">
          <label class="field__label">Ficheiro de vídeo</label>
          <label class="btn btn--sm upload-row__btn">
            ${icon("upload")} ${v.src ? "Vídeo carregado · Trocar" : "Carregar vídeo"}
            <input type="file" accept="video/*" data-hero-upload="src" hidden>
          </label>
        </div>
        <div class="field">
          <label class="field__label">Imagem de capa</label>
          <label class="btn btn--sm upload-row__btn">
            ${icon("upload")} ${v.poster ? "Capa carregada · Trocar" : "Carregar capa"}
            <input type="file" accept="image/*" data-hero-upload="poster" hidden>
          </label>
        </div>
      </div>
    </article>`
    )
    .join("");

  const stackBlocks = stack
    .map(
      (item, i) => `
    <article class="media-card" data-home-stack="${i}">
      <div class="media-card__preview media-card__preview--upload" data-stack-preview="${i}">
        ${item.src ? `<img src="${escapeHtml(item.src)}" alt="">` : `<div class="media-card__preview-placeholder">${icon("photo")}<span>Clica para carregar</span></div>`}
        <span class="media-card__upload-overlay">${icon("upload")} Trocar ficheiro</span>
      </div>
      <div class="media-card__body">
        <div class="field">
          <label class="field__label">Descrição</label>
          <input class="field__input" type="text" data-stack="alt" value="${escapeHtml(item.alt || "")}" placeholder="Descrição da imagem">
        </div>
        <button type="button" class="btn btn--sm btn--danger" data-stack-remove="${i}">${icon("trash")} Remover</button>
      </div>
    </article>`
    )
    .join("");

  const subtitleLines = (hero.subtitleLines || []).join("\n");

  return `
    <section class="section-block">
      ${sectionTitle("Texto do cabeçalho", "home")}
      <div class="field">
        <label class="field__label" for="hero-title">Título principal</label>
        <input class="field__input" id="hero-title" type="text" value="${escapeHtml(hero.title || data.brand)}">
      </div>
      <div class="field">
        <label class="field__label" for="hero-subtitle">Subtítulo</label>
        <p class="section-block__subtitle">Cada linha aparece numa linha separada no site.</p>
        <textarea class="field__textarea" id="hero-subtitle">${escapeHtml(subtitleLines)}</textarea>
      </div>
    </section>
    <section class="section-block">
      ${sectionTitle("Vídeos de fundo", "video")}
      <p class="section-block__subtitle">Estes vídeos mudam quando o visitante faz scroll na página.</p>
      <div class="media-list">${videoBlocks}</div>
    </section>
    <section class="section-block">
      ${sectionTitle("Imagens abaixo do cabeçalho", "photo")}
      ${renderDropZone("home-stack-dropzone", "image/*", true)}
      <div class="media-list" id="home-stack-list">${
        stackBlocks ||
        emptyState("photo", "Sem imagens", "Carrega fotos na área acima para as mostrar na página inicial.")
      }</div>
    </section>`;
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
    card.querySelectorAll("[data-hero-upload]").forEach((input) => {
      input.addEventListener("change", async () => {
        const file = input.files?.[0];
        input.value = "";
        if (!file) return;
        const key = input.dataset.heroUpload;
        if (!file.type.match(key === "src" ? /^video\// : /^image\//)) {
          showToast(key === "src" ? "Escolhe um ficheiro de vídeo." : "Escolhe uma imagem.", "error");
          return;
        }
        try {
          await processUpload(file, (url) => {
            currentData.hero.videos[i][key] = url;
            rerenderWorkspace();
          });
        } catch (err) {
          showToast(err.message, "error");
        }
      });
    });
  });

  bindDropZone($("#home-stack-dropzone"), async (files) => {
    const dz = $("#home-stack-dropzone");
    dz?.classList.add("is-uploading");
    for (const file of files) {
      if (!file.type.startsWith("image/")) continue;
      await processUpload(file, (url, f) => {
        currentData.homeStack.push({ type: "image", src: url, alt: f.name.replace(/\.[^.]+$/, "") });
      });
    }
    dz?.classList.remove("is-uploading");
    rerenderWorkspace();
  });

  document.querySelectorAll("[data-stack-preview]").forEach((preview) => {
    const i = Number(preview.dataset.stackPreview);
    bindPreviewUpload(preview, "image/*", (url, file) => {
      currentData.homeStack[i].src = url;
      currentData.homeStack[i].alt = currentData.homeStack[i].alt || file.name.replace(/\.[^.]+$/, "");
      rerenderWorkspace();
    });
  });

  document.querySelectorAll("[data-home-stack]").forEach((card) => {
    const i = Number(card.dataset.homeStack);
    card.querySelectorAll("[data-stack]").forEach((input) => {
      input.addEventListener("input", (e) => {
        currentData.homeStack[i][e.target.dataset.stack] = e.target.value;
        markDirty();
      });
    });
  });

  document.querySelectorAll("[data-stack-remove]").forEach((btn) => {
    btn.addEventListener("click", () => {
      currentData.homeStack.splice(Number(btn.dataset.stackRemove), 1);
      rerenderWorkspace();
      markDirty();
    });
  });
}

/* ── Render: equipa ── */

function renderTeamEditor(data) {
  const featured = (data.featured || [])
    .map(
      (m, i) => `
    <article class="person-card" data-featured="${i}">
      <div class="person-card__avatar person-card__avatar--upload" data-photo-target="featured:${i}">
        ${m.photo ? `<img src="${escapeHtml(m.photo)}" alt="">` : initials(m.name)}
        <span class="media-card__upload-overlay">${icon("upload")} Carregar foto</span>
      </div>
      <div class="person-card__fields">
        <input class="field__input" data-f="name" value="${escapeHtml(m.name)}" placeholder="Nome">
        <input class="field__input" data-f="roles" value="${escapeHtml(m.roles)}" placeholder="Funções (ex.: Cam OP · Editor)">
      </div>
    </article>`
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
      <article class="person-card" data-member="${i}">
        <div class="person-card__avatar person-card__avatar--upload" data-photo-target="member:${i}">
          ${m.photo ? `<img src="${escapeHtml(m.photo)}" alt="">` : initials(m.name)}
          <span class="media-card__upload-overlay">${icon("upload")} Carregar foto</span>
        </div>
        <div class="person-card__fields">
          <input class="field__input" data-f="name" value="${escapeHtml(m.name)}" placeholder="Nome">
          <input class="field__input" data-f="roles" value="${escapeHtml(m.roles)}" placeholder="Funções">
          <div class="skills-row">${skills}</div>
        </div>
        <button type="button" class="btn btn--sm btn--danger" data-member-remove="${i}">${icon("trash")} Remover</button>
      </article>`;
    })
    .join("");

  return `
    <section class="section-block">
      ${sectionTitle("Destaques no topo", "team")}
      <p class="section-block__subtitle">Membros em destaque no início da página da equipa.</p>
      ${featured || emptyState("team", "Sem destaques", "Os membros em destaque aparecem no topo da página.")}
    </section>
    <section class="section-block">
      ${sectionTitle("Todos os membros", "team")}
      ${members || emptyState("team", "Sem membros", "Adiciona o primeiro membro da equipa abaixo.")}
      <div class="add-bar">
        <button type="button" class="btn" id="btn-add-member">${icon("plus")} Adicionar membro</button>
      </div>
    </section>`;
}

function bindTeamEvents() {
  document.querySelectorAll("[data-photo-target]").forEach((avatar) => {
    const [group, i] = avatar.dataset.photoTarget.split(":");
    bindPreviewUpload(avatar, "image/*", (url) => {
      if (group === "featured") currentData.featured[i].photo = url;
      else currentData.members[i].photo = url;
      rerenderWorkspace();
    });
  });

  document.querySelectorAll("[data-featured]").forEach((card) => {
    const i = Number(card.dataset.featured);
    card.querySelectorAll("[data-f]").forEach((input) => {
      input.addEventListener("input", (e) => {
        currentData.featured[i][e.target.dataset.f] = e.target.value;
        if (e.target.dataset.f === "name") {
          const av = card.querySelector(".person-card__avatar");
          if (!currentData.featured[i].photo) {
            av.innerHTML = `<span>${initials(e.target.value)}</span><span class="media-card__upload-overlay">${icon("upload")} Carregar foto</span>`;
            bindPreviewUpload(av, "image/*", (url) => {
              currentData.featured[i].photo = url;
              rerenderWorkspace();
            });
          }
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
    <article class="partner-card-edit" data-${dataAttr}="${i}">
      <div class="partner-card-edit__logo partner-card-edit__logo--upload" data-logo-target="${dataAttr}:${i}">
        ${p.logo ? `<img src="${escapeHtml(p.logo)}" alt="">` : escapeHtml(p.name).slice(0, 2)}
        <span class="media-card__upload-overlay">${icon("upload")} Carregar logo</span>
      </div>
      <div class="partner-card-edit__fields">
        <input class="field__input" data-f="name" value="${escapeHtml(p.name)}" placeholder="Nome do parceiro">
      </div>
      <button type="button" class="btn btn--sm btn--danger" data-partner-remove="${dataAttr}:${i}">${icon("trash")} Remover</button>
    </article>`
    )
    .join("");
}

function renderPartnersEditor(data) {
  return `
    <section class="section-block">
      ${sectionTitle("Parceiros principais", "partners")}
      <p class="section-block__subtitle">Logótipos em destaque no topo da página.</p>
      ${renderPartnerList(data.main, "main") || emptyState("partners", "Sem parceiros principais", "Adiciona o primeiro parceiro abaixo.")}
      <div class="add-bar"><button type="button" class="btn" data-add-partner="main">${icon("plus")} Adicionar parceiro</button></div>
    </section>
    <section class="section-block">
      ${sectionTitle("Parceiros secundários", "partners")}
      <p class="section-block__subtitle">Logótipos adicionais na parte inferior.</p>
      ${renderPartnerList(data.secondary, "secondary") || emptyState("partners", "Sem parceiros secundários", "Adiciona parceiros secundários abaixo.")}
      <div class="add-bar"><button type="button" class="btn" data-add-partner="secondary">${icon("plus")} Adicionar parceiro</button></div>
    </section>`;
}

function bindPartnersEvents() {
  document.querySelectorAll("[data-logo-target]").forEach((logoEl) => {
    const [group, i] = logoEl.dataset.logoTarget.split(":");
    bindPreviewUpload(logoEl, "image/*", (url) => {
      currentData[group][i].logo = url;
      rerenderWorkspace();
    });
  });

  ["main", "secondary"].forEach((group) => {
    document.querySelectorAll(`[data-${group}]`).forEach((card) => {
      const i = Number(card.dataset[group]);
      card.querySelectorAll("[data-f]").forEach((input) => {
        input.addEventListener("input", (e) => {
          currentData[group][i][e.target.dataset.f] = e.target.value;
          if (e.target.dataset.f === "name" && !currentData[group][i].logo) {
            const logo = card.querySelector(".partner-card-edit__logo");
            logo.innerHTML = `${escapeHtml(e.target.value).slice(0, 2)}<span class="media-card__upload-overlay">${icon("upload")} Carregar logo</span>`;
            bindPreviewUpload(logo, "image/*", (url) => {
              currentData[group][i].logo = url;
              rerenderWorkspace();
            });
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
  if (dirty && !confirm("Tens alterações por guardar. Queres continuar sem guardar?")) return;

  currentSection = section;
  $("#page-title").textContent = section.label;
  const pageLink = section.page ? ` · <a href="/${section.page}" target="_blank" rel="noopener" style="color:inherit">Ver no site ↗</a>` : "";
  $("#page-hint").innerHTML = escapeHtml(section.hint) + pageLink;

  document.querySelectorAll(".sidebar__btn").forEach((btn) => {
    btn.classList.toggle("is-active", btn.dataset.id === section.id);
  });

  $("#workspace-content").innerHTML = loadingHtml("A carregar conteúdo…");

  try {
    const { data, sha } = await loadContent(section);
    currentData = data;
    currentSha = sha;
    dirty = false;
    markClean();
    rerenderWorkspace();
  } catch (err) {
    $("#workspace-content").innerHTML = `<div class="empty-state"><span class="empty-state__icon">${ICONS.warning}</span><p class="empty-state__title">Não foi possível carregar</p><p class="empty-state__text">${escapeHtml(err.message)}</p></div>`;
  }
}

function buildSidebar() {
  const nav = $("#sidebar-nav");
  nav.innerHTML = SIDEBAR_GROUPS.map((group) => {
    const buttons = group.sections
      .map((id) => {
        const s = SECTIONS.find((sec) => sec.id === id);
        if (!s) return "";
        const active = s.id === currentSection.id ? " is-active" : "";
        const sIcon = s.sidebarIcon || group.icon;
        return `<button type="button" class="sidebar__btn${active}" data-id="${s.id}">${icon(sIcon)}${escapeHtml(s.label)}</button>`;
      })
      .join("");
    return `
      <div class="sidebar__group">
        <p class="sidebar__label">${icon(group.icon)} ${escapeHtml(group.label)}</p>
        ${buttons}
      </div>`;
  }).join("");

  nav.querySelectorAll(".sidebar__btn").forEach((btn) => {
    btn.addEventListener("click", () => {
      const section = SECTIONS.find((s) => s.id === btn.dataset.id);
      if (section) loadSection(section);
    });
  });
}

/* ── Save ── */

async function handleSave() {
  setSaveLoading(true);
  try {
    currentSha = await saveContent(currentSection, currentData, currentSha);
    markClean();
    showToast("Alterações guardadas! O site atualiza em cerca de 1 minuto.", "ok");
  } catch (err) {
    showToast(err.message, "error");
    if (err.message.includes("Sessão")) showLogin();
  } finally {
    setSaveLoading(false);
  }
}

/* ── Boot ── */

function init() {
  $("#login-form")?.addEventListener("submit", handleLogin);
  $("#btn-logout")?.addEventListener("click", handleLogout);
  $("#btn-save")?.addEventListener("click", handleSave);
  checkSession();
}

document.addEventListener("DOMContentLoaded", init);

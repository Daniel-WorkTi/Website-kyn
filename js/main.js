/* Proimagem.pt — render engine + interações (data-driven) */

const CONTENT_BASE = "content/";

async function loadJSON(path) {
  const res = await fetch(CONTENT_BASE + path, { cache: "no-store" });
  if (!res.ok) throw new Error("Falha ao carregar " + path);
  return res.json();
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

function mediaEl(item) {
  if (item.type === "video") {
    const poster = item.poster ? ` poster="${item.poster}"` : "";
    return `<video autoplay muted loop playsinline${poster}><source src="${item.src}" type="video/mp4"></video>`;
  }
  return `<img src="${item.src}" alt="${item.alt || ""}" loading="lazy">`;
}

/* ── Navigation ── */

function renderNav(site, activeHref) {
  const links = site.nav
    .map((n) => {
      const active = n.href === activeHref ? " is-active" : "";
      return `<li><a href="${n.href}" class="nav__link${active}">${n.label}</a></li>`;
    })
    .join("");

  return `
    <nav class="nav">
      <div class="nav__inner">
        <button class="nav__toggle" aria-label="Menu"><span></span></button>
        <ul class="nav__menu">${links}</ul>
      </div>
    </nav>`;
}

/* ── Home ── */

function renderHome(site) {
  const hero = site.hero || {};
  const videos = hero.videos || [];
  const vids = videos
    .map((v, i) => {
      const cls = i === 0 ? "hero__video hero__video--1 is-active" : `hero__video hero__video--${i + 1}`;
      const poster = v.poster ? ` poster="${v.poster}"` : "";
      return `<video class="${cls}" autoplay muted loop playsinline${poster}><source src="${v.src}" type="video/mp4"></video>`;
    })
    .join("");

  const lines = (hero.subtitleLines || [])
    .map((line, i) => `<span class="hero__line hero-animate hero-animate--${i + 1}">${line.replace(/\|/g, "&nbsp;|&nbsp;")}</span>`)
    .join("");

  const stack = (site.homeStack || [])
    .map((item) => `<div class="stack__item" data-lightbox>${mediaEl(item)}</div>`)
    .join("");

  return `
    <section class="hero hero--scroll" id="home-hero">
      <div class="hero__media">${vids}</div>
      <div class="hero__overlay"></div>
      <div class="hero__content" id="hero-content">
        <h1 class="hero__title hero-animate">${hero.title || site.brand}</h1>
        <p class="hero__subtitle">${lines}</p>
      </div>
    </section>
    <div class="stack">${stack}</div>`;
}

/* ── Gallery ── */

function renderGallery(data) {
  const featured = (data.items || []).filter((i) => i.featured);
  const rest = (data.items || []).filter((i) => !i.featured);

  const featuredHtml = featured.length
    ? `<div class="stack">${featured
        .map((i) => `<div class="stack__item stack__item--viewport" data-lightbox>${mediaEl(i)}</div>`)
        .join("")}</div>`
    : "";

  const gridHtml = rest.length
    ? `<div class="supd-grid">${rest
        .map((i) => `<div class="supd-grid__cell" data-lightbox>${mediaEl(i)}</div>`)
        .join("")}</div>`
    : "";

  const note = data.note ? `<p class="placeholder-note section">${data.note}</p>` : "";

  return `
    <header class="page-heading"><h1 class="page-heading__title">${data.title}</h1></header>
    ${featuredHtml}
    ${gridHtml}
    ${note}`;
}

/* ── Team ── */

function teamCard(m, withSkills) {
  const photo = m.photo
    ? `<img src="${m.photo}" alt="${m.name}" loading="lazy">`
    : `<span>${initials(m.name)}</span>`;
  const skills = withSkills && m.skills ? ` data-skills="${m.skills.join(" ")}"` : "";
  return `
    <article class="team-card"${skills}>
      <div class="team-card__photo">${photo}</div>
      <div class="team-card__info">
        <h2 class="team-card__name">${m.name}</h2>
        <p class="team-card__roles">${m.roles}</p>
      </div>
    </article>`;
}

function renderTeam(data) {
  const featured = (data.featured || []).map((m) => teamCard(m, false)).join("");

  const allSkills = new Set();
  (data.members || []).forEach((m) => (m.skills || []).forEach((s) => allSkills.add(s)));
  const labels = {
    photography: "Photography",
    videographer: "Videographer",
    drone: "Drone",
    fpv: "FPV",
    editor: "Editor",
    "social-media": "Social Media"
  };
  const filters =
    `<button class="team-filter is-active" data-filter="all">Todos</button>` +
    [...allSkills]
      .map((s) => `<button class="team-filter" data-filter="${s}">${labels[s] || s}</button>`)
      .join("");

  const grid = (data.members || []).map((m) => teamCard(m, true)).join("");

  return `
    <header class="page-heading"><h1 class="page-heading__title">${data.title}</h1></header>
    <section class="section reveal">
      <div class="team-featured">${featured}</div>
      <div class="team-filters">${filters}</div>
      <div class="team-grid">${grid}</div>
    </section>`;
}

/* ── Partners ── */

function partnerCard(p) {
  const inner = p.logo
    ? `<img src="${p.logo}" alt="${p.name}" loading="lazy">`
    : `<span class="partner-card__name">${p.name}</span>`;
  return `<div class="partner-card">${inner}</div>`;
}

function renderPartners(data) {
  const main = (data.main || []).map(partnerCard).join("");
  const secondary = (data.secondary || []).map(partnerCard).join("");
  return `
    <header class="page-heading"><h1 class="page-heading__title">${data.title}</h1></header>
    <section class="section reveal">
      <div class="partners-section">
        <p class="partners-section__label">Principais</p>
        <div class="partners-grid partners-grid--main">${main}</div>
      </div>
      <div class="partners-section">
        <p class="partners-section__label">Secundários</p>
        <div class="partners-grid partners-grid--secondary">${secondary}</div>
      </div>
    </section>`;
}

/* ── Interactions ── */

function initInteractions() {
  const toggle = document.querySelector(".nav__toggle");
  const menu = document.querySelector(".nav__menu");
  if (toggle && menu) {
    toggle.addEventListener("click", () => {
      toggle.classList.toggle("is-active");
      menu.classList.toggle("is-open");
      document.body.style.overflow = menu.classList.contains("is-open") ? "hidden" : "";
    });
    menu.querySelectorAll(".nav__link").forEach((link) => {
      link.addEventListener("click", () => {
        toggle.classList.remove("is-active");
        menu.classList.remove("is-open");
        document.body.style.overflow = "";
      });
    });
  }

  const reveals = document.querySelectorAll(".reveal");
  if (reveals.length) {
    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) entry.target.classList.add("is-visible");
        });
      },
      { threshold: 0.1, rootMargin: "0px 0px -50px 0px" }
    );
    reveals.forEach((el) => observer.observe(el));
  }

  const heroContent = document.getElementById("hero-content");
  if (heroContent) {
    requestAnimationFrame(() => {
      requestAnimationFrame(() => heroContent.classList.add("is-visible"));
    });
  }

  const heroScroll = document.querySelector(".hero--scroll");
  if (heroScroll) {
    const vid1 = heroScroll.querySelector(".hero__video--1");
    const vid2 = heroScroll.querySelector(".hero__video--2");
    let showingSecond = false;
    let textExiting = false;

    const swapVideo = (toSecond) => {
      if (!vid1 || !vid2 || showingSecond === toSecond) return;
      showingSecond = toSecond;
      vid1.classList.toggle("is-active", !toSecond);
      vid2.classList.toggle("is-active", toSecond);
      const active = toSecond ? vid2 : vid1;
      active.currentTime = 0;
      active.play().catch(() => {});
    };

    const updateHeroOnScroll = () => {
      const y = window.scrollY;
      swapVideo(y > window.innerHeight * 0.25);
      if (heroContent) {
        const shouldExit = y > window.innerHeight * 0.12;
        if (shouldExit !== textExiting) {
          textExiting = shouldExit;
          heroContent.classList.toggle("is-exiting", shouldExit);
          heroContent.classList.toggle("is-visible", !shouldExit);
        }
      }
    };
    window.addEventListener("scroll", updateHeroOnScroll, { passive: true });
    updateHeroOnScroll();
  }

  const filterBtns = document.querySelectorAll(".team-filter");
  const teamCards = document.querySelectorAll(".team-grid .team-card");
  if (filterBtns.length && teamCards.length) {
    filterBtns.forEach((btn) => {
      btn.addEventListener("click", () => {
        const filter = btn.dataset.filter;
        filterBtns.forEach((b) => b.classList.remove("is-active"));
        btn.classList.add("is-active");
        teamCards.forEach((card) => {
          const skills = card.dataset.skills || "";
          const match = filter === "all" || skills.split(" ").includes(filter);
          card.classList.toggle("is-hidden", !match);
        });
      });
    });
  }

  const lightbox = document.getElementById("lightbox");
  if (lightbox) {
    const content = lightbox.querySelector(".lightbox__content");
    const closeBtn = lightbox.querySelector(".lightbox__close");

    const openLightbox = (media) => {
      content.innerHTML = "";
      if (media.tagName === "VIDEO") {
        const video = document.createElement("video");
        video.src = media.querySelector("source")?.src || media.src;
        video.controls = true;
        video.autoplay = true;
        content.appendChild(video);
      } else {
        const img = document.createElement("img");
        img.src = media.src || media.dataset.src;
        img.alt = media.alt || "";
        content.appendChild(img);
      }
      lightbox.classList.add("is-open");
      document.body.style.overflow = "hidden";
    };

    const closeLightbox = () => {
      lightbox.classList.remove("is-open");
      content.innerHTML = "";
      document.body.style.overflow = "";
    };

    document.querySelectorAll("[data-lightbox]").forEach((item) => {
      item.addEventListener("click", () => {
        const media = item.querySelector("img, video") || item;
        openLightbox(media);
      });
    });

    closeBtn?.addEventListener("click", closeLightbox);
    lightbox.addEventListener("click", (e) => {
      if (e.target === lightbox) closeLightbox();
    });
    document.addEventListener("keydown", (e) => {
      if (e.key === "Escape") closeLightbox();
    });
  }

  document.querySelectorAll("video[autoplay]").forEach((video) => {
    video.muted = true;
    video.playsInline = true;
    video.play().catch(() => {});
  });
}

/* ── Boot ── */

async function boot() {
  const body = document.body;
  const page = body.dataset.page;
  const app = document.getElementById("app");

  let site;
  try {
    site = await loadJSON("site.json");
  } catch (e) {
    if (app) app.innerHTML = `<p style="padding:6rem 2rem;text-align:center">Não foi possível carregar o conteúdo.</p>`;
    return;
  }

  const activeHref = body.dataset.href || "index.html";
  const navHtml = renderNav(site, activeHref);

  let contentHtml = "";
  try {
    if (page === "home") {
      contentHtml = renderHome(site);
    } else if (page === "gallery") {
      const data = await loadJSON("galleries/" + body.dataset.source + ".json");
      contentHtml = renderGallery(data);
    } else if (page === "team") {
      contentHtml = renderTeam(await loadJSON("team.json"));
    } else if (page === "partners") {
      contentHtml = renderPartners(await loadJSON("partners.json"));
    }
  } catch (e) {
    contentHtml = `<p style="padding:6rem 2rem;text-align:center">Não foi possível carregar esta secção.</p>`;
  }

  const lightboxHtml = `<div class="lightbox" id="lightbox"><button class="lightbox__close" aria-label="Fechar">&times;</button><div class="lightbox__content"></div></div>`;

  body.insertAdjacentHTML("afterbegin", navHtml);
  if (app) app.innerHTML = contentHtml + lightboxHtml;

  initInteractions();
}

document.addEventListener("DOMContentLoaded", boot);

/**
 * Main Entry Point — Apple-style layout
 */

function initApp() {
  renderNav();
  renderSocials();
  renderFooter();
  setupRouting();

  const hash = window.location.hash.slice(1);
  if (hash.startsWith("notes/")) {
    loadNote(hash.slice(6));
  } else {
    loadSection(hash || SITE_CONFIG.defaultSection);
  }
}

function renderNav() {
  const profile = SITE_CONFIG.profile;

  document.title = SITE_CONFIG.title || profile.name;

  document.getElementById("nav-name").textContent = profile.name;
  document.getElementById("nav-desc").textContent = profile.description || "";

  const navLinks = document.getElementById("nav-links");
  navLinks.innerHTML = SITE_CONFIG.navigation
    .map(
      (item) =>
        `<a href="javascript:void(0)" data-section="${item.id}" onclick="navigateTo('${item.id}')">${item.label}</a>`
    )
    .join("");
}

const ICONS = {
  email: `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z"/><polyline points="22,6 12,13 2,6"/></svg>`,
  github: `<svg viewBox="0 0 24 24" fill="currentColor"><path d="M12 0c-6.626 0-12 5.373-12 12 0 5.302 3.438 9.8 8.207 11.387.599.111.793-.261.793-.577v-2.234c-3.338.726-4.033-1.416-4.033-1.416-.546-1.387-1.333-1.756-1.333-1.756-1.089-.745.083-.729.083-.729 1.205.084 1.839 1.237 1.839 1.237 1.07 1.834 2.807 1.304 3.492.997.107-.775.418-1.305.762-1.604-2.665-.305-5.467-1.334-5.467-5.931 0-1.311.469-2.381 1.236-3.221-.124-.303-.535-1.524.117-3.176 0 0 1.008-.322 3.301 1.23.957-.266 1.983-.399 3.003-.404 1.02.005 2.047.138 3.006.404 2.291-1.552 3.297-1.23 3.297-1.23.653 1.653.242 2.874.118 3.176.77.84 1.235 1.911 1.235 3.221 0 4.609-2.807 5.624-5.479 5.921.43.372.823 1.102.823 2.222v3.293c0 .319.192.694.801.576 4.765-1.589 8.199-6.086 8.199-11.386 0-6.627-5.373-12-12-12z"/></svg>`,
  xiaohongshu: `<svg viewBox="0 0 24 24" fill="currentColor"><path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm-1 15h-2v-6h2v6zm0-8h-2V7h2v2zm4 8h-2v-6h2v6zm0-8h-2V7h2v2z"/></svg>`,
};

function renderSocials() {
  const container = document.getElementById("nav-socials");
  if (!container || !SITE_CONFIG.socials) return;

  container.innerHTML = SITE_CONFIG.socials
    .map(
      (s) =>
        `<a href="${s.url}" class="nav-social" target="_blank" rel="noopener noreferrer" title="${s.label}">${ICONS[s.icon] || s.label}</a>`
    )
    .join("");
}

function renderFooter() {
  const footer = document.getElementById("site-footer");
  footer.innerHTML = `<p>${SITE_CONFIG.footer.copyright}</p>`;
}

function navigateTo(sectionId) {
  window.location.hash = sectionId;
  loadSection(sectionId);
}

function loadSection(sectionId) {
  document.querySelectorAll(".nav-links a").forEach((link) => {
    link.classList.toggle("active", link.dataset.section === sectionId);
  });

  const section = SITE_CONFIG.navigation.find((s) => s.id === sectionId);
  if (!section) return;

  window.scrollTo({ top: 0, behavior: "smooth" });

  const contentEl = document.getElementById("dynamic-content");
  const mainEl = document.querySelector(".main-content");
  const processor = getSectionProcessor(sectionId);

  // Toggle wide layout for papers page
  if (sectionId === "papers") {
    mainEl.classList.add("wide");
  } else {
    mainEl.classList.remove("wide");
  }

  renderer.renderToElement(section.dataFile, contentEl, {
    postProcess: processor,
  });
}

function setupRouting() {
  window.addEventListener("hashchange", () => {
    const hash = window.location.hash.slice(1);
    if (hash.startsWith("notes/")) {
      loadNote(hash.slice(6));
    } else if (hash) {
      loadSection(hash);
    }
  });
}

if (document.readyState === "loading") {
  document.addEventListener("DOMContentLoaded", initApp);
} else {
  initApp();
}

const themeStorageKey = "habit-theme";
const themes = ["original", "kuromi", "friends"];
const ICON_BUST = "33";

const themeBranding = {
  original: {
    themeColor: "#26735b",
    svg: "icon.svg",
    apple: "apple-touch-icon.png",
    png192: "icon-192.png",
  },
  kuromi: {
    themeColor: "#2d1548",
    svg: "icon-kuromi.svg",
    apple: "apple-touch-icon-kuromi.png",
    png192: "icon-192-kuromi.png",
  },
  friends: {
    themeColor: "#e8e2d8",
    svg: "icon-friends.svg",
    apple: "apple-touch-icon-friends.png",
    png192: "icon-192-friends.png",
  },
};

function getTheme() {
  const saved = localStorage.getItem(themeStorageKey);

  if (saved === "mid-friends") {
    localStorage.setItem(themeStorageKey, "friends");
    return "friends";
  }

  return themes.includes(saved) ? saved : "original";
}

function setLinkHref(selector, href) {
  let link = document.querySelector(selector);

  if (!link) {
    link = document.createElement("link");
    const relMatch = selector.match(/rel="([^"]+)"/);

    if (relMatch) {
      link.rel = relMatch[1];
    }

    if (selector.includes("image/svg")) {
      link.type = "image/svg+xml";
    }

    if (selector.includes("192x192")) {
      link.sizes = "192x192";
      link.type = "image/png";
    }

    if (selector.includes("apple-touch")) {
      link.sizes = "180x180";
    }

    link.setAttribute("data-theme-icon", "true");
    document.head.appendChild(link);
  }

  link.href = href;
}

function syncThemeBranding(theme) {
  const brand = themeBranding[theme] || themeBranding.original;
  const q = `?v=${ICON_BUST}`;

  const themeColorMeta = document.querySelector('meta[name="theme-color"]');

  if (themeColorMeta) {
    themeColorMeta.setAttribute("content", brand.themeColor);
  }

  setLinkHref('link[rel="apple-touch-icon"]', `${brand.apple}${q}`);
  setLinkHref('link[rel="icon"][sizes="192x192"]', `${brand.png192}${q}`);
  setLinkHref('link[rel="icon"][type="image/svg+xml"]', `${brand.svg}${q}`);
}

function applyTheme(theme) {
  document.documentElement.dataset.theme = theme;
  localStorage.setItem(themeStorageKey, theme);
  syncThemeButtons(theme);
  syncThemeBranding(theme);

  window.dispatchEvent(new CustomEvent("habit-theme-change", { detail: { theme } }));
}

function syncThemeButtons(theme) {
  document.querySelectorAll(".side-theme, .theme-chip").forEach((button) => {
    if (themes.includes(button.dataset.theme)) {
      button.classList.toggle("is-active", button.dataset.theme === theme);
    }
  });
}

function initThemeControls(root = document) {
  const current = getTheme();

  root.querySelectorAll(".side-theme, .theme-chip").forEach((button) => {
    if (!themes.includes(button.dataset.theme)) {
      return;
    }

    button.classList.toggle("is-active", button.dataset.theme === current);

    if (button.dataset.themeBound === "true") {
      return;
    }

    button.dataset.themeBound = "true";
    button.addEventListener("click", () => {
      applyTheme(button.dataset.theme);
    });
  });
}

function initThemeImages() {
  document.querySelectorAll(".theme-decor img").forEach((img) => {
    const base = img.dataset.srcBase;

    if (!base) {
      return;
    }

    const extensions = ["png", "jpg", "jpeg", "webp", "svg"];

    function tryLoad(index) {
      if (index >= extensions.length) {
        img.closest(".decor-slot")?.classList.add("is-missing");
        return;
      }

      const candidate = `${base}.${extensions[index]}`;
      const probe = new Image();

      probe.onload = () => {
        img.src = candidate;
        img.closest(".decor-slot")?.classList.remove("is-missing");
      };

      probe.onerror = () => tryLoad(index + 1);
      probe.src = candidate;
    }

    tryLoad(0);
  });
}

applyTheme(getTheme());

if (document.readyState === "loading") {
  document.addEventListener("DOMContentLoaded", initThemeImages);
} else {
  initThemeImages();
}

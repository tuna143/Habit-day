const themeStorageKey = "habit-theme";
const themes = ["original", "kuromi", "friends", "gintama", "toothless"];
const ICON_BUST = "45";

const appIcons = {
  svg: "icon.svg",
  apple: "apple-touch-icon.png",
  png192: "icon-192.png",
};

const themeBranding = {
  original: { themeColor: "#26735b" },
  kuromi: { themeColor: "#35214a" },
  friends: { themeColor: "#8a8378" },
  gintama: { themeColor: "#1a2233" },
  toothless: { themeColor: "#141618" },
};

function getTheme() {
  const saved = localStorage.getItem(themeStorageKey);

  if (saved === "mid-friends") {
    localStorage.setItem(themeStorageKey, "friends");
    return "friends";
  }

  return themes.includes(saved) ? saved : "original";
}

function setThemeIconLink(rel, href, extra) {
  const selector = extra
    ? `link[rel="${rel}"][${extra}]`
    : `link[rel="${rel}"]`;
  let link = document.querySelector(selector);

  if (!link) {
    link = document.createElement("link");
    link.rel = rel;

    if (extra && extra.startsWith("sizes=")) {
      link.sizes = extra.replace('sizes="', "").replace('"', "");
      link.type = "image/png";
    }

    if (extra === 'type="image/svg+xml"') {
      link.type = "image/svg+xml";
    }

    if (rel === "apple-touch-icon") {
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

  document.querySelectorAll("link[data-theme-icon]").forEach((link) => {
    const rel = link.rel;

    if (rel === "apple-touch-icon") {
      link.href = `${appIcons.apple}${q}`;
    } else if (rel === "icon" && link.sizes === "192x192") {
      link.href = `${appIcons.png192}${q}`;
    } else if (rel === "icon" && link.type === "image/svg+xml") {
      link.href = `${appIcons.svg}${q}`;
    }
  });

  setThemeIconLink("apple-touch-icon", `${appIcons.apple}${q}`);
  setThemeIconLink("icon", `${appIcons.png192}${q}`, 'sizes="192x192"');
  setThemeIconLink("icon", `${appIcons.svg}${q}`, 'type="image/svg+xml"');
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

if ("serviceWorker" in navigator && location.protocol !== "file:") {
  navigator.serviceWorker.register("./sw.js?v=49").catch(() => {});
}

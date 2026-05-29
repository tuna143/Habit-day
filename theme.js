const themeStorageKey = "habit-theme";
const themes = ["original", "friends"];
const themeColors = {
  original: "#f6f7f2",
  kuromi: "#ccc6d4",
  friends: "#e8e5e0",
};

function getTheme() {
  const saved = localStorage.getItem(themeStorageKey);

  if (saved === "mid-friends" || saved === "kuromi") {
    localStorage.setItem(themeStorageKey, "friends");
    return "friends";
  }

  return themes.includes(saved) ? saved : "original";
}

function applyTheme(theme) {
  document.documentElement.dataset.theme = theme;
  localStorage.setItem(themeStorageKey, theme);
  syncThemeButtons(theme);

  const themeColorMeta = document.querySelector('meta[name="theme-color"]');

  if (themeColorMeta) {
    themeColorMeta.setAttribute("content", themeColors[theme] || themeColors.original);
  }

  window.dispatchEvent(new CustomEvent("habit-theme-change", { detail: { theme } }));
}

function removeKuromiThemeButton(root = document) {
  root.querySelectorAll('.side-theme[data-theme="kuromi"]').forEach((button) => {
    button.remove();
  });
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

  removeKuromiThemeButton(root);

  root.querySelectorAll(".side-theme, .theme-chip").forEach((button) => {
    button.classList.toggle("is-active", button.dataset.theme === current);

    button.addEventListener("click", () => {
      applyTheme(button.dataset.theme);
    });
  });
}

function initThemeImages() {
  document.querySelectorAll(".theme-decor img, .side-decor img").forEach((img) => {
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

removeKuromiThemeButton();

if (document.readyState === "loading") {
  document.addEventListener("DOMContentLoaded", () => {
    removeKuromiThemeButton();
    initThemeControls();
    initThemeImages();
  });
} else {
  initThemeControls();
  initThemeImages();
}

const themeStorageKey = "habit-theme";
const mainThemeStorageKey = "habit-main-theme";
const userNameStorageKey = "habit-user-name";
const themes = ["original", "kuromi", "friends", "gintama", "toothless"];
const mainThemeOptions = ["friends", "kuromi", "gintama", "toothless"];
const ICON_BUST = "48";

const themeLabels = {
  original: "Original",
  friends: "Friends",
  kuromi: "Kuromi",
  gintama: "銀魂",
  toothless: "Toothless",
};

const themeTodayTitles = {
  friends: "Friend's Habit",
  kuromi: "Kromi's Habit",
  gintama: "銀魂's habit",
  toothless: "Dragon's habit",
};

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

function getUserName() {
  return (localStorage.getItem(userNameStorageKey) || "").trim();
}

function setUserName(name) {
  localStorage.setItem(userNameStorageKey, (name || "").trim());
  syncMainThemeUi();
  window.dispatchEvent(new CustomEvent("habit-profile-change"));
}

function getMainTheme() {
  const saved = localStorage.getItem(mainThemeStorageKey);

  return mainThemeOptions.includes(saved) ? saved : null;
}

function setMainTheme(theme) {
  if (!mainThemeOptions.includes(theme)) {
    return;
  }

  localStorage.setItem(mainThemeStorageKey, theme);
  syncMainThemeUi();
  window.dispatchEvent(new CustomEvent("habit-profile-change"));
}

function formatUserHabitTitle(name) {
  const trimmed = (name || "").trim();

  if (!trimmed) {
    return "My habit";
  }

  if (/s$/i.test(trimmed)) {
    return `${trimmed}' habit`;
  }

  return `${trimmed}'s habit`;
}

function getTodayTitle(theme) {
  const activeTheme = theme || getTheme();
  const mainTheme = getMainTheme();

  if (mainTheme && activeTheme === mainTheme) {
    return formatUserHabitTitle(getUserName());
  }

  return themeTodayTitles[activeTheme] || null;
}

function updateMainTitlePreviews(root = document) {
  const title = formatUserHabitTitle(getUserName());

  root.querySelectorAll("[data-main-title-preview]").forEach((node) => {
    node.textContent = title;
  });
}

function updateSetMainThemeButtons(root = document) {
  const currentTheme = getTheme();
  const mainTheme = getMainTheme();
  const label = themeLabels[currentTheme] || currentTheme;

  root.querySelectorAll("[data-set-main-theme]").forEach((button) => {
    const canSet = mainThemeOptions.includes(currentTheme);
    button.hidden = !canSet;
    button.disabled = !canSet || currentTheme === mainTheme;
    button.textContent =
      currentTheme === mainTheme ? "Main theme saved" : `Set ${label} as main theme`;
  });
}

function syncMainThemeUi(root = document) {
  const mainTheme = getMainTheme();

  root.querySelectorAll(".theme-chip, .side-theme").forEach((button) => {
    if (!themes.includes(button.dataset.theme)) {
      return;
    }

    button.classList.toggle("is-main", button.dataset.theme === mainTheme);
  });

  root.querySelectorAll(".habit-user-name-input").forEach((input) => {
    if (document.activeElement !== input) {
      input.value = getUserName();
    }
  });

  updateMainTitlePreviews(root);
  updateSetMainThemeButtons(root);
}

function initMainThemeProfile(root = document) {
  root.querySelectorAll(".habit-user-name-input").forEach((input) => {
    if (input.dataset.profileBound === "true") {
      return;
    }

    input.dataset.profileBound = "true";
    input.value = getUserName();
    input.addEventListener("input", () => {
      setUserName(input.value);
    });
  });

  root.querySelectorAll("[data-set-main-theme]").forEach((button) => {
    if (button.dataset.profileBound === "true") {
      return;
    }

    button.dataset.profileBound = "true";
    button.addEventListener("click", () => {
      const theme = getTheme();

      if (mainThemeOptions.includes(theme)) {
        setMainTheme(theme);
      }
    });
  });

  syncMainThemeUi(root);
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
  syncMainThemeUi();
  updateSetMainThemeButtons();

  window.dispatchEvent(new CustomEvent("habit-theme-change", { detail: { theme } }));
  window.dispatchEvent(new CustomEvent("habit-profile-change"));
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
      updateSetMainThemeButtons(root);
    });
  });

  initMainThemeProfile(root);
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
  navigator.serviceWorker.register("./sw.js?v=50").catch(() => {});
}

window.HabitTheme = {
  getTheme,
  applyTheme,
  getUserName,
  setUserName,
  getMainTheme,
  setMainTheme,
  getTodayTitle,
  getThemeLabel: (theme) => themeLabels[theme] || theme,
  formatUserHabitTitle,
  syncMainThemeUi,
  mainThemeOptions,
  themeLabels,
};

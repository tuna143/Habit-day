/* sidebar.js build 39 — single top-right ⋯ menu (mobile) + desktop sidebar */
const HOME_HREF = "app.html";

function renderSidebar() {
  const sidebar = document.getElementById("app-sidebar");

  if (!sidebar) {
    return;
  }

  const page = sidebar.dataset.page || "home";

  sidebar.innerHTML = `
    <div class="app-menu-bar" aria-label="App menu">
      <div class="app-menu" data-menu="main">
        <button
          type="button"
          class="app-menu-trigger"
          aria-expanded="false"
          aria-controls="appMenuMain"
          aria-label="Open menu"
        >
          <span class="app-menu-dots" aria-hidden="true"></span>
        </button>
        <div class="app-menu-dropdown app-menu-dropdown--full" id="appMenuMain" role="menu" hidden>
          <div class="app-menu-stack" data-menu-stack>
            <div class="app-menu-layer is-active" data-layer="root">
              <nav class="app-menu-section" aria-label="Pages">
                <a
                  role="menuitem"
                  class="app-menu-link${page === "home" ? " is-active" : ""}"
                  href="${HOME_HREF}"
                >Today</a>
                <a
                  role="menuitem"
                  class="app-menu-link${page === "weekly" ? " is-active" : ""}"
                  href="weekly.html"
                >Weekly</a>
                <a
                  role="menuitem"
                  class="app-menu-link${page === "calendar" ? " is-active" : ""}"
                  href="calendar.html"
                >Calendar</a>
              </nav>
              <div class="app-menu-divider" role="separator"></div>
              <div class="app-menu-section app-menu-section--tools">
                <button type="button" class="app-menu-row app-menu-row--sub" data-open-layer="themes">
                  <span class="app-menu-row-icon theme-row-icon" aria-hidden="true">
                    <span class="theme-swatch theme-swatch--a"></span>
                    <span class="theme-swatch theme-swatch--b"></span>
                    <span class="theme-swatch theme-swatch--c"></span>
                  </span>
                  <span class="app-menu-row-text">Theme</span>
                  <span class="app-menu-chevron" aria-hidden="true">›</span>
                </button>
                <a
                  class="app-menu-row${page === "photos" ? " is-active" : ""}"
                  href="photos.html"
                  role="menuitem"
                >
                  <span class="app-menu-row-icon" aria-hidden="true">▣</span>
                  <span class="app-menu-row-text">Photos</span>
                </a>
              </div>
            </div>
            <div class="app-menu-layer" data-layer="themes" hidden>
              <button type="button" class="app-menu-row app-menu-row--back" data-back-layer="root">
                <span class="app-menu-chevron app-menu-chevron--back" aria-hidden="true">‹</span>
                <span class="app-menu-row-text">Theme</span>
              </button>
              <div class="app-menu-theme-list" role="group" aria-label="Choose theme">
                <button type="button" class="theme-chip theme-chip--original" data-theme="original">
                  <span class="theme-chip-dot" aria-hidden="true"></span>
                  <span class="theme-chip-copy">
                    <strong>Original</strong>
                    <small>Fresh green</small>
                  </span>
                </button>
                <button type="button" class="theme-chip theme-chip--kuromi" data-theme="kuromi">
                  <span class="theme-chip-dot" aria-hidden="true"></span>
                  <span class="theme-chip-copy">
                    <strong>Kuromi</strong>
                    <small>Lavender ♡</small>
                  </span>
                </button>
                <button type="button" class="theme-chip theme-chip--friends" data-theme="friends">
                  <span class="theme-chip-dot" aria-hidden="true"></span>
                  <span class="theme-chip-copy">
                    <strong>Friends</strong>
                    <small>Warm cozy</small>
                  </span>
                </button>
                <button type="button" class="theme-chip theme-chip--gintama" data-theme="gintama">
                  <span class="theme-chip-dot" aria-hidden="true"></span>
                  <span class="theme-chip-copy">
                    <strong>Gintama</strong>
                    <small>Silver soul</small>
                  </span>
                </button>
                <button type="button" class="theme-chip theme-chip--toothless" data-theme="toothless">
                  <span class="theme-chip-dot" aria-hidden="true"></span>
                  <span class="theme-chip-copy">
                    <strong>Toothless</strong>
                    <small>Night Fury</small>
                  </span>
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>

    <div class="side-desktop-nav">
      <section class="side-block side-block--pages" aria-label="Pages">
        <p class="side-block-label">Pages</p>
        <nav class="side-nav">
          <a class="side-link${page === "home" ? " is-active" : ""}" href="${HOME_HREF}">Today</a>
          <a class="side-link${page === "weekly" ? " is-active" : ""}" href="weekly.html">Weekly</a>
          <a class="side-link${page === "calendar" ? " is-active" : ""}" href="calendar.html">Calendar</a>
        </nav>
      </section>
      <section class="side-block side-block--theme" aria-label="Theme and shortcuts">
        <p class="side-block-label">Theme</p>
        <div class="side-themes" role="group" aria-label="Choose theme">
          <button type="button" class="side-theme" data-theme="original" title="Original">Org</button>
          <button type="button" class="side-theme" data-theme="kuromi" title="Kuromi">Kuro</button>
          <button type="button" class="side-theme" data-theme="friends" title="Friends">Fr</button>
          <button type="button" class="side-theme" data-theme="gintama" title="Gintama">Gi</button>
          <button type="button" class="side-theme" data-theme="toothless" title="Toothless">To</button>
        </div>
        <a class="side-link side-link--pics side-link--pics-desktop${page === "photos" ? " is-active" : ""}" href="photos.html" title="My Photos">Pics</a>
      </section>
    </div>
  `;

  initAppMenus(sidebar);

  if (typeof initThemeControls === "function") {
    initThemeControls(sidebar);
  }
}

function setMenuLayer(menu, layerName) {
  const stack = menu.querySelector("[data-menu-stack]");

  if (!stack) {
    return;
  }

  stack.querySelectorAll(".app-menu-layer").forEach((layer) => {
    const isTarget = layer.dataset.layer === layerName;
    layer.classList.toggle("is-active", isTarget);
    layer.hidden = !isTarget;
  });
}

function resetMenuLayers(menu) {
  setMenuLayer(menu, "root");
}

function closeAllMenus(sidebar) {
  sidebar.querySelectorAll(".app-menu.is-open").forEach((menu) => {
    menu.classList.remove("is-open");
    const trigger = menu.querySelector(".app-menu-trigger");
    const dropdown = menu.querySelector(".app-menu-dropdown");

    if (trigger) {
      trigger.setAttribute("aria-expanded", "false");
    }

    if (dropdown) {
      dropdown.hidden = true;
    }

    resetMenuLayers(menu);
  });

  document.body.classList.remove("app-menu-open");
}

function openMenu(menu) {
  const trigger = menu.querySelector(".app-menu-trigger");
  const dropdown = menu.querySelector(".app-menu-dropdown");

  menu.classList.add("is-open");

  if (trigger) {
    trigger.setAttribute("aria-expanded", "true");
  }

  if (dropdown) {
    dropdown.hidden = false;
  }
}

function initAppMenus(sidebar) {
  const menus = sidebar.querySelectorAll(".app-menu");

  menus.forEach((menu) => {
    const trigger = menu.querySelector(".app-menu-trigger");

    if (!trigger) {
      return;
    }

    trigger.addEventListener("click", (event) => {
      event.stopPropagation();
      const wasOpen = menu.classList.contains("is-open");
      const sidebarRoot = menu.closest("#app-sidebar") || sidebar;

      closeAllMenus(sidebarRoot);

      if (!wasOpen) {
        openMenu(menu);
        document.body.classList.add("app-menu-open");
      }
    });

    menu.querySelectorAll("[data-open-layer]").forEach((button) => {
      button.addEventListener("click", (event) => {
        event.stopPropagation();
        setMenuLayer(menu, button.dataset.openLayer);
      });
    });

    menu.querySelectorAll("[data-back-layer]").forEach((button) => {
      button.addEventListener("click", (event) => {
        event.stopPropagation();
        setMenuLayer(menu, button.dataset.backLayer);
      });
    });

    menu.querySelectorAll(".theme-chip").forEach((chip) => {
      chip.addEventListener("click", () => {
        closeAllMenus(sidebar);
      });
    });

    menu.querySelectorAll(".app-menu-link, .app-menu-row[href]").forEach((link) => {
      link.addEventListener("click", () => {
        closeAllMenus(sidebar);
      });
    });

    menu.querySelectorAll(".app-menu-dropdown").forEach((panel) => {
      panel.addEventListener("click", (event) => {
        event.stopPropagation();
      });
    });
  });

  if (sidebar.dataset.menuBound === "true") {
    return;
  }

  sidebar.dataset.menuBound = "true";

  document.addEventListener("click", () => {
    closeAllMenus(sidebar);
  });

  document.addEventListener("keydown", (event) => {
    if (event.key === "Escape") {
      closeAllMenus(sidebar);
    }
  });
}

if (document.readyState === "loading") {
  document.addEventListener("DOMContentLoaded", renderSidebar);
} else {
  renderSidebar();
}

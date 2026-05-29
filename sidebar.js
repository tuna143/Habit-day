/* sidebar.js build 11 */
const HOME_HREF = "app.html";

function renderSidebar() {
  const sidebar = document.getElementById("app-sidebar");

  if (!sidebar) {
    return;
  }

  const page = sidebar.dataset.page || "home";
  const isHome = page === "home";

  sidebar.innerHTML = `
    <section class="side-block side-block--pages" aria-label="Pages">
      <p class="side-block-label">Pages</p>
      <nav class="side-nav">
        <a class="side-link${page === "home" ? " is-active" : ""}" href="${HOME_HREF}">Today</a>
        <a class="side-link${page === "weekly" ? " is-active" : ""}" href="weekly.html">Weekly</a>
        <a class="side-link${page === "calendar" ? " is-active" : ""}" href="calendar.html">Calendar</a>
      </nav>
    </section>
    <section class="side-block side-block--theme" aria-label="Theme">
      <p class="side-block-label">Theme</p>
      <div class="side-themes" role="group" aria-label="Choose theme">
        <button type="button" class="side-theme" data-theme="original" title="Original">
          <span class="side-theme-dot" aria-hidden="true"></span>
          <span class="side-theme-name">Org</span>
        </button>
        <button type="button" class="side-theme" data-theme="kuromi" title="Kuromi">
          <span class="side-theme-dot" aria-hidden="true"></span>
          <span class="side-theme-name">Kuro</span>
        </button>
        <button type="button" class="side-theme" data-theme="friends" title="Friends">
          <span class="side-theme-dot" aria-hidden="true"></span>
          <span class="side-theme-name">Fr</span>
        </button>
      </div>
      <a class="side-link side-link--pics side-link--pics-desktop${page === "photos" ? " is-active" : ""}" href="photos.html" title="My Photos">Pics</a>
    </section>
    <section class="side-block side-block--mobile-bar" aria-label="Quick actions">
      <div class="side-mobile-bar">
        <a class="side-link side-link--pics side-link--pics-mobile${page === "photos" ? " is-active" : ""}" href="photos.html" title="My Photos">Pics</a>
        ${
          isHome
            ? `<button type="button" class="side-add-habit" id="sideAddHabit" aria-label="Add a new habit">
          <span class="side-add-habit-icon" aria-hidden="true">+</span>
          <span class="side-add-habit-label">Habit</span>
        </button>`
            : ""
        }
      </div>
    </section>
  `;

  if (typeof initThemeControls === "function") {
    initThemeControls(sidebar);
  }
}

if (document.readyState === "loading") {
  document.addEventListener("DOMContentLoaded", renderSidebar);
} else {
  renderSidebar();
}

/* sidebar.js build 12 */
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
    <section class="side-block side-block--theme" aria-label="Theme and shortcuts">
      <p class="side-block-label">Theme</p>
      <div class="side-toolbar">
        <div class="side-themes" role="group" aria-label="Choose theme">
          <button type="button" class="side-theme" data-theme="original" title="Original">Org</button>
          <button type="button" class="side-theme" data-theme="kuromi" title="Kuromi">Kuro</button>
          <button type="button" class="side-theme" data-theme="friends" title="Friends">Fr</button>
        </div>
        <div class="side-quick">
          <a class="side-quick-btn side-quick-btn--pics${page === "photos" ? " is-active" : ""}" href="photos.html" title="My Photos">Pics</a>
          ${
            isHome
              ? `<button type="button" class="side-quick-btn side-quick-btn--add" id="sideAddHabit" aria-label="Add habit">+</button>`
              : ""
          }
        </div>
      </div>
      <a class="side-link side-link--pics side-link--pics-desktop${page === "photos" ? " is-active" : ""}" href="photos.html" title="My Photos">Pics</a>
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

/* sidebar.js build 9 — Org + Fr themes only */
const HOME_HREF = "app.html";

function removeKuromiThemeButton(root = document) {
  root.querySelectorAll('.side-theme[data-theme="kuromi"]').forEach((button) => {
    button.remove();
  });
}

function renderSidebar() {
  const sidebar = document.getElementById("app-sidebar");

  if (!sidebar) {
    return;
  }

  const page = sidebar.dataset.page || "home";

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
        <button type="button" class="side-theme" data-theme="original" title="Original">Org</button>
        <button type="button" class="side-theme" data-theme="friends" title="Friends">Fr</button>
      </div>
      <a class="side-link side-link--pics${page === "photos" ? " is-active" : ""}" href="photos.html" title="My Photos">Pics</a>
    </section>
    <div class="side-decor side-decor-kuromi" aria-hidden="true">
      <img src="assets/kuromi/sidebar.svg" alt="" width="48" height="48" data-fallback="assets/kuromi/sidebar.svg" />
    </div>
  `;

  removeKuromiThemeButton(sidebar);

  if (typeof initThemeControls === "function") {
    initThemeControls(sidebar);
  }
}

removeKuromiThemeButton();

if (document.readyState === "loading") {
  document.addEventListener("DOMContentLoaded", renderSidebar);
} else {
  renderSidebar();
}

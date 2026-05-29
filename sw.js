const cacheName = "habit-day-v50";
const mainPage = "./app.html";

const toothlessAssets = [
  "./assets/toothless/banner.png",
  "./assets/toothless/celebrate.png",
  ...Array.from({ length: 20 }, (_, index) => `./assets/toothless/scene-${String(index + 1).padStart(2, "0")}.png`),
];

function isCodeRequest(request) {
  const url = request.url;

  return (
    request.destination === "script" ||
    request.destination === "style" ||
    request.mode === "navigate" ||
    request.destination === "document" ||
    /\.(html|js|css|webmanifest)(\?|$)/i.test(url)
  );
}

function isAppIconRequest(request) {
  const url = request.url;

  return /\/apple-touch-icon\.png|\/icon\.svg|\/icon-\d+\.png/i.test(url);
}

const appShell = [
  "./",
  mainPage,
  "./index.html",
  "./습관바꾸기.html",
  "./weekly.html",
  "./calendar.html",
  "./photos.html",
  "./styles.css",
  "./layout.css",
  "./themes.css",
  "./shared.js",
  "./app.js",
  "./sidebar.js",
  "./theme.js",
  "./weekly.js",
  "./calendar.js",
  "./photos.js",
  "./user-photos.js",
  "./fireworks.js",
  "./habit-photos.js",
  "./habit-snap-badges.js",
  "./habit-camera.js",
  "./manifest.webmanifest",
  ...toothlessAssets,
];

self.addEventListener("install", (event) => {
  event.waitUntil(
    caches.open(cacheName).then((cache) => cache.addAll(appShell)).then(() => self.skipWaiting())
  );
});

self.addEventListener("activate", (event) => {
  event.waitUntil(
    caches
      .keys()
      .then((keys) => Promise.all(keys.filter((key) => key !== cacheName).map((key) => caches.delete(key))))
      .then(() => self.clients.claim())
  );
});

self.addEventListener("fetch", (event) => {
  if (event.request.method !== "GET") {
    return;
  }

  const request = event.request;

  if (isAppIconRequest(request)) {
    event.respondWith(
      fetch(request)
        .then((response) => {
          if (response && response.ok) {
            const copy = response.clone();
            caches.open(cacheName).then((cache) => cache.put(request, copy));
          }
          return response;
        })
        .catch(() => caches.match(request))
    );
    return;
  }

  if (isCodeRequest(request)) {
    event.respondWith(
      fetch(request)
        .then((response) => {
          if (response && response.ok) {
            const copy = response.clone();
            caches.open(cacheName).then((cache) => cache.put(request, copy));
          }
          return response;
        })
        .catch(() =>
          caches.match(request).then((cached) => cached || caches.match(mainPage) || caches.match("./index.html"))
        )
    );
    return;
  }

  event.respondWith(
    caches.match(request).then((cached) => {
      const networkFetch = fetch(request)
        .then((response) => {
          if (response && response.ok) {
            caches.open(cacheName).then((cache) => cache.put(request, response.clone()));
          }
          return response;
        })
        .catch(() => cached);

      return cached || networkFetch;
    })
  );
});

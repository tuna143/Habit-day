const cacheName = "habit-day-v47";
const mainPage = "./app.html";

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
  "./habit-camera.js",
  "./manifest.webmanifest",
  "./icon.svg",
  "./icon-kuromi.svg",
  "./icon-friends.svg",
  "./icon-gintama.svg",
  "./icon-toothless.svg",
  "./icon-192.png",
  "./icon-192-kuromi.png",
  "./icon-192-friends.png",
  "./icon-192-gintama.png",
  "./icon-192-toothless.png",
  "./icon-512.png",
  "./icon-512-kuromi.png",
  "./icon-512-friends.png",
  "./icon-512-gintama.png",
  "./icon-512-toothless.png",
  "./apple-touch-icon.png",
  "./apple-touch-icon-kuromi.png",
  "./apple-touch-icon-friends.png",
  "./apple-touch-icon-gintama.png",
  "./apple-touch-icon-toothless.png",
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

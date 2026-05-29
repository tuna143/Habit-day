const cacheName = "habit-day-v7";
const mainPage = "./습관바꾸기.html";
const appShell = [
  "./",
  mainPage,
  "./index.html",
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
  "./manifest.webmanifest",
  "./icon.svg",
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
  const isNavigation = request.mode === "navigate" || request.destination === "document";

  if (isNavigation) {
    event.respondWith(
      fetch(request)
        .then((response) => {
          if (response && response.ok) {
            const copy = response.clone();
            caches.open(cacheName).then((cache) => cache.put(request.url, copy));
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

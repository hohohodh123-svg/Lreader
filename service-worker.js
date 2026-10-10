const CACHE_NAME = "linh-reader-v15";

const APP_FILES = [
  "./",
  "./index.html",
  "./manifest.json",
  "./icons/apple-touch-icon.png",
  "./icons/icon-192.png",
  "./icons/icon-512.png",
  "./icons/favicon-32.png",
  "./lib/pdf.min.js",
  "./lib/pdf.worker.min.js"
];

self.addEventListener("install", event => {
  event.waitUntil(
    caches.open(CACHE_NAME)
      .then(cache => cache.addAll(APP_FILES))
      .then(() => self.skipWaiting())
  );
});

self.addEventListener("activate", event => {
  event.waitUntil(
    caches.keys()
      .then(names => Promise.all(
        names
          .filter(name => name.startsWith("linh-reader-") && name !== CACHE_NAME)
          .map(name => caches.delete(name))
      ))
      .then(() => self.clients.claim())
  );
});

self.addEventListener("fetch", event => {
  if (event.request.method !== "GET") return;

  const url = new URL(event.request.url);

  if (url.origin !== self.location.origin) return;

  event.respondWith(
    fetch(event.request)
      .then(response => {
        if (response.ok) {
          const copy = response.clone();

          event.waitUntil(
            caches.open(CACHE_NAME)
              .then(cache => cache.put(event.request, copy))
          );
        }

        return response;
      })
      .catch(async () => {
        const cached = await caches.match(
          event.request,
          { ignoreSearch: true }
        );

        if (cached) return cached;

        if (event.request.mode === "navigate") {
          return caches.match("./index.html");
        }

        return Response.error();
      })
  );
});
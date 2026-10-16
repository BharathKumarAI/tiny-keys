// Tiny Keys offline worker: on first visit it saves the whole game (page, sounds,
// videos, icons) on the device, then serves everything from there, with or without internet.
// pwa/build.sh fills in VERSION and ASSETS; a new VERSION replaces the old copy.
const VERSION = "tiny-keys-c132c007e6";
const ASSETS = ["./", "icons/apple-touch-icon.png", "icons/icon-192.png", "icons/icon-512.png", "index.html", "manifest.webmanifest", "sounds/bee.mp3", "sounds/cat.mp3", "sounds/cow.mp3", "sounds/dog.mp3", "sounds/duck.mp3", "sounds/frog.mp3", "sounds/horse.mp3", "sounds/lion.mp3", "sounds/owl.mp3", "sounds/pig.mp3", "sounds/rooster.mp3", "sounds/sheep.mp3", "videos/brush-teeth.mp4", "videos/clap.mp4", "videos/dance.mp4", "videos/drink.mp4", "videos/eat.mp4", "videos/hug.mp4", "videos/jump.mp4", "videos/play.mp4", "videos/put-on-shoes.mp4", "videos/read-a-book.mp4", "videos/run.mp4", "videos/share.mp4", "videos/sleep.mp4", "videos/wake-up.mp4", "videos/walk.mp4", "videos/wash-hands.mp4", "videos/wave.mp4"];
const FONTS = "tiny-keys-fonts";

self.addEventListener("install", event => {
  event.waitUntil(caches.open(VERSION).then(cache => cache.addAll(ASSETS)).then(() => self.skipWaiting()));
});

self.addEventListener("activate", event => {
  event.waitUntil(
    caches.keys()
      .then(keys => Promise.all(keys.filter(k => k !== VERSION && k !== FONTS).map(k => caches.delete(k))))
      .then(() => self.clients.claim())
  );
});

self.addEventListener("fetch", event => {
  const req = event.request;
  if (req.method !== "GET") return;
  const url = new URL(req.url);

  // Google Fonts: keep a copy so the rounded font works offline too
  if (url.hostname.endsWith("googleapis.com") || url.hostname.endsWith("gstatic.com")) {
    event.respondWith(caches.open(FONTS).then(async cache => {
      const hit = await cache.match(req);
      const fresh = fetch(req).then(res => { cache.put(req, res.clone()); return res; }).catch(() => hit);
      return hit || fresh;
    }));
    return;
  }
  if (url.origin !== location.origin) return;

  // Everything else: saved copy first, the network only for anything not saved yet
  event.respondWith(
    caches.match(req.mode === "navigate" ? "./" : req, { ignoreSearch: true })
      .then(hit => hit || fetch(req))
  );
});

/* 英语闯关岛 Service Worker · 版本 mv2c0lld */
const CACHE = "english-quest-shell-mv2c0lld";   // 外壳：每次部署换新
const DATA_CACHE = "english-quest-data";          // 词库数据：跨版本保留，避免重复下载
const ASSETS = [
  "./",
  "./index.html",
  "./manifest.webmanifest",
  "./icons/icon-192.png",
  "./icons/icon-512.png",
  "./icons/maskable-192.png",
  "./icons/maskable-512.png",
  "./icons/icon-180.png",
  "./icons/favicon-32.png"
];

self.addEventListener("install", (event) => {
  event.waitUntil(
    caches.open(CACHE)
      .then((cache) => cache.addAll(ASSETS))
      .then(() => self.skipWaiting())
      .catch(() => self.skipWaiting())
  );
});

self.addEventListener("activate", (event) => {
  event.waitUntil(
    caches.keys()
      .then((keys) => Promise.all(
        keys.filter((k) => k.startsWith("english-quest-shell-") && k !== CACHE).map((k) => caches.delete(k))
      ))
      .then(() => self.clients.claim())
  );
});

self.addEventListener("fetch", (event) => {
  const req = event.request;
  if (req.method !== "GET") return;
  const url = new URL(req.url);
  // 只处理同源请求（YouTube 等外链视频不拦截，始终走网络）
  if (url.origin !== self.location.origin) return;

  // 词库数据：放进独立缓存，跨版本保留（手机上省流量）
  if (url.pathname.includes("/data/")) {
    event.respondWith(
      caches.open(DATA_CACHE).then((cache) =>
        cache.match(req).then((hit) => hit || fetch(req).then((resp) => {
          if (resp && resp.status === 200) cache.put(req, resp.clone());
          return resp;
        }))
      )
    );
    return;
  }

  // 导航请求：优先离线外壳，保证断网也能打开
  if (req.mode === "navigate") {
    event.respondWith(
      caches.match("./index.html").then((cached) => cached || fetch(req).catch(() => caches.match("./index.html")))
    );
    return;
  }

  // 静态资源：缓存优先，后台回填
  event.respondWith(
    caches.match(req).then((cached) => {
      if (cached) return cached;
      return fetch(req).then((resp) => {
        if (resp && resp.status === 200 && resp.type === "basic") {
          const copy = resp.clone();
          caches.open(CACHE).then((cache) => cache.put(req, copy)).catch(() => {});
        }
        return resp;
      }).catch(() => caches.match("./index.html"));
    })
  );
});

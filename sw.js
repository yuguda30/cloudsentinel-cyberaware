/* CloudSentinel CyberAware service worker.
   The region between BUILD markers is rewritten by `node scripts/build.mjs` (version hash + precache list).

   Strategies (chosen so a deployment is never hidden behind an old cached copy):
   - pages, scripts, styles, JSON  -> NETWORK FIRST (revalidated against the server), cache only as the offline fallback
   - fonts, icons, images          -> cache first (they are versioned by the cache name)
   One-time migration: if caches from the first release ("cyberaware-*") or the 2025 site are found, this worker
   activates immediately and reloads open tabs so nobody stays stuck on an old, broken copy. */
/*BUILD:START*/
const VERSION = '2afa53a650';
const PRECACHE = [ "./", "404.html", "assets/LICENSES.md", "assets/brand/cloudsentinel-logo-original.png", "assets/fonts/onest-latin-ext-wght-normal.woff2", "assets/fonts/onest-latin-wght-normal.woff2", "assets/fonts/onest-vietnamese-wght-normal.woff2", "assets/icons/apple-touch-icon.png", "assets/icons/favicon-48.png", "assets/icons/icon-192.png", "assets/icons/icon-512.png", "assets/icons/icon-maskable-512.png", "assets/icons/sprite.svg", "assets/img/hero-shield.svg", "assets/img/logo.png", "css/base.css", "css/components.css", "css/layout.css", "css/pages.css", "css/tokens.css", "data/chatbot/faq.ha.json", "data/chatbot/faq.ig.json", "data/chatbot/faq.yo.json", "data/chatbot/kb-extra.json", "data/chatbot/knowledge-base.json", "data/content/articles.json", "data/content/config.json", "data/content/questions.json", "data/content/team.json", "data/content/tips.json", "data/content/topics.json", "data/content/videos.json", "data/i18n/_status.json", "data/i18n/content.ha.json", "data/i18n/content.ig.json", "data/i18n/content.yo.json", "data/i18n/en.json", "data/i18n/ha.json", "data/i18n/ig.json", "data/i18n/yo.json", "index.html", "js/app.js", "js/boot-guard.js", "js/chat/engine.js", "js/core/data.js", "js/core/i18n.js", "js/core/pwa.js", "js/core/router.js", "js/core/search.js", "js/core/theme.js", "js/core/videos.js", "js/pages/about.js", "js/pages/article.js", "js/pages/articles.js", "js/pages/chat.js", "js/pages/contact.js", "js/pages/home.js", "js/pages/learn.js", "js/pages/legal.js", "js/pages/more.js", "js/pages/quiz.js", "js/pages/saved.js", "js/pages/search.js", "js/pages/states.js", "js/pages/team.js", "js/pages/tips.js", "js/pages/topic.js", "js/pages/videos.js", "js/quiz/engine.js", "js/theme-init.js", "js/ui/cards.js", "js/ui/layout.js", "js/ui/miniquiz.js", "js/ui/motion.js", "js/ui/newsletter.js", "js/ui/spotflags.js", "js/util/dom.js", "js/util/format.js", "js/util/net.js", "js/util/share.js", "js/util/storage.js", "manifest.webmanifest", "offline.html", "robots.txt", "version.json" ];
/*BUILD:END*/
const PREFIX = 'cs2-';
const CACHE = PREFIX + VERSION;
const LEGACY = /^(cyberaware-|cyber-awareness-)/;
const NETWORK_TIMEOUT = 4000;
const scope = self.registration.scope;
const abs = (p) => new URL(p, scope).href;

self.addEventListener('install', (event) => {
  event.waitUntil((async () => {
    const cache = await caches.open(CACHE);
    // Fetch each file individually so one missing file can't block the whole install.
    await Promise.all(PRECACHE.map(async (p) => {
      try { const res = await fetch(abs(p), { cache: 'reload' }); if (res.ok) await cache.put(abs(p), res); } catch (e) { /* cached at runtime instead */ }
    }));
    if ((await caches.keys()).some((n) => LEGACY.test(n))) await self.skipWaiting();   // migrate from the old release at once
  })());
  // Otherwise no skipWaiting(): the page offers a "Refresh" button (see core/pwa.js).
});

self.addEventListener('activate', (event) => {
  event.waitUntil((async () => {
    const names = await caches.keys();
    const migrating = names.some((n) => LEGACY.test(n));
    await Promise.all(names.filter((n) => n !== CACHE && (n.startsWith(PREFIX) || LEGACY.test(n))).map((n) => caches.delete(n)));
    await self.clients.claim();
    if (migrating) {
      const wins = await self.clients.matchAll({ type: 'window' });
      wins.forEach((c) => { try { c.navigate(c.url); } catch (e) { /* ignore */ } });
    }
  })());
});

self.addEventListener('message', (event) => { if (event.data && event.data.type === 'SKIP_WAITING') self.skipWaiting(); });

async function networkFirst(request, cacheKey) {
  const cache = await caches.open(CACHE);
  const cached = await cache.match(cacheKey || request, { ignoreSearch: true });
  const go = async () => {
    const res = await fetch(cacheKey ? new Request(cacheKey) : request, { cache: 'no-cache' });
    if (res.ok && res.type === 'basic') cache.put(cacheKey || request, res.clone());
    return res;
  };
  if (!cached) return go();                                 // nothing to fall back to: just wait for the network
  try {
    const res = await Promise.race([go(), new Promise((_, rej) => setTimeout(() => rej(new Error('timeout')), NETWORK_TIMEOUT))]);
    return res.ok ? res : cached;                           // server error or 404: prefer the saved copy
  } catch (e) { return cached; }                            // offline or slow: saved copy
}
async function cacheFirst(request) {
  const cache = await caches.open(CACHE);
  const hit = await cache.match(request, { ignoreSearch: true });
  if (hit) return hit;
  const res = await fetch(request);
  if (res.ok && res.type === 'basic') cache.put(request, res.clone());
  return res;
}

self.addEventListener('fetch', (event) => {
  const req = event.request;
  if (req.method !== 'GET') return;
  const url = new URL(req.url);
  if (url.origin !== location.origin) return;               // never touch YouTube or other third parties
  if (req.mode === 'navigate') {
    event.respondWith(networkFirst(req, abs('index.html')).catch(async () => (await (await caches.open(CACHE)).match(abs('offline.html'))) || Response.error()));
    return;
  }
  if (/\.(?:js|mjs|css|json|html|webmanifest|svg)$/.test(url.pathname)) { event.respondWith(networkFirst(req).catch(() => Response.error())); return; }
  event.respondWith(cacheFirst(req).catch(() => Response.error()));
});

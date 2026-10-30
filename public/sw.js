/* Caches the large in-browser runtimes (Pyodide, CheerpJ, tools.jar) after their first download,
   so later sessions start faster and work offline. Range requests (used by CheerpJ for jar chunks)
   are passed through untouched; the browser HTTP cache handles those. */
const CACHE = 'dsaforge-runtimes-v1';
const CACHEABLE = [/^https:\/\/cdn\.jsdelivr\.net\/pyodide\//, /^https:\/\/cjrtnc\.leaningtech\.com\//, /\/tools\.jar$/, /\/cheerpj\/dsaloader\.jar$/];

self.addEventListener('install', () => self.skipWaiting());
self.addEventListener('activate', (e) => e.waitUntil(self.clients.claim()));

self.addEventListener('fetch', (event) => {
  const req = event.request;
  if (req.method !== 'GET' || req.headers.has('range')) return;
  if (!CACHEABLE.some((re) => re.test(req.url))) return;
  event.respondWith((async () => {
    const cache = await caches.open(CACHE);
    const hit = await cache.match(req);
    if (hit) return hit;
    const res = await fetch(req);
    if (res.ok && res.status === 200) cache.put(req, res.clone());
    return res;
  })());
});

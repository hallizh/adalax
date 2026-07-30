/*
 * Þjónustuvinna: geymir umgjörð appsins og kortamyndirnar svo leiðarvísirinn
 * opnist á bakkanum þótt sambandið sé farið.
 *
 * Kortaflísar raunkortsins eru EKKI geymdar — þær koma af utanaðkomandi
 * þjónustu og eru of stórar til að hlaða niður fyrirfram. Handteiknuðu kortin,
 * veiðistaðirnir og mælingarnar virka áfram án sambands.
 */

const CACHE = 'adalax-v1';

const SHELL = [
  '.',
  'index.html',
  'manifest.webmanifest',
  'assets/css/app.css',
  'assets/js/app.js',
  'assets/js/data.js',
  'assets/js/store.js',
  'assets/js/geo.js',
  'assets/js/zonemap.js',
  'assets/js/realmap.js',
  'assets/icon.svg',
  'vendor/leaflet/leaflet.js',
  'vendor/leaflet/leaflet.css',
  'maps/svaedi-1.jpg',
  'maps/svaedi-2.jpg',
  'maps/svaedi-3.jpg',
  'maps/svaedi-4.jpg',
  'maps/svaedi-5.jpg',
  'maps/svaedi-6.jpg',
  'maps/skiptingar.jpg',
];

self.addEventListener('install', (event) => {
  event.waitUntil(
    caches
      .open(CACHE)
      .then((cache) => cache.addAll(SHELL))
      .then(() => self.skipWaiting()),
  );
});

self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches
      .keys()
      .then((keys) => Promise.all(keys.filter((k) => k !== CACHE).map((k) => caches.delete(k))))
      .then(() => self.clients.claim()),
  );
});

self.addEventListener('fetch', (event) => {
  const { request } = event;
  if (request.method !== 'GET') return;

  const url = new URL(request.url);
  // Kortaflísar fara beint á netið; það þýðir ekkert að geyma þær hér.
  if (url.origin !== self.location.origin) return;

  event.respondWith(
    caches.match(request, { ignoreSearch: true }).then((hit) => {
      if (hit) return hit;
      return fetch(request)
        .then((response) => {
          if (response.ok && response.type === 'basic') {
            const copy = response.clone();
            caches.open(CACHE).then((cache) => cache.put(request, copy));
          }
          return response;
        })
        .catch(() => caches.match('index.html'));
    }),
  );
});

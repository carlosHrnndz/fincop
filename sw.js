const CACHE_NAME = 'finanzas-quiz-v2';
const ASSETS = [
    './',
    './index.html',
    './css/style.css',
    './js/app.js',
    './manifest.json',
    './icon-192.png',
    './icon-512.png',
    './data/questions_index.json',
    'https://fonts.googleapis.com/css2?family=Outfit:wght@300;400;500;600;700&family=JetBrains+Mono:wght@400;600&display=swap',
    'https://cdn.jsdelivr.net/npm/katex@0.16.8/dist/katex.min.css',
    'https://cdn.jsdelivr.net/npm/katex@0.16.8/dist/katex.min.js',
    'https://cdn.jsdelivr.net/npm/katex@0.16.8/dist/contrib/auto-render.min.js',
    'https://cdn.jsdelivr.net/npm/canvas-confetti@1.6.0/dist/confetti.browser.min.js'
];

self.addEventListener('install', e => {
    e.waitUntil(
        caches.open(CACHE_NAME).then(cache => cache.addAll(ASSETS)).catch(() => {})
    );
    self.skipWaiting();
});

self.addEventListener('activate', e => {
    e.waitUntil(
        caches.keys().then(keys =>
            Promise.all(keys.filter(k => k !== CACHE_NAME).map(k => caches.delete(k)))
        )
    );
    self.clients.claim();
});

self.addEventListener('fetch', e => {
    e.respondWith(
        caches.match(e.request).then(cached => cached || fetch(e.request).catch(() => cached))
    );
});

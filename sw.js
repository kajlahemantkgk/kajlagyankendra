const CACHE_NAME = 'kgk-online-v1';
const ASSETS_TO_CACHE = [
    '/',
    '/index.html',
    '/style.css',
    '/quiz.js',
    '/manifest.json',
    '/icon-192.png',
    '/icon-512.png'
];

// 1. Service Worker Install करना और फाइलों को सुरक्षित (Cache) करना
self.addEventListener('install', (event) => {
    event.waitUntil(
        caches.open(CACHE_NAME).then((cache) => {
            console.log('Caching essential assets');
            return cache.addAll(ASSETS_TO_CACHE);
        })
    );
});

// 2. पुराने कैश को हटाना (जब आप ऐप अपडेट करें)
self.addEventListener('activate', (event) => {
    event.waitUntil(
        caches.keys().then((keys) => {
            return Promise.all(
                keys.filter((key) => key !== CACHE_NAME)
                    .map((key) => caches.delete(key))
            );
        })
    );
});

// 3. ऑफलाइन होने पर भी फाइलें लोड करना
self.addEventListener('fetch', (event) => {
    event.respondWith(
        caches.match(event.request).then((response) => {
            // अगर फाइल कैश में है तो उसे दें, वरना नेटवर्क से लाएं
            return response || fetch(event.request);
        }).catch(() => {
            // अगर नेटवर्क नहीं है और फाइल कैश में भी नहीं है (जैसे कोई नया पेज)
            return caches.match('/index.html');
        })
    );
});

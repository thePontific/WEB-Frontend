// service-worker.js - улучшенная версия
const CACHE_NAME = 'galaxy-app-v1';
const urlsToCache = [
  '/WEB-Frontend/',
  '/WEB-Frontend/index.html',
  '/WEB-Frontend/static/js/bundle.js',
  '/WEB-Frontend/static/css/main.css',
  // добавьте другие важные ресурсы
];

self.addEventListener('install', event => {
  console.log('Service Worker installing...');
  event.waitUntil(
    caches.open(CACHE_NAME)
      .then(cache => {
        return cache.addAll(urlsToCache);
      })
  );
});

self.addEventListener('fetch', event => {
  event.respondWith(
    caches.match(event.request)
      .then(response => {
        // Возвращаем кэшированную версию или делаем запрос
        return response || fetch(event.request);
      })
  );
});
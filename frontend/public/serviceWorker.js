self.addEventListener('fetch', event => {
  console.log("Fetch intercepted for:", event.request.url);
  event.respondWith(fetch(event.request));
});
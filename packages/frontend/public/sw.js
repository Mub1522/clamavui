// Minimal service worker — required for PWA installability
// No caching: all requests go to the network (this is a local app)
self.addEventListener('fetch', (event) => {
  event.respondWith(fetch(event.request))
})

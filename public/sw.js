const cacheName = 'V1'

const cacheItems = [

    '/index.html',
    '/app.js',
    '/style.css',
    'https://fonts.googleapis.com/css2?family=Open+Sans:wght@500&display=swap'

]


self.addEventListener('install', function (event) {
    console.log('SW Installed');
    event.waitUntil(
        caches.open(cacheName)
            .then(cache => {
                console.log("SW Caching Files");
                cache.addAll(cacheItems);

            })
            .then(() => self.skipWaiting())
    );
});

self.addEventListener('activate', function (event) {
    console.log('SW Activated');
    event.waitUntil(
        caches.keys().map(cache => {
            if (cache !== cacheName) {
                console.log("SW Clearing Old Cache");
                return caches.delete(cache);
            }
        })
    );
});


self.addEventListener('fetch', function (event) {
    console.log('SW Fetching');

    event.respondWith(fetch(event.request).catch(() => {
        catches.match(event.request)
    }))
});


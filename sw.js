const CACHE_NAME = "sidra-store-v1";

const APP_SHELL = [
    "./",
    "./index.html",
    "./manifest.json"
];

self.addEventListener("install", event => {

    event.waitUntil(
        caches
            .open(CACHE_NAME)
            .then(cache => cache.addAll(APP_SHELL))
            .then(() => self.skipWaiting())
    );

});


self.addEventListener("activate", event => {

    event.waitUntil(

        caches.keys().then(keys => {

            return Promise.all(

                keys
                    .filter(key => key !== CACHE_NAME)
                    .map(key => caches.delete(key))

            );

        })

    );

    self.clients.claim();

});


self.addEventListener("fetch", event => {

    if (event.request.method !== "GET") {
        return;
    }

    const requestURL =
        new URL(
            event.request.url
        );

    /*
     * طلبات Google Sheets وواجهات API
     * لا نريد تخزينها في Cache.
     */
    if (
        requestURL.hostname.includes("googleapis.com") ||
        requestURL.hostname.includes("docs.google.com")
    ) {
        return;
    }

    event.respondWith(

        fetch(event.request)
            .then(response => {

                if (
                    !response ||
                    response.status !== 200 ||
                    response.type === "opaque"
                ) {
                    return response;
                }

                const cloned =
                    response.clone();

                caches
                    .open(CACHE_NAME)
                    .then(cache => {

                        cache.put(
                            event.request,
                            cloned
                        );

                    });

                return response;

            })
            .catch(() => {

                return caches.match(
                    event.request
                );

            })

    );

});

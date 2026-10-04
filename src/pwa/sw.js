/*
 * Terpaling Trader service worker.
 *
 * Built by the `service-worker` plugin in vite.config.js, which replaces
 * __BUILD_VERSION__ so every deployment produces a byte-different sw.js and
 * browsers pick up the update. Production only; not registered in `vite dev`.
 *
 * Caching is an allowlist. Only public, non-personal files are cached:
 *   - content-hashed build files under /assets/ (cache-first; immutable)
 *   - the offline page, manifest and icons (precached per version)
 * Everything else, including every HTML page, API call, auth, account,
 * subscription, payment and download request, goes straight to the network
 * and is never stored by this worker. Pages are network-first: when the
 * network is unavailable the offline page is shown, never a stale copy of an
 * app page or its data.
 */
const VERSION = '__BUILD_VERSION__';
const SHELL_CACHE = `tt-shell-${VERSION}`;
// Hashed file names never change content, so one cache is shared across
// versions: tabs still running the previous build can lazy-load its chunks.
const ASSET_CACHE = 'tt-assets';
const MAX_ASSETS = 150;
const OFFLINE_URL = '/offline.html';
const SHELL_FILES = [OFFLINE_URL, '/manifest.webmanifest', '/icons/icon-192.png', '/icons/icon-512.png'];

self.addEventListener('install', (event) => {
    event.waitUntil(
        (async () => {
            const cache = await caches.open(SHELL_CACHE);
            await Promise.all(
                SHELL_FILES.map(async (url) => {
                    const res = await fetch(url, { cache: 'reload' });
                    if (!res.ok) throw new Error(`Precache failed: ${url} (${res.status})`);
                    await cache.put(url, await clean(res));
                }),
            );
            // Safe to activate immediately: pages are never served from cache
            // and hashed assets are shared, so old and new workers behave alike.
            await self.skipWaiting();
        })(),
    );
});

self.addEventListener('activate', (event) => {
    event.waitUntil(
        (async () => {
            const keys = await caches.keys();
            await Promise.all(keys.filter((k) => k.startsWith('tt-shell-') && k !== SHELL_CACHE).map((k) => caches.delete(k)));
            if (self.registration.navigationPreload) await self.registration.navigationPreload.enable();
            await self.clients.claim();
        })(),
    );
});

self.addEventListener('fetch', (event) => {
    const { request } = event;
    if (request.method !== 'GET') return;

    const url = new URL(request.url);

    if (request.mode === 'navigate') {
        event.respondWith(networkFirstPage(event));
        return;
    }

    if (url.origin !== self.location.origin) return;

    if (url.pathname.startsWith('/assets/')) {
        event.respondWith(cacheFirstAsset(request));
    } else if (SHELL_FILES.includes(url.pathname)) {
        event.respondWith(caches.match(url.pathname, { cacheName: SHELL_CACHE }).then((hit) => hit ?? fetch(request)));
    }
    // Anything else: no respondWith, the browser handles it normally.
});

async function networkFirstPage(event) {
    try {
        return (await event.preloadResponse) ?? (await fetch(event.request));
    } catch {
        const offline = await caches.match(OFFLINE_URL, { cacheName: SHELL_CACHE });
        return offline ?? Response.error();
    }
}

async function cacheFirstAsset(request) {
    const cache = await caches.open(ASSET_CACHE);
    const hit = await cache.match(request);
    if (hit) return hit;

    const res = await fetch(request);
    if (isCacheable(res)) {
        await cache.put(request, res.clone());
        trim(cache);
    }
    return res;
}

// Only successful same-origin responses that are not HTML (an SPA host serves
// index.html for a missing file) and that the server allows to be stored.
function isCacheable(res) {
    if (!res.ok || res.type !== 'basic') return false;
    if ((res.headers.get('Content-Type') ?? '').includes('text/html')) return false;
    return !/no-store|private/i.test(res.headers.get('Cache-Control') ?? '');
}

async function trim(cache) {
    const keys = await cache.keys();
    await Promise.all(keys.slice(0, Math.max(0, keys.length - MAX_ASSETS)).map((k) => cache.delete(k)));
}

// A redirected response (e.g. Cloudflare's /offline.html -> /offline) cannot
// answer a navigation, so store a plain copy.
async function clean(res) {
    return res.redirected ? new Response(await res.blob(), { status: res.status, statusText: res.statusText, headers: res.headers }) : res;
}

/*
 * Web Push: ready for a future backend. Nothing subscribes yet, so these never
 * fire. To enable: subscribe with registration.pushManager.subscribe({
 * userVisibleOnly: true, applicationServerKey: <VAPID public key> }) after a
 * user gesture, send the subscription to the server, and push JSON like
 *   { "title": "...", "body": "...", "url": "/dashboard/notifications", "tag": "signal-123" }
 * Keep payloads free of sensitive data; they appear on the lock screen.
 */
self.addEventListener('push', (event) => {
    if (!event.data) return;
    let data;
    try {
        data = event.data.json();
    } catch {
        data = { body: event.data.text() };
    }
    event.waitUntil(
        self.registration.showNotification(data.title || 'Terpaling Trader', {
            body: data.body,
            tag: data.tag,
            icon: '/icons/icon-192.png',
            data: { url: sameOriginPath(data.url) },
        }),
    );
});

self.addEventListener('notificationclick', (event) => {
    event.notification.close();
    const target = new URL(event.notification.data?.url ?? '/', self.location.origin).href;
    event.waitUntil(
        (async () => {
            const windows = await self.clients.matchAll({ type: 'window', includeUncontrolled: true });
            const client = windows.find((c) => c.url.startsWith(self.location.origin));
            if (client) {
                await client.focus();
                return client.navigate(target);
            }
            return self.clients.openWindow(target);
        })(),
    );
});

// Notification links may only point inside the app.
function sameOriginPath(url) {
    try {
        const u = new URL(url, self.location.origin);
        return u.origin === self.location.origin ? u.pathname + u.search + u.hash : '/';
    } catch {
        return '/';
    }
}

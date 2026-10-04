/*
 * PWA client: service-worker registration, update detection and the install
 * prompt. State lives outside React because `beforeinstallprompt` can fire
 * before the app mounts; components read it through usePwa().
 */
import { useSyncExternalStore } from 'react';

const standaloneQuery = window.matchMedia('(display-mode: standalone)');
const isStandalone = () => standaloneQuery.matches || window.navigator.standalone === true;

/*
 * How this browser installs web apps, if at all:
 *   'prompt'       Chromium (Chrome, Edge, Samsung Internet…) gave us beforeinstallprompt
 *   'ios'          iPhone / iPad: Share → Add to Home Screen
 *   'macos-safari' Safari 17+ on macOS: File → Add to Dock
 *   null           installed already, or no install support (e.g. Firefox desktop)
 */
const ua = navigator.userAgent;
const isIos = /iPhone|iPad|iPod/.test(ua) || (navigator.platform === 'MacIntel' && navigator.maxTouchPoints > 1);
const isMacSafari = !isIos && /Macintosh/.test(ua) && /Safari\//.test(ua) && !/Chrome|Chromium|CriOS|Edg|OPR|Firefox/.test(ua) && Number(ua.match(/Version\/(\d+)/)?.[1]) >= 17;

let state = { installed: isStandalone(), promptEvent: null, guide: null, updateReady: false };
const listeners = new Set();

function set(patch) {
    state = { ...state, ...patch };
    listeners.forEach((l) => l());
}

window.addEventListener('beforeinstallprompt', (e) => {
    e.preventDefault(); // no automatic mini-infobar; offered from the menus instead
    set({ promptEvent: e });
});
window.addEventListener('appinstalled', () => set({ installed: true, promptEvent: null }));
standaloneQuery.addEventListener('change', () => set({ installed: isStandalone() }));

function installMethod(s) {
    if (s.installed) return null;
    if (s.promptEvent) return 'prompt';
    if (isIos) return 'ios';
    if (isMacSafari) return 'macos-safari';
    return null;
}

async function install() {
    const method = installMethod(state);
    if (method === 'prompt') {
        const e = state.promptEvent;
        set({ promptEvent: null }); // a prompt event can only be used once
        try {
            await e.prompt();
            await e.userChoice; // 'accepted' triggers appinstalled
        } catch {
            set({ promptEvent: e }); // not shown (e.g. no user gesture); keep the offer
        }
    } else if (method) {
        set({ guide: method });
    }
}

const actions = {
    install,
    closeGuide: () => set({ guide: null }),
    dismissUpdate: () => set({ updateReady: false }),
    reload: () => window.location.reload(),
};

export function usePwa() {
    const s = useSyncExternalStore(
        (l) => (listeners.add(l), () => listeners.delete(l)),
        () => state,
    );
    return { ...s, installMethod: installMethod(s), ...actions };
}

/*
 * Production only: `vite dev` serves no sw.js and must not be cached.
 * updateViaCache 'none' makes the browser fetch sw.js from the server on every
 * update check, so a deployment is noticed on the next visit. Long-lived
 * sessions (an installed app left open) also check when they return to the
 * foreground, at most once an hour.
 */
export function registerServiceWorker() {
    if (!import.meta.env.PROD || !('serviceWorker' in navigator)) return;

    window.addEventListener('load', async () => {
        let registration;
        try {
            registration = await navigator.serviceWorker.register('/sw.js', { scope: '/', updateViaCache: 'none' });
        } catch (err) {
            console.warn('Service worker registration failed:', err);
            return;
        }

        // A new worker taking over an already-controlled page means a new
        // version was deployed. Offer a refresh rather than forcing one, so
        // nobody loses what they were typing.
        const hadController = !!navigator.serviceWorker.controller;
        navigator.serviceWorker.addEventListener('controllerchange', () => {
            if (hadController) set({ updateReady: true });
        });

        let lastCheck = Date.now();
        document.addEventListener('visibilitychange', () => {
            if (document.visibilityState !== 'visible' || Date.now() - lastCheck < 60 * 60 * 1000) return;
            lastCheck = Date.now();
            registration.update().catch(() => {});
        });
    });
}

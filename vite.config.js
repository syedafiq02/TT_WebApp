import { createHash } from 'node:crypto';
import { readFileSync } from 'node:fs';
import tailwindcss from '@tailwindcss/vite';
import react from '@vitejs/plugin-react';
import prefixer from 'postcss-prefix-selector';
import { defineConfig } from 'vite';

/*
 * The landing page stylesheet (src/styles/landing.css) is the original
 * Laravel landing CSS, kept verbatim. It was written for a standalone page,
 * so its global rules (:root, html, body, h1, svg, .btn …) are scoped to the
 * `.lp` wrapper at build time and cannot leak into the dashboard pages.
 */
const scopeLandingCss = prefixer({
    prefix: '.lp',
    includeFiles: [/landing\.css$/],
    transform(prefix, selector, prefixedSelector) {
        if (/^(:root|html|body)$/.test(selector)) return prefix;
        return prefixedSelector;
    },
});

/*
 * Emits dist/sw.js from src/pwa/sw.js with a build version derived from the
 * hashed bundle file names and the PWA's public files, so each deployment
 * that changes the app ships a new service worker (see src/pwa/index.js).
 */
function serviceWorker() {
    const read = (path) => readFileSync(new URL(path, import.meta.url), 'utf8');
    return {
        name: 'service-worker',
        apply: 'build',
        generateBundle(_, bundle) {
            const source = read('./src/pwa/sw.js');
            const version = createHash('sha256')
                .update(Object.keys(bundle).sort().join('\n'))
                .update(source)
                .update(read('./public/offline.html'))
                .update(read('./public/manifest.webmanifest'))
                .digest('hex')
                .slice(0, 12);
            this.emitFile({ type: 'asset', fileName: 'sw.js', source: source.replace(`'__BUILD_VERSION__'`, `'${version}'`) });
        },
    };
}

export default defineConfig({
    plugins: [react(), tailwindcss(), serviceWorker()],
    css: {
        postcss: { plugins: [scopeLandingCss] },
    },
});

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

export default defineConfig({
    plugins: [react(), tailwindcss()],
    css: {
        postcss: { plugins: [scopeLandingCss] },
    },
});

/*
 * Generates the PWA / home-screen icons in public/icons/ with headless Chrome.
 *
 *   node scripts/generate-pwa-icons.mjs                     # "TT" placeholder mark (AppLogoIcon)
 *   node scripts/generate-pwa-icons.mjs --logo logo.svg     # the real logo, centred on the brand colour
 *   node scripts/generate-pwa-icons.mjs --logo logo.png --bg "#ffffff"
 *
 * Chrome or Edge must be installed; set CHROME_PATH if it is not found.
 * When the final Terpaling Trader logo is ready, run this with --logo and
 * commit the regenerated PNGs. No other file needs to change.
 */
import { execFileSync } from 'node:child_process';
import { existsSync, mkdirSync, mkdtempSync, readFileSync, rmSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { extname, join, resolve } from 'node:path';
import { parseArgs } from 'node:util';

const { values: args } = parseArgs({
    options: {
        logo: { type: 'string' },
        bg: { type: 'string', default: '#2563eb' }, // --color-brand
    },
});

const OUT = resolve(import.meta.dirname, '../public/icons');

/*
 * kind "any":      rounded tile with a little transparent margin (desktop, Android launcher fallback)
 * kind "maskable": full-bleed square, artwork inside the central 80% safe zone (Android adaptive icons)
 * kind "apple":    full-bleed square, no transparency (iOS applies its own rounded mask)
 */
const ICONS = [
    { file: 'icon-192.png', size: 192, kind: 'any' },
    { file: 'icon-512.png', size: 512, kind: 'any' },
    { file: 'icon-maskable-192.png', size: 192, kind: 'maskable' },
    { file: 'icon-maskable-512.png', size: 512, kind: 'maskable' },
    { file: 'apple-touch-icon.png', size: 180, kind: 'apple' },
];

function findChrome() {
    const candidates = [
        process.env.CHROME_PATH,
        'C:/Program Files/Google/Chrome/Application/chrome.exe',
        'C:/Program Files (x86)/Microsoft/Edge/Application/msedge.exe',
        '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome',
        '/usr/bin/google-chrome',
        '/usr/bin/chromium',
    ];
    const found = candidates.find((p) => p && existsSync(p));
    if (!found) throw new Error('Chrome/Edge not found. Set CHROME_PATH.');
    return found;
}

function logoDataUrl(path) {
    const mime = { '.svg': 'image/svg+xml', '.png': 'image/png', '.jpg': 'image/jpeg', '.jpeg': 'image/jpeg', '.webp': 'image/webp' }[extname(path).toLowerCase()];
    if (!mime) throw new Error(`Unsupported logo format: ${path}`);
    return `data:${mime};base64,${readFileSync(path).toString('base64')}`;
}

function html({ size, kind }) {
    const tile = kind === 'any' ? Math.round(size * 0.88) : size;
    const radius = kind === 'any' ? Math.round(tile * 0.22) : 0;
    const art = kind === 'maskable' ? 0.8 : kind === 'apple' ? 0.86 : 1; // share of the tile the artwork may use
    const mark = args.logo
        ? `<img src="${logoDataUrl(resolve(args.logo))}" style="width:${Math.round(tile * art * 0.72)}px;height:${Math.round(tile * art * 0.72)}px;object-fit:contain">`
        : `<span style="font:700 ${Math.round(tile * art * 0.36)}px/1 Inter,'Segoe UI',system-ui,sans-serif;letter-spacing:-0.02em;color:#fff">TT</span>`;
    return `<!doctype html><html><head>
<link rel="stylesheet" href="https://fonts.googleapis.com/css2?family=Inter:wght@700&display=block">
<style>html,body{margin:0;width:${size}px;height:${size}px;background:transparent;overflow:hidden}
body{display:grid;place-items:center}
.tile{width:${tile}px;height:${tile}px;border-radius:${radius}px;background:${args.bg};display:grid;place-items:center;
box-shadow:${kind === 'any' ? `inset 0 -${Math.max(1, Math.round(tile / 32))}px 0 rgb(0 0 0/.12)` : 'none'}}</style>
</head><body><div class="tile">${mark}</div></body></html>`;
}

const chrome = findChrome();
const tmp = mkdtempSync(join(tmpdir(), 'tt-icons-'));
mkdirSync(OUT, { recursive: true });

try {
    for (const icon of ICONS) {
        const page = join(tmp, `${icon.file}.html`);
        writeFileSync(page, html(icon));
        execFileSync(chrome, [
            '--headless=new',
            '--disable-gpu',
            '--hide-scrollbars',
            '--force-device-scale-factor=1',
            '--default-background-color=00000000',
            '--virtual-time-budget=8000',
            `--window-size=${icon.size},${icon.size}`,
            `--screenshot=${join(OUT, icon.file)}`,
            `file:///${page.replace(/\\/g, '/')}`,
        ], { stdio: 'ignore' });
        console.log(`public/icons/${icon.file} (${icon.size}x${icon.size}, ${icon.kind})`);
    }
} finally {
    rmSync(tmp, { recursive: true, force: true });
}

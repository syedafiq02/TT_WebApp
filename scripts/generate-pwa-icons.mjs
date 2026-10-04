/*
 * Generates the PWA / home-screen icons in public/icons/ and the favicons in
 * public/ with headless Chrome, from the Terpaling Trader logo.
 *
 *   node scripts/generate-pwa-icons.mjs                     # src/assets/logo.png, centred on the brand colour
 *   node scripts/generate-pwa-icons.mjs --logo logo.png --bg "#ffffff"
 *
 * The logo is white on transparent, so it is placed on a brand-coloured tile.
 * It is only scaled proportionally (object-fit: contain), never recoloured.
 * The untouched master artwork is brand/terpaling-trader-logo.png;
 * src/assets/logo.png is the same artwork trimmed to its bounds.
 *
 * Chrome or Edge must be installed; set CHROME_PATH if it is not found.
 */
import { execFileSync } from 'node:child_process';
import { copyFileSync, existsSync, mkdirSync, mkdtempSync, readFileSync, rmSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { extname, join, resolve } from 'node:path';
import { parseArgs } from 'node:util';

const { values: args } = parseArgs({
    options: {
        logo: { type: 'string', default: resolve(import.meta.dirname, '../src/assets/logo.png') },
        bg: { type: 'string', default: '#2563eb' }, // --color-brand
    },
});

const PUBLIC = resolve(import.meta.dirname, '../public');
const OUT = join(PUBLIC, 'icons');

/*
 * kind "any":      rounded tile with a little transparent margin (desktop, Android launcher fallback)
 * kind "maskable": full-bleed square, artwork inside the central 80% safe zone (Android adaptive icons)
 * kind "apple":    full-bleed square, no transparency (iOS applies its own rounded mask)
 * kind "favicon":  rounded tile filling the canvas, artwork as large as legibility allows (browser tabs)
 */
const ICONS = [
    { file: 'icon-192.png', size: 192, kind: 'any' },
    { file: 'icon-512.png', size: 512, kind: 'any' },
    { file: 'icon-maskable-192.png', size: 192, kind: 'maskable' },
    { file: 'icon-maskable-512.png', size: 512, kind: 'maskable' },
    { file: 'apple-touch-icon.png', size: 180, kind: 'apple' },
];
const FAVICON_SIZES = [16, 32, 48];

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
    const radius = kind === 'any' || kind === 'favicon' ? Math.round(tile * 0.22) : 0;
    const art = { maskable: 0.8, apple: 0.86, favicon: 1.15 }[kind] ?? 1; // share of the tile the artwork may use
    const box = Math.round(tile * art * 0.72);
    return `<!doctype html><html><head>
<style>html,body{margin:0;width:${size}px;height:${size}px;background:transparent;overflow:hidden}
body{display:grid;place-items:center}
.tile{width:${tile}px;height:${tile}px;border-radius:${radius}px;background:${args.bg};display:grid;place-items:center;
box-shadow:${kind === 'any' ? `inset 0 -${Math.max(1, Math.round(tile / 32))}px 0 rgb(0 0 0/.12)` : 'none'}}
img{width:${box}px;height:${box}px;object-fit:contain}</style>
</head><body><div class="tile"><img src="${logoDataUrl(resolve(args.logo))}" alt=""></div></body></html>`;
}

/* A .ico holding PNG images (supported by every current browser). */
function ico(pngs) {
    const header = Buffer.alloc(6 + 16 * pngs.length);
    header.writeUInt16LE(1, 2); // type: icon
    header.writeUInt16LE(pngs.length, 4);
    let offset = header.length;
    pngs.forEach(({ size, data }, i) => {
        const at = 6 + 16 * i;
        header.writeUInt8(size % 256, at);
        header.writeUInt8(size % 256, at + 1);
        header.writeUInt16LE(1, at + 4); // colour planes
        header.writeUInt16LE(32, at + 6); // bits per pixel
        header.writeUInt32LE(data.length, at + 8);
        header.writeUInt32LE(offset, at + 12);
        offset += data.length;
    });
    return Buffer.concat([header, ...pngs.map((p) => p.data)]);
}

const chrome = findChrome();
const tmp = mkdtempSync(join(tmpdir(), 'tt-icons-'));
mkdirSync(OUT, { recursive: true });

function render(icon, target) {
    const page = join(tmp, `${icon.kind}-${icon.size}.html`);
    writeFileSync(page, html(icon));
    execFileSync(chrome, [
        '--headless=new',
        '--disable-gpu',
        '--hide-scrollbars',
        '--force-device-scale-factor=1',
        '--default-background-color=00000000',
        '--virtual-time-budget=8000',
        `--window-size=${icon.size},${icon.size}`,
        `--screenshot=${target}`,
        `file:///${page.replace(/\\/g, '/')}`,
    ], { stdio: 'ignore' });
}

try {
    for (const icon of ICONS) {
        render(icon, join(OUT, icon.file));
        console.log(`public/icons/${icon.file} (${icon.size}x${icon.size}, ${icon.kind})`);
    }

    // Conventional root path some clients request without reading <link rel="apple-touch-icon">.
    copyFileSync(join(OUT, 'apple-touch-icon.png'), join(PUBLIC, 'apple-touch-icon.png'));
    console.log('public/apple-touch-icon.png (copy of icons/apple-touch-icon.png)');

    const pngs = FAVICON_SIZES.map((size) => {
        const target = join(tmp, `favicon-${size}.png`);
        render({ size, kind: 'favicon' }, target);
        return { size, data: readFileSync(target) };
    });
    writeFileSync(join(PUBLIC, 'favicon.ico'), ico(pngs));
    console.log(`public/favicon.ico (${FAVICON_SIZES.map((s) => `${s}x${s}`).join(', ')})`);
} finally {
    rmSync(tmp, { recursive: true, force: true });
}

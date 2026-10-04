/*
 * Formatting helpers. Mirrors App\Support\Money (integer minor units, never
 * floats) and the Carbon date formats used across the Blade views.
 */

const SYMBOLS = { MYR: 'RM', USD: 'US$', SGD: 'S$' };

export const CURRENCY = 'MYR';
export const PLATFORM_FEE_BPS = 1500;
export const EARNING_HOLD_DAYS = 14;
export const MINIMUM_PAYOUT_MINOR = 10000;
export const DOWNLOAD_LINK_MINUTES = 5;
export const MAX_UPLOAD_KB = 51200;
export const FILE_EXTENSIONS = ['ex4', 'ex5', 'mq4', 'mq5', 'set', 'tpl', 'zip', 'pdf', 'txt', 'csv', 'xlsx', 'docx', 'png', 'jpg', 'jpeg'];

export function money(minor, currency = CURRENCY, decimals = true) {
    const symbol = SYMBOLS[currency] ?? currency;
    const value = (minor / 100).toLocaleString('en-US', {
        minimumFractionDigits: decimals ? 2 : 0,
        maximumFractionDigits: decimals ? 2 : 0,
    });
    return `${symbol} ${value}`;
}

/** Percentage of an amount in basis points, rounded half up (Money::bps). */
export function bps(minor, points) {
    return Math.floor((minor * points + 5000) / 10000);
}

const MONTHS = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
const DAYS = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

const toDate = (d) => (d instanceof Date ? d : new Date(d));
const pad = (n) => String(n).padStart(2, '0');

/** "j M Y" → 4 Oct 2026 */
export function fmtDate(d) {
    if (!d) return null;
    const x = toDate(d);
    return `${x.getDate()} ${MONTHS[x.getMonth()]} ${x.getFullYear()}`;
}

/** "j M" → 4 Oct */
export function fmtDay(d) {
    if (!d) return null;
    const x = toDate(d);
    return `${x.getDate()} ${MONTHS[x.getMonth()]}`;
}

/** "M Y" → Oct 2026 */
export function fmtMonthYear(d) {
    const x = toDate(d);
    return `${MONTHS[x.getMonth()]} ${x.getFullYear()}`;
}

/** "j M Y H:i" */
export function fmtDateTime(d) {
    if (!d) return null;
    const x = toDate(d);
    return `${fmtDate(x)} ${pad(x.getHours())}:${pad(x.getMinutes())}`;
}

/** "j M Y, H:i" */
export function fmtDateTimeComma(d) {
    if (!d) return null;
    const x = toDate(d);
    return `${fmtDate(x)}, ${pad(x.getHours())}:${pad(x.getMinutes())}`;
}

/** "D, j M Y · g:i A" */
export function fmtSession(d) {
    const x = toDate(d);
    const h = x.getHours() % 12 || 12;
    return `${DAYS[x.getDay()]}, ${fmtDate(x)} · ${h}:${pad(x.getMinutes())} ${x.getHours() < 12 ? 'AM' : 'PM'}`;
}

/** Carbon diffForHumans(), optionally in its short form. */
export function diffForHumans(d, short = false) {
    const seconds = Math.round((Date.now() - toDate(d).getTime()) / 1000);
    const future = seconds < 0;
    const abs = Math.abs(seconds);
    const units = [
        ['year', 'yr', 31536000],
        ['month', 'mo', 2592000],
        ['week', 'w', 604800],
        ['day', 'd', 86400],
        ['hour', 'h', 3600],
        ['minute', 'm', 60],
        ['second', 's', 1],
    ];
    for (const [long, abbr, size] of units) {
        if (abs >= size || size === 1) {
            const n = Math.max(1, Math.floor(abs / size));
            const label = short ? `${n}${abbr}` : `${n} ${long}${n === 1 ? '' : 's'}`;
            return future ? `${short ? '' : 'in '}${label}${short ? ' from now' : ''}` : `${label} ago`;
        }
    }
    return 'just now';
}

export function daysFromNow(days, hour = null, minute = 0) {
    const d = new Date();
    d.setDate(d.getDate() + days);
    if (hour !== null) d.setHours(hour, minute, 0, 0);
    return d.toISOString();
}

export function hoursAgo(hours) {
    return new Date(Date.now() - hours * 3600 * 1000).toISOString();
}

export function isFuture(d) {
    return d ? toDate(d).getTime() > Date.now() : false;
}

export function humanFileSize(bytes) {
    const units = ['B', 'KB', 'MB', 'GB'];
    let i = 0;
    let n = bytes;
    while (n >= 1024 && i < units.length - 1) {
        n /= 1024;
        i++;
    }
    return `${i === 0 ? n : n.toFixed(1)} ${units[i]}`;
}

export function plural(word, count) {
    if (count === 1) return word;
    if (word.endsWith('y') && !/[aeiou]y$/.test(word)) return word.slice(0, -1) + 'ies';
    return word + 's';
}

export function initials(name) {
    return name
        .trim()
        .split(/\s+/)
        .filter(Boolean)
        .slice(0, 2)
        .map((w) => w[0].toUpperCase())
        .join('');
}

/** User::initials(): first and last initial. */
export function userInitials(name) {
    const parts = name.trim().split(/\s+/).filter(Boolean);
    if (parts.length === 1) return parts[0][0].toUpperCase();
    return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
}

export function slugify(text) {
    return text
        .toLowerCase()
        .replace(/[^a-z0-9]+/g, '-')
        .replace(/^-+|-+$/g, '');
}

export function greeting() {
    const h = new Date().getHours();
    return h < 12 ? 'Good morning' : h < 18 ? 'Good afternoon' : 'Good evening';
}

export function cx(...parts) {
    return parts.filter(Boolean).join(' ');
}

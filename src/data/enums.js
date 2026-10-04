/*
 * Port of app/Enums/*: labels, tones (status badge colours), icons and the
 * service-type rules. Records store the plain string values.
 */
import { money } from '../utils/format';

const titleCase = (v) => v.replace(/_/g, ' ').replace(/\b\w/g, (c) => c.toUpperCase());

function toned(map) {
    return (value) => ({ value, label: titleCase(value), tone: map[value] ?? 'zinc' });
}

export const serviceStatus = toned({ published: 'green', pending_review: 'amber', rejected: 'red', suspended: 'red', draft: 'zinc', archived: 'zinc' });
export const subscriptionStatus = toned({ active: 'green', pending: 'amber', suspended: 'red', cancelled: 'red', expired: 'zinc' });
export const orderStatus = toned({ paid: 'green', pending: 'amber', failed: 'red', cancelled: 'red', refunded: 'zinc' });
export const paymentStatus = toned({ succeeded: 'green', pending: 'amber', failed: 'red', refunded: 'zinc' });
export const payoutStatus = toned({ paid: 'green', requested: 'amber', approved: 'amber', rejected: 'red' });
export const providerStatus = toned({ approved: 'green', pending: 'amber', rejected: 'red', suspended: 'red' });
export const bookingStatus = toned({ confirmed: 'green', completed: 'green', requested: 'amber', cancelled: 'red', no_show: 'red' });
export const reviewStatus = toned({ published: 'green', flagged: 'amber', hidden: 'zinc' });
export const contentStatus = toned({ published: 'green' });
export const planStatus = toned({ active: 'green' });
export const userStatus = toned({ active: 'green', suspended: 'red' });

export const SERVICE_STATUSES = ['draft', 'pending_review', 'published', 'rejected', 'suspended', 'archived'];
export const SUBSCRIPTION_STATUSES = ['pending', 'active', 'expired', 'cancelled', 'suspended'];
export const USER_ROLES = ['customer', 'provider', 'admin'];

export const earningLabel = (v) => titleCase(v);
export const billingTypeLabel = (v) => titleCase(v);

/* ---------------------------------------------------------- Service types */

export const SERVICE_TYPES = {
    academy: { label: 'Academy', icon: 'academic-cap', family: 'academy', defaults: ['content_access'] },
    mentorship: { label: 'Mentorship', icon: 'user-group', family: 'consultancy', defaults: ['booking_access'] },
    signals: { label: 'Signals', icon: 'signal', family: 'signals', defaults: ['signal_access'] },
    market_research: { label: 'Market Research', icon: 'document-text', family: 'signals', defaults: ['content_access'] },
    expert_advisor: { label: 'Expert Advisor (EA)', icon: 'cpu-chip', family: 'tools', defaults: ['download_access', 'license_access'] },
    indicator: { label: 'Indicator', icon: 'chart-bar', family: 'tools', defaults: ['download_access'] },
    trading_tool: { label: 'Trading Tool', icon: 'wrench-screwdriver', family: 'tools', defaults: ['download_access'] },
    consultancy: { label: 'Consultancy', icon: 'briefcase', family: 'consultancy', defaults: ['booking_access'] },
    technical_setup: { label: 'Technical Setup', icon: 'server-stack', family: 'consultancy', defaults: ['booking_access'] },
};

export const FAMILIES = { academy: 'Academy', signals: 'Signals & Research', tools: 'EA / Indicator', consultancy: 'Consultancy' };

export const typeLabel = (t) => SERVICE_TYPES[t]?.label ?? titleCase(t);
export const typeIcon = (t) => SERVICE_TYPES[t]?.icon ?? 'squares-2x2';

/** ServiceType::allowedEntitlements() */
export function allowedEntitlements(type) {
    const allowed = new Set([...SERVICE_TYPES[type].defaults, 'download_access', 'content_access', 'external_access', 'community_access']);
    if (['expert_advisor', 'indicator', 'trading_tool'].includes(type)) allowed.add('license_access');
    if (SERVICE_TYPES[type].family === 'consultancy') allowed.add('booking_access');
    return Object.keys(ENTITLEMENTS).filter((e) => allowed.has(e));
}

/** ServiceType::allowedBillingTypes() */
export const allowedBillingTypes = (type) => (type === 'signals' ? ['recurring'] : ['recurring', 'one_time']);

/* ----------------------------------------------------------- Entitlements */

export const ENTITLEMENTS = {
    download_access: { label: 'Downloads', icon: 'arrow-down-tray', description: 'Download the product files and documents from your dashboard.' },
    content_access: { label: 'Content & lessons', icon: 'academic-cap', description: 'Lessons, videos, articles and learning materials.' },
    signal_access: { label: 'Signal feed', icon: 'signal', description: 'Trade setups and market alerts in your dashboard feed.' },
    booking_access: { label: 'Bookings', icon: 'calendar', description: 'Book one-to-one sessions with the provider.' },
    external_access: { label: 'External access', icon: 'arrow-top-right-on-square', description: "Access to the provider's private channel or external platform." },
    community_access: { label: 'Community', icon: 'chat-bubble-left-right', description: 'A private community area for subscribers.' },
    license_access: { label: 'Licence key', icon: 'key', description: 'A licence key tied to your trading accounts.' },
};

/* -------------------------------------------------------------- Content */

export const CONTENT_TYPES = { lesson: 'Lesson', video: 'Video', article: 'Article', pdf: 'PDF', post: 'Post', signal: 'Signal' };
export const contentEntitlement = (type) => (type === 'signal' ? 'signal_access' : 'content_access');

/* ------------------------------------------------------- Plans and terms */

export const TERMS = { recurring: 'Subscription', fixed_term: 'Fixed-term access', lifetime: 'Lifetime purchase' };

const hasDuration = (p) => !!p.interval_unit && p.interval_count > 0;

/** ServicePlan::term() */
export function planTerm(p) {
    if (p.billing_type === 'recurring') return 'recurring';
    return hasDuration(p) ? 'fixed_term' : 'lifetime';
}

export const termLabel = (term) => TERMS[term];
export const termVerb = (term) => (term === 'recurring' ? 'Subscribe' : 'Purchase');

/** ServicePlan::termLabel() */
export function planTermLabel(p) {
    if (p.session_count) return p.session_count === 1 ? '1 session' : `${p.session_count} sessions`;
    if (!hasDuration(p)) return 'lifetime access';
    const span = p.interval_count === 1 ? p.interval_unit : `${p.interval_count} ${p.interval_unit}s`;
    return p.billing_type === 'recurring' ? `/ ${span}` : `for ${span}`;
}

export const planPrice = (p) => money(p.price_minor, p.currency);
export { hasDuration as planHasDuration };

/** ServicePlan::accessEndsAt() */
export function accessEndsAt(p, from = new Date()) {
    if (!hasDuration(p)) return null;
    const d = new Date(from);
    const n = p.interval_count;
    if (p.interval_unit === 'day') d.setDate(d.getDate() + n);
    if (p.interval_unit === 'week') d.setDate(d.getDate() + 7 * n);
    if (p.interval_unit === 'month') d.setMonth(d.getMonth() + n);
    if (p.interval_unit === 'year') d.setFullYear(d.getFullYear() + n);
    return d.toISOString();
}

/* ------------------------------------------------------------ Moderation */

export const FLAGGED_TERMS = ['guarantee', '100%', 'never lose', 'risk-free', 'risk free', 'sure profit'];

export const PROVIDER_DECLARATIONS = {
    no_guaranteed_returns: 'I will not advertise guaranteed profits, "100% accuracy", "never lose" or "risk-free" results.',
    full_results_disclosure: 'Where I show performance, I will publish complete results including losing trades.',
    risk_disclosure: 'I will display a risk disclosure and will not give personalised investment advice.',
    listing_review: 'I understand services are published only after platform review and can be removed for breaches.',
    identity_check: 'I consent to identity verification and a background review by the platform team.',
};

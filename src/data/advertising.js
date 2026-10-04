/*
 * Advertising module: placements, statuses, illustrative packages and mock
 * campaigns. Advertisers buy promotional placements only — nothing here is an
 * investment, and no impressions, clicks or results are promised.
 *
 * All advertisers below are fictional demo brands. Prices are illustrative
 * draft pricing, subject to administrator approval.
 */
import { daysFromNow } from '../utils/format';

/* ------------------------------------------------------------ Constants */

export const AD_PLACEMENTS = {
    featured_banner: {
        label: 'Featured Banner',
        icon: 'rectangle-group',
        description: 'A prominent banner on selected pages, suited to brand awareness and product launches.',
        where: 'Landing page, below the featured services',
    },
    sponsored_listing: {
        label: 'Sponsored Listing',
        icon: 'list-bullet',
        description: 'A clearly labelled sponsored card inside a relevant product section. Suited to indicators, EAs, trading tools and services.',
        where: 'Explore Services, below the search filters',
    },
    featured_brand: {
        label: 'Featured Brand',
        icon: 'building-office-2',
        description: 'A dedicated placement that introduces a business and its main offering.',
        where: 'Advertise page and selected public pages',
    },
    sponsored_announcement: {
        label: 'Sponsored Announcement',
        icon: 'megaphone',
        description: 'A promotional announcement or campaign in a designated community section of the trading hub.',
        where: 'Trader dashboard, community updates area',
    },
};

export const AD_CATEGORIES = {
    broker: 'Forex / CFD broker',
    prop_firm: 'Prop trading firm',
    trading_tools: 'Trading tools & software',
    indicators_eas: 'Indicators / EAs',
    education: 'Financial education',
    community: 'Trading community / signals',
    fintech: 'Financial technology',
    other: 'Other',
};

export const AD_OBJECTIVES = {
    brand_awareness: 'Brand awareness',
    product_launch: 'Product or service launch',
    event: 'Event or webinar promotion',
    community: 'Community growth',
    other: 'Other',
};

export const AD_DURATIONS = [7, 14, 30, 60, 90];

const titleCase = (v) => v.replace(/_/g, ' ').replace(/\b\w/g, (c) => c.toUpperCase());

const AD_STATUS_TONES = { draft: 'zinc', pending_review: 'amber', changes_requested: 'amber', approved: 'blue', rejected: 'red', scheduled: 'blue', active: 'green', completed: 'zinc', cancelled: 'red' };
const AD_PAYMENT_TONES = { not_required: 'zinc', awaiting_payment: 'amber', paid: 'green', refunded: 'zinc' };

export const AD_STATUSES = Object.keys(AD_STATUS_TONES);
export const AD_PAYMENT_STATUSES = Object.keys(AD_PAYMENT_TONES);

export const adStatus = (value) => ({ value, label: titleCase(value), tone: AD_STATUS_TONES[value] ?? 'zinc' });
export const adPaymentStatus = (value) => ({ value, label: titleCase(value), tone: AD_PAYMENT_TONES[value] ?? 'zinc' });

/** Statuses that count as an application still being decided. */
export const AD_REVIEW_STATUSES = ['pending_review', 'changes_requested'];
/** Statuses that count as a campaign (application accepted). */
export const AD_CAMPAIGN_STATUSES = ['approved', 'scheduled', 'active', 'completed', 'cancelled'];
/** Statuses the advertiser may still withdraw from (nothing paid or live yet). */
export const AD_WITHDRAWABLE = ['draft', 'pending_review', 'changes_requested', 'approved'];

export function addDays(iso, days) {
    const d = new Date(iso);
    d.setDate(d.getDate() + Number(days));
    return d.toISOString();
}

/** yyyy-mm-dd for <input type="date">. */
export const toDateInput = (iso) => (iso ? new Date(iso).toISOString().slice(0, 10) : '');

/** Active campaigns for one placement, i.e. the sponsored content shown on the site. */
export function liveAds(db, placement) {
    const now = Date.now();
    return (db.adCampaigns ?? []).filter(
        (c) => c.placement === placement && c.status === 'active' && ['paid', 'not_required'].includes(c.payment_status) && new Date(c.start_date) <= now && new Date(c.end_date) >= now,
    );
}

/* -------------------------------------------------------------- Packages */

export const AD_PACKAGES = [
    {
        id: 1,
        name: 'Starter',
        description: 'A focused first campaign for a single product or service.',
        placements: ['sponsored_listing'],
        duration_days: 14,
        price_minor: 45000,
        features: ['One sponsored listing in Explore Services', 'Clearly labelled "Sponsored" card', 'One creative, reviewed before publication', 'Campaign status tracking in your dashboard'],
        is_active: true,
        highlighted: false,
    },
    {
        id: 2,
        name: 'Growth',
        description: 'A listing plus an announcement in the trader dashboard.',
        placements: ['sponsored_listing', 'sponsored_announcement'],
        duration_days: 30,
        price_minor: 150000,
        features: ['Sponsored listing in Explore Services', 'Sponsored announcement in the trading hub', 'Up to two creatives', 'One mid-campaign creative change'],
        is_active: true,
        highlighted: true,
    },
    {
        id: 3,
        name: 'Premium',
        description: 'Our most visible combination for launches and brand campaigns.',
        placements: ['featured_banner', 'featured_brand', 'sponsored_listing'],
        duration_days: 30,
        price_minor: 380000,
        features: ['Featured banner on the landing page', 'Featured brand placement', 'Sponsored listing in Explore Services', 'Priority creative review'],
        is_active: true,
        highlighted: false,
    },
    {
        id: 4,
        name: 'Event Spotlight',
        description: 'Short announcement for a webinar or community event.',
        placements: ['sponsored_announcement'],
        duration_days: 7,
        price_minor: 30000,
        features: ['Sponsored announcement for 7 days', 'Event date and registration link'],
        is_active: false,
        highlighted: false,
    },
];

/* ------------------------------------------------------------- Campaigns */

let seq = 0;
function campaign(c) {
    seq += 1;
    const created = c.created_at ?? daysFromNow(-30);
    const start = c.start_date;
    return {
        id: seq,
        reference: `AD-${String(2600 + seq)}-${String(1000 + seq * 37).slice(-4)}`,
        phone: '+60 12-345 6789',
        notes: '',
        creative: null,
        creative_name: null,
        review_notes: null,
        rejection_reason: null,
        change_request: null,
        created_at: created,
        updated_at: c.updated_at ?? created,
        end_date: start ? addDays(start, c.duration_days) : null,
        history: [{ at: created, status: c.status === 'draft' ? 'draft' : 'pending_review', note: c.status === 'draft' ? 'Draft saved' : 'Application submitted', by: c.user_id }],
        ...c,
    };
}

const d = daysFromNow;

export const AD_CAMPAIGNS = [
    // Demo advertiser account (advertiser@terpaling.test, user 20)
    campaign({
        user_id: 20, company: 'Meridian FX Markets', contact_person: 'Hana Kamal', email: 'marketing@meridianfx.example', website: 'https://meridianfx.example',
        category: 'broker', placement: 'featured_banner', package_id: 3, price_minor: 380000, start_date: d(-8), duration_days: 30,
        objective: 'brand_awareness', description: 'Trade FX, gold and indices on MT5 with transparent pricing and Malaysian-based support.', cta_label: 'Visit Meridian FX',
        status: 'active', payment_status: 'paid', accent: '#0f766e', created_at: d(-25),
        history: [
            { at: d(-25), status: 'pending_review', note: 'Application submitted', by: 20 },
            { at: d(-22), status: 'approved', note: 'Creative and claims checked.', by: 1 },
            { at: d(-12), status: 'scheduled', note: 'Payment received (demo).', by: 1 },
            { at: d(-8), status: 'active', note: 'Campaign started.', by: 1 },
        ],
    }),
    campaign({
        user_id: 20, company: 'Meridian FX Markets', contact_person: 'Hana Kamal', email: 'marketing@meridianfx.example', website: 'https://meridianfx.example',
        category: 'broker', placement: 'sponsored_listing', package_id: 1, price_minor: 45000, start_date: d(-80), duration_days: 14,
        objective: 'product_launch', description: 'Launch of the Meridian MT5 copy-trading tool for existing clients.', cta_label: 'Learn more',
        status: 'completed', payment_status: 'paid', accent: '#0f766e', created_at: d(-95),
        history: [
            { at: d(-95), status: 'pending_review', note: 'Application submitted', by: 20 },
            { at: d(-90), status: 'approved', note: null, by: 1 },
            { at: d(-80), status: 'active', note: 'Campaign started.', by: 1 },
            { at: d(-66), status: 'completed', note: 'Campaign ended.', by: 1 },
        ],
    }),
    campaign({
        user_id: 20, company: 'Meridian FX Markets', contact_person: 'Hana Kamal', email: 'marketing@meridianfx.example', website: 'https://meridianfx.example',
        category: 'broker', placement: 'sponsored_announcement', package_id: 2, price_minor: 150000, start_date: d(20), duration_days: 30,
        objective: 'event', description: 'Free webinar: understanding spreads, swaps and margin before you trade.', cta_label: 'Register for the webinar',
        status: 'changes_requested', payment_status: 'not_required', accent: '#0f766e', created_at: d(-5),
        change_request: 'Please add the webinar date and time, and remove "zero risk" from the description.',
        history: [
            { at: d(-5), status: 'pending_review', note: 'Application submitted', by: 20 },
            { at: d(-3), status: 'changes_requested', note: 'Please add the webinar date and time, and remove "zero risk" from the description.', by: 1 },
        ],
    }),
    campaign({
        user_id: 20, company: 'Meridian FX Markets', contact_person: 'Hana Kamal', email: 'marketing@meridianfx.example', website: 'https://meridianfx.example',
        category: 'broker', placement: 'featured_brand', package_id: 3, price_minor: 380000, start_date: d(45), duration_days: 30,
        objective: 'brand_awareness', description: 'Year-end brand campaign (draft).', cta_label: 'Visit Meridian FX',
        status: 'draft', payment_status: 'not_required', accent: '#0f766e', created_at: d(-1),
    }),

    // Other advertisers, visible to the admin
    campaign({
        user_id: 14, company: 'QuantEdge EA Lab', contact_person: 'Rajesh Kumar', email: 'hello@quantedge.example', website: 'https://quantedge.example',
        category: 'indicators_eas', placement: 'sponsored_listing', package_id: 1, price_minor: 45000, start_date: d(-4), duration_days: 14,
        objective: 'product_launch', description: 'Rule-based MT5 Expert Advisors with full logic documentation and a 14-day demo licence.', cta_label: 'See the EAs',
        status: 'active', payment_status: 'paid', accent: '#7c3aed', created_at: d(-18),
        history: [
            { at: d(-18), status: 'pending_review', note: 'Application submitted', by: 14 },
            { at: d(-15), status: 'approved', note: null, by: 1 },
            { at: d(-4), status: 'active', note: 'Campaign started.', by: 1 },
        ],
    }),
    campaign({
        user_id: 18, company: 'TradeDesk VPS', contact_person: 'Izzati Roslan', email: 'partners@tradedeskvps.example', website: 'https://tradedeskvps.example',
        category: 'fintech', placement: 'featured_brand', package_id: 3, price_minor: 380000, start_date: d(-10), duration_days: 30,
        objective: 'brand_awareness', description: 'Low-latency Windows VPS in Singapore and Kuala Lumpur for MT4 and MT5 terminals.', cta_label: 'View VPS plans',
        status: 'active', payment_status: 'paid', accent: '#1d4ed8', created_at: d(-28),
        history: [
            { at: d(-28), status: 'pending_review', note: 'Application submitted', by: 18 },
            { at: d(-24), status: 'approved', note: null, by: 1 },
            { at: d(-10), status: 'active', note: 'Campaign started.', by: 1 },
        ],
    }),
    campaign({
        user_id: 17, company: 'Klang Valley Traders Meetup', contact_person: 'Ahmad Faizal', email: 'events@kvtraders.example', website: 'https://kvtraders.example',
        category: 'community', placement: 'sponsored_announcement', package_id: 2, price_minor: 150000, start_date: d(-6), duration_days: 30,
        objective: 'event', description: 'Monthly in-person meetup for retail traders in Petaling Jaya. Talks on journaling and risk management; no trade calls.', cta_label: 'See event details',
        status: 'active', payment_status: 'paid', accent: '#b45309', created_at: d(-20),
        history: [
            { at: d(-20), status: 'pending_review', note: 'Application submitted', by: 17 },
            { at: d(-17), status: 'approved', note: null, by: 1 },
            { at: d(-6), status: 'active', note: 'Campaign started.', by: 1 },
        ],
    }),
    campaign({
        user_id: 19, company: 'Apex Funded Traders', contact_person: 'Kevin Ong', email: 'growth@apexfunded.example', website: 'https://apexfunded.example',
        category: 'prop_firm', placement: 'featured_banner', package_id: 3, price_minor: 380000, start_date: d(24), duration_days: 30,
        objective: 'brand_awareness', description: 'Two-step evaluation programme with published rules and payout terms.', cta_label: 'Read the programme rules',
        status: 'scheduled', payment_status: 'paid', accent: '#be123c', created_at: d(-12),
        history: [
            { at: d(-12), status: 'pending_review', note: 'Application submitted', by: 19 },
            { at: d(-9), status: 'approved', note: 'Approved after removing "guaranteed funding".', by: 1 },
            { at: d(-4), status: 'scheduled', note: 'Payment received (demo).', by: 1 },
        ],
    }),
    campaign({
        user_id: 13, company: 'SignalNest Community', contact_person: 'Mei Ling Tan', email: 'team@signalnest.example', website: 'https://signalnest.example',
        category: 'community', placement: 'sponsored_listing', package_id: 2, price_minor: 150000, start_date: d(10), duration_days: 30,
        objective: 'community', description: 'A moderated Telegram community for discussing setups, with weekly educational sessions.', cta_label: 'Join the community',
        status: 'approved', payment_status: 'awaiting_payment', accent: '#0369a1', created_at: d(-7),
        history: [
            { at: d(-7), status: 'pending_review', note: 'Application submitted', by: 13 },
            { at: d(-2), status: 'approved', note: 'Invoice to be issued (demo).', by: 1 },
        ],
    }),
    campaign({
        user_id: 12, company: 'ChartPilot', contact_person: 'Farid Ismail', email: 'ads@chartpilot.example', website: 'https://chartpilot.example',
        category: 'trading_tools', placement: 'sponsored_listing', package_id: 1, price_minor: 45000, start_date: d(14), duration_days: 14,
        objective: 'product_launch', description: 'Trade journal and analytics app that imports MT5 history and tags setups automatically.', cta_label: 'Try ChartPilot',
        status: 'pending_review', payment_status: 'not_required', accent: '#4338ca', created_at: d(-2),
    }),
    campaign({
        user_id: 11, company: 'Bursa Learning Hub', contact_person: 'Siti Hajar', email: 'admin@bursalearning.example', website: 'https://bursalearning.example',
        category: 'education', placement: 'featured_brand', package_id: 3, price_minor: 380000, start_date: d(7), duration_days: 30,
        objective: 'brand_awareness', description: 'Courses for Bursa Malaysia investors and traders.', cta_label: 'Browse courses',
        status: 'pending_review', payment_status: 'not_required', accent: '#15803d', created_at: d(-1),
    }),
    campaign({
        user_id: 15, company: 'Profit Kilat Academy', contact_person: 'Zul Ariffin', email: 'zul@profitkilat.example', website: 'https://profitkilat.example',
        category: 'education', placement: 'featured_banner', package_id: 3, price_minor: 380000, start_date: d(5), duration_days: 30,
        objective: 'brand_awareness', description: 'Double your account in 30 days with our guaranteed system.', cta_label: 'Join now',
        status: 'rejected', payment_status: 'not_required', accent: '#dc2626', created_at: d(-16),
        rejection_reason: 'The creative promises guaranteed returns, which is not allowed on Terpaling Trader.',
        history: [
            { at: d(-16), status: 'pending_review', note: 'Application submitted', by: 15 },
            { at: d(-14), status: 'rejected', note: 'The creative promises guaranteed returns, which is not allowed on Terpaling Trader.', by: 1 },
        ],
    }),
    campaign({
        user_id: 16, company: 'Velo Prop Capital', contact_person: 'Tan Wei Jie', email: 'mkt@veloprop.example', website: 'https://veloprop.example',
        category: 'prop_firm', placement: 'sponsored_listing', package_id: 1, price_minor: 45000, start_date: d(-40), duration_days: 14,
        objective: 'brand_awareness', description: 'Funded trader programme.', cta_label: 'Learn more',
        status: 'cancelled', payment_status: 'refunded', accent: '#475569', created_at: d(-55),
        history: [
            { at: d(-55), status: 'pending_review', note: 'Application submitted', by: 16 },
            { at: d(-52), status: 'approved', note: null, by: 1 },
            { at: d(-45), status: 'scheduled', note: 'Payment received (demo).', by: 1 },
            { at: d(-42), status: 'cancelled', note: 'Cancelled at the advertiser\'s request. Refund recorded (demo).', by: 1 },
        ],
    }),
];

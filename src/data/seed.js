/*
 * Mock database. Replaces the Laravel database + DemoSeeder for the static
 * build. Shapes follow the Laravel models (amounts in sen, ISO dates).
 * Dates are generated relative to "now" so renewals and expiries always
 * look current. All people and businesses are fictional.
 */
import { AD_CAMPAIGNS, AD_PACKAGES } from './advertising';
import { accessEndsAt, planTerm } from './enums';
import { bps, daysFromNow, EARNING_HOLD_DAYS, hoursAgo, PLATFORM_FEE_BPS } from '../utils/format';

const d = daysFromNow;

/* -------------------------------------------------------------- Users */

const users = [
    { id: 1, name: 'Farah Aziz', email: 'admin@terpaling.test', role: 'admin', status: 'active', created_at: d(-420) },
    { id: 2, name: 'Aiman Hakim', email: 'provider@terpaling.test', role: 'customer', status: 'active', created_at: d(-410) },
    { id: 3, name: 'Daniel Lim', email: 'trader@terpaling.test', role: 'customer', status: 'active', created_at: d(-200) },
    { id: 4, name: 'Hafiz Rahman', email: 'hafiz@kelastrader.test', role: 'customer', status: 'active', created_at: d(-380) },
    { id: 5, name: 'Wong Kah Wai', email: 'kahwai@kodalgo.test', role: 'customer', status: 'active', created_at: d(-360) },
    { id: 6, name: 'Amirah Zain', email: 'amirah@azconsult.test', role: 'customer', status: 'active', created_at: d(-330) },
    { id: 7, name: 'Lee Chen Wei', email: 'chenwei@chartwise.test', role: 'customer', status: 'active', created_at: d(-300) },
    { id: 8, name: 'Syafiq Bakar', email: 'applicant@terpaling.test', role: 'customer', status: 'active', created_at: d(-9) },
    { id: 9, name: 'Nur Aina', email: 'newtrader@terpaling.test', role: 'customer', status: 'active', created_at: d(-3) },
    { id: 10, name: 'Kumar Selvam', email: 'newprovider@terpaling.test', role: 'customer', status: 'active', created_at: d(-40) },
    { id: 11, name: 'Siti Hajar', email: 'siti.hajar@example.test', role: 'customer', status: 'active', created_at: d(-180) },
    { id: 12, name: 'Farid Ismail', email: 'farid.ismail@example.test', role: 'customer', status: 'active', created_at: d(-160) },
    { id: 13, name: 'Mei Ling Tan', email: 'meiling.tan@example.test', role: 'customer', status: 'active', created_at: d(-140) },
    { id: 14, name: 'Rajesh Kumar', email: 'rajesh.k@example.test', role: 'customer', status: 'active', created_at: d(-120) },
    { id: 15, name: 'Zul Ariffin', email: 'zul.ariffin@example.test', role: 'customer', status: 'active', created_at: d(-60) },
    { id: 16, name: 'Tan Wei Jie', email: 'weijie.tan@example.test', role: 'customer', status: 'suspended', created_at: d(-90) },
    { id: 17, name: 'Ahmad Faizal', email: 'ahmad.faizal@example.test', role: 'customer', status: 'active', created_at: d(-75) },
    { id: 18, name: 'Izzati Roslan', email: 'izzati.roslan@example.test', role: 'customer', status: 'active', created_at: d(-50) },
    { id: 19, name: 'Kevin Ong', email: 'kevin.ong@example.test', role: 'customer', status: 'active', created_at: d(-34) },
    { id: 20, name: 'Hana Kamal', email: 'advertiser@terpaling.test', role: 'customer', status: 'active', created_at: d(-120) },
];

/* ---------------------------------------------------------- Providers */

const allDeclarations = { no_guaranteed_returns: true, full_results_disclosure: true, risk_disclosure: true, listing_review: true, identity_check: true };

const providers = [
    {
        id: 1, user_id: 2, slug: 'pusaka-capital', display_name: 'Pusaka Capital', status: 'approved',
        headline: 'Gold-focused signals and session analysis for disciplined, rules-based traders.',
        specialisation: 'Signals & Market Analysis', experience_years: 9, website: 'https://pusakacapital.example',
        business_registration: '202201034567 (1475312-K)',
        bio: 'Pusaka Capital is a Kuala Lumpur based team of three analysts focused on XAUUSD and major FX pairs.\n\nWe publish every setup with entry zone, stop loss and targets, and we keep a complete public record including losing trades. Our work is educational and analytical; it is not personalised investment advice.',
        application_notes: 'Nine years trading gold. Full trade log since 2021 shared via MyFXBook, including drawdown periods in 2022.',
        declarations: allDeclarations, submitted_at: d(-405), approved_at: d(-400), reviewed_by: 1, review_notes: 'Track record and identity verified.',
    },
    {
        id: 2, user_id: 4, slug: 'kelas-trader-academy', display_name: 'Kelas Trader Academy', status: 'approved',
        headline: 'Structured trading education in Bahasa Melayu and English, from basics to market structure.',
        specialisation: 'Trading Education', experience_years: 7, website: 'https://kelastrader.example',
        bio: 'Kelas Trader Academy runs structured courses and small-group mentoring for Malaysian traders. Our courses focus on market structure, risk management and building a written trading plan.',
        application_notes: 'Seven years teaching; 1,200+ students across in-person and online cohorts.',
        declarations: allDeclarations, submitted_at: d(-370), approved_at: d(-365), reviewed_by: 1,
    },
    {
        id: 3, user_id: 5, slug: 'kod-algo-studio', display_name: 'Kod Algo Studio', status: 'approved',
        headline: 'Rule-based Expert Advisors and trading utilities for MetaTrader 5.',
        specialisation: 'EA & Tool Development', experience_years: 8, website: 'https://kodalgo.example',
        bio: 'Kod Algo Studio is a Cyberjaya software studio building MetaTrader tools. Every EA ships with documented logic, configurable risk settings and versioned releases.',
        application_notes: 'MQL5 developers since 2017. Source code reviewed by the platform team.',
        declarations: allDeclarations, submitted_at: d(-350), approved_at: d(-345), reviewed_by: 1,
    },
    {
        id: 4, user_id: 6, slug: 'amirah-zain-consulting', display_name: 'Amirah Zain Consulting', status: 'approved',
        headline: 'One-to-one trading plan reviews and platform setup for independent traders.',
        specialisation: 'Trading Consultancy', experience_years: 10, website: '',
        bio: 'Amirah spent ten years on a bank treasury desk before moving into independent consulting. Sessions focus on risk rules, position sizing and journaling.',
        application_notes: 'Former treasury dealer. References provided.',
        declarations: allDeclarations, submitted_at: d(-320), approved_at: d(-318), reviewed_by: 1,
    },
    {
        id: 5, user_id: 7, slug: 'chartwise-labs', display_name: 'Chartwise Labs', status: 'approved',
        headline: 'Liquidity and session indicators for TradingView and MT5.',
        specialisation: 'Indicators & Charting Tools', experience_years: 6, website: 'https://chartwise.example',
        bio: 'Chartwise Labs builds clean, configurable indicators. We publish change logs for every release and support both TradingView and MetaTrader 5.',
        application_notes: 'Indicators used by 3,000+ TradingView users.',
        declarations: allDeclarations, submitted_at: d(-290), approved_at: d(-285), reviewed_by: 1,
    },
    {
        id: 6, user_id: 8, slug: 'bijak-research', display_name: 'Bijak Research', status: 'pending',
        headline: 'Weekly macro and Bursa Malaysia research notes.',
        specialisation: 'Market research', experience_years: 3, website: 'https://bijakresearch.example',
        business_registration: '202301045678 (1512345-A)',
        bio: 'Bijak Research publishes weekly macro outlooks covering ringgit, gold and the KLCI, written for retail traders who want context rather than calls.',
        application_notes: 'Three years writing a free weekly newsletter (4,500 subscribers). Sample issues and a full archive are available on the website, including calls that did not work out.',
        declarations: allDeclarations, submitted_at: d(-2),
    },
    {
        id: 7, user_id: 10, slug: 'selvam-fx-lab', display_name: 'Selvam FX Lab', status: 'approved',
        headline: '', specialisation: 'Getting started', experience_years: 1, website: '',
        bio: 'New provider. Has not listed any products yet.',
        application_notes: 'Approved with no products.', declarations: allDeclarations, submitted_at: d(-38), approved_at: d(-35), reviewed_by: 1,
    },
    {
        id: 8, user_id: 15, slug: 'profit-kilat-signals', display_name: 'Profit Kilat Signals', status: 'rejected',
        headline: '', specialisation: 'Forex signals', experience_years: 2, website: 'https://profitkilat.example',
        bio: 'Fast forex signals.', application_notes: 'Our signals are 95% accurate and members double their account every month.',
        declarations: { ...allDeclarations, full_results_disclosure: false }, submitted_at: d(-20), rejected_at: d(-18), reviewed_by: 1,
        review_notes: 'Marketing claims guaranteed returns and the track record could not be verified',
    },
    {
        id: 9, user_id: 17, slug: 'momentum-edge-trading', display_name: 'Momentum Edge Trading', status: 'suspended',
        headline: 'Momentum signals on indices.', specialisation: 'Index signals', experience_years: 4, website: '',
        bio: 'Momentum-based signals on US indices.', application_notes: '', declarations: allDeclarations,
        submitted_at: d(-260), approved_at: d(-255), suspended_at: d(-6), reviewed_by: 1, review_notes: 'Suspended pending investigation of guaranteed-profit claims in published content.',
    },
];

/* --------------------------------------------------------- Categories */

const taxonomy = [
    ['Trading Education', 'trading-education', 'Learn from selected educators and mentors.', [['Academy', 'academy'], ['Mentorship', 'mentorship'], ['Courses', 'courses'], ['Coaching', 'coaching']]],
    ['Trading Intelligence', 'trading-intelligence', 'Market analysis, trading ideas, signals and research.', [['Signals', 'signals'], ['Market Research', 'market-research'], ['Market Analysis', 'market-analysis']]],
    ['Trading Tools', 'trading-tools', 'Expert Advisors, indicators and trading utilities for supported platforms.', [['EA', 'ea'], ['Indicators', 'indicators'], ['Trading Tools', 'trading-tools-general'], ['Utilities', 'utilities']]],
    ['Professional Services', 'professional-services', 'Consultancy, technical setup and other trading-related services.', [['Consultancy', 'consultancy'], ['Technical Setup', 'technical-setup'], ['Other Services', 'other-services']]],
];

const categories = [];
taxonomy.forEach(([name, slug, description], i) => categories.push({ id: i + 1, name, slug, description, parent_id: null, sort_order: i, is_active: true }));
let catId = 5;
taxonomy.forEach(([, , , children], i) =>
    children.forEach(([name, slug], j) => categories.push({ id: catId++, name, slug, description: null, parent_id: i + 1, sort_order: j, is_active: true })),
);
const cat = (slug) => categories.find((c) => c.slug === slug).id;

/* ----------------------------------------------------------- Services */

const plans = [];
let planId = 101;
function plan(service_id, name, price_minor, billing_type, interval_unit = null, interval_count = null, session_count = null, extra = {}) {
    const p = { id: planId++, service_id, name, description: null, price_minor, currency: 'MYR', billing_type, interval_unit, interval_count, session_count, status: 'active', sort_order: plans.filter((x) => x.service_id === service_id).length, ...extra };
    plans.push(p);
    return p;
}

const services = [
    {
        id: 1, provider_id: 1, category_id: cat('signals'), slug: 'rumus-pusaka-gold-signals', title: 'RUMUS PUSAKA Gold Signals', service_type: 'signals', status: 'published', featured: true,
        short_description: 'XAUUSD setups for the London and New York sessions with entry zone, stop loss and three targets, plus a private Telegram channel.',
        description: 'RUMUS PUSAKA is our session-based gold service. Every trading day we publish one to three XAUUSD setups on M5/M15 around the London open and the New York overlap.\n\nEach setup includes the entry zone, stop loss, three take-profit levels and a short rationale. Subscribers also join our private Telegram channel for live management notes.\n\nWe publish every result, including stopped-out trades, in a weekly recap.',
        platforms: ['MT4', 'MT5'], level: 'Intermediate', access_types: ['signal_access', 'external_access'],
        features: ['1–3 XAUUSD setups per trading day', 'Entry zone, stop loss and three targets', 'Live management notes in Telegram', 'Weekly recap with every result, wins and losses'],
        faqs: [{ q: 'Which broker should I use?', a: 'Any broker offering XAUUSD on MT4 or MT5. Spreads differ between brokers, so results will vary.' }, { q: 'Can I cancel anytime?', a: 'Yes. Cancelling stops the next renewal; you keep access until the end of the period you paid for.' }],
        external_access_label: 'Join the private Telegram channel', external_access_url: 'https://t.me/example_pusaka', external_access_instructions: 'Open the invite link from the phone that has Telegram installed. The link is personal; please do not share it.',
        submitted_at: d(-392), published_at: d(-390), updated_at: d(-12), reviewed_by: 1,
    },
    {
        id: 2, provider_id: 1, category_id: cat('indicators'), slug: 'session-levels-indicator', title: 'Session Levels Indicator', service_type: 'indicator', status: 'published', featured: false,
        short_description: 'A MetaTrader 5 indicator that plots Asia, London and New York session highs and lows, with alerts on level breaks.',
        description: 'Session Levels draws the high, low and midpoint of each trading session directly on your chart, so you can see where liquidity sits before the next session opens.\n\nSubscribers download the current version of the indicator, the installation guide and the user manual from their dashboard while their plan is active.',
        platforms: ['MT5'], level: 'Intermediate', access_types: ['download_access'],
        features: ['Session high and low levels', 'Alerts on level breaks', 'Works on all MT5 timeframes', 'Configurable colours and session times'],
        faqs: [{ q: 'Which platform does it run on?', a: 'MetaTrader 5. Download the file and follow the installation guide.' }, { q: 'Do I get updates?', a: 'Yes. You always download the current version while your plan is active.' }],
        submitted_at: d(-300), published_at: d(-298), updated_at: d(-20), reviewed_by: 1,
    },
    {
        id: 3, provider_id: 1, category_id: cat('market-research'), slug: 'pusaka-weekly-outlook', title: 'Pusaka Weekly Outlook', service_type: 'market_research', status: 'pending_review', featured: false,
        short_description: 'A weekly PDF outlook for gold and the ringgit with key levels and scheduled events.',
        description: 'Every Sunday evening subscribers receive a 6–8 page outlook covering XAUUSD, USDMYR and the week’s scheduled events, with the levels we are watching.',
        platforms: ['Web'], level: 'Beginner', access_types: ['content_access'], features: ['Weekly PDF outlook', 'Key levels for gold and USDMYR', 'Economic calendar highlights'], faqs: [],
        submitted_at: d(-1), updated_at: d(-1),
    },
    {
        id: 4, provider_id: 1, category_id: cat('ea'), slug: 'gold-breakout-ea', title: 'Gold Breakout EA', service_type: 'expert_advisor', status: 'draft', featured: false,
        short_description: 'An MT5 Expert Advisor that trades London-session breakouts on XAUUSD with fixed fractional risk.',
        description: 'Draft listing. Rule-based breakout EA with configurable risk per trade, daily loss limit and news filter.',
        platforms: ['MT5'], level: 'Advanced', access_types: ['download_access', 'license_access'], features: ['Fixed fractional risk', 'Daily loss limit', 'News filter'], faqs: [],
        updated_at: d(-4),
    },
    {
        id: 5, provider_id: 1, category_id: cat('courses'), slug: 'smart-money-basics', title: 'Smart Money Basics', service_type: 'academy', status: 'rejected', featured: false,
        short_description: 'An introductory course on liquidity and order blocks. 90% win rate strategy included.',
        description: 'Six video lessons introducing liquidity, order blocks and session timing.',
        platforms: ['Web'], level: 'Beginner', access_types: ['content_access'], features: [], faqs: [],
        submitted_at: d(-15), updated_at: d(-13), rejection_reason: 'Please remove the "90% win rate" claim from the short description and add a risk disclosure.',
    },
    {
        id: 6, provider_id: 2, category_id: cat('courses'), slug: 'market-structure-masterclass', title: 'Market Structure Masterclass', service_type: 'academy', status: 'published', featured: true,
        short_description: 'An eight-week course on market structure, liquidity and building a written trading plan, with video lessons and worksheets.',
        description: 'The Masterclass takes you from reading swing structure to writing a complete trading plan.\n\nEight modules of video lessons, worksheets and weekly assignments. Lifetime buyers keep access to every future update of the course.',
        platforms: ['Web'], level: 'Beginner', access_types: ['content_access', 'community_access'],
        features: ['8 modules, 40+ video lessons', 'Worksheets and trading plan template', 'Private student community', 'Course updates included'],
        faqs: [{ q: 'Is the course in Bahasa Melayu?', a: 'Lessons are in Bahasa Melayu with English slides and subtitles.' }, { q: 'How long do I have access?', a: 'Monthly subscribers have access while subscribed. Lifetime buyers keep access permanently.' }],
        submitted_at: d(-360), published_at: d(-358), updated_at: d(-30), reviewed_by: 1,
    },
    {
        id: 7, provider_id: 2, category_id: cat('mentorship'), slug: 'one-to-one-mentorship', title: 'One-to-One Mentorship Programme', service_type: 'mentorship', status: 'published', featured: false,
        short_description: 'Two private mentoring sessions each month, with homework reviews and a shared trading journal.',
        description: 'Work directly with a Kelas Trader mentor. Two 60-minute online sessions per month plus written feedback on your journal.',
        platforms: ['Web'], level: 'Intermediate', access_types: ['booking_access', 'content_access'],
        features: ['Two 60-minute sessions per month', 'Journal reviews', 'Written action plan after every session'], faqs: [],
        submitted_at: d(-250), published_at: d(-248), updated_at: d(-60), reviewed_by: 1,
    },
    {
        id: 8, provider_id: 3, category_id: cat('ea'), slug: 'mt5-ea-toolkit', title: 'MT5 EA Toolkit', service_type: 'expert_advisor', status: 'published', featured: true,
        short_description: 'Three rule-based Expert Advisors (trend, range and breakout) with configurable risk settings and versioned releases.',
        description: 'The toolkit bundles three Expert Advisors for MetaTrader 5, each with documented entry and exit logic.\n\nLicensed per trading account and managed from your dashboard. Every release ships with a change log.',
        platforms: ['MT5'], level: 'Advanced', access_types: ['download_access', 'license_access'],
        features: ['Trend, range and breakout EAs', 'Risk per trade and daily loss limit', 'Preset files for major pairs', 'Licence for 2 trading accounts'],
        faqs: [{ q: 'Does it work on MT4?', a: 'No. The toolkit is built for MetaTrader 5 only.' }, { q: 'Can I run it on a VPS?', a: 'Yes. Install it on your VPS terminal and activate your licence there.' }],
        submitted_at: d(-330), published_at: d(-328), updated_at: d(-8), reviewed_by: 1,
    },
    {
        id: 9, provider_id: 3, category_id: cat('trading-tools-general'), slug: 'risk-calculator-pro', title: 'Risk Calculator Pro', service_type: 'trading_tool', status: 'published', featured: false,
        short_description: 'A one-click position size calculator panel for MT5 with risk-to-reward lines on the chart.',
        description: 'Drag the stop loss and take profit lines and the panel calculates lot size from your risk percentage. One payment, lifetime updates.',
        platforms: ['MT5'], level: 'Beginner', access_types: ['download_access', 'license_access'],
        features: ['Lot size from % risk', 'Drag-and-drop SL/TP lines', 'Lifetime updates'], faqs: [],
        submitted_at: d(-200), published_at: d(-198), updated_at: d(-45), reviewed_by: 1,
    },
    {
        id: 10, provider_id: 5, category_id: cat('indicators'), slug: 'smart-liquidity-zones', title: 'Smart Liquidity Zones', service_type: 'indicator', status: 'published', featured: true,
        short_description: 'Liquidity pools, equal highs and lows, and session ranges highlighted automatically on TradingView and MT5.',
        description: 'Smart Liquidity Zones marks resting liquidity and session ranges so you can plan around them.\n\nTradingView users receive an invite to the invite-only script; MT5 users download the indicator.',
        platforms: ['TradingView', 'MT5'], level: 'Intermediate', access_types: ['download_access', 'external_access'],
        features: ['Equal highs and lows detection', 'Session range boxes', 'Alerts on sweeps', 'TradingView and MT5 versions'],
        faqs: [{ q: 'How do I get the TradingView version?', a: 'Enter your TradingView username in the External access section; we add you within 24 hours.' }],
        external_access_label: 'Request TradingView access', external_access_url: 'https://www.tradingview.com/', external_access_instructions: 'Send your TradingView username to the provider through the link. Access is added within 24 hours.',
        submitted_at: d(-280), published_at: d(-278), updated_at: d(-16), reviewed_by: 1,
    },
    {
        id: 11, provider_id: 4, category_id: cat('consultancy'), slug: 'trading-plan-review', title: 'Trading Plan Review', service_type: 'consultancy', status: 'published', featured: false,
        short_description: 'A one-to-one review of your trading plan, risk rules and journal, with a written summary after each session.',
        description: 'Bring your trading plan and the last month of your journal. We review risk rules, position sizing and execution, and you leave with a written summary and three concrete changes to test.',
        platforms: ['Web'], level: null, access_types: ['booking_access'],
        features: ['60-minute video session', 'Written summary within 48 hours', 'Follow-up questions by email'], faqs: [],
        submitted_at: d(-310), published_at: d(-308), updated_at: d(-90), reviewed_by: 1,
    },
    {
        id: 12, provider_id: 4, category_id: cat('technical-setup'), slug: 'vps-mt5-setup', title: 'VPS & MT5 Setup Session', service_type: 'technical_setup', status: 'published', featured: false,
        short_description: 'We set up a VPS, install MetaTrader 5 and your EAs, and walk you through monitoring on your phone.',
        description: 'A guided remote session to set up a trading VPS, install MT5, add your Expert Advisors and configure alerts.',
        platforms: ['MT4', 'MT5'], level: null, access_types: ['booking_access'], features: ['VPS selection advice', 'MT5 and EA installation', 'Mobile monitoring setup'], faqs: [],
        submitted_at: d(-150), published_at: d(-148), updated_at: d(-100), reviewed_by: 1,
    },
    {
        id: 13, provider_id: 3, category_id: cat('ea'), slug: 'asia-session-scalper-ea', title: 'Asia Session Scalper EA', service_type: 'expert_advisor', status: 'pending_review', featured: false,
        short_description: 'A low-frequency scalper for the Asia session on EURUSD and AUDUSD with strict spread filters.',
        description: 'Trades the Asia session range with a spread filter and hard stop loss on every trade.',
        platforms: ['MT5'], level: 'Advanced', access_types: ['download_access', 'license_access'], features: ['Spread filter', 'Hard stop loss', 'Session time filter'], faqs: [],
        submitted_at: d(-3), updated_at: d(-3),
    },
    {
        id: 14, provider_id: 9, category_id: cat('signals'), slug: 'momentum-edge-signals', title: 'Momentum Edge Index Signals', service_type: 'signals', status: 'suspended', featured: false,
        short_description: 'Momentum signals on NAS100 and US30.', description: 'Momentum signals on US indices.',
        platforms: ['MT5'], level: 'Intermediate', access_types: ['signal_access'], features: [], faqs: [],
        submitted_at: d(-250), published_at: d(-248), updated_at: d(-6), reviewed_by: 1,
    },
];

plan(1, 'Monthly', 18900, 'recurring', 'month', 1);
plan(1, 'Quarterly', 49900, 'recurring', 'month', 3, null, { description: 'Save 12% compared with monthly.' });
plan(2, 'Monthly', 5000, 'recurring', 'month', 1);
plan(2, '3 Months', 12000, 'recurring', 'month', 3);
plan(2, '6 Months', 20000, 'recurring', 'month', 6);
plan(3, 'Monthly', 5900, 'recurring', 'month', 1);
plan(4, 'Monthly', 22000, 'recurring', 'month', 1);
plan(5, 'Lifetime access', 14900, 'one_time');
plan(6, 'Monthly', 12900, 'recurring', 'month', 1);
plan(6, 'Lifetime access', 49900, 'one_time', null, null, null, { description: 'Pay once, keep every lesson and future update.' });
plan(7, 'Monthly mentoring', 45000, 'recurring', 'month', 1, 2);
plan(8, 'Monthly', 22000, 'recurring', 'month', 1);
plan(8, 'Annual', 198000, 'recurring', 'year', 1, null, { description: 'Two months free compared with monthly.' });
plan(9, 'Lifetime licence', 8900, 'one_time');
plan(10, 'Monthly', 7900, 'recurring', 'month', 1);
plan(10, 'Yearly', 69900, 'recurring', 'year', 1);
plan(11, 'Single session', 35000, 'one_time', 'month', 3, 1);
plan(11, '3-session pack', 89000, 'one_time', 'month', 3, 3);
plan(12, 'Setup session', 15000, 'one_time', null, null, 1);
plan(13, 'Monthly', 18000, 'recurring', 'month', 1);
plan(14, 'Monthly', 15000, 'recurring', 'month', 1, null, { status: 'inactive' });

const planOf = (serviceId, name) => plans.find((p) => p.service_id === serviceId && p.name === name);

/* ------------------------------------- Subscriptions, orders, earnings */

const subscriptions = [];
const orders = [];
const earnings = [];
let refSeq = 41027;

function sale(user_id, service_id, planName, { status = 'active', starts, expires, auto_renew, sessions_remaining = null, method = 'FPX', meta } = {}) {
    const p = planOf(service_id, planName);
    const term = planTerm(p);
    const orderId = orders.length + 1;
    const reference = `TT-${(refSeq++).toString(36).toUpperCase()}${String(orderId).padStart(3, '0')}`;
    orders.push({
        id: orderId, reference, user_id, status: 'paid', currency: 'MYR',
        subtotal_minor: p.price_minor, discount_minor: 0, total_minor: p.price_minor, created_at: starts, paid_at: starts,
        items: [{ service_id, plan_id: p.id, description: `${services.find((s) => s.id === service_id).title} · ${p.name}`, plan_snapshot: { name: p.name, price_minor: p.price_minor } }],
        payments: [{ gateway: 'test', method, status: 'succeeded', amount_minor: p.price_minor, transaction_reference: `TXN${(900000 + orderId * 7919) % 1000000}` }],
    });
    const sub = {
        id: subscriptions.length + 1, user_id, service_id, plan_id: p.id, order_id: orderId, status, term,
        starts_at: starts, expires_at: expires === undefined ? accessEndsAt(p, starts) : expires,
        auto_renew: auto_renew ?? term === 'recurring', sessions_remaining: sessions_remaining ?? p.session_count ?? null,
        cancelled_at: status === 'cancelled' ? expires : null, license: meta ?? null,
    };
    subscriptions.push(sub);

    const service = services.find((s) => s.id === service_id);
    const fee = bps(p.price_minor, PLATFORM_FEE_BPS);
    const availableAt = new Date(new Date(starts).getTime() + EARNING_HOLD_DAYS * 86400000).toISOString();
    earnings.push({
        id: earnings.length + 1, provider_id: service.provider_id, order_id: orderId, description: `${service.title} · ${p.name}`,
        gross_minor: p.price_minor, platform_fee_minor: fee, net_minor: p.price_minor - fee, fee_bps: PLATFORM_FEE_BPS, currency: 'MYR',
        status: new Date(availableAt) > new Date() ? 'pending' : 'available', available_at: availableAt, payout_id: null, created_at: starts,
    });
    return sub;
}

// The demo trader: five active products, one expired, one cancelled.
sale(3, 2, '3 Months', { starts: d(-70), expires: d(20) });
sale(3, 1, 'Monthly', { starts: d(-18), expires: d(12) });
sale(3, 6, 'Lifetime access', { starts: d(-120), method: 'Card' });
sale(3, 8, 'Monthly', { starts: d(-5), expires: d(25), meta: { license_key: 'TTEA-7F3K-92QD-LM4X', activations: ['50123456'], activation_limit: 2 } });
sale(3, 11, '3-session pack', { starts: d(-30), expires: d(60), sessions_remaining: 2, auto_renew: false });
sale(3, 10, 'Monthly', { status: 'expired', starts: d(-95), expires: d(-65), auto_renew: false });
sale(3, 7, 'Monthly mentoring', { status: 'cancelled', starts: d(-150), expires: d(-120), auto_renew: false });

// Other customers.
sale(11, 1, 'Quarterly', { starts: d(-40), expires: d(50), method: 'Card' });
sale(12, 1, 'Monthly', { starts: d(-9), expires: d(21) });
sale(13, 1, 'Monthly', { starts: d(-25), expires: d(5), auto_renew: false });
sale(14, 2, 'Monthly', { starts: d(-12), expires: d(18) });
sale(17, 2, '6 Months', { starts: d(-100), expires: d(80), method: 'Card' });
sale(18, 1, 'Monthly', { status: 'expired', starts: d(-80), expires: d(-50), auto_renew: false });
sale(19, 2, '3 Months', { starts: d(-2), expires: d(88) });
sale(11, 6, 'Monthly', { starts: d(-14), expires: d(16) });
sale(12, 6, 'Lifetime access', { starts: d(-60), method: 'Card' });
sale(13, 8, 'Annual', { starts: d(-200), expires: d(165), meta: { license_key: 'TTEA-Q8M2-5RTV-K1PZ', activations: ['70011223', '70011224'], activation_limit: 2 } });
sale(14, 10, 'Yearly', { starts: d(-150), expires: d(215) });
sale(17, 11, 'Single session', { starts: d(-8), expires: d(82) });
sale(18, 9, 'Lifetime licence', { starts: d(-33), method: 'Card' });
sale(19, 1, 'Quarterly', { starts: d(-1), expires: d(89) });
sale(16, 14, 'Monthly', { status: 'suspended', starts: d(-20), expires: d(10) });

// A failed and a pending order for the demo trader's billing page.
const failedPlan = planOf(9, 'Lifetime licence');
orders.push({
    id: orders.length + 1, reference: 'TT-FAIL-0091', user_id: 3, status: 'failed', currency: 'MYR', subtotal_minor: failedPlan.price_minor, discount_minor: 0, total_minor: failedPlan.price_minor,
    created_at: d(-44), paid_at: null, items: [{ service_id: 9, plan_id: failedPlan.id, description: 'Risk Calculator Pro · Lifetime licence', plan_snapshot: { name: 'Lifetime licence', price_minor: failedPlan.price_minor } }],
    payments: [{ gateway: 'test', method: 'FPX', status: 'failed', amount_minor: failedPlan.price_minor, transaction_reference: null, failure_reason: 'The payment was declined by the bank.' }],
});

// Paid out earnings + payouts.
const payouts = [
    { id: 1, provider_id: 1, amount_minor: 0, currency: 'MYR', status: 'paid', reference: 'MBB-88320117', requested_at: d(-45), processed_at: d(-42) },
    { id: 2, provider_id: 2, amount_minor: 0, currency: 'MYR', status: 'approved', reference: null, requested_at: d(-4), processed_at: null },
    { id: 3, provider_id: 3, amount_minor: 0, currency: 'MYR', status: 'requested', reference: null, requested_at: d(-1), processed_at: null },
    { id: 4, provider_id: 5, amount_minor: 0, currency: 'MYR', status: 'paid', reference: 'CIMB-55102934', requested_at: d(-90), processed_at: d(-87) },
];
const payoutAssignments = { 1: [1, 1], 2: [2, 2], 3: [3, 3], 4: [5, 4] }; // payout id → [provider id, payout id]
for (const [payoutId, [providerId]] of Object.entries(payoutAssignments)) {
    const payout = payouts.find((p) => p.id === Number(payoutId));
    const eligible = earnings.filter((e) => e.provider_id === providerId && e.status === 'available' && !e.payout_id && new Date(e.created_at) < new Date(payout.requested_at) - 14 * 86400000);
    const pick = payout.status === 'paid' ? eligible.slice(0, 2) : eligible;
    pick.forEach((e) => {
        e.payout_id = payout.id;
        if (payout.status === 'paid') e.status = 'paid_out';
        payout.amount_minor += e.net_minor;
    });
    if (payout.amount_minor === 0) payout.amount_minor = 25840;
}

/* ------------------------------------------------------------ Content */

let contentId = 1;
const contents = [];
function content(service_id, type, title, body, opts = {}) {
    contents.push({
        id: contentId++, service_id, type, title, summary: opts.summary ?? null, body, external_url: opts.url ?? null,
        required_entitlement: type === 'signal' ? 'signal_access' : 'content_access', is_preview: !!opts.preview,
        status: opts.status ?? 'published', published_at: opts.at ?? d(-1), created_at: opts.at ?? d(-1), sort_order: contents.filter((c) => c.service_id === service_id).length,
    });
}

content(1, 'signal', 'XAUUSD · BUY · London session', 'Entry zone: 3,868.50 – 3,865.00\nStop loss: 3,858.00\nTP1: 3,876.00\nTP2: 3,884.50\nTP3: 3,896.00\n\nRationale: Asia low swept into H1 demand. Risk 1% of a reference account.', { at: hoursAgo(5) });
content(1, 'signal', 'XAUUSD · SELL · New York overlap', 'Entry zone: 3,902.00 – 3,905.50\nStop loss: 3,913.00\nTP1: 3,894.00\nTP2: 3,886.00\n\nUpdate: TP1 hit, stop moved to entry. Remaining position closed at entry.', { at: hoursAgo(29) });
content(1, 'signal', 'XAUUSD · BUY · London session', 'Entry zone: 3,842.00 – 3,839.50\nStop loss: 3,832.00\nTP1: 3,850.00\n\nResult: stopped out (−1R). Price swept the zone before reversing.', { at: hoursAgo(53) });
content(1, 'post', 'Weekly recap', 'Eleven setups this week: six reached TP1 or better, four were stopped out, one closed at entry. Net result +3.2R on the reference account.\n\nThe full trade log is attached in the Telegram channel.', { at: d(-3), summary: 'Every setup from last week, including the four losses.' });
content(6, 'lesson', 'Module 1 · How markets move', 'Swing highs, swing lows and why structure matters. Watch the video, then mark the last 20 swings on any H4 chart.', { preview: true, at: d(-110), summary: 'Free preview: the building blocks of market structure.', url: 'https://example.com/video/module-1' });
content(6, 'lesson', 'Module 2 · Break of structure vs. change of character', 'How to tell a continuation break from a reversal signal, with eight annotated examples.', { at: d(-100), url: 'https://example.com/video/module-2' });
content(6, 'lesson', 'Module 3 · Liquidity and stop runs', 'Where stops gather, why they get taken, and how to wait for confirmation instead of guessing.', { at: d(-60) });
content(6, 'pdf', 'Trading plan template (worksheet)', 'A fill-in template for your rules: markets, sessions, setups, risk per trade, daily limits and review routine.', { at: d(-58), url: 'https://example.com/files/trading-plan.pdf' });
content(6, 'video', 'Live review · Student charts, week 6', 'Recording of the live review session covering eight student charts.', { at: d(-6), url: 'https://example.com/video/live-6' });
content(7, 'article', 'Before your first session', 'Please export your last 30 trades and write down your three biggest questions. We start every mentorship with your journal.', { at: d(-140) });
content(10, 'post', 'v3.1 release notes', 'Adds equal-high/low tolerance setting and fixes duplicate alerts on the M1 timeframe.', { at: d(-16) });
content(14, 'post', 'This week: guaranteed 300 pips', 'Join now — our momentum system is risk-free and has never lost a week.', { at: d(-7) });
content(3, 'pdf', 'Sample issue · Week 39', 'Sample outlook issue attached for review.', { at: d(-1), preview: true, status: 'draft' });

/* -------------------------------------------------------------- Files */

let fileId = 1;
let versionId = 1;
const files = [];
function file(service_id, title, description, versions, extra = {}) {
    const f = { id: fileId++, service_id, title, description, is_active: extra.is_active ?? true, sort_order: files.filter((x) => x.service_id === service_id).length, versions: [] };
    versions.forEach(([version, original_name, size_bytes, released, release_notes, downloads], i) => {
        f.versions.unshift({
            id: versionId++, version, original_name, size_bytes, released_at: released, release_notes: release_notes ?? null, downloads: downloads ?? 0,
            is_current: i === versions.length - 1, checksum_sha256: Array.from({ length: 64 }, (_, k) => '0123456789abcdef'[(versionId * 7 + k * 13) % 16]).join(''),
        });
    });
    files.push(f);
}

file(2, 'Session Levels Indicator', 'The indicator file for MetaTrader 5.', [
    ['1.0', 'session-levels-v1.0.ex5', 48211, d(-298), 'Initial release.', 41],
    ['1.1', 'session-levels-v1.1.ex5', 51904, d(-20), 'Adds alerts on level breaks.\nFixes the midpoint line on weekly charts.', 27],
]);
file(2, 'Installation Guide', null, [['1.0', 'installation-guide.pdf', 412880, d(-298), null, 52]]);
file(2, 'User Manual', 'Settings reference and example layouts.', [['1.0', 'user-manual.pdf', 1288401, d(-298), null, 38]]);
file(8, 'MT5 EA Toolkit', 'Trend, range and breakout Expert Advisors.', [
    ['1.1.0', 'tt-ea-toolkit-1.1.0.zip', 884120, d(-120), 'Adds daily loss limit.', 63],
    ['1.2.0', 'tt-ea-toolkit-1.2.0.zip', 902455, d(-8), 'News filter and improved spread handling.', 19],
]);
file(8, 'Preset files', 'Starting presets for EURUSD, GBPUSD and XAUUSD.', [['1.2', 'presets.zip', 6512, d(-8), null, 14]]);
file(9, 'Risk Calculator Pro', null, [['2.0', 'risk-calculator-pro-2.0.ex5', 72300, d(-45), 'Redesigned panel.', 22]]);
file(10, 'Smart Liquidity Zones (MT5)', 'MetaTrader 5 version.', [['3.1', 'smart-liquidity-zones-3.1.ex5', 63980, d(-16), 'Equal-high/low tolerance setting.', 88]]);
file(4, 'Gold Breakout EA', 'Draft build.', [['0.9', 'gold-breakout-0.9.ex5', 58120, d(-4), 'Beta build for review.', 0]]);

/* ----------------------------------------------------------- Bookings */

const bookings = [
    { id: 1, user_id: 3, service_id: 11, provider_id: 4, subscription_id: 5, scheduled_at: d(-20, 10), duration_minutes: 60, status: 'completed', notes: 'Review of my risk rules', meeting_url: null },
    { id: 2, user_id: 3, service_id: 11, provider_id: 4, subscription_id: 5, scheduled_at: d(4, 20, 30), duration_minutes: 60, status: 'confirmed', notes: 'Position sizing for gold', meeting_url: 'https://meet.example.com/tt-amirah-2' },
    { id: 3, user_id: 17, service_id: 11, provider_id: 4, subscription_id: 19, scheduled_at: d(6, 21), duration_minutes: 60, status: 'requested', notes: 'First review of my plan', meeting_url: null },
    { id: 4, user_id: 3, service_id: 7, provider_id: 2, subscription_id: 7, scheduled_at: d(-135, 21), duration_minutes: 60, status: 'completed', notes: null, meeting_url: null },
];

/* ------------------------------------------------------------ Reviews */

const reviews = [
    { id: 1, user_id: 11, service_id: 1, rating: 5, body: 'Clear entries and they post the losing trades too. The weekly recap is the reason I stayed.', status: 'published', created_at: d(-20) },
    { id: 2, user_id: 12, service_id: 1, rating: 4, body: 'Good setups around London open. Wish there were more during Asia.', status: 'published', created_at: d(-6) },
    { id: 3, user_id: 13, service_id: 1, rating: 5, body: 'Management notes in Telegram are very helpful.', status: 'published', created_at: d(-15) },
    { id: 4, user_id: 18, service_id: 1, rating: 1, body: 'Lost money, this is a scam!!! Call me on WhatsApp for a better group.', status: 'hidden', created_at: d(-48) },
    { id: 5, user_id: 14, service_id: 2, rating: 4, body: 'Simple and clean. Alerts work well.', status: 'published', created_at: d(-9) },
    { id: 6, user_id: 17, service_id: 2, rating: 5, body: 'I use it every day to mark session ranges.', status: 'published', created_at: d(-70) },
    { id: 7, user_id: 3, service_id: 6, rating: 5, body: 'The trading plan module alone was worth it.', status: 'published', created_at: d(-90) },
    { id: 8, user_id: 11, service_id: 6, rating: 5, body: 'Explained in a way that finally made sense to me.', status: 'published', created_at: d(-10) },
    { id: 9, user_id: 12, service_id: 6, rating: 4, body: 'Great content, some videos could be shorter.', status: 'published', created_at: d(-40) },
    { id: 10, user_id: 13, service_id: 8, rating: 4, body: 'Well documented and the presets are a good starting point.', status: 'published', created_at: d(-150) },
    { id: 11, user_id: 14, service_id: 10, rating: 5, body: 'Equal highs/lows detection is spot on.', status: 'published', created_at: d(-100) },
    { id: 12, user_id: 3, service_id: 10, rating: 4, body: 'Useful indicator, TradingView access was added quickly.', status: 'published', created_at: d(-80) },
    { id: 13, user_id: 17, service_id: 11, rating: 5, body: 'Very practical session, I changed my daily loss rule right after.', status: 'flagged', created_at: d(-2) },
    { id: 14, user_id: 18, service_id: 9, rating: 5, body: 'Saves me so much time sizing positions.', status: 'published', created_at: d(-25) },
];

/* ------------------------------------------------------ Notifications */

let notifId = 1;
const notifications = [];
function notify(user_id, icon, title, body, url, at, read = true) {
    notifications.push({ id: notifId++, user_id, data: { icon, title, body, url }, created_at: at, read_at: read ? at : null });
}

notify(3, 'credit-card', 'Payment successful', 'Your payment of RM 220.00 for MT5 EA Toolkit was received.', '/dashboard/services/mt5-ea-toolkit', d(-5), true);
notify(3, 'check-circle', 'Subscription activated', 'You now have access to MT5 EA Toolkit.', '/dashboard/services/mt5-ea-toolkit', d(-5), true);
notify(3, 'arrow-down-tray', 'New version available', 'MT5 EA Toolkit v1.2.0 is ready to download.', '/dashboard/services/mt5-ea-toolkit?section=download_access', d(-8), true);
notify(3, 'calendar', 'Booking confirmed', 'Amirah Zain Consulting confirmed your Trading Plan Review session.', '/dashboard/bookings', hoursAgo(20), false);
notify(3, 'signal', 'New signal published', 'RUMUS PUSAKA Gold Signals posted a new XAUUSD setup.', '/dashboard/services/rumus-pusaka-gold-signals?section=signal_access', hoursAgo(5), false);
notify(3, 'clock', 'Access ended', 'Your access to Smart Liquidity Zones has ended. Renew any time from My Services.', '/dashboard/services', d(-65), true);
notify(2, 'check-badge', 'Product approved', 'Session Levels Indicator is now published.', '/provider/services', d(-298), true);
notify(2, 'users', 'New subscriber', 'Kevin Ong subscribed to RUMUS PUSAKA Gold Signals.', '/provider/customers', d(-1), false);
notify(2, 'banknotes', 'Payout paid', 'Your payout was transferred. Reference MBB-88320117.', '/provider/payouts', d(-42), true);
notify(2, 'x-circle', 'Product not approved', 'Smart Money Basics needs changes before it can be published.', '/provider/services/smart-money-basics/edit', d(-13), false);
notify(8, 'inbox-arrow-down', 'Application received', 'We received your provider application and will review it within 5–7 working days.', '/provider/apply', d(-2), false);

/* ---------------------------------------------------------- Audit log */

let logId = 1;
const auditLogs = [];
function log(action, actor_id, subject_type, subject_id, properties, at) {
    auditLogs.push({ id: logId++, action, actor_id, subject_type, subject_id, properties, created_at: at });
}

log('provider.approved', 1, 'Provider', 7, { notes: 'Demo approval' }, d(-35));
log('payout.paid', 1, 'Payout', 1, { reference: 'MBB-88320117' }, d(-42));
log('service.approved', 1, 'Service', 9, null, d(-198));
log('provider.rejected', 1, 'Provider', 8, { notes: 'Marketing claims guaranteed returns' }, d(-18));
log('service.rejected', 1, 'Service', 5, { reason: 'Remove win-rate claim' }, d(-13));
log('payment.succeeded', null, 'Payment', 4, { reference: 'TXN' }, d(-5));
log('user.suspended', 1, 'User', 16, null, d(-7));
log('provider.suspended', 1, 'Provider', 9, null, d(-6));
log('service.suspended', 1, 'Service', 14, { reason: 'Provider suspended' }, d(-6));
log('review.hidden', 1, 'Review', 4, null, d(-47));
log('payout.approved', 1, 'Payout', 2, null, d(-3));
log('service.submitted', 5, 'Service', 13, null, d(-3));
log('provider.application_submitted', 8, 'Provider', 6, null, d(-2));
log('service.submitted', 2, 'Service', 3, null, d(-1));
log('payout.requested', 5, 'Payout', 3, null, d(-1));
log('payment.succeeded', null, 'Payment', 21, null, d(-1));
auditLogs.reverse();

// ReviewProviderApplication::approve() promotes the account to the provider role.
providers.forEach((p) => {
    if (['approved', 'suspended'].includes(p.status)) users.find((u) => u.id === p.user_id).role = 'provider';
});

/* ------------------------------------------------------------ Export */

export function createSeed() {
    return structuredClone({
        users, providers, categories, services, plans, subscriptions, orders, earnings, payouts,
        contents, files, bookings, reviews, notifications, auditLogs,
        adPackages: AD_PACKAGES, adCampaigns: AD_CAMPAIGNS,
        settings: { gateway: 'test', environment: 'static-demo' },
        security: {},
    });
}

/** Demo personas offered on the login page (DemoSeeder accounts). */
export const DEMO_ACCOUNTS = [
    { email: 'trader@terpaling.test', label: 'Trader', description: 'Customer with active, expired and cancelled products', icon: 'user' },
    { email: 'provider@terpaling.test', label: 'Provider', description: 'Approved provider with published products', icon: 'briefcase' },
    { email: 'admin@terpaling.test', label: 'Admin', description: 'Platform team: review queues and console', icon: 'shield-check' },
    { email: 'applicant@terpaling.test', label: 'Applicant', description: 'Provider application waiting for review', icon: 'inbox-arrow-down' },
    { email: 'newtrader@terpaling.test', label: 'New trader', description: 'Customer with no purchases yet', icon: 'user-plus' },
    { email: 'newprovider@terpaling.test', label: 'New provider', description: 'Approved provider with no products', icon: 'plus-circle' },
    { email: 'advertiser@terpaling.test', label: 'Advertiser', description: 'Demo advertiser with active, draft and returned campaigns', icon: 'megaphone' },
];

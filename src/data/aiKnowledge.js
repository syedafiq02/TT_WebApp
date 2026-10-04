/*
 * Offline stand-in for the AI support backend (OpenAI + knowledge base).
 * Answers are written from resources/ai-support/knowledge.php and matched by
 * keyword, with a light account-aware answer for "my subscriptions" questions.
 */
import { fmtDate } from '../utils/format';
import { isCurrentlyActive, serviceById } from './queries';

const ARTICLES = [
    {
        keywords: ['download', 'muat turun', 'file', 'fail', 'indicator', 'indikator', 'ex4', 'ex5', 'zip', 'link'],
        answer: `To download a product you bought:
1. Go to [My Services](/dashboard/services).
2. Press **Access Product** on the product.
3. Open the **Downloads** section and press **Download** next to the file.

Download links are created for your account only and expire after a few minutes. If a link expired, press Download again to get a fresh one. You always receive the current version of each file.`,
    },
    {
        keywords: ['install', 'pasang', 'mt4', 'mt5', 'metatrader', 'navigator', 'not showing', 'tak keluar', 'autotrading'],
        answer: `General MetaTrader guidance (the provider's own instructions take priority):
- .ex4/.mq4 files are for **MetaTrader 4**; .ex5/.mq5 files are for **MetaTrader 5**.
- In MetaTrader: File → Open Data Folder → MQL5 → put indicators in \`Indicators\` and EAs in \`Experts\`.
- Restart MetaTrader or right-click Navigator → Refresh, then drag the item onto a chart.
- For EAs, Algo Trading must be enabled.`,
    },
    {
        keywords: ['cancel', 'batal', 'renew', 'renewal', 'expire', 'expired', 'tamat', 'auto'],
        answer: `[My Subscriptions](/dashboard/subscriptions) lists every subscription with Active, Expired and Cancelled tabs.

Cancelling a recurring subscription stops renewal. You **keep access until the end of the period already paid**. When access ends, the product shows as Expired in My Services and you can press **Renew subscription** at any time. Other products are not affected.`,
    },
    {
        keywords: ['payment', 'pay', 'bayar', 'failed', 'gagal', 'receipt', 'resit', 'invoice', 'billing', 'refund', 'fpx', 'card'],
        answer: `All your orders and payments are listed under [Payments & Billing](/dashboard/billing). Order statuses are Pending, Paid, Failed, Cancelled and Refunded. Access is granted only after a payment is confirmed.

If a payment did not complete, open the order and press **Try again**. If money was deducted but the order is not Paid, or for a refund request, please contact the platform team with your order reference. I can't check bank transactions or issue refunds.`,
    },
    {
        keywords: ['subscribe', 'buy', 'purchase', 'checkout', 'langgan', 'beli', 'how to', 'cara'],
        answer: `1. Sign in and verify your email address.
2. Open the product from [Explore](/services) and choose a plan in **Choose a plan**, then press Subscribe or Purchase.
3. On the Checkout page choose a payment method, tick the risk disclosure and pay.
4. After payment, press **Access Product**. Access starts immediately.`,
    },
    {
        keywords: ['product', 'products', 'plan', 'price', 'harga', 'explore', 'signal', 'course', 'ea', 'what can i find'],
        answer: `Terpaling Trader is a curated marketplace. Approved providers sell individual products: academies and courses, mentorship, signals, market research, Expert Advisors, indicators, trading tools, consultancy and technical setup.

Browse everything at [Explore](/services). Each plan is a **Subscription** (renews), **Fixed-term access** (paid once, for a set period) or a **Lifetime purchase**. Buying a product gives access to that product only.`,
    },
    {
        keywords: ['licence', 'license', 'lesen', 'key', 'activation'],
        answer: 'Products with a licence show it in the **Licence** section of the product\'s access page (My Services → Access Product), together with the activation limit.',
    },
    {
        keywords: ['booking', 'tempahan', 'session', 'sesi', 'lesson', 'community', 'telegram', 'learning'],
        answer: `Everything for a product is on its access page: My Services → **Access Product**. Lessons appear under Content & lessons (also collected in [Learning / Content](/dashboard/learning)); consultancy products have a **Bookings** section where you request a time and the provider confirms it. See all sessions in [Bookings](/dashboard/bookings).`,
    },
    {
        keywords: ['verify', 'verification', 'email', 'emel', 'register', 'daftar', 'login', 'password', 'forgot', 'lupa', '2fa', 'passkey', 'account', 'akaun'],
        answer: `- Change your name or email in [Account Settings](/settings/profile).
- Password, two-factor authentication and passkeys are under [Security](/settings/security).
- Forgot your password? Use **Forgot your password?** on the [login page](/login).
- Didn't get a verification email? Press **Resend verification email** and check your spam folder.`,
    },
    {
        keywords: ['provider', 'penyedia', 'sell', 'jual', 'apply', 'mohon'],
        answer: 'Any signed-in user can apply at [Become a Provider](/provider/apply). The Terpaling team reviews every application; approved providers get a Provider dashboard to create products, plans and files. Each product is reviewed again before it is published.',
    },
    {
        keywords: ['profit', 'untung', 'guarantee', 'jamin', 'accuracy', 'win rate', 'should i buy', 'recommend', 'advice', 'nasihat'],
        answer: 'Trading involves risk. Services on the platform are educational and analytical, are **not a guarantee of trading results** and are not personalised investment advice. I can explain how products and plans work, but I can\'t recommend trades or tell you which product will be profitable.',
    },
];

const FALLBACK = `I can help with products, subscriptions, payments, downloads and account questions. Could you tell me a bit more about what you need?

You can also browse [Explore](/services) or check [My Services](/dashboard/services).`;

export function answer(question, db, user) {
    const text = question.toLowerCase();

    if (/\b(my|saya)\b/.test(text) && /(subscri|langgan|service|product|renew|expire)/.test(text)) {
        const subs = db.subscriptions.filter((s) => s.user_id === user.id && s.status !== 'pending');
        if (!subs.length) return "You don't have any subscriptions or purchases yet. Browse products at [Explore](/services).";
        const lines = subs.map((s) => {
            const svc = serviceById(db, s.service_id);
            const state = isCurrentlyActive(s) ? (s.expires_at ? `${s.auto_renew ? 'renews' : 'ends'} ${fmtDate(s.expires_at)}` : 'lifetime access') : s.status;
            return `- **${svc.title}** — ${state}`;
        });
        return `Here are your products:\n${lines.join('\n')}\n\nManage them in [My Subscriptions](/dashboard/subscriptions).`;
    }

    let best = null;
    let bestScore = 0;
    for (const article of ARTICLES) {
        const score = article.keywords.reduce((n, k) => n + (text.includes(k) ? k.length : 0), 0);
        if (score > bestScore) {
            best = article;
            bestScore = score;
        }
    }
    return best ? best.answer : FALLBACK;
}

export const SUGGESTIONS = [
    { label: 'Explore Products', question: 'What products can I find on Terpaling Trader?' },
    { label: 'Subscription Help', question: 'How do I subscribe to a product and manage my subscriptions?' },
    { label: 'Payment Help', question: 'I need help with a payment or an order.' },
    { label: 'Download Indicator', question: 'How do I download an indicator I have purchased?' },
    { label: 'Account & Verification', question: 'I need help with my account and email verification.' },
];

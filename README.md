# Terpaling Trader — static React build

A static React + Vite version of the Terpaling Trader Laravel app (Draft 1). It recreates the UI of every page: the landing page, the catalogue, checkout, and the trader, provider and admin dashboards. It needs no PHP, database or server at runtime.

## Run

```bash
npm install
npm run dev       # http://localhost:5173
npm run build     # outputs dist/
npm run preview   # serves dist/ locally
```

## Deploy to Cloudflare Pages

- Build command: `npm run build`
- Build output directory: `dist`

The app uses client-side routing (React Router). Cloudflare Pages treats a project without a top-level `404.html` as a single-page app, so deep links such as `/dashboard/services` work without extra configuration.

## Demo accounts

On `/login`, choose one of the demo accounts (any password works):

| Account | Shows |
|---|---|
| `trader@terpaling.test` | Customer with active, expired and cancelled products, bookings and orders |
| `provider@terpaling.test` | Approved provider (Pusaka Capital) with published, draft, pending and rejected products |
| `admin@terpaling.test` | Admin console with review queues |
| `applicant@terpaling.test` | Pending provider application |
| `newtrader@terpaling.test` | Customer with no purchases (empty states) |
| `newprovider@terpaling.test` | Approved provider with no products |
| `advertiser@terpaling.test` | Advertiser with active, completed, draft and returned campaigns |

Changes you make (checkouts, approvals, uploads and so on) are saved in your browser's `localStorage`. To restore the original data, open the user menu and choose **Reset demo data**.

## Structure

```text
src/
├── App.jsx               route table (mirrors routes/web.php)
├── main.jsx              entry: router, store, toasts
├── components/
│   ├── ui/               Flux stand-ins (Button, Input, Select, Modal, Dropdown, Tabs…) + Heroicons registry
│   ├── AiSupportWidget   chat widget (offline knowledge base)
│   ├── Cards, AppLogo, UserMenu, Guards, Feedback (toasts + confirm dialog)
├── layouts/              PublicLayout, AppLayout (sidebar dashboards), AuthLayout
├── pages/                landing, catalog, checkout, auth, customer, settings, provider, admin, errors
├── data/
│   ├── seed.js           mock database (dates relative to "now")
│   ├── store.jsx         React context + simulated domain actions (app/Actions/*)
│   ├── queries.js        relations, scopes and access checks
│   ├── enums.js          labels, tones and rules from app/Enums/*
│   ├── navigation.js     sidebar items (App\Support\Navigation)
│   └── aiKnowledge.js    AI support answers (resources/ai-support/knowledge.php)
├── hooks/                useTitle, usePerform, useQueryState, usePaginated, useProvider
├── utils/format.js       money (sen), dates, formatting helpers
└── styles/
    ├── app.css           Tailwind 4 theme + tt-* utilities (from resources/css/app.css)
    ├── landing.css       original landing CSS, scoped to .lp at build time (vite.config.js)
    └── ai-support.css    original widget CSS
```

## Advertising module

Businesses can buy clearly labelled sponsored placements (not an investment, no guaranteed results).

| Route | Purpose |
|---|---|
| `/advertise` | Public page: why advertise, the four placements, illustrative packages |
| `/advertise/apply` | Application form (sign-in required); accepts `?package=`, `?placement=`, `?edit=AD-…` |
| `/dashboard/advertising` | Advertiser dashboard; `/dashboard/advertising/:reference` for one campaign |
| `/admin/advertising` | Admin: overview, applications, campaigns, packages; `/admin/advertising/:reference` to review and manage |

- Data: `src/data/advertising.js` (placements, statuses, packages, mock campaigns); actions in `src/data/store.jsx`.
- Reusable placements in `src/components/sponsored/`: `SponsoredBanner`, `SponsoredListingCard`, `FeaturedBrandCard`, `SponsoredAnnouncement` (data via props, always labelled "Sponsored").
- Live placements appear only for active, paid campaigns within their dates: landing (banner), Explore Services (one listing), Providers (featured brand), trader overview (announcement).
- Package prices are illustrative draft pricing subject to administrator approval. Payments, invoices, creative uploads and ad delivery are simulated.

## What is simulated

There is no backend. The following behave like the Laravel app but run entirely in the browser:

- **Sign-in and registration.** Demo personas; passwords are not checked. Email verification, password reset, 2FA and passkeys are UI-only.
- **Payments.** Checkout goes to the test payment page (Approve / Decline), then creates the order, subscription, provider earning and notifications.
- **File uploads and downloads.** Uploads record the file name and size only. Download buttons count the download and show a toast; no file is transferred.
- **Workflows.** Provider applications, product review, payouts, moderation and suspensions follow the same rules and error messages as `app/Actions/*`, and are written to the audit log.
- **AI Support.** Answers come from keyword matching against the platform knowledge base, not from OpenAI.

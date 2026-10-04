/* Public advertising page: why advertise, placements, illustrative packages. */
import { useState } from 'react';
import { AdDemoNotice } from '../../components/sponsored/AdParts';
import { SAMPLE_AD, SponsoredPlacement } from '../../components/sponsored';
import { Button, Icon, Modal } from '../../components/ui';
import { AD_PLACEMENTS } from '../../data/advertising';
import { useStore } from '../../data/store';
import { useTitle } from '../../hooks/useTitle';
import { cx, money } from '../../utils/format';

const REASONS = [
    ['users', 'Targeted trading audience', 'Reach people who come to the platform specifically to find trading education, tools and services.'],
    ['rectangle-group', 'Multiple advertising placements', 'Choose banners, sponsored listings, featured-brand slots or community announcements.'],
    ['squares-2x2', 'Campaign management', 'Apply, follow review and manage every campaign from your own advertising dashboard.'],
    ['check-badge', 'Transparent campaign statuses', 'See exactly where each campaign is: under review, approved, scheduled, live or completed.'],
    ['megaphone', 'Brand visibility within the community', 'Present your brand alongside reviewed providers, always clearly labelled as sponsored.'],
];

const STEPS = [
    ['Apply', 'Submit your brand, placement, package and creative.'],
    ['Platform review', 'We check claims and creative against our advertising standards.'],
    ['Payment', 'Approved campaigns are invoiced before they are scheduled.'],
    ['Go live', 'Your sponsored placement runs for the agreed dates.'],
];

export default function Advertise() {
    useTitle('Advertise');
    const { db } = useStore();
    const [details, setDetails] = useState(null);
    const packages = db.adPackages.filter((p) => p.is_active);
    const scrollTo = (id) => document.getElementById(id)?.scrollIntoView({ behavior: 'smooth', block: 'start' });

    return (
        <div>
            {/* Hero */}
            <section className="border-b border-zinc-200 bg-white">
                <div className="mx-auto grid max-w-7xl gap-10 px-4 py-12 sm:px-6 lg:grid-cols-[minmax(0,1.1fr)_minmax(0,1fr)] lg:items-center lg:px-10 lg:py-16">
                    <div>
                        <span className="tt-eyebrow">Advertise on Terpaling Trader</span>
                        <h1 className="mt-2 text-3xl font-semibold tracking-tight text-zinc-900 sm:text-[44px] sm:leading-[1.08]">Reach the Trading Community</h1>
                        <p className="mt-4 max-w-xl text-[17px] leading-relaxed text-zinc-600">
                            Brokers, prop firms, tool builders, educators and trading communities can promote their products and services to the Terpaling Trader audience through clearly labelled sponsored placements.
                        </p>
                        <div className="mt-7 flex flex-wrap gap-3">
                            <Button variant="primary" iconTrailing="arrow-right" href="/advertise/apply">
                                Start Advertising
                            </Button>
                            <Button onClick={() => scrollTo('placements')}>Explore Ad Placements</Button>
                        </div>
                        <p className="mt-5 text-xs leading-relaxed text-zinc-500">Advertising buys promotional placement only. It is not an investment, does not give any ownership in Terpaling Trader and does not guarantee results.</p>
                    </div>
                    <div className="grid gap-3">
                        <SponsoredPlacement placement="featured_brand" ad={SAMPLE_AD} preview />
                        <SponsoredPlacement placement="sponsored_announcement" ad={SAMPLE_AD} preview />
                        <p className="text-center text-xs text-zinc-400">Example placements · sample content</p>
                    </div>
                </div>
            </section>

            <div className="mx-auto grid max-w-7xl gap-16 px-4 py-12 sm:px-6 lg:px-10">
                <AdDemoNotice />

                {/* Audience (no invented figures) */}
                <section className="grid gap-4 sm:grid-cols-3" aria-label="Audience figures">
                    {['Monthly visitors', 'Registered traders', 'Audience report'].map((label) => (
                        <div key={label} className="tt-card grid gap-1 p-5">
                            <span className="text-sm font-medium text-zinc-500">{label}</span>
                            <span className="text-[22px] font-semibold tracking-tight text-zinc-300">Coming soon</span>
                            <span className="text-xs text-zinc-400">Published once audited figures are available.</span>
                        </div>
                    ))}
                </section>

                {/* Why advertise */}
                <section className="grid gap-6" aria-labelledby="why-title">
                    <div className="grid max-w-2xl gap-1.5">
                        <span className="tt-eyebrow">Why advertise with us?</span>
                        <h2 id="why-title" className="text-2xl font-semibold tracking-tight text-zinc-900">Promotion inside a curated trading platform</h2>
                    </div>
                    <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
                        {REASONS.map(([icon, title, text]) => (
                            <div key={title} className="tt-card grid content-start gap-3 p-5">
                                <span className="tt-icon-tile">
                                    <Icon name={icon} variant="mini" className="size-5" />
                                </span>
                                <h3 className="font-semibold text-zinc-900">{title}</h3>
                                <p className="text-sm leading-relaxed text-zinc-600">{text}</p>
                            </div>
                        ))}
                    </div>
                </section>

                {/* Placements */}
                <section id="placements" className="grid scroll-mt-24 gap-6" aria-labelledby="placements-title">
                    <div className="grid max-w-2xl gap-1.5">
                        <span className="tt-eyebrow">Advertising opportunities</span>
                        <h2 id="placements-title" className="text-2xl font-semibold tracking-tight text-zinc-900">Ad placements</h2>
                        <p className="text-[15px] text-zinc-500">Every placement carries a visible &quot;Sponsored&quot; label so traders can always tell advertising from platform content.</p>
                    </div>
                    <div className="grid gap-5 lg:grid-cols-2">
                        {Object.entries(AD_PLACEMENTS).map(([key, p], i) => (
                            <article key={key} className="tt-card flex flex-col overflow-hidden">
                                <div className="flex items-start gap-3 p-5">
                                    <span className="tt-icon-tile">
                                        <Icon name={p.icon} variant="mini" className="size-5" />
                                    </span>
                                    <div className="min-w-0">
                                        <p className="text-xs font-semibold text-zinc-400">{String.fromCharCode(65 + i)}</p>
                                        <h3 className="font-semibold text-zinc-900">{p.label}</h3>
                                        <p className="mt-1 text-sm text-zinc-600">{p.description}</p>
                                    </div>
                                </div>
                                <div className="pointer-events-none mx-5 max-h-80 overflow-hidden rounded-lg border border-dashed border-zinc-300 bg-canvas p-3 select-none" aria-hidden="true">
                                    <div className={cx(key === 'sponsored_listing' && 'mx-auto max-w-xs')}>
                                        <SponsoredPlacement placement={key} ad={SAMPLE_AD} preview />
                                    </div>
                                </div>
                                <div className="mt-auto flex flex-wrap items-center justify-between gap-3 p-5">
                                    <span className="text-xs text-zinc-500">Shown on: {p.where}</span>
                                    <div className="flex gap-2">
                                        <Button size="sm" variant="ghost" onClick={() => setDetails(key)}>
                                            View Details
                                        </Button>
                                        <Button size="sm" href={`/advertise/apply?placement=${key}`}>
                                            Select Placement
                                        </Button>
                                    </div>
                                </div>
                            </article>
                        ))}
                    </div>
                </section>

                {/* Packages */}
                <section id="packages" className="grid scroll-mt-24 gap-6" aria-labelledby="packages-title">
                    <div className="flex flex-wrap items-end justify-between gap-4">
                        <div className="grid max-w-2xl gap-1.5">
                            <span className="tt-eyebrow">Advertising packages</span>
                            <h2 id="packages-title" className="text-2xl font-semibold tracking-tight text-zinc-900">Choose a starting package</h2>
                        </div>
                        <span className="inline-flex items-center gap-1.5 rounded-full bg-amber-50 px-3 py-1 text-xs font-medium text-amber-800 ring-1 ring-amber-600/20 ring-inset">
                            <Icon name="information-circle" variant="micro" />
                            Illustrative draft pricing · subject to administrator approval
                        </span>
                    </div>
                    {packages.length === 0 ? (
                        <p className="rounded-xl border border-dashed border-zinc-300 bg-white px-5 py-6 text-sm text-zinc-500">No packages are available right now.</p>
                    ) : (
                        <div className="grid gap-5 md:grid-cols-2 xl:grid-cols-3">
                            {packages.map((pkg) => (
                                <div key={pkg.id} className={cx('tt-card flex flex-col gap-5 p-6', pkg.highlighted && 'border-brand-line ring-1 ring-brand-line')}>
                                    <div className="flex items-start justify-between gap-3">
                                        <div>
                                            <h3 className="text-lg font-semibold text-zinc-900">{pkg.name}</h3>
                                            <p className="mt-1 text-sm text-zinc-500">{pkg.description}</p>
                                        </div>
                                        {pkg.highlighted && <span className="rounded-full bg-brand-soft px-2.5 py-0.5 text-xs font-semibold text-brand">Popular</span>}
                                    </div>
                                    <div>
                                        <p className="flex items-baseline gap-1.5">
                                            <span className="text-3xl font-semibold tracking-tight text-zinc-900 tabular-nums">{money(pkg.price_minor, 'MYR', false)}</span>
                                            <span className="text-sm text-zinc-500">/ {pkg.duration_days} days</span>
                                        </p>
                                        <p className="mt-1 text-xs text-amber-700">Illustrative price, not an approved rate</p>
                                    </div>
                                    <div className="flex flex-wrap gap-1.5">
                                        {pkg.placements.map((pl) => (
                                            <span key={pl} className="tt-tag">
                                                {AD_PLACEMENTS[pl].label}
                                            </span>
                                        ))}
                                    </div>
                                    <ul className="grid gap-2 text-sm text-zinc-700">
                                        {pkg.features.map((f) => (
                                            <li key={f} className="flex gap-2.5">
                                                <Icon name="check" variant="micro" className="mt-0.5 text-green-600" />
                                                {f}
                                            </li>
                                        ))}
                                    </ul>
                                    <Button variant={pkg.highlighted ? 'primary' : 'outline'} className="mt-auto" href={`/advertise/apply?package=${pkg.id}`}>
                                        Select {pkg.name}
                                    </Button>
                                </div>
                            ))}
                        </div>
                    )}
                    <p className="text-sm text-zinc-500">Packages buy placement for the stated period only. Terpaling Trader does not promise impressions, clicks, leads, sales or any financial return.</p>
                </section>

                {/* Process + standards */}
                <section className="grid gap-6 lg:grid-cols-[minmax(0,1.3fr)_minmax(0,1fr)]">
                    <div className="tt-card p-6">
                        <h2 className="text-lg font-semibold text-zinc-900">How it works</h2>
                        <ol className="mt-5 grid gap-5 sm:grid-cols-2">
                            {STEPS.map(([title, text], i) => (
                                <li key={title} className="flex gap-3">
                                    <span className="grid size-8 shrink-0 place-items-center rounded-full border border-zinc-200 text-xs font-semibold text-zinc-600 tabular-nums">{i + 1}</span>
                                    <div>
                                        <p className="font-medium text-zinc-900">{title}</p>
                                        <p className="text-sm text-zinc-500">{text}</p>
                                    </div>
                                </li>
                            ))}
                        </ol>
                    </div>
                    <div className="tt-card grid content-start gap-3 p-6">
                        <h2 className="text-lg font-semibold text-zinc-900">Advertising standards</h2>
                        {['No guaranteed profits, "risk-free" or "never lose" claims', 'Licensing details shown where your business is regulated', 'Every creative is reviewed before it is published', 'Sponsored content is always labelled as advertising'].map((t) => (
                            <p key={t} className="flex gap-2.5 text-sm text-zinc-700">
                                <Icon name="shield-check" variant="mini" className="shrink-0 text-brand" />
                                {t}
                            </p>
                        ))}
                        <Button variant="primary" className="mt-2" href="/advertise/apply">
                            Start Advertising
                        </Button>
                    </div>
                </section>
            </div>

            <Modal open={!!details} onClose={() => setDetails(null)} className="max-w-2xl">
                {details && (
                    <div className="grid gap-5">
                        <div className="pr-6">
                            <span className="tt-eyebrow">Placement details</span>
                            <h2 className="mt-1 text-xl font-semibold text-zinc-900">{AD_PLACEMENTS[details].label}</h2>
                            <p className="mt-2 text-sm text-zinc-600">{AD_PLACEMENTS[details].description}</p>
                        </div>
                        <dl className="grid grid-cols-[auto_1fr] gap-x-6 gap-y-2 text-sm">
                            <dt className="text-zinc-500">Shown on</dt>
                            <dd>{AD_PLACEMENTS[details].where}</dd>
                            <dt className="text-zinc-500">Included in</dt>
                            <dd>{db.adPackages.filter((p) => p.is_active && p.placements.includes(details)).map((p) => p.name).join(', ') || 'No active package'}</dd>
                            <dt className="text-zinc-500">Label</dt>
                            <dd>Always marked &quot;Sponsored&quot;</dd>
                        </dl>
                        <div className="rounded-lg border border-dashed border-zinc-300 bg-canvas p-4">
                            <SponsoredPlacement placement={details} ad={SAMPLE_AD} preview />
                        </div>
                        <div className="flex justify-end gap-2">
                            <Button onClick={() => setDetails(null)}>Close</Button>
                            <Button variant="primary" href={`/advertise/apply?placement=${details}`}>
                                Select Placement
                            </Button>
                        </div>
                    </div>
                )}
            </Modal>
        </div>
    );
}

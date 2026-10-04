/*
 * Sponsored placements. Every component takes an `ad` (an advertising
 * campaign record) via props, carries a visible "Sponsored" label and marks
 * outbound links rel="sponsored". `preview` renders the placement without a
 * live link, for the advertise page, application form and admin review.
 *
 * Icon sizes use `!` so the components render the same inside the landing
 * page, whose scoped stylesheet sets a default size on every svg.
 */
import { AD_CATEGORIES } from '../../data/advertising';
import { cx, initials } from '../../utils/format';
import { Icon } from '../ui';

export function SponsoredLabel({ className, children = 'Sponsored' }) {
    return (
        <span
            className={cx('inline-flex items-center gap-1 rounded-md border border-amber-200 bg-amber-50 px-1.5 py-0.5 text-[11px] font-semibold tracking-wide text-amber-800 uppercase', className)}
            title="Paid advertising. Advertisers are reviewed, but Terpaling Trader does not endorse their products."
        >
            <Icon name="megaphone" variant="micro" className="size-3!" />
            {children}
        </span>
    );
}

/** The uploaded creative, or a neutral placeholder tile built from the brand. */
export function AdCreative({ ad, className }) {
    if (ad.creative) return <img src={ad.creative} alt={`${ad.company} advertisement`} className={cx('object-cover', className)} />;
    return (
        <div className={cx('grid place-items-center bg-zinc-50', className)} aria-hidden="true">
            <div className="grid justify-items-center gap-2 p-4 text-center">
                <span className="grid size-12 place-items-center rounded-xl text-base font-bold text-white" style={{ background: ad.accent ?? '#2563eb' }}>
                    {initials(ad.company || 'Ad')}
                </span>
                <span className="text-[11px] font-medium tracking-wide text-zinc-400 uppercase">Creative placeholder</span>
            </div>
        </div>
    );
}

function AdLink({ ad, preview, className, children }) {
    const cls = cx('inline-flex items-center gap-1.5 font-semibold transition-colors', className);
    if (preview || !ad.website) {
        return (
            <span className={cls} aria-disabled="true">
                {children}
            </span>
        );
    }
    return (
        <a href={ad.website} target="_blank" rel="sponsored noopener noreferrer" className={cls}>
            {children}
        </a>
    );
}

/** Featured Banner — wide placement for brand awareness. */
export function SponsoredBanner({ ad, preview = false, className }) {
    return (
        <aside aria-label={`Sponsored: ${ad.company}`} className={cx('tt-card overflow-hidden', className)}>
            <div className="grid sm:grid-cols-[minmax(0,1fr)_260px]">
                <div className="grid content-center gap-3 p-6 sm:p-8">
                    <div className="flex flex-wrap items-center gap-2">
                        <SponsoredLabel />
                        <span className="text-xs text-zinc-500">{AD_CATEGORIES[ad.category]}</span>
                    </div>
                    <p className="text-xl leading-snug font-semibold tracking-tight text-zinc-900">{ad.company}</p>
                    <p className="max-w-2xl text-sm leading-relaxed text-zinc-600">{ad.description}</p>
                    <div>
                        <AdLink ad={ad} preview={preview} className="rounded-lg bg-zinc-900 px-4 py-2 text-sm text-white hover:bg-zinc-700">
                            {ad.cta_label || 'Learn more'}
                            <Icon name="arrow-top-right-on-square" variant="micro" className="size-4!" />
                        </AdLink>
                    </div>
                </div>
                <AdCreative ad={ad} className="h-40 border-t border-zinc-200 sm:h-full sm:border-t-0 sm:border-l" />
            </div>
        </aside>
    );
}

/**
 * Sponsored Listing — same footprint as ServiceCard. `horizontal` lays it out
 * as a full-width strip, used under the Explore Services filters.
 */
export function SponsoredListingCard({ ad, preview = false, horizontal = false, className }) {
    if (horizontal) {
        return (
            <article aria-label={`Sponsored: ${ad.company}`} className={cx('tt-card flex min-w-0 flex-col overflow-hidden border-amber-200 sm:flex-row', className)}>
                <AdCreative ad={ad} className="h-28 shrink-0 border-b border-zinc-200 sm:h-auto sm:w-48 sm:border-r sm:border-b-0" />
                <div className="flex min-w-0 flex-1 flex-col gap-4 p-5 sm:flex-row sm:items-center">
                    <div className="min-w-0 flex-1">
                        <div className="flex flex-wrap items-center gap-2">
                            <SponsoredLabel />
                            <span className="truncate text-xs text-zinc-500">{AD_CATEGORIES[ad.category]}</span>
                        </div>
                        <h3 className="mt-2 text-[17px] leading-snug font-semibold text-zinc-900">{ad.company}</h3>
                        <p className="mt-1 line-clamp-2 text-sm leading-relaxed text-zinc-600">{ad.description}</p>
                    </div>
                    <AdLink ad={ad} preview={preview} className="shrink-0 rounded-lg border border-zinc-200 bg-white px-3.5 py-2 text-sm text-zinc-800 shadow-xs hover:bg-zinc-50">
                        {ad.cta_label || 'Learn more'}
                        <Icon name="arrow-top-right-on-square" variant="micro" className="size-4! text-zinc-400" />
                    </AdLink>
                </div>
            </article>
        );
    }
    return (
        <article aria-label={`Sponsored: ${ad.company}`} className={cx('tt-card flex min-w-0 flex-col overflow-hidden border-amber-200', className)}>
            <AdCreative ad={ad} className="h-28 border-b border-zinc-200" />
            <div className="flex flex-1 flex-col p-5">
                <div className="flex items-center justify-between gap-2">
                    <SponsoredLabel />
                    <span className="truncate text-xs text-zinc-500">{AD_CATEGORIES[ad.category]}</span>
                </div>
                <h3 className="mt-3 text-[17px] leading-snug font-semibold text-zinc-900">{ad.company}</h3>
                <p className="mt-2 line-clamp-3 text-sm leading-relaxed text-zinc-600">{ad.description}</p>
                <div className="mt-auto flex items-center justify-between gap-3 border-t border-zinc-100 pt-4">
                    <span className="text-xs text-zinc-400">Advertisement</span>
                    <AdLink ad={ad} preview={preview} className="text-sm text-brand hover:text-brand-hover">
                        {ad.cta_label || 'Learn more'}
                        <Icon name="arrow-top-right-on-square" variant="micro" className="size-4!" />
                    </AdLink>
                </div>
            </div>
        </article>
    );
}

/** Featured Brand — introduces a business and its main offering. */
export function FeaturedBrandCard({ ad, preview = false, className }) {
    return (
        <aside aria-label={`Sponsored: ${ad.company}`} className={cx('tt-card flex flex-col gap-4 p-5 sm:flex-row sm:items-center', className)}>
            <span className="grid size-14 shrink-0 place-items-center overflow-hidden rounded-xl text-lg font-bold text-white" style={{ background: ad.accent ?? '#2563eb' }}>
                {ad.creative ? <img src={ad.creative} alt="" className="size-full object-cover" /> : initials(ad.company || 'Ad')}
            </span>
            <div className="min-w-0 flex-1">
                <div className="flex flex-wrap items-center gap-2">
                    <SponsoredLabel>Featured brand · Sponsored</SponsoredLabel>
                </div>
                <p className="mt-1.5 font-semibold text-zinc-900">{ad.company}</p>
                <p className="line-clamp-2 text-sm text-zinc-600">{ad.description}</p>
            </div>
            <AdLink ad={ad} preview={preview} className="shrink-0 rounded-lg border border-zinc-200 bg-white px-3.5 py-2 text-sm text-zinc-800 shadow-xs hover:bg-zinc-50">
                {ad.cta_label || 'Visit website'}
                <Icon name="arrow-top-right-on-square" variant="micro" className="size-4! text-zinc-400" />
            </AdLink>
        </aside>
    );
}

/** Sponsored Announcement — a promotional notice in a community/update area. */
export function SponsoredAnnouncement({ ad, preview = false, className }) {
    return (
        <aside aria-label={`Sponsored: ${ad.company}`} className={cx('tt-card overflow-hidden', className)}>
            <div className="flex items-center justify-between gap-3 border-b border-zinc-200 px-5 py-3">
                <span className="text-xs font-medium text-zinc-500">Community announcement</span>
                <SponsoredLabel />
            </div>
            <div className="flex gap-3 px-5 py-4">
                <span className="grid size-9 shrink-0 place-items-center rounded-full text-xs font-bold text-white" style={{ background: ad.accent ?? '#2563eb' }}>
                    {initials(ad.company || 'Ad')}
                </span>
                <div className="min-w-0">
                    <p className="text-sm font-semibold text-zinc-900">{ad.company}</p>
                    <p className="mt-0.5 text-sm leading-relaxed text-zinc-600">{ad.description}</p>
                    <AdLink ad={ad} preview={preview} className="mt-2 text-sm text-brand hover:text-brand-hover">
                        {ad.cta_label || 'Find out more'}
                        <Icon name="arrow-right" variant="micro" className="size-4!" />
                    </AdLink>
                </div>
            </div>
        </aside>
    );
}

const COMPONENTS = { featured_banner: SponsoredBanner, sponsored_listing: SponsoredListingCard, featured_brand: FeaturedBrandCard, sponsored_announcement: SponsoredAnnouncement };

/** Renders the right component for a placement key. */
export function SponsoredPlacement({ placement, ad, preview, className }) {
    const Cmp = COMPONENTS[placement] ?? SponsoredListingCard;
    return <Cmp ad={ad} preview={preview} className={className} />;
}

/** Sample data for previews on the advertise page (clearly an example). */
export const SAMPLE_AD = {
    company: 'Your Brand',
    category: 'trading_tools',
    description: 'A short description of your product or service, reviewed by the platform team before it goes live.',
    cta_label: 'Learn more',
    accent: '#2563eb',
    creative: null,
    website: null,
};

/* Shared pieces for advertiser and admin campaign views. */
import { AD_CATEGORIES, AD_OBJECTIVES, AD_PLACEMENTS, adPaymentStatus, adStatus } from '../../data/advertising';
import { userOf } from '../../data/queries';
import { cx, fmtDate, fmtDateTime, money } from '../../utils/format';
import { Icon, Status } from '../ui';

export const campaignName = (c) => `${c.company} — ${AD_OBJECTIVES[c.objective] ?? 'Campaign'}`;

export function AdStatusPair({ campaign, className }) {
    return (
        <span className={cx('flex flex-wrap items-center gap-1.5', className)}>
            <Status value={adStatus(campaign.status)} />
            <Status value={adPaymentStatus(campaign.payment_status)} />
        </span>
    );
}

export function AdDetails({ campaign, pkg, account = null }) {
    const rows = [
        ['Reference', <span className="tabular-nums">{campaign.reference}</span>],
        ['Company / brand', campaign.company],
        ['Business category', AD_CATEGORIES[campaign.category]],
        ['Contact person', campaign.contact_person],
        ['Business email', campaign.email],
        ['Contact number', campaign.phone],
        [
            'Website',
            campaign.website ? (
                <a href={campaign.website} target="_blank" rel="noopener noreferrer" className="tt-link break-all">
                    {campaign.website}
                </a>
            ) : (
                '—'
            ),
        ],
        ['Placement', AD_PLACEMENTS[campaign.placement]?.label],
        ['Package', pkg ? `${pkg.name} · ${money(campaign.price_minor)} (illustrative)` : '—'],
        ['Campaign dates', campaign.start_date ? `${fmtDate(campaign.start_date)} – ${fmtDate(campaign.end_date)} · ${campaign.duration_days} days` : '—'],
        ['Objective', AD_OBJECTIVES[campaign.objective]],
        ['Submitted', fmtDateTime(campaign.created_at)],
    ];
    if (account) rows.splice(2, 0, ['Platform account', `${account.name} · ${account.email}`]);
    return (
        <dl className="grid grid-cols-1 gap-x-6 gap-y-1 text-sm sm:grid-cols-[auto_1fr] sm:gap-y-2.5">
            {rows.map(([k, v]) => (
                <div key={k} className="contents">
                    <dt className="text-zinc-500 max-sm:mt-2">{k}</dt>
                    <dd className="text-zinc-800">{v || '—'}</dd>
                </div>
            ))}
        </dl>
    );
}

export function AdTimeline({ campaign, db }) {
    const items = [...campaign.history].reverse();
    return (
        <ol className="grid gap-4">
            {items.map((h, i) => (
                <li key={i} className="flex gap-3">
                    <span className={cx('mt-0.5 grid size-6 shrink-0 place-items-center rounded-full', i === 0 ? 'bg-brand-soft text-brand' : 'bg-zinc-100 text-zinc-400')}>
                        <Icon name="check" variant="micro" className="size-3.5" />
                    </span>
                    <div className="min-w-0 text-sm">
                        <p className="font-medium text-zinc-900">{adStatus(h.status).label}</p>
                        {h.note && <p className="text-zinc-600">{h.note}</p>}
                        <p className="text-xs text-zinc-400 tabular-nums">
                            {fmtDateTime(h.at)}
                            {h.by ? ` · ${userOf(db, h.by)?.name ?? 'User'}` : ''}
                        </p>
                    </div>
                </li>
            ))}
        </ol>
    );
}

/** Banner explaining that the module is a static demo. */
export function AdDemoNotice({ className }) {
    return (
        <div className={cx('flex gap-3 rounded-xl border border-zinc-200 bg-zinc-50 p-4 text-sm text-zinc-600', className)}>
            <Icon name="information-circle" variant="mini" className="mt-px text-zinc-400" />
            <p>
                <b className="font-semibold text-zinc-800">Demo module.</b> Applications, payments and campaign statuses are simulated in your browser. Nothing is sent to Terpaling Trader, no files are uploaded and no
                payment is taken. Prices shown are illustrative draft pricing, subject to administrator approval.
            </p>
        </div>
    );
}

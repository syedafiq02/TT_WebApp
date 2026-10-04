/* x-tt.service-card and x-tt.provider-card */
import { Link } from 'react-router-dom';
import { planPrice, planTermLabel, typeIcon, typeLabel } from '../data/enums';
import { categoryById, cheapestPlan, providerById, providerServices, rating } from '../data/queries';
import { useStore } from '../data/store';
import { cx, initials } from '../utils/format';
import { Icon } from './ui';

export function ServiceCard({ service, className }) {
    const { db } = useStore();
    const plan = cheapestPlan(db, service.id);
    const provider = providerById(db, service.provider_id);
    const r = rating(db, service.id);

    return (
        <Link to={`/services/${service.slug}`} className={cx('group tt-card tt-card-interactive flex min-w-0 flex-col p-5', className)}>
            <div className="flex items-center justify-between gap-2">
                <span className="inline-flex items-center gap-1.5 rounded-md bg-brand-soft px-2 py-1 text-xs font-semibold text-brand">
                    <Icon name={typeIcon(service.service_type)} variant="micro" />
                    {typeLabel(service.service_type)}
                </span>
                <span className="inline-flex items-center gap-1 text-xs font-medium text-zinc-500" title="Listing reviewed by the platform team">
                    <Icon name="shield-check" variant="micro" className="text-green-600" /> Reviewed
                </span>
            </div>

            <h3 className="mt-4 text-[17px] leading-snug font-semibold text-zinc-900 transition-colors group-hover:text-brand">{service.title}</h3>
            <div className="mt-1 flex items-center gap-1 text-sm text-zinc-500">
                by {provider.display_name}
                <Icon name="check-badge" variant="micro" className="text-brand" />
            </div>

            <p className="mt-3 line-clamp-2 text-sm leading-relaxed text-zinc-600">{service.short_description}</p>

            <div className="mt-4 mb-5 flex flex-wrap gap-1.5">
                <span className="tt-tag">{categoryById(db, service.category_id)?.name}</span>
                {(service.platforms ?? []).slice(0, 2).map((p) => (
                    <span key={p} className="tt-tag">
                        {p}
                    </span>
                ))}
            </div>

            <div className="mt-auto flex items-end justify-between gap-3 border-t border-zinc-100 pt-4">
                <div className="grid gap-0.5">
                    {plan ? (
                        <>
                            <span className="text-xs text-zinc-500">From</span>
                            <span className="flex items-baseline gap-1">
                                <span className="text-lg font-semibold tracking-tight text-zinc-900 tabular-nums">{planPrice(plan)}</span>
                                <span className="text-xs text-zinc-500">{planTermLabel(plan)}</span>
                            </span>
                        </>
                    ) : (
                        <span className="text-sm text-zinc-500">No plans yet</span>
                    )}
                </div>
                <div className="grid justify-items-end gap-1">
                    {r.count > 0 ? (
                        <span className="flex items-center gap-1 text-xs text-zinc-500">
                            <Icon name="star" variant="micro" className="text-amber-400" />
                            <span className="font-semibold text-zinc-800 tabular-nums">{r.avg.toFixed(1)}</span>({r.count})
                        </span>
                    ) : (
                        <span className="text-xs text-zinc-400">New listing</span>
                    )}
                    <span className="inline-flex items-center gap-1 text-sm font-semibold text-brand">
                        View product <Icon name="arrow-right" variant="micro" className="transition-transform group-hover:translate-x-0.5" />
                    </span>
                </div>
            </div>
        </Link>
    );
}

export function ProviderCard({ provider }) {
    const { db } = useStore();
    const count = providerServices(db, provider.id).filter((s) => s.status === 'published').length;
    return (
        <Link to={`/providers/${provider.slug}`} className="group tt-card tt-card-interactive flex min-w-0 flex-col gap-4 p-5">
            <div className="flex items-center gap-3">
                <span className="relative grid size-12 shrink-0 place-items-center rounded-xl bg-brand-soft text-base font-semibold text-brand">
                    {initials(provider.display_name)}
                    <span className="absolute -right-1 -bottom-1 grid size-5 place-items-center rounded-full border-2 border-white bg-brand text-white">
                        <Icon name="check" variant="micro" className="size-3" />
                    </span>
                </span>
                <div className="min-w-0">
                    <h3 className="truncate text-base font-semibold text-zinc-900 transition-colors group-hover:text-brand">{provider.display_name}</h3>
                    <p className="truncate text-sm text-zinc-500">{provider.specialisation || 'Trading services'}</p>
                </div>
            </div>
            <span className="inline-flex w-max items-center gap-1 rounded-full bg-blue-50 px-2.5 py-0.5 text-xs font-medium text-blue-700 ring-1 ring-blue-600/15 ring-inset">
                <Icon name="check-badge" variant="micro" /> Verified Provider
            </span>
            {provider.headline && <p className="line-clamp-2 text-sm leading-relaxed text-zinc-600">{provider.headline}</p>}
            <div className="mt-auto flex gap-6 border-t border-zinc-100 pt-4 text-xs text-zinc-500">
                <span className="grid gap-0.5">
                    <b className="text-sm font-semibold text-zinc-900 tabular-nums">{count}</b>Services
                </span>
                {provider.experience_years ? (
                    <span className="grid gap-0.5">
                        <b className="text-sm font-semibold text-zinc-900 tabular-nums">{provider.experience_years} yrs</b>Experience
                    </span>
                ) : null}
            </div>
        </Link>
    );
}

/* pages/catalog/show.blade.php — public product page */
import { Link, useParams } from 'react-router-dom';
import { Button, Callout, Crumbs, Icon } from '../../components/ui';
import { CONTENT_TYPES, ENTITLEMENTS, planPrice, planTerm, planTermLabel, termLabel, termVerb, typeIcon, typeLabel } from '../../data/enums';
import { activePlans, categoryById, hasAnyAccess, providerById, providerForUser, rating, serviceBySlug, sortByDesc, userOf } from '../../data/queries';
import { useStore } from '../../data/store';
import { useTitle } from '../../hooks/useTitle';
import { cx, fmtDate, initials, plural } from '../../utils/format';
import ErrorPage from '../errors/ErrorPage';

export default function ServiceShow() {
    const { slug } = useParams();
    const { db, user } = useStore();
    const service = serviceBySlug(db, slug);
    useTitle(service?.title);

    if (!service) return <ErrorPage code={404} />;

    const provider = providerById(db, service.provider_id);
    const isPublished = service.status === 'published' && provider.status === 'approved';
    const isOwnerOrAdmin = user && (user.role === 'admin' || providerForUser(db, user.id)?.id === provider.id);
    if (!isPublished && !isOwnerOrAdmin) return <ErrorPage code={404} />;

    const category = categoryById(db, service.category_id);
    const parent = category.parent_id ? categoryById(db, category.parent_id) : null;
    const plans = activePlans(db, service.id);
    const access = user && hasAnyAccess(db, user.id, service);
    const r = rating(db, service.id);
    const reviews = sortByDesc(
        db.reviews.filter((x) => x.service_id === service.id && x.status === 'published'),
        'created_at',
    ).slice(0, 6);
    const previews = db.contents.filter((c) => c.service_id === service.id && c.status === 'published' && c.is_preview).slice(0, 3);

    return (
        <div>
            {!isPublished && (
                <div className="border-b border-amber-200 bg-amber-50">
                    <div className="mx-auto flex max-w-7xl items-center gap-2 px-4 py-2.5 text-sm font-medium text-amber-800 sm:px-6 lg:px-10">
                        <Icon name="eye" variant="micro" /> Preview only. This listing is {service.status.replace('_', ' ')} and not visible to the public.
                    </div>
                </div>
            )}

            <section className="border-b border-zinc-200 bg-white">
                <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-10 lg:py-12">
                    <Crumbs items={[{ label: 'Explore', href: '/services' }, ...(parent ? [{ label: parent.name, href: `/services?category=${parent.slug}` }] : []), { label: category.name }]} />

                    <div className="flex flex-wrap gap-2">
                        <span className="inline-flex items-center gap-1.5 rounded-md bg-brand-soft px-2.5 py-1 text-xs font-semibold text-brand">
                            <Icon name={typeIcon(service.service_type)} variant="micro" />
                            {typeLabel(service.service_type)}
                        </span>
                        <span className="inline-flex items-center gap-1.5 rounded-md bg-zinc-100 px-2.5 py-1 text-xs font-medium text-zinc-700">
                            <Icon name="check-badge" variant="micro" className="text-brand" />
                            Verified provider
                        </span>
                    </div>
                    <h1 className="mt-4 max-w-4xl text-3xl font-semibold tracking-tight text-zinc-900 sm:text-[40px] sm:leading-[1.1]">{service.title}</h1>
                    <p className="mt-3 max-w-2xl text-lg leading-relaxed text-zinc-600">{service.short_description}</p>

                    <div className="mt-6 flex flex-wrap items-center gap-x-6 gap-y-3 text-sm">
                        <Link to={`/providers/${provider.slug}`} className="group flex items-center gap-2.5">
                            <span className="grid size-8 place-items-center rounded-lg bg-brand-soft text-xs font-semibold text-brand">{initials(provider.display_name)}</span>
                            <span className="grid leading-tight">
                                <span className="text-xs text-zinc-500">Provider</span>
                                <span className="font-medium text-zinc-900 group-hover:text-brand">{provider.display_name}</span>
                            </span>
                        </Link>
                        {r.count > 0 && (
                            <span className="flex items-center gap-1.5 text-zinc-500">
                                <Icon name="star" variant="mini" className="text-amber-400" />
                                <span className="font-semibold text-zinc-900 tabular-nums">{r.avg.toFixed(1)}</span> · {r.count} reviews
                            </span>
                        )}
                        {(service.level || service.platforms?.length > 0) && (
                            <span className="flex flex-wrap items-center gap-1.5">
                                {service.level && (
                                    <span className="tt-tag">
                                        <Icon name="academic-cap" variant="micro" />
                                        {service.level}
                                    </span>
                                )}
                                {service.platforms?.map((p) => (
                                    <span key={p} className="tt-tag">
                                        {p}
                                    </span>
                                ))}
                            </span>
                        )}
                    </div>
                </div>
            </section>

            <div className="mx-auto grid max-w-7xl gap-10 px-4 py-10 sm:px-6 lg:grid-cols-[minmax(0,1fr)_380px] lg:px-10">
                <div className="grid min-w-0 content-start gap-10">
                    {service.gallery?.length > 0 && (
                        <section className="grid gap-3 sm:grid-cols-2" aria-label="Product preview">
                            {service.gallery.map((src, i) => (
                                <img key={i} src={src} alt={`${service.title} preview ${i + 1}`} className={cx('aspect-video w-full rounded-xl border border-zinc-200 bg-white object-cover shadow-card', i === 0 && 'sm:col-span-2')} />
                            ))}
                        </section>
                    )}

                    <section className="tt-card grid gap-4 p-6 sm:p-8">
                        <h2 className="tt-section-title">About this product</h2>
                        <div className="max-w-[68ch] leading-relaxed whitespace-pre-line text-zinc-700">{service.description || service.short_description}</div>
                    </section>

                    {service.features?.length > 0 && (
                        <section className="grid gap-4">
                            <h2 className="tt-section-title">What's included</h2>
                            <ul className="grid gap-3 sm:grid-cols-2">
                                {service.features.map((f) => (
                                    <li key={f} className="flex gap-3 rounded-lg border border-zinc-200 bg-white px-4 py-3 text-sm text-zinc-700">
                                        <span className="mt-0.5 grid size-5 shrink-0 place-items-center rounded-full bg-green-50 text-green-600">
                                            <Icon name="check" variant="micro" className="size-3.5" />
                                        </span>
                                        {f}
                                    </li>
                                ))}
                            </ul>
                        </section>
                    )}

                    <section className="grid gap-4">
                        <h2 className="tt-section-title">How you access it</h2>
                        <div className="grid gap-3 sm:grid-cols-2">
                            {service.access_types.map((t) => (
                                <div key={t} className="tt-card flex gap-3 p-4">
                                    <span className="tt-icon-tile size-9">
                                        <Icon name={ENTITLEMENTS[t].icon} variant="mini" />
                                    </span>
                                    <div>
                                        <p className="font-medium text-zinc-900">{ENTITLEMENTS[t].label}</p>
                                        <p className="text-sm text-zinc-500">{ENTITLEMENTS[t].description}</p>
                                    </div>
                                </div>
                            ))}
                        </div>
                        <p className="text-sm text-zinc-500">Buying this product gives you access to {service.title} only, for the period of the plan you choose.</p>
                    </section>

                    {previews.length > 0 && (
                        <section className="grid gap-4">
                            <h2 className="tt-section-title">Free previews</h2>
                            {previews.map((item) => (
                                <div key={item.id} className="tt-card p-5">
                                    <div className="flex flex-wrap items-center gap-2">
                                        <span className="tt-tag">{CONTENT_TYPES[item.type]}</span>
                                        <p className="font-medium text-zinc-900">{item.title}</p>
                                    </div>
                                    {item.summary && <p className="mt-2 text-sm text-zinc-600">{item.summary}</p>}
                                </div>
                            ))}
                        </section>
                    )}

                    <section className="grid gap-4">
                        <h2 className="tt-section-title">Reviews</h2>
                        {reviews.length === 0 ? (
                            <p className="rounded-xl border border-dashed border-zinc-300 bg-white px-5 py-6 text-sm text-zinc-500">No reviews yet. Only verified subscribers can review a service.</p>
                        ) : (
                            reviews.map((rv) => (
                                <div key={rv.id} className="tt-card grid gap-2 p-5">
                                    <div className="flex items-center justify-between text-sm">
                                        <b className="font-medium text-zinc-900">{userOf(db, rv.user_id)?.name}</b>
                                        <span className="text-xs text-zinc-400 tabular-nums">{fmtDate(rv.created_at)}</span>
                                    </div>
                                    <div className="flex gap-0.5">
                                        {[1, 2, 3, 4, 5].map((i) => (
                                            <Icon key={i} name="star" variant="micro" className={i <= rv.rating ? 'text-amber-400' : 'text-zinc-200'} />
                                        ))}
                                    </div>
                                    {rv.body && <p className="text-sm leading-relaxed text-zinc-700">{rv.body}</p>}
                                </div>
                            ))
                        )}
                    </section>

                    {service.faqs?.length > 0 && (
                        <section className="grid gap-4">
                            <h2 className="tt-section-title">FAQ</h2>
                            <div className="tt-card overflow-hidden">
                                {service.faqs.map((f) => (
                                    <details key={f.q} className="group border-b border-zinc-100 px-5 py-4 last:border-0">
                                        <summary className="flex cursor-pointer list-none items-center justify-between gap-4 font-medium text-zinc-900">
                                            {f.q}
                                            <Icon name="plus" variant="micro" className="shrink-0 text-zinc-400 transition-transform group-open:rotate-45" />
                                        </summary>
                                        <p className="mt-3 text-sm whitespace-pre-line text-zinc-600">{f.a}</p>
                                    </details>
                                ))}
                            </div>
                        </section>
                    )}

                    <Callout icon="information-circle" variant="secondary">
                        Trading involves risk. {service.title} provides education and analysis, not personalised investment advice. Results vary and losses can occur.
                    </Callout>
                </div>

                <aside className="lg:sticky lg:top-24 lg:self-start">
                    <div className="tt-card grid gap-5 p-6">
                        <div className="flex items-center justify-between">
                            <h2 className="text-base font-semibold text-zinc-900">Choose a plan</h2>
                            {plans.length > 0 && !access && (
                                <span className="text-xs text-zinc-500">
                                    {plans.length} {plural('option', plans.length)}
                                </span>
                            )}
                        </div>
                        {access ? (
                            <>
                                <div className="flex items-start gap-3 rounded-lg border border-green-200 bg-green-50 p-4">
                                    <Icon name="check-circle" variant="mini" className="mt-0.5 shrink-0 text-green-600" />
                                    <div className="grid gap-0.5">
                                        <p className="text-sm font-semibold text-green-800">Subscription active</p>
                                        <p className="text-sm text-green-700">You already have access to this service.</p>
                                    </div>
                                </div>
                                <Button variant="primary" iconTrailing="arrow-right" href={`/dashboard/services/${service.slug}`}>
                                    Open in your trading hub
                                </Button>
                            </>
                        ) : plans.length === 0 ? (
                            <p className="rounded-lg bg-zinc-50 px-4 py-3 text-sm text-zinc-500">No plans are available right now.</p>
                        ) : (
                            plans.map((plan, i) => (
                                <div key={plan.id} className={cx('grid gap-4 rounded-xl border p-4 transition-colors', i === 0 ? 'border-brand-line bg-brand-soft/40' : 'border-zinc-200 hover:border-zinc-300')}>
                                    <div className="flex items-start justify-between gap-3">
                                        <div className="min-w-0">
                                            <p className="font-semibold text-zinc-900">{plan.name}</p>
                                            <p className="text-xs font-medium text-brand">{termLabel(planTerm(plan))}</p>
                                            {plan.description && <p className="mt-1 text-xs text-zinc-500">{plan.description}</p>}
                                        </div>
                                        <div className="shrink-0 text-right">
                                            <p className="text-xl font-semibold tracking-tight text-zinc-900 tabular-nums">{planPrice(plan)}</p>
                                            <p className="text-xs text-zinc-500">{planTermLabel(plan)}</p>
                                        </div>
                                    </div>
                                    {isPublished && (
                                        <Button size="sm" variant={i === 0 ? 'primary' : 'outline'} href={`/checkout/${plan.id}`}>
                                            {termVerb(planTerm(plan))}
                                        </Button>
                                    )}
                                </div>
                            ))
                        )}
                        <div className="grid gap-3 border-t border-zinc-100 pt-5 text-sm text-zinc-600">
                            <p className="flex gap-2.5">
                                <Icon name="check-badge" variant="mini" className="shrink-0 text-brand" />
                                {provider.display_name} is a verified provider
                            </p>
                            <p className="flex gap-2.5">
                                <Icon name="shield-check" variant="mini" className="shrink-0 text-brand" />
                                Listing reviewed by the platform team
                            </p>
                            <p className="flex gap-2.5">
                                <Icon name="arrow-path" variant="mini" className="shrink-0 text-brand" />
                                Manage or cancel from your dashboard
                            </p>
                        </div>
                    </div>
                </aside>
            </div>
        </div>
    );
}

/*
 * pages/customer/access.blade.php — access hub for ONE product. What it shows
 * is driven by the entitlements the customer holds for this product.
 */
import { useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import { useFeedback } from '../../components/Feedback';
import { Button, Callout, Crumbs, Empty, Icon, Input, Select, Status, Tabs, Textarea } from '../../components/ui';
import { bookingStatus, CONTENT_TYPES, ENTITLEMENTS, subscriptionStatus, termLabel, typeIcon, typeLabel } from '../../data/enums';
import { currentVersion, grantedTypes, latestSubscription, planById, providerById, providerForUser, serviceBySlug, sortByDesc } from '../../data/queries';
import { useStore } from '../../data/store';
import { usePerform } from '../../hooks/usePerform';
import { useQueryState } from '../../hooks/useQueryState';
import { useTitle } from '../../hooks/useTitle';
import { cx, DOWNLOAD_LINK_MINUTES, fmtDate, fmtDateTimeComma, fmtSession, humanFileSize } from '../../utils/format';
import ErrorPage from '../errors/ErrorPage';

export default function Access() {
    const { slug } = useParams();
    const { db, user, actions } = useStore();
    const perform = usePerform();
    const { toast } = useFeedback();
    const service = serviceBySlug(db, slug);
    useTitle(service?.title);

    const [sectionParam, setSection] = useQueryState('section');
    const [openItem, setOpenItem] = useState(null);
    const [downloading, setDownloading] = useState(null);
    const [bookingAt, setBookingAt] = useState('');
    const [bookingNotes, setBookingNotes] = useState('');
    const [bookingError, setBookingError] = useState(null);
    const existingReview = service && db.reviews.find((r) => r.user_id === user.id && r.service_id === service.id);
    const [ratingValue, setRatingValue] = useState(existingReview?.rating ?? 5);
    const [reviewBody, setReviewBody] = useState(existingReview?.body ?? '');

    if (!service) return <ErrorPage code={404} />;

    const provider = providerById(db, service.provider_id);
    let granted = grantedTypes(db, user.id, service);
    const sub = latestSubscription(db, user.id, service.id);
    let lapsed = false;
    let preview = false;
    if (granted.length === 0) {
        if (sub && sub.status !== 'pending') lapsed = true;
        else if (user.role === 'admin' || providerForUser(db, user.id)?.id === provider.id) {
            preview = true;
            granted = service.access_types;
        } else return <ErrorPage code={403} message="You do not have access to this product." action={{ href: `/services/${service.slug}`, label: 'View product' }} />;
    }

    const canReview = !!sub && !preview;
    const section = granted.includes(sectionParam) || (sectionParam === 'review' && canReview) ? sectionParam : granted[0];
    const items = db.contents.filter((c) => c.service_id === service.id && c.status === 'published' && c.required_entitlement === section);
    const sortedItems = section === 'signal_access' ? sortByDesc(items, 'published_at') : items.sort((a, b) => a.sort_order - b.sort_order);
    const files = db.files.filter((f) => f.service_id === service.id && f.is_active && currentVersion(f));
    const bookings = sortByDesc(
        db.bookings.filter((b) => b.user_id === user.id && b.service_id === service.id),
        'scheduled_at',
    );

    const download = (file) => {
        const v = currentVersion(file);
        setDownloading(file.id);
        setTimeout(() => {
            actions.recordDownload(v.id);
            setDownloading(null);
            toast(`Download link for ${v.original_name} created (valid ${DOWNLOAD_LINK_MINUTES} minutes). Static preview: no file is transferred.`);
        }, 700);
    };

    const requestBooking = (e) => {
        e.preventDefault();
        setBookingError(null);
        if (!bookingAt) return setBookingError('The booking at field is required.');
        let failed = null;
        const ok = perform(() => {
            try {
                actions.requestBooking(service.id, bookingAt, bookingNotes);
            } catch (err) {
                failed = err.message;
                throw err;
            }
        }, 'Booking requested. The provider will confirm your session.');
        if (ok) {
            setBookingAt('');
            setBookingNotes('');
        } else setBookingError(failed);
    };

    const tabs = granted.map((t) => ({ value: t, label: ENTITLEMENTS[t].label, icon: ENTITLEMENTS[t].icon }));
    if (canReview) tabs.push({ value: 'review', label: 'Your review', icon: 'star' });

    return (
        <div>
            <Crumbs items={[{ label: 'My Services', href: '/dashboard/services' }, { label: service.title }]} />

            {preview && (
                <Callout variant="warning" icon="eye" className="mb-6">
                    Preview mode. You are viewing this product&apos;s access page as its provider or an admin.
                </Callout>
            )}

            <div className="tt-card overflow-hidden">
                <div className="flex flex-wrap items-center gap-4 p-6">
                    <span className="tt-icon-tile size-14 rounded-xl">
                        <Icon name={typeIcon(service.service_type)} />
                    </span>
                    <div className="min-w-0 flex-1">
                        <p className="tt-eyebrow">{typeLabel(service.service_type)}</p>
                        <h1 className="mt-0.5 text-2xl font-semibold tracking-tight text-zinc-900">{service.title}</h1>
                        <p className="text-sm text-zinc-500">
                            by{' '}
                            <Link to={`/providers/${provider.slug}`} className="font-medium text-zinc-700 hover:text-brand">
                                {provider.display_name}
                            </Link>
                        </p>
                    </div>
                    <Button size="sm" icon="arrow-top-right-on-square" href={`/services/${service.slug}`}>
                        Product page
                    </Button>
                </div>
                {sub && (
                    <dl className="grid grid-cols-2 border-t border-zinc-200 bg-zinc-50/60 sm:grid-cols-4">
                        <div className="grid gap-1.5 px-6 py-4">
                            <dt className="tt-label">Status</dt>
                            <dd>{lapsed ? <Status tone="zinc" label="Expired" /> : <Status value={subscriptionStatus(sub.status)} />}</dd>
                        </div>
                        <div className="grid gap-1.5 border-l border-zinc-200 px-6 py-4">
                            <dt className="tt-label">Plan</dt>
                            <dd className="text-sm font-medium text-zinc-900">{planById(db, sub.plan_id).name}</dd>
                        </div>
                        <div className="grid gap-1.5 border-t border-zinc-200 px-6 py-4 sm:border-t-0 sm:border-l">
                            <dt className="tt-label">Type</dt>
                            <dd className="text-sm font-medium text-zinc-900">{termLabel(sub.term)}</dd>
                        </div>
                        <div className="grid gap-1.5 border-t border-l border-zinc-200 px-6 py-4 sm:border-t-0">
                            <dt className="tt-label">{lapsed ? 'Ended' : sub.auto_renew ? 'Next renewal' : 'Expires'}</dt>
                            <dd className="text-sm font-semibold text-zinc-900 tabular-nums">{sub.expires_at ? fmtDate(sub.expires_at) : 'Never'}</dd>
                        </div>
                    </dl>
                )}
            </div>

            {lapsed ? (
                <div className="tt-card mt-6 grid justify-items-start gap-3 p-6 sm:p-8">
                    <span className="inline-flex items-center gap-1.5 rounded-full bg-zinc-100 px-2.5 py-1 text-xs font-medium text-zinc-600">
                        <Icon name="lock-closed" variant="micro" />
                        Access unavailable
                    </span>
                    <h2 className="text-xl font-semibold text-zinc-900">Your access to {service.title} has ended</h2>
                    <p className="max-w-2xl text-sm leading-relaxed text-zinc-600">Downloads, content and other access for this product are locked. Your other products are not affected. Your history and invoices are kept.</p>
                    {service.status === 'published' && (
                        <Button variant="primary" icon="arrow-path" className="mt-2" href={`/services/${service.slug}`}>
                            Renew subscription
                        </Button>
                    )}
                </div>
            ) : (
                <>
                    <Tabs className="mt-8" tabs={tabs} value={section} onChange={setSection} />

                    <div className="mt-6">
                        {section === 'download_access' &&
                            (files.length === 0 ? (
                                <Empty title="No files available yet" icon="arrow-down-tray">
                                    The provider hasn&apos;t published any files for this product yet.
                                </Empty>
                            ) : (
                                <>
                                    <div className="tt-card overflow-hidden">
                                        <div className="hidden grid-cols-[minmax(0,1fr)_110px_110px_130px_auto] gap-4 border-b border-zinc-200 bg-zinc-50/80 px-5 py-3 text-xs font-medium text-zinc-500 md:grid">
                                            <span>File</span>
                                            <span>Version</span>
                                            <span>Size</span>
                                            <span>Released</span>
                                            <span className="w-32" />
                                        </div>
                                        {files.map((file) => {
                                            const v = currentVersion(file);
                                            const ext = v.original_name.split('.').pop().toUpperCase();
                                            return (
                                                <div key={file.id} className="grid grid-cols-1 gap-4 border-b border-zinc-100 px-5 py-4 last:border-0 md:grid-cols-[minmax(0,1fr)_110px_110px_130px_auto] md:items-center">
                                                    <div className="flex min-w-0 items-start gap-3">
                                                        <span className="tt-icon-tile relative">
                                                            <Icon name="document-arrow-down" variant="mini" />
                                                            <span className="absolute -bottom-1.5 left-1/2 -translate-x-1/2 rounded bg-white px-1 text-[9px] font-bold text-brand ring-1 ring-brand-line">{ext.slice(0, 4)}</span>
                                                        </span>
                                                        <div className="min-w-0">
                                                            <p className="font-semibold text-zinc-900">{file.title}</p>
                                                            <p className="truncate text-xs text-zinc-500">{v.original_name}</p>
                                                            {file.description && <p className="mt-1 text-sm text-zinc-600">{file.description}</p>}
                                                            {v.release_notes && <p className="mt-1 text-xs whitespace-pre-line text-zinc-500">{v.release_notes}</p>}
                                                        </div>
                                                    </div>
                                                    <div className="flex flex-wrap gap-x-4 gap-y-1 text-xs text-zinc-500 md:contents md:text-sm">
                                                        <span>
                                                            <span className="md:hidden">Version </span>
                                                            <span className="rounded-md bg-green-50 px-1.5 py-0.5 font-semibold text-green-700 tabular-nums">v{v.version}</span>
                                                        </span>
                                                        <span className="tabular-nums md:text-zinc-700">{humanFileSize(v.size_bytes)}</span>
                                                        <span className="tabular-nums md:text-zinc-700">
                                                            <span className="md:hidden">Released </span>
                                                            {fmtDate(v.released_at)}
                                                        </span>
                                                    </div>
                                                    <Button variant="primary" icon="arrow-down-tray" className="w-full md:w-32" loading={downloading === file.id} onClick={() => download(file)}>
                                                        Download
                                                    </Button>
                                                </div>
                                            );
                                        })}
                                    </div>
                                    <p className="mt-4 flex items-center gap-2 text-xs text-zinc-500">
                                        <Icon name="lock-closed" variant="micro" className="text-zinc-400" />
                                        Download links are generated for your account and expire after {DOWNLOAD_LINK_MINUTES} minutes.
                                    </p>
                                </>
                            ))}

                        {(section === 'content_access' || section === 'signal_access') &&
                            (sortedItems.length === 0 ? (
                                <Empty title="Nothing published here yet" icon="document-text">
                                    The provider hasn&apos;t published anything in this section. You&apos;ll be notified when they do.
                                </Empty>
                            ) : (
                                <>
                                    <div className="grid gap-3">
                                        {sortedItems.map((item) => {
                                            const isOpen = openItem === item.id || section === 'signal_access';
                                            return (
                                                <div key={item.id} className="tt-card p-5">
                                                    <button className="flex w-full cursor-pointer items-start justify-between gap-4 text-left" onClick={() => setOpenItem(openItem === item.id ? null : item.id)}>
                                                        <div className="min-w-0">
                                                            <div className="flex flex-wrap items-center gap-2">
                                                                <span className="tt-tag">{CONTENT_TYPES[item.type]}</span>
                                                                <p className="font-semibold text-zinc-900">{item.title}</p>
                                                            </div>
                                                            {item.summary && <p className="mt-1.5 text-sm text-zinc-500">{item.summary}</p>}
                                                        </div>
                                                        <span className="flex shrink-0 items-center gap-2 text-xs text-zinc-400 tabular-nums">
                                                            {fmtDateTimeComma(item.published_at)}
                                                            {section !== 'signal_access' && <Icon name="chevron-down" variant="micro" className={cx('transition-transform', openItem === item.id && 'rotate-180')} />}
                                                        </span>
                                                    </button>
                                                    {isOpen && (
                                                        <>
                                                            {item.body && (
                                                                <div className={cx('mt-4 border-t border-zinc-100 pt-4 leading-relaxed whitespace-pre-line text-zinc-700', section === 'signal_access' && 'tt-code border-t-zinc-200 p-4')}>{item.body}</div>
                                                            )}
                                                            {item.external_url && (
                                                                <Button size="sm" className="mt-4" icon="arrow-top-right-on-square" href={item.external_url} external>
                                                                    Open
                                                                </Button>
                                                            )}
                                                        </>
                                                    )}
                                                </div>
                                            );
                                        })}
                                    </div>
                                    {section === 'signal_access' && (
                                        <p className="mt-4 text-xs text-zinc-500">Signals are analysis, not personalised advice. Place trades in your own broker account with your own position sizing; losing trades are part of trading.</p>
                                    )}
                                </>
                            ))}

                        {section === 'external_access' && (
                            <div className="tt-card grid max-w-2xl gap-4 p-6">
                                <div className="flex items-center gap-3">
                                    <span className="tt-icon-tile">
                                        <Icon name="arrow-top-right-on-square" variant="mini" />
                                    </span>
                                    <h2 className="font-semibold text-zinc-900">{service.external_access_label || 'External access'}</h2>
                                </div>
                                {service.external_access_instructions && <p className="text-sm whitespace-pre-line text-zinc-600">{service.external_access_instructions}</p>}
                                {service.external_access_url ? (
                                    <Button variant="primary" icon="arrow-top-right-on-square" href={service.external_access_url} external className="w-max">
                                        {service.external_access_label || 'Open'}
                                    </Button>
                                ) : (
                                    <p className="text-sm text-zinc-500">The provider will share access details here.</p>
                                )}
                                <p className="text-xs text-zinc-500">This access is linked to your subscription to {service.title} and ends when it expires.</p>
                            </div>
                        )}

                        {section === 'license_access' && (
                            <div className="tt-card grid max-w-2xl gap-4 p-6">
                                <div className="flex items-center gap-3">
                                    <span className="tt-icon-tile">
                                        <Icon name="key" variant="mini" />
                                    </span>
                                    <h2 className="font-semibold text-zinc-900">Licence</h2>
                                </div>
                                {sub?.license ? (
                                    <>
                                        <div className="tt-code flex items-center gap-3 px-4 py-3 tracking-wider">
                                            <Icon name="key" variant="mini" className="text-brand" />
                                            <span className="flex-1 select-all">{sub.license.license_key}</span>
                                            <button
                                                className="cursor-pointer text-zinc-400 hover:text-zinc-700"
                                                aria-label="Copy licence key"
                                                onClick={() => {
                                                    navigator.clipboard?.writeText(sub.license.license_key).catch(() => {});
                                                    toast('Licence key copied.');
                                                }}
                                            >
                                                <Icon name="document-duplicate" variant="mini" />
                                            </button>
                                        </div>
                                        <dl className="grid grid-cols-2 gap-y-2.5 text-sm text-zinc-500">
                                            <dt>Status</dt>
                                            <dd className="text-right">
                                                <Status tone="green" label="Active" className="ml-auto" />
                                            </dd>
                                            <dt>Activations</dt>
                                            <dd className="text-right font-medium text-zinc-900 tabular-nums">
                                                {sub.license.activations.length} / {sub.license.activation_limit}
                                            </dd>
                                            <dt>Expires</dt>
                                            <dd className="text-right font-medium text-zinc-900 tabular-nums">{sub.expires_at ? fmtDate(sub.expires_at) : 'Never'}</dd>
                                        </dl>
                                    </>
                                ) : (
                                    <p className="text-sm text-zinc-500">A licence key is issued when you subscribe.</p>
                                )}
                            </div>
                        )}

                        {section === 'booking_access' && (
                            <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
                                <form onSubmit={requestBooking} className="tt-card grid content-start gap-4 p-6" noValidate>
                                    <h2 className="font-semibold text-zinc-900">Request a session</h2>
                                    {sub?.sessions_remaining !== null && sub?.sessions_remaining !== undefined && (
                                        <p className="text-sm text-zinc-500">
                                            <span className="font-semibold text-zinc-900 tabular-nums">{sub.sessions_remaining}</span> session(s) remaining in your plan.
                                        </p>
                                    )}
                                    <Input type="datetime-local" label="Preferred date and time" value={bookingAt} onChange={(e) => setBookingAt(e.target.value)} error={bookingError} />
                                    <Textarea label="What would you like to cover?" rows={3} value={bookingNotes} onChange={(e) => setBookingNotes(e.target.value)} />
                                    <Button type="submit" variant="primary" disabled={preview}>
                                        Request booking
                                    </Button>
                                </form>
                                <div className="tt-card overflow-hidden">
                                    <div className="tt-card-head">
                                        <h2>Your sessions</h2>
                                    </div>
                                    {bookings.length === 0 ? (
                                        <p className="px-5 py-5 text-sm text-zinc-500">No sessions yet.</p>
                                    ) : (
                                        bookings.map((b) => (
                                            <div key={b.id} className="tt-row">
                                                <span className="flex items-center gap-2 font-medium text-zinc-800 tabular-nums">
                                                    <Icon name="calendar" variant="micro" className="text-zinc-400" />
                                                    {fmtSession(b.scheduled_at)}
                                                </span>
                                                <Status value={bookingStatus(b.status)} />
                                            </div>
                                        ))
                                    )}
                                </div>
                            </div>
                        )}

                        {section === 'community_access' && (
                            <Empty title="Community access is linked to this product" icon="chat-bubble-left-right">
                                A private community area for {service.title} will appear here. Access ends automatically when your subscription ends.
                            </Empty>
                        )}

                        {section === 'review' && (
                            <form
                                className="tt-card grid max-w-2xl gap-4 p-6"
                                onSubmit={(e) => {
                                    e.preventDefault();
                                    perform(() => actions.submitReview(service.id, Number(ratingValue), reviewBody), 'Thanks, your review is published.');
                                }}
                            >
                                <h2 className="font-semibold text-zinc-900">Review {service.title}</h2>
                                <Select label="Rating" value={ratingValue} onChange={(e) => setRatingValue(e.target.value)}>
                                    {[5, 4, 3, 2, 1].map((i) => (
                                        <option key={i} value={i}>
                                            {i} / 5
                                        </option>
                                    ))}
                                </Select>
                                <Textarea label="Your review (optional)" rows={4} value={reviewBody} onChange={(e) => setReviewBody(e.target.value)} />
                                <Button type="submit" variant="primary" className="w-max">
                                    Publish review
                                </Button>
                            </form>
                        )}
                    </div>
                </>
            )}
        </div>
    );
}

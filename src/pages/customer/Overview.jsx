/* pages/customer/overview.blade.php — "My trading hub" */
import { Link } from 'react-router-dom';
import { Button, Empty, Icon, PageHeader, Stat, Status } from '../../components/ui';
import { subscriptionStatus, typeIcon, typeLabel } from '../../data/enums';
import { isCurrentlyActive, planById, providerById, serviceById, sortByDesc } from '../../data/queries';
import { useStore } from '../../data/store';
import { useTitle } from '../../hooks/useTitle';
import { cx, diffForHumans, fmtDate, fmtDay, greeting } from '../../utils/format';

export default function Overview() {
    useTitle('Dashboard');
    const { db, user } = useStore();
    const mine = db.subscriptions.filter((s) => s.user_id === user.id);
    const active = sortByDesc(mine.filter(isCurrentlyActive), 'starts_at');
    const soon = Date.now() + 30 * 86400000;
    const renewals = active.filter((s) => s.expires_at && new Date(s.expires_at) <= soon).sort((a, b) => new Date(a.expires_at) - new Date(b.expires_at));
    const total = mine.filter((s) => s.status !== 'pending').length;
    const notifications = sortByDesc(db.notifications.filter((n) => n.user_id === user.id), 'created_at').slice(0, 5);

    return (
        <div>
            <PageHeader
                title={`${greeting()}, ${user.name.split(' ')[0]}`}
                description="Here's what's happening with your account."
                actions={
                    <>
                        <Button icon="credit-card" href="/dashboard/billing">
                            Billing
                        </Button>
                        <Button variant="primary" icon="magnifying-glass" href="/services">
                            Explore services
                        </Button>
                    </>
                }
            />

            <div className="grid gap-4 sm:grid-cols-3">
                <Stat label="Active services" value={active.length} icon="squares-2x2" hint="Accessible right now" />
                <Stat label="Upcoming renewals" value={renewals.length} icon="arrow-path" hint="Next 30 days" />
                <Stat label="Total subscriptions" value={total} icon="rectangle-stack" hint="Since you joined" />
            </div>

            <div className="mt-8 grid grid-cols-1 gap-6 xl:grid-cols-[minmax(0,1.65fr)_minmax(0,1fr)]">
                <section className="grid content-start gap-4">
                    <div className="flex items-center justify-between">
                        <h2 className="tt-section-title">My Services</h2>
                        <Link to="/dashboard/services" className="tt-link inline-flex items-center gap-1 text-sm">
                            View all <Icon name="arrow-right" variant="micro" />
                        </Link>
                    </div>
                    {active.length === 0 ? (
                        <Empty
                            title="You haven't subscribed to any services yet"
                            icon="squares-2x2"
                            actions={
                                <Button size="sm" variant="primary" href="/services">
                                    Explore services
                                </Button>
                            }
                        >
                            Browse curated education, signals, tools and consultancy from verified providers.
                        </Empty>
                    ) : (
                        <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                            {active.slice(0, 6).map((sub) => {
                                const svc = serviceById(db, sub.service_id);
                                return (
                                    <div key={sub.id} className="tt-card tt-card-interactive flex flex-col gap-4 p-5">
                                        <div className="flex items-start gap-3">
                                            <span className="tt-icon-tile size-11 rounded-xl">
                                                <Icon name={typeIcon(svc.service_type)} variant="mini" />
                                            </span>
                                            <div className="min-w-0 flex-1">
                                                <p className="line-clamp-2 leading-snug font-semibold text-zinc-900">{svc.title}</p>
                                                <p className="truncate text-sm text-zinc-500">
                                                    {typeLabel(svc.service_type)} · {providerById(db, svc.provider_id).display_name}
                                                </p>
                                            </div>
                                            <Status value={subscriptionStatus(sub.status)} />
                                        </div>
                                        <dl className="grid grid-cols-2 gap-3 rounded-lg bg-zinc-50 px-4 py-3 text-sm">
                                            <div className="grid gap-0.5">
                                                <dt className="tt-label">Plan</dt>
                                                <dd className="truncate font-medium text-zinc-800">{planById(db, sub.plan_id).name}</dd>
                                            </div>
                                            <div className="grid gap-0.5">
                                                <dt className="tt-label">{sub.expires_at ? (sub.auto_renew ? 'Renews' : 'Ends') : 'Access'}</dt>
                                                <dd className="font-medium text-zinc-800 tabular-nums">{sub.expires_at ? fmtDate(sub.expires_at) : 'No end date'}</dd>
                                            </div>
                                        </dl>
                                        <Button size="sm" variant="primary" iconTrailing="arrow-right" href={`/dashboard/services/${svc.slug}`}>
                                            Access Product
                                        </Button>
                                    </div>
                                );
                            })}
                        </div>
                    )}
                </section>

                <div className="grid content-start gap-6">
                    <section className="tt-card overflow-hidden">
                        <div className="tt-card-head">
                            <h2>Upcoming renewals</h2>
                            <Link to="/dashboard/subscriptions" className="tt-link text-sm">
                                Manage
                            </Link>
                        </div>
                        {renewals.length === 0 ? (
                            <div className="flex items-center gap-3 px-5 py-5 text-sm text-zinc-500">
                                <Icon name="check-circle" variant="mini" className="text-green-600" />
                                Nothing renews in the next 30 days.
                            </div>
                        ) : (
                            renewals.map((sub) => (
                                <div key={sub.id} className="tt-row">
                                    <div className="min-w-0">
                                        <p className="truncate font-medium text-zinc-900">{serviceById(db, sub.service_id).title}</p>
                                        <p className="text-xs text-zinc-500">
                                            {planById(db, sub.plan_id).name} · {sub.auto_renew ? 'Auto-renew on' : 'Not renewing'}
                                        </p>
                                    </div>
                                    <span className="shrink-0 rounded-md bg-zinc-100 px-2 py-1 text-xs font-semibold text-zinc-700 tabular-nums">{fmtDay(sub.expires_at)}</span>
                                </div>
                            ))
                        )}
                    </section>

                    <section className="tt-card overflow-hidden">
                        <div className="tt-card-head">
                            <h2>Recent activity</h2>
                            <Link to="/dashboard/notifications" className="tt-link text-sm">
                                View all
                            </Link>
                        </div>
                        {notifications.length === 0 ? (
                            <p className="px-5 py-5 text-sm text-zinc-500">No activity yet.</p>
                        ) : (
                            notifications.map((n) => (
                                <div key={n.id} className="flex gap-3 border-b border-zinc-100 px-5 py-3.5 text-sm last:border-0">
                                    <span className={cx('grid size-8 shrink-0 place-items-center rounded-full', n.read_at ? 'bg-zinc-100 text-zinc-400' : 'bg-brand-soft text-brand')}>
                                        <Icon name={n.data.icon ?? 'bell'} variant="micro" />
                                    </span>
                                    <div className="min-w-0 flex-1">
                                        <p className={n.read_at ? 'text-zinc-600' : 'font-medium text-zinc-900'}>{n.data.title}</p>
                                        <p className="line-clamp-2 text-xs text-zinc-500">{n.data.body}</p>
                                    </div>
                                    <span className="shrink-0 text-[11px] text-zinc-400 tabular-nums">{diffForHumans(n.created_at, true)}</span>
                                </div>
                            ))
                        )}
                    </section>
                </div>
            </div>
        </div>
    );
}

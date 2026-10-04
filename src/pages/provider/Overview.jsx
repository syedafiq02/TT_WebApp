/* pages/provider/overview.blade.php */
import { Link } from 'react-router-dom';
import { Button, Empty, Icon, PageHeader, Stat, Status } from '../../components/ui';
import { serviceStatus, typeIcon, typeLabel } from '../../data/enums';
import { isCurrentlyActive, planById, serviceById, sortByDesc, userOf } from '../../data/queries';
import { useTitle } from '../../hooks/useTitle';
import { diffForHumans, fmtDay, money, userInitials } from '../../utils/format';
import { useProvider } from '../../hooks/useProvider';

export default function Overview() {
    useTitle('Provider overview');
    const { db, provider, services, serviceIds } = useProvider();
    const earnings = db.earnings.filter((e) => e.provider_id === provider.id);
    const subs = db.subscriptions.filter((s) => serviceIds.includes(s.service_id));
    const recent = sortByDesc(subs, 'starts_at').slice(0, 6);
    const latest = sortByDesc(services, 'updated_at').slice(0, 6);

    return (
        <div>
            <PageHeader
                title={provider.display_name}
                eyebrow="Provider dashboard"
                description="Your services, subscribers and revenue at a glance."
                actions={
                    <>
                        <Button icon="chart-bar" href="/provider/revenue">
                            Revenue
                        </Button>
                        <Button variant="primary" icon="plus" href="/provider/services/create">
                            Create service
                        </Button>
                    </>
                }
            />

            <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
                <Stat label="Published services" value={services.filter((s) => s.status === 'published').length} icon="squares-2x2" />
                <Stat label="Active subscribers" value={subs.filter(isCurrentlyActive).length} icon="users" />
                <Stat label="Gross sales (all time)" value={money(earnings.reduce((a, e) => a + e.gross_minor, 0))} icon="chart-bar" />
                <Stat label="Available for payout" value={money(earnings.filter((e) => e.status === 'available' && !e.payout_id).reduce((a, e) => a + e.net_minor, 0))} icon="banknotes" hint="After the holding period" />
            </div>

            <div className="mt-8 grid grid-cols-1 gap-6 xl:grid-cols-2">
                <section className="tt-card overflow-hidden">
                    <div className="tt-card-head">
                        <h2>Service status</h2>
                        <Link to="/provider/services" className="tt-link text-sm">
                            Manage
                        </Link>
                    </div>
                    {latest.length === 0 ? (
                        <div className="p-5">
                            <Empty title="No services yet" icon="squares-2x2" className="border-0!">
                                Create your first service, add a plan, then submit it for review.
                            </Empty>
                        </div>
                    ) : (
                        latest.map((s) => (
                            <Link key={s.id} to={`/provider/services/${s.slug}/edit`} className="tt-row tt-row-link">
                                <div className="flex min-w-0 items-center gap-3">
                                    <span className="tt-icon-tile size-9">
                                        <Icon name={typeIcon(s.service_type)} variant="micro" />
                                    </span>
                                    <div className="min-w-0">
                                        <p className="truncate font-medium text-zinc-900">{s.title}</p>
                                        <p className="text-xs text-zinc-500">
                                            {typeLabel(s.service_type)} · updated {diffForHumans(s.updated_at)}
                                        </p>
                                    </div>
                                </div>
                                <Status value={serviceStatus(s.status)} />
                            </Link>
                        ))
                    )}
                </section>

                <section className="tt-card overflow-hidden">
                    <div className="tt-card-head">
                        <h2>Newest subscribers</h2>
                        <Link to="/provider/customers" className="tt-link text-sm">
                            All customers
                        </Link>
                    </div>
                    {recent.length === 0 ? (
                        <p className="px-5 py-5 text-sm text-zinc-500">Subscribers appear here once your services are published.</p>
                    ) : (
                        recent.map((sub) => {
                            const u = userOf(db, sub.user_id);
                            return (
                                <div key={sub.id} className="tt-row">
                                    <div className="flex min-w-0 items-center gap-3">
                                        <span className="grid size-9 shrink-0 place-items-center rounded-full bg-zinc-100 text-xs font-semibold text-zinc-600">{userInitials(u.name)}</span>
                                        <div className="min-w-0">
                                            <p className="truncate font-medium text-zinc-900">{u.name}</p>
                                            <p className="truncate text-xs text-zinc-500">
                                                {serviceById(db, sub.service_id).title} · {planById(db, sub.plan_id).name}
                                            </p>
                                        </div>
                                    </div>
                                    <span className="shrink-0 text-xs text-zinc-400 tabular-nums">{fmtDay(sub.starts_at)}</span>
                                </div>
                            );
                        })
                    )}
                </section>
            </div>
        </div>
    );
}

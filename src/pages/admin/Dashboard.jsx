/* pages/admin/dashboard.blade.php */
import { Link } from 'react-router-dom';
import { Icon, PageHeader, Stat, Status } from '../../components/ui';
import { isCurrentlyActive, providerById, sortByAsc, sortByDesc, userOf } from '../../data/queries';
import { useStore } from '../../data/store';
import { useTitle } from '../../hooks/useTitle';
import { diffForHumans, money } from '../../utils/format';

export default function Dashboard() {
    useTitle('Admin dashboard');
    const { db } = useStore();
    const monthStart = new Date(new Date().getFullYear(), new Date().getMonth(), 1);
    const pendingProviders = sortByAsc(
        db.providers.filter((p) => p.status === 'pending'),
        'submitted_at',
    ).slice(0, 5);
    const pendingServices = sortByAsc(
        db.services.filter((s) => s.status === 'pending_review'),
        'submitted_at',
    ).slice(0, 5);
    const activity = sortByDesc(db.auditLogs, 'created_at').slice(0, 8);

    return (
        <div>
            <PageHeader title="Platform dashboard" eyebrow="Admin" description="Curation queues, marketplace health and recent administrative activity." />

            <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
                <Stat label="Provider applications awaiting review" value={db.providers.filter((p) => p.status === 'pending').length} icon="inbox-arrow-down" />
                <Stat label="Listings awaiting review" value={db.services.filter((s) => s.status === 'pending_review').length} icon="squares-2x2" />
                <Stat label="Payout requests" value={db.payouts.filter((p) => p.status === 'requested').length} icon="banknotes" />
                <Stat label="Active subscriptions" value={db.subscriptions.filter(isCurrentlyActive).length} icon="arrow-path" />
                <Stat label="Paid order value this month" value={money(db.orders.filter((o) => o.status === 'paid' && new Date(o.paid_at) >= monthStart).reduce((a, o) => a + o.total_minor, 0))} icon="credit-card" />
                <Stat label="Registered users" value={db.users.length} icon="users" />
            </div>

            <div className="mt-8 grid grid-cols-1 gap-6 xl:grid-cols-2">
                <section className="tt-card overflow-hidden">
                    <div className="tt-card-head">
                        <h2>Review queues</h2>
                    </div>
                    {pendingProviders.map((p) => (
                        <Link key={`p${p.id}`} to={`/admin/provider-applications?selected=${p.id}`} className="tt-row tt-row-link">
                            <div className="flex min-w-0 items-center gap-3">
                                <span className="tt-icon-tile size-9">
                                    <Icon name="user-plus" variant="micro" />
                                </span>
                                <div className="min-w-0">
                                    <p className="truncate font-medium text-zinc-900">{p.display_name}</p>
                                    <p className="text-xs text-zinc-500">Provider application · {diffForHumans(p.submitted_at)}</p>
                                </div>
                            </div>
                            <Status tone="amber" label="Review" />
                        </Link>
                    ))}
                    {pendingServices.map((s) => (
                        <Link key={`s${s.id}`} to="/admin/services?tab=pending_review" className="tt-row tt-row-link">
                            <div className="flex min-w-0 items-center gap-3">
                                <span className="tt-icon-tile size-9">
                                    <Icon name="squares-2x2" variant="micro" />
                                </span>
                                <div className="min-w-0">
                                    <p className="truncate font-medium text-zinc-900">{s.title}</p>
                                    <p className="truncate text-xs text-zinc-500">
                                        Listing · {providerById(db, s.provider_id).display_name} · {diffForHumans(s.submitted_at)}
                                    </p>
                                </div>
                            </div>
                            <Status tone="amber" label="Review" />
                        </Link>
                    ))}
                    {pendingProviders.length === 0 && pendingServices.length === 0 && (
                        <div className="flex items-center gap-3 px-5 py-5 text-sm text-zinc-500">
                            <Icon name="check-circle" variant="mini" className="text-green-600" />
                            All review queues are clear.
                        </div>
                    )}
                </section>

                <section className="tt-card overflow-hidden">
                    <div className="tt-card-head">
                        <h2>Recent admin activity</h2>
                        <Link to="/admin/audit-logs" className="tt-link text-sm">
                            Audit log
                        </Link>
                    </div>
                    {activity.length === 0 ? (
                        <p className="px-5 py-5 text-sm text-zinc-500">No activity recorded yet.</p>
                    ) : (
                        activity.map((log) => (
                            <div key={log.id} className="tt-row">
                                <div className="min-w-0">
                                    <p className="truncate font-mono text-xs font-medium text-zinc-800">{log.action}</p>
                                    <p className="text-xs text-zinc-500">{log.actor_id ? userOf(db, log.actor_id)?.name ?? 'Deleted user' : 'System'}</p>
                                </div>
                                <span className="shrink-0 text-xs text-zinc-400 tabular-nums">{diffForHumans(log.created_at, true)}</span>
                            </div>
                        ))
                    )}
                </section>
            </div>
        </div>
    );
}

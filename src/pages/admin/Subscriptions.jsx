/* pages/admin/subscriptions.blade.php */
import { useFeedback } from '../../components/Feedback';
import { Button, PageHeader, Pagination, Select, Status } from '../../components/ui';
import { SUBSCRIPTION_STATUSES, subscriptionStatus } from '../../data/enums';
import { isCurrentlyActive, planById, serviceById, sortByDesc, userOf } from '../../data/queries';
import { useStore } from '../../data/store';
import { usePaginated } from '../../hooks/usePaginated';
import { usePerform } from '../../hooks/usePerform';
import { useQueryState } from '../../hooks/useQueryState';
import { useTitle } from '../../hooks/useTitle';
import { fmtDate } from '../../utils/format';

export default function Subscriptions() {
    useTitle('Subscriptions');
    const { db, actions } = useStore();
    const perform = usePerform();
    const { confirm } = useFeedback();
    const [status, setStatus] = useQueryState('status');
    const list = sortByDesc(
        db.subscriptions.filter((s) => !status || s.status === status),
        'starts_at',
    );
    const { items, pagination } = usePaginated(list, 25);

    return (
        <div>
            <PageHeader title="Subscriptions" description="Every subscription on the platform. Suspending revokes the customer's entitlements immediately and is audit-logged." />

            <div className="mb-4">
                <Select className="w-48" value={status} onChange={(e) => setStatus(e.target.value)} aria-label="Status">
                    <option value="">All statuses</option>
                    {SUBSCRIPTION_STATUSES.map((s) => (
                        <option key={s} value={s}>
                            {subscriptionStatus(s).label}
                        </option>
                    ))}
                </Select>
            </div>

            <div className="tt-card overflow-x-auto">
                <table className="tt-table min-w-[820px]">
                    <thead>
                        <tr>
                            <th>Customer</th>
                            <th>Service</th>
                            <th>Plan</th>
                            <th>Status</th>
                            <th>Starts</th>
                            <th>Ends</th>
                            <th />
                        </tr>
                    </thead>
                    <tbody>
                        {items.length === 0 && (
                            <tr>
                                <td colSpan={7} className="text-center text-zinc-500">
                                    No subscriptions.
                                </td>
                            </tr>
                        )}
                        {items.map((sub) => {
                            const u = userOf(db, sub.user_id);
                            return (
                                <tr key={sub.id}>
                                    <td>
                                        {u?.name}
                                        <p className="text-xs text-zinc-500">{u?.email}</p>
                                    </td>
                                    <td>{serviceById(db, sub.service_id).title}</td>
                                    <td>{planById(db, sub.plan_id).name}</td>
                                    <td>
                                        <Status value={subscriptionStatus(sub.status)} />
                                    </td>
                                    <td className="text-xs tabular-nums">{fmtDate(sub.starts_at)}</td>
                                    <td className="text-xs tabular-nums">{sub.expires_at ? fmtDate(sub.expires_at) : '—'}</td>
                                    <td className="text-right">
                                        {isCurrentlyActive(sub) && (
                                            <Button
                                                size="sm"
                                                variant="ghost"
                                                onClick={async () => {
                                                    if (await confirm('Suspend this subscription and revoke access now?', { confirmLabel: 'Suspend', danger: true })) perform(() => actions.suspendSubscription(sub.id), 'Subscription suspended.');
                                                }}
                                            >
                                                Suspend
                                            </Button>
                                        )}
                                    </td>
                                </tr>
                            );
                        })}
                    </tbody>
                </table>
            </div>
            <div className="mt-6">
                <Pagination {...pagination} />
            </div>
        </div>
    );
}

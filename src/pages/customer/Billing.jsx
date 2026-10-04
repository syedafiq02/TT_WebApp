/* pages/customer/billing.blade.php — Payments & Billing */
import { Link } from 'react-router-dom';
import { Empty, PageHeader, Pagination, Stat, Status } from '../../components/ui';
import { orderStatus } from '../../data/enums';
import { sortByDesc } from '../../data/queries';
import { useStore } from '../../data/store';
import { usePaginated } from '../../hooks/usePaginated';
import { useTitle } from '../../hooks/useTitle';
import { fmtDate, money } from '../../utils/format';

export default function Billing() {
    useTitle('Payments & Billing');
    const { db, user } = useStore();
    const orders = sortByDesc(
        db.orders.filter((o) => o.user_id === user.id),
        'created_at',
    );
    const paid = orders.filter((o) => o.status === 'paid');
    const yearStart = new Date(new Date().getFullYear(), 0, 1);
    const year = paid.filter((o) => new Date(o.paid_at) >= yearStart).reduce((a, o) => a + o.total_minor, 0);
    const { items, pagination } = usePaginated(orders, 15);

    return (
        <div>
            <PageHeader title="Payments & Billing" description="Orders, payments and receipts." />

            <div className="mb-6 grid gap-4 sm:grid-cols-2">
                <Stat label="Paid this year" value={money(year)} icon="credit-card" />
                <Stat label="Paid orders" value={paid.length} icon="receipt-percent" />
            </div>

            {orders.length === 0 ? (
                <Empty title="No orders yet" icon="credit-card" />
            ) : (
                <>
                    <div className="tt-card overflow-x-auto">
                        <table className="tt-table min-w-[720px]">
                            <thead>
                                <tr>
                                    <th>Order</th>
                                    <th>Date</th>
                                    <th>Item</th>
                                    <th>Payment</th>
                                    <th className="text-right">Amount</th>
                                    <th>Status</th>
                                </tr>
                            </thead>
                            <tbody>
                                {items.map((o) => {
                                    const p = o.payments[o.payments.length - 1];
                                    return (
                                        <tr key={o.id}>
                                            <td className="text-xs tabular-nums">
                                                <Link to={`/orders/${o.reference}`} className="hover:text-brand">
                                                    {o.reference}
                                                </Link>
                                            </td>
                                            <td className="text-xs tabular-nums">{fmtDate(o.created_at)}</td>
                                            <td>{o.items[0]?.description}</td>
                                            <td className="text-zinc-600">{p?.method ?? p?.gateway ?? '—'}</td>
                                            <td className="text-right tabular-nums">{money(o.total_minor)}</td>
                                            <td>
                                                <Status value={orderStatus(o.status)} />
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
                </>
            )}
        </div>
    );
}

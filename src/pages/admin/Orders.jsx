/* pages/admin/orders.blade.php — Orders & Payments */
import { PageHeader, Pagination, Status } from '../../components/ui';
import { orderStatus, paymentStatus } from '../../data/enums';
import { sortByDesc, userOf } from '../../data/queries';
import { useStore } from '../../data/store';
import { usePaginated } from '../../hooks/usePaginated';
import { useTitle } from '../../hooks/useTitle';
import { fmtDateTime, money } from '../../utils/format';

export default function Orders() {
    useTitle('Orders & Payments');
    const { db } = useStore();
    const { items, pagination } = usePaginated(sortByDesc(db.orders, 'created_at'), 25);

    return (
        <div>
            <PageHeader title="Orders & Payments" description={`Payment gateway: ${db.settings.gateway}. Gateways are pluggable; no real payment provider is connected yet.`} />

            <div className="tt-card overflow-x-auto">
                <table className="tt-table min-w-[900px]">
                    <thead>
                        <tr>
                            <th>Order</th>
                            <th>Customer</th>
                            <th>Item</th>
                            <th className="text-right">Total</th>
                            <th>Order status</th>
                            <th>Payment</th>
                            <th>Paid</th>
                        </tr>
                    </thead>
                    <tbody>
                        {items.length === 0 && (
                            <tr>
                                <td colSpan={7} className="text-center text-zinc-500">
                                    No orders yet.
                                </td>
                            </tr>
                        )}
                        {items.map((o) => {
                            const p = o.payments[o.payments.length - 1];
                            return (
                                <tr key={o.id}>
                                    <td className="text-xs tabular-nums">{o.reference}</td>
                                    <td>{userOf(db, o.user_id)?.name ?? 'Deleted user'}</td>
                                    <td className="text-zinc-600">{o.items[0]?.description}</td>
                                    <td className="text-right tabular-nums">{money(o.total_minor)}</td>
                                    <td>
                                        <Status value={orderStatus(o.status)} />
                                    </td>
                                    <td>
                                        {p ? (
                                            <>
                                                <Status value={paymentStatus(p.status)} />
                                                <p className="text-[11px] text-zinc-500 tabular-nums">
                                                    {p.gateway} {p.transaction_reference}
                                                </p>
                                            </>
                                        ) : (
                                            '—'
                                        )}
                                    </td>
                                    <td className="text-xs tabular-nums">{o.paid_at ? fmtDateTime(o.paid_at) : '—'}</td>
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

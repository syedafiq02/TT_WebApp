/* pages/provider/revenue.blade.php — Sales & Revenue */
import { Badge, Empty, PageHeader, Pagination, Stat } from '../../components/ui';
import { earningLabel } from '../../data/enums';
import { sortByDesc } from '../../data/queries';
import { useProvider } from '../../hooks/useProvider';
import { usePaginated } from '../../hooks/usePaginated';
import { useTitle } from '../../hooks/useTitle';
import { EARNING_HOLD_DAYS, fmtDate, money, PLATFORM_FEE_BPS } from '../../utils/format';

export default function Revenue() {
    useTitle('Sales & Revenue');
    const { db, provider } = useProvider();
    const all = sortByDesc(
        db.earnings.filter((e) => e.provider_id === provider.id),
        'created_at',
    );
    const live = all.filter((e) => e.status !== 'reversed');
    const sum = (list, key) => list.reduce((a, e) => a + e[key], 0);
    const monthStart = new Date(new Date().getFullYear(), new Date().getMonth(), 1);
    const { items, pagination } = usePaginated(all, 20);

    return (
        <div>
            <PageHeader title="Sales & Revenue" description={`Platform fee: ${PLATFORM_FEE_BPS / 100}% of each sale. Earnings become available ${EARNING_HOLD_DAYS} days after payment.`} />

            <div className="mb-6 grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
                <Stat label="Gross sales" value={money(sum(live, 'gross_minor'))} icon="chart-bar" />
                <Stat label="Platform fees" value={money(sum(live, 'platform_fee_minor'))} icon="receipt-percent" />
                <Stat label="Net earnings" value={money(sum(live, 'net_minor'))} icon="banknotes" />
                <Stat label="Net this month" value={money(sum(live.filter((e) => new Date(e.created_at) >= monthStart), 'net_minor'))} icon="calendar" />
            </div>

            {all.length === 0 ? (
                <Empty title="No sales yet" icon="chart-bar" />
            ) : (
                <>
                    <div className="tt-card overflow-x-auto">
                        <table className="tt-table min-w-[760px]">
                            <thead>
                                <tr>
                                    <th>Date</th>
                                    <th>Item</th>
                                    <th className="text-right">Gross</th>
                                    <th className="text-right">Fee</th>
                                    <th className="text-right">Net</th>
                                    <th>Status</th>
                                    <th>Available</th>
                                </tr>
                            </thead>
                            <tbody>
                                {items.map((e) => (
                                    <tr key={e.id}>
                                        <td className="text-xs tabular-nums">{fmtDate(e.created_at)}</td>
                                        <td>{e.description}</td>
                                        <td className="text-right tabular-nums">{money(e.gross_minor)}</td>
                                        <td className="text-right text-zinc-500 tabular-nums">− {money(e.platform_fee_minor)}</td>
                                        <td className="text-right tabular-nums">{money(e.net_minor)}</td>
                                        <td>
                                            <Badge size="sm">{earningLabel(e.status)}</Badge>
                                        </td>
                                        <td className="text-xs tabular-nums">{fmtDate(e.available_at)}</td>
                                    </tr>
                                ))}
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

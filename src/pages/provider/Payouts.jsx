/* pages/provider/payouts.blade.php */
import { Button, Empty, PageHeader, Stat, Status } from '../../components/ui';
import { payoutStatus } from '../../data/enums';
import { sortByDesc } from '../../data/queries';
import { useProvider } from '../../hooks/useProvider';
import { usePerform } from '../../hooks/usePerform';
import { useTitle } from '../../hooks/useTitle';
import { fmtDate, MINIMUM_PAYOUT_MINOR, money } from '../../utils/format';

export default function Payouts() {
    useTitle('Payouts');
    const { db, actions, provider } = useProvider();
    const perform = usePerform();
    const earnings = db.earnings.filter((e) => e.provider_id === provider.id);
    const sum = (list) => list.reduce((a, e) => a + e.net_minor, 0);
    const payouts = sortByDesc(
        db.payouts.filter((p) => p.provider_id === provider.id),
        'requested_at',
    );

    return (
        <div>
            <PageHeader
                title="Payouts"
                description={`Minimum payout ${money(MINIMUM_PAYOUT_MINOR)}. Transfers are made to your registered bank account after approval.`}
                actions={
                    <Button variant="primary" icon="banknotes" onClick={() => perform(() => actions.requestPayout(), 'Payout requested. The platform team will process it.')}>
                        Request payout
                    </Button>
                }
            />

            <div className="mb-6 grid gap-4 sm:grid-cols-3">
                <Stat label="Pending (holding period)" value={money(sum(earnings.filter((e) => e.status === 'pending')))} icon="clock" />
                <Stat label="Available" value={money(sum(earnings.filter((e) => e.status === 'available' && !e.payout_id)))} icon="banknotes" />
                <Stat label="Paid out" value={money(sum(earnings.filter((e) => e.status === 'paid_out')))} icon="check-circle" />
            </div>

            {payouts.length === 0 ? (
                <Empty title="No payouts yet" icon="banknotes" />
            ) : (
                <div className="tt-card overflow-x-auto">
                    <table className="tt-table min-w-[640px]">
                        <thead>
                            <tr>
                                <th>Requested</th>
                                <th className="text-right">Amount</th>
                                <th>Status</th>
                                <th>Reference</th>
                                <th>Processed</th>
                            </tr>
                        </thead>
                        <tbody>
                            {payouts.map((p) => (
                                <tr key={p.id}>
                                    <td className="text-xs tabular-nums">{fmtDate(p.requested_at)}</td>
                                    <td className="text-right tabular-nums">{money(p.amount_minor)}</td>
                                    <td>
                                        <Status value={payoutStatus(p.status)} />
                                    </td>
                                    <td className="text-xs tabular-nums">{p.reference ?? '—'}</td>
                                    <td className="text-xs tabular-nums">{p.processed_at ? fmtDate(p.processed_at) : '—'}</td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            )}
        </div>
    );
}

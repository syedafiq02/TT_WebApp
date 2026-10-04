/* pages/admin/payouts.blade.php */
import { useState } from 'react';
import { Button, Empty, Input, PageHeader, Status } from '../../components/ui';
import { payoutStatus } from '../../data/enums';
import { providerById, sortByDesc } from '../../data/queries';
import { useStore } from '../../data/store';
import { usePerform } from '../../hooks/usePerform';
import { useTitle } from '../../hooks/useTitle';
import { fmtDate, money } from '../../utils/format';

export default function Payouts() {
    useTitle('Payouts');
    const { db, actions } = useStore();
    const perform = usePerform();
    const [paying, setPaying] = useState(null);
    const [reference, setReference] = useState('');
    const payouts = sortByDesc(db.payouts, 'requested_at');

    return (
        <div>
            <PageHeader title="Payouts" description="Approve requests, make the bank transfer outside the platform, then record it as paid with its reference." />

            {paying && (
                <form
                    className="tt-card mb-4 flex flex-wrap items-end gap-3 p-5"
                    onSubmit={(e) => {
                        e.preventDefault();
                        if (perform(() => actions.markPayoutPaid(paying, reference), 'Payout recorded as paid.')) {
                            setPaying(null);
                            setReference('');
                        }
                    }}
                >
                    <Input label="Bank transfer reference" className="w-full max-w-sm" value={reference} onChange={(e) => setReference(e.target.value)} autoFocus />
                    <Button type="submit" variant="primary">
                        Record as paid
                    </Button>
                    <Button onClick={() => setPaying(null)}>Cancel</Button>
                </form>
            )}

            {payouts.length === 0 ? (
                <Empty title="No payout requests" icon="banknotes" />
            ) : (
                <div className="tt-card overflow-x-auto">
                    <table className="tt-table min-w-[760px]">
                        <thead>
                            <tr>
                                <th>Provider</th>
                                <th>Requested</th>
                                <th className="text-right">Amount</th>
                                <th>Status</th>
                                <th>Reference</th>
                                <th />
                            </tr>
                        </thead>
                        <tbody>
                            {payouts.map((p) => (
                                <tr key={p.id}>
                                    <td className="font-medium">{providerById(db, p.provider_id).display_name}</td>
                                    <td className="text-xs tabular-nums">{fmtDate(p.requested_at)}</td>
                                    <td className="text-right tabular-nums">{money(p.amount_minor)}</td>
                                    <td>
                                        <Status value={payoutStatus(p.status)} />
                                    </td>
                                    <td className="text-xs tabular-nums">{p.reference ?? '—'}</td>
                                    <td className="text-right whitespace-nowrap">
                                        {p.status === 'requested' && (
                                            <>
                                                <Button size="sm" variant="primary" onClick={() => perform(() => actions.approvePayout(p.id), 'Payout approved.')}>
                                                    Approve
                                                </Button>
                                                <Button size="sm" variant="ghost" onClick={() => perform(() => actions.rejectPayout(p.id), 'Payout rejected.')}>
                                                    Reject
                                                </Button>
                                            </>
                                        )}
                                        {p.status === 'approved' && (
                                            <Button
                                                size="sm"
                                                onClick={() => {
                                                    setPaying(p.id);
                                                    window.scrollTo({ top: 0, behavior: 'smooth' });
                                                }}
                                            >
                                                Record payment
                                            </Button>
                                        )}
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            )}
        </div>
    );
}

/* payments/test.blade.php — the development "hosted payment page" (TestGateway). */
import { useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { Button } from '../../components/ui';
import { planPrice } from '../../data/enums';
import { planById, serviceById } from '../../data/queries';
import { useStore } from '../../data/store';
import { usePerform } from '../../hooks/usePerform';
import { useTitle } from '../../hooks/useTitle';
import ErrorPage from '../errors/ErrorPage';

export default function TestPayment() {
    useTitle('Test payment');
    const { planId } = useParams();
    const { db, actions } = useStore();
    const navigate = useNavigate();
    const perform = usePerform();
    const [busy, setBusy] = useState(null);
    const plan = planById(db, planId);
    if (!plan) return <ErrorPage code={404} />;
    const service = serviceById(db, plan.service_id);

    const complete = (outcome) => {
        setBusy(outcome);
        setTimeout(() => {
            let reference;
            const ok = perform(() => {
                reference = actions.checkout(plan.id, outcome);
            });
            if (ok) navigate(`/orders/${reference}`, { replace: true });
            else setBusy(null);
        }, 700);
    };

    return (
        <div className="mx-auto grid max-w-lg gap-6 px-4 py-16">
            <div className="rounded-xl border border-amber-200 bg-amber-50 p-4 text-sm text-amber-800">
                <p className="text-xs tracking-[0.14em] text-amber-700 uppercase tabular-nums">Test mode · development only</p>
                <p className="mt-1">This page stands in for a payment provider. No money is charged. It is not available in production.</p>
            </div>

            <div className="tt-card grid gap-4 p-6">
                <span className="tt-label">Payment request</span>
                <p className="font-medium">
                    {service.title} · {plan.name}
                </p>
                <dl className="grid grid-cols-2 gap-y-2 text-sm text-zinc-600">
                    <dt>Order</dt>
                    <dd className="text-right text-zinc-900 tabular-nums">Pending</dd>
                    <dt>Amount</dt>
                    <dd className="text-right text-zinc-900 tabular-nums">{planPrice(plan)}</dd>
                </dl>
                <div className="grid grid-cols-2 gap-3">
                    <Button className="w-full" disabled={!!busy} loading={busy === 'decline'} onClick={() => complete('decline')}>
                        Decline
                    </Button>
                    <Button variant="primary" className="w-full" disabled={!!busy} loading={busy === 'approve'} onClick={() => complete('approve')}>
                        Approve payment
                    </Button>
                </div>
            </div>
        </div>
    );
}

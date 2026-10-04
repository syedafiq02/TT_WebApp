/* pages/checkout/complete.blade.php — order status after the gateway returns. */
import { useParams } from 'react-router-dom';
import { Button, Icon, Status } from '../../components/ui';
import { orderStatus } from '../../data/enums';
import { serviceById } from '../../data/queries';
import { useStore } from '../../data/store';
import { useTitle } from '../../hooks/useTitle';
import { cx, fmtDate, money } from '../../utils/format';
import ErrorPage from '../errors/ErrorPage';

export default function OrderStatus() {
    useTitle('Order status');
    const { reference } = useParams();
    const { db, user } = useStore();
    const order = db.orders.find((o) => o.reference === reference && (o.user_id === user.id || user.role === 'admin'));
    if (!order) return <ErrorPage code={404} />;

    const paid = order.status === 'paid';
    const item = order.items[0];
    const service = serviceById(db, item.service_id);
    const sub = db.subscriptions.find((s) => s.order_id === order.id);
    const payment = order.payments[order.payments.length - 1];

    return (
        <div className="mx-auto grid max-w-2xl justify-items-center gap-6 px-4 py-16 text-center">
            <span className={cx('grid size-16 place-items-center rounded-full border', paid ? 'border-green-200 bg-green-50 text-green-600' : 'border-amber-200 bg-amber-50 text-amber-700')}>
                <Icon name={paid ? 'check' : 'clock'} className="size-8" />
            </span>
            <div className="grid gap-2">
                <h1 className="text-3xl font-semibold tracking-tight text-zinc-900 sm:text-4xl">{paid ? 'Payment successful' : 'Payment not completed'}</h1>
                <p className="text-zinc-600">{paid ? `Your access to ${service.title} is now active.` : payment?.failure_reason ?? 'We have not received payment for this order.'}</p>
            </div>

            <div className="tt-card grid w-full gap-3 p-6 text-left text-sm">
                {order.items.map((it) => (
                    <div key={it.plan_id} className="flex items-center justify-between gap-3">
                        <div>
                            <p className="font-medium">{serviceById(db, it.service_id).title}</p>
                            <p className="text-zinc-500">{it.plan_snapshot.name}</p>
                        </div>
                        <Status value={orderStatus(order.status)} />
                    </div>
                ))}
                <dl className="grid grid-cols-2 gap-y-2 border-t border-zinc-200 pt-3 text-zinc-600">
                    <dt>Order</dt>
                    <dd className="text-right text-zinc-900 tabular-nums">{order.reference}</dd>
                    <dt>Amount</dt>
                    <dd className="text-right text-zinc-900 tabular-nums">{money(order.total_minor)}</dd>
                    {paid && sub && (
                        <>
                            <dt>{sub.auto_renew ? 'Renews' : 'Access until'}</dt>
                            <dd className="text-right text-zinc-900 tabular-nums">{sub.expires_at ? fmtDate(sub.expires_at) : 'No end date'}</dd>
                        </>
                    )}
                </dl>
            </div>

            <div className="flex flex-wrap justify-center gap-3">
                {paid ? (
                    <>
                        <Button variant="primary" href={`/dashboard/services/${service.slug}`}>
                            Access Product
                        </Button>
                        <Button href="/dashboard">Go to Dashboard</Button>
                    </>
                ) : (
                    <>
                        <Button variant="primary" href={`/checkout/${item.plan_id}`}>
                            Try again
                        </Button>
                        <Button href={`/services/${service.slug}`}>Back to service</Button>
                    </>
                )}
            </div>
        </div>
    );
}

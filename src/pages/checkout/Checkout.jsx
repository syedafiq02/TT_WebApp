/* pages/checkout/show.blade.php */
import { useState } from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import { Avatar, Button, Callout, Checkbox, Icon, RadioCards } from '../../components/ui';
import { planHasDuration, planPrice, planTermLabel, typeLabel } from '../../data/enums';
import { hasAnyAccess, planById, providerById, providerForUser, serviceById } from '../../data/queries';
import { useStore } from '../../data/store';
import { useTitle } from '../../hooks/useTitle';
import { userInitials } from '../../utils/format';
import ErrorPage from '../errors/ErrorPage';

export default function Checkout() {
    useTitle('Checkout');
    const { planId } = useParams();
    const { db, user } = useStore();
    const navigate = useNavigate();
    const [gateway, setGateway] = useState('test');
    const [agree, setAgree] = useState(false);
    const [errors, setErrors] = useState({});
    const [error, setError] = useState(null);
    const [busy, setBusy] = useState(false);

    const plan = planById(db, planId);
    const service = plan && serviceById(db, plan.service_id);
    if (!plan || !service || service.status !== 'published') return <ErrorPage code={404} />;
    const provider = providerById(db, service.provider_id);

    const pay = (e) => {
        e.preventDefault();
        setError(null);
        if (!agree) {
            setErrors({ agree: 'Please confirm you have read the risk disclosure.' });
            return;
        }
        setErrors({});
        // CreateOrder checks, then redirect to the gateway (StartPayment).
        if (plan.status !== 'active') return setError('This plan is no longer available.');
        if (providerForUser(db, user.id)?.id === service.provider_id) return setError('You cannot subscribe to your own service.');
        if (hasAnyAccess(db, user.id, service)) return setError('You already have access to this service.');
        setBusy(true);
        setTimeout(() => navigate(`/payments/test/${plan.id}`), 500);
    };

    return (
        <div className="mx-auto max-w-5xl px-4 py-10 sm:px-6 lg:px-10">
            <Link to={`/services/${service.slug}`} className="inline-flex items-center gap-1 text-sm font-medium text-zinc-500 transition-colors hover:text-zinc-900">
                <Icon name="arrow-left" variant="micro" />
                {service.title}
            </Link>
            <h1 className="mt-3 text-3xl font-semibold tracking-tight text-zinc-900 sm:text-4xl">Checkout</h1>

            <div className="mt-8 grid grid-cols-1 gap-8 lg:grid-cols-[minmax(0,1fr)_360px]">
                <form onSubmit={pay} className="grid content-start gap-6" noValidate>
                    {error && (
                        <Callout variant="danger" icon="exclamation-triangle">
                            {error}
                        </Callout>
                    )}

                    <section className="tt-card grid gap-4 p-6">
                        <h2 className="text-base font-semibold text-zinc-900">Account</h2>
                        <div className="flex items-center gap-3">
                            <Avatar initials={userInitials(user.name)} />
                            <div>
                                <p className="font-medium">{user.name}</p>
                                <p className="text-sm text-zinc-500">{user.email}</p>
                            </div>
                        </div>
                    </section>

                    <section className="tt-card grid gap-4 p-6">
                        <h2 className="text-base font-semibold text-zinc-900">Payment method</h2>
                        <RadioCards
                            name="gateway"
                            value={gateway}
                            onChange={setGateway}
                            options={[{ value: 'test', label: 'Test payment', description: 'Simulates a hosted payment page. No money is charged and this option is unavailable in production.' }]}
                        />
                        <p className="text-xs text-zinc-500">FPX, card and e-wallet options will appear here once a payment provider is connected.</p>
                    </section>

                    <section className="tt-card grid gap-4 p-6">
                        <h2 className="text-base font-semibold text-zinc-900">Confirm</h2>
                        <Checkbox checked={agree} onChange={(e) => setAgree(e.target.checked)} label={`I understand that ${service.title} is an educational/analytical service and does not guarantee trading results.`} />
                        {errors.agree && <p className="text-sm font-medium text-red-500">{errors.agree}</p>}
                        <Button type="submit" variant="primary" className="w-full" loading={busy}>
                            Continue to payment · {planPrice(plan)}
                        </Button>
                    </section>
                </form>

                <aside className="tt-card grid content-start gap-4 p-6 lg:sticky lg:top-24 lg:self-start">
                    <span className="tt-label">Order summary</span>
                    <div>
                        <p className="font-semibold">{service.title}</p>
                        <p className="text-sm text-zinc-500">
                            {provider.display_name} · {typeLabel(service.service_type)}
                        </p>
                    </div>
                    <div className="grid gap-2 border-t border-zinc-200 pt-4 text-sm">
                        <div className="flex justify-between text-zinc-600">
                            <span>{plan.name}</span>
                            <span className="text-zinc-900 tabular-nums">{planPrice(plan)}</span>
                        </div>
                        <div className="flex justify-between text-zinc-600">
                            <span>Term</span>
                            <span>{planTermLabel(plan)}</span>
                        </div>
                        <div className="flex justify-between border-t border-zinc-200 pt-3 text-base font-semibold">
                            <span>Total</span>
                            <span className="tabular-nums">{planPrice(plan)}</span>
                        </div>
                    </div>
                    <p className="text-xs text-zinc-500">
                        {plan.billing_type === 'recurring'
                            ? `Renews ${planTermLabel(plan)} until cancelled. Turn off renewal anytime from My Subscriptions.`
                            : `One payment. ${planHasDuration(plan) ? `Access lasts ${planTermLabel(plan).replace(/^for /, '')}.` : 'No renewal.'}`}
                    </p>
                </aside>
            </div>
        </div>
    );
}

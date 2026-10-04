/* pages/provider/plans.blade.php — Subscription Plans */
import { Button, Empty, PageHeader, Status } from '../../components/ui';
import { billingTypeLabel, planPrice, planStatus, planTermLabel, serviceStatus } from '../../data/enums';
import { plansFor } from '../../data/queries';
import { useProvider } from '../../hooks/useProvider';
import { useTitle } from '../../hooks/useTitle';

export default function Plans() {
    useTitle('Subscription Plans');
    const { db, services } = useProvider();
    const groups = [...services]
        .sort((a, b) => a.id - b.id)
        .map((s) => ({ service: s, plans: plansFor(db, s.id) }))
        .filter((g) => g.plans.length > 0);

    return (
        <div>
            <PageHeader title="Subscription Plans" description="Pricing across your services. Plans can be changed while a listing is draft or rejected; changes to live pricing go through review." />
            {groups.length === 0 ? (
                <Empty title="No plans yet" icon="tag">
                    Plans are created on each service&apos;s edit page.
                </Empty>
            ) : (
                groups.map(({ service, plans }) => (
                    <section key={service.id} className="tt-card mb-4">
                        <div className="tt-card-head">
                            <div className="flex flex-wrap items-center gap-3">
                                <h2 className="font-semibold">{service.title}</h2>
                                <Status value={serviceStatus(service.status)} />
                            </div>
                            <Button size="sm" variant="ghost" href={`/provider/services/${service.slug}/edit`}>
                                Edit plans
                            </Button>
                        </div>
                        <div className="grid gap-3 p-5 sm:grid-cols-2 lg:grid-cols-3">
                            {plans.map((p) => (
                                <div key={p.id} className="rounded-xl border border-zinc-200 bg-zinc-50/70 p-4">
                                    <div className="flex items-center justify-between">
                                        <p className="font-medium">{p.name}</p>
                                        <Status value={planStatus(p.status)} />
                                    </div>
                                    <p className="mt-2 text-xl tabular-nums">
                                        {planPrice(p)} <span className="text-xs text-zinc-500">{planTermLabel(p)}</span>
                                    </p>
                                    <p className="mt-1 text-xs text-zinc-500">{billingTypeLabel(p.billing_type)}</p>
                                </div>
                            ))}
                        </div>
                    </section>
                ))
            )}
        </div>
    );
}

/* pages/customer/services.blade.php — My Services */
import { Button, Chips, Empty, Icon, PageHeader, Status } from '../../components/ui';
import { FAMILIES, SERVICE_TYPES, subscriptionStatus, termLabel, typeIcon, typeLabel } from '../../data/enums';
import { hasAnyAccess, planById, providerById, serviceById, sortByDesc } from '../../data/queries';
import { useStore } from '../../data/store';
import { useQueryState } from '../../hooks/useQueryState';
import { useTitle } from '../../hooks/useTitle';
import { cx, fmtDate } from '../../utils/format';

export default function Services() {
    useTitle('My Services');
    const { db, user } = useStore();
    const [family, setFamily] = useQueryState('family', 'all');

    // One card per product, using the latest subscription or purchase of it.
    const seen = new Set();
    const items = sortByDesc(
        db.subscriptions.filter((s) => s.user_id === user.id && s.status !== 'pending'),
        'starts_at',
    )
        .filter((s) => (seen.has(s.service_id) ? false : seen.add(s.service_id)))
        .map((sub) => ({ sub, service: serviceById(db, sub.service_id) }))
        .filter(({ service }) => family === 'all' || SERVICE_TYPES[service.service_type].family === family)
        .map((x) => ({ ...x, access: hasAnyAccess(db, user.id, x.service) }))
        .sort((a, b) => Number(b.access) - Number(a.access));

    return (
        <div>
            <PageHeader title="My Services" description="Every product you have subscribed to or purchased. Each product has its own plan, access and expiry." />

            <Chips className="mb-6" value={family} onChange={setFamily} options={[{ value: 'all', label: 'All' }, ...Object.entries(FAMILIES).map(([value, label]) => ({ value, label }))]} />

            {items.length === 0 ? (
                <Empty
                    title="No products here yet"
                    icon="squares-2x2"
                    actions={
                        <Button size="sm" variant="primary" href="/services">
                            Explore services
                        </Button>
                    }
                >
                    Products you subscribe to or purchase will appear here.
                </Empty>
            ) : (
                <div className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-3">
                    {items.map(({ sub, service, access }) => {
                        const plan = planById(db, sub.plan_id);
                        return (
                            <div key={service.id} className={cx('tt-card flex flex-col gap-5 p-5', access ? 'tt-card-interactive' : 'bg-zinc-50/60')}>
                                <div className="flex items-start gap-3">
                                    <span className={cx('tt-icon-tile size-11 rounded-xl', !access && 'bg-zinc-100! text-zinc-400!')}>
                                        <Icon name={typeIcon(service.service_type)} variant="mini" />
                                    </span>
                                    <div className="min-w-0 flex-1">
                                        <p className="line-clamp-2 leading-snug font-semibold text-zinc-900">{service.title}</p>
                                        <p className="text-sm text-zinc-500">{typeLabel(service.service_type)}</p>
                                    </div>
                                    {access ? <Status value={subscriptionStatus(sub.status)} /> : <Status tone="zinc" label="Expired" />}
                                </div>
                                <dl className="grid gap-2.5 text-sm">
                                    <div className="flex justify-between gap-4">
                                        <dt className="text-zinc-500">Provider</dt>
                                        <dd className="truncate text-right font-medium text-zinc-800">{providerById(db, service.provider_id).display_name}</dd>
                                    </div>
                                    <div className="flex justify-between gap-4">
                                        <dt className="text-zinc-500">Plan</dt>
                                        <dd className="text-right font-medium text-zinc-800">
                                            {plan.name} <span className="font-normal text-zinc-500">· {termLabel(sub.term)}</span>
                                        </dd>
                                    </div>
                                    <div className="flex justify-between gap-4 border-t border-zinc-100 pt-2.5">
                                        <dt className="text-zinc-500">{access ? (sub.auto_renew ? 'Renews' : 'Expires') : 'Ended'}</dt>
                                        <dd className={cx('text-right font-semibold tabular-nums', access ? 'text-zinc-900' : 'text-red-600')}>{sub.expires_at ? fmtDate(sub.expires_at) : 'Never (lifetime)'}</dd>
                                    </div>
                                </dl>
                                <div className="mt-auto">
                                    {access ? (
                                        <Button variant="primary" className="w-full" iconTrailing="arrow-right" href={`/dashboard/services/${service.slug}`}>
                                            Access Product
                                        </Button>
                                    ) : service.status === 'published' ? (
                                        <Button className="w-full" icon="arrow-path" href={`/services/${service.slug}`}>
                                            Renew subscription
                                        </Button>
                                    ) : (
                                        <p className="text-xs text-zinc-500">This product is no longer available for purchase.</p>
                                    )}
                                </div>
                            </div>
                        );
                    })}
                </div>
            )}
        </div>
    );
}

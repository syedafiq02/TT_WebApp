/* pages/customer/subscriptions.blade.php */
import { useFeedback } from '../../components/Feedback';
import { Button, Empty, Icon, PageHeader, Status, Tabs } from '../../components/ui';
import { planPrice, planTermLabel, subscriptionStatus, termLabel, typeIcon } from '../../data/enums';
import { isCurrentlyActive, planById, providerById, serviceById, sortByDesc } from '../../data/queries';
import { useStore } from '../../data/store';
import { usePerform } from '../../hooks/usePerform';
import { useQueryState } from '../../hooks/useQueryState';
import { useTitle } from '../../hooks/useTitle';
import { fmtDate } from '../../utils/format';

export default function Subscriptions() {
    useTitle('My Subscriptions');
    const { db, user, actions } = useStore();
    const { confirm } = useFeedback();
    const perform = usePerform();
    const [tab, setTab] = useQueryState('tab', 'active');
    const mine = db.subscriptions.filter((s) => s.user_id === user.id);
    const count = (status) => mine.filter((s) => s.status === status).length;
    const list = sortByDesc(
        mine.filter((s) => s.status === tab),
        'starts_at',
    );

    const cancel = async (sub) => {
        if (!(await confirm('Turn off renewal? You keep access until the end of the paid period.', { confirmLabel: 'Cancel renewal', danger: true }))) return;
        perform(() => actions.cancelRenewal(sub.id), `Renewal cancelled. You keep access until ${sub.expires_at ? fmtDate(sub.expires_at) : 'the end of your plan'}.`);
    };

    return (
        <div>
            <PageHeader title="My Subscriptions" description="Each product you buy has its own subscription or purchase, plan and expiry." />

            <div className="tt-card overflow-hidden">
                <Tabs
                    className="px-5"
                    value={tab}
                    onChange={setTab}
                    tabs={[
                        { value: 'active', label: 'Active', count: count('active') },
                        { value: 'expired', label: 'Expired', count: count('expired') },
                        { value: 'cancelled', label: 'Cancelled', count: count('cancelled') },
                    ]}
                />

                {list.length === 0 ? (
                    <div className="p-6">
                        <Empty title={`No ${tab} subscriptions`} icon="arrow-path" className="border-0!">
                            {tab === 'active' ? 'Subscriptions you start are listed here with their renewal dates.' : 'Nothing to show in this view.'}
                        </Empty>
                    </div>
                ) : (
                    <div className="overflow-x-auto">
                        <table className="tt-table min-w-[760px]">
                            <thead>
                                <tr>
                                    <th>Service</th>
                                    <th>Plan</th>
                                    <th>Status</th>
                                    <th>Started</th>
                                    <th>{tab === 'active' ? 'Renews / ends' : 'Ended'}</th>
                                    <th />
                                </tr>
                            </thead>
                            <tbody>
                                {list.map((sub) => {
                                    const svc = serviceById(db, sub.service_id);
                                    const plan = planById(db, sub.plan_id);
                                    const live = isCurrentlyActive(sub);
                                    return (
                                        <tr key={sub.id}>
                                            <td>
                                                <div className="flex items-center gap-3">
                                                    <span className="tt-icon-tile size-9">
                                                        <Icon name={typeIcon(svc.service_type)} variant="micro" />
                                                    </span>
                                                    <div className="min-w-0">
                                                        <p className="font-medium text-zinc-900">{svc.title}</p>
                                                        <p className="text-xs text-zinc-500">{providerById(db, svc.provider_id).display_name}</p>
                                                    </div>
                                                </div>
                                            </td>
                                            <td>
                                                <p className="font-medium text-zinc-800">{plan.name}</p>
                                                <p className="text-xs text-zinc-500">
                                                    {termLabel(sub.term)} · <span className="tabular-nums">{planPrice(plan)}</span> {planTermLabel(plan)}
                                                </p>
                                            </td>
                                            <td>
                                                <Status value={subscriptionStatus(sub.status)} />
                                            </td>
                                            <td className="tabular-nums">{fmtDate(sub.starts_at)}</td>
                                            <td className="font-medium text-zinc-900 tabular-nums">{sub.expires_at ? fmtDate(sub.expires_at) : 'No end date'}</td>
                                            <td className="text-right whitespace-nowrap">
                                                {live && (
                                                    <Button size="sm" variant="ghost" href={`/dashboard/services/${svc.slug}`}>
                                                        Open
                                                    </Button>
                                                )}
                                                {live && sub.auto_renew && (
                                                    <Button size="sm" variant="ghost" className="text-red-600!" onClick={() => cancel(sub)}>
                                                        Cancel renewal
                                                    </Button>
                                                )}
                                                {!live && svc.status === 'published' && (
                                                    <Button size="sm" href={`/services/${svc.slug}`}>
                                                        Renew
                                                    </Button>
                                                )}
                                            </td>
                                        </tr>
                                    );
                                })}
                            </tbody>
                        </table>
                    </div>
                )}
            </div>
            <p className="mt-4 flex items-center gap-2 text-sm text-zinc-500">
                <Icon name="information-circle" variant="mini" className="shrink-0 text-zinc-400" />
                Cancelling stops renewal; access continues until the end of the period you paid for.
            </p>
        </div>
    );
}

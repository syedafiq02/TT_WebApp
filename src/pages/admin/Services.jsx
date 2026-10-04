/* pages/admin/services.blade.php — Products review queue and catalogue */
import { useState } from 'react';
import { Link } from 'react-router-dom';
import { useFeedback } from '../../components/Feedback';
import { Button, Empty, PageHeader, Pagination, Status, Switch, Tabs, Textarea } from '../../components/ui';
import { serviceStatus, typeLabel } from '../../data/enums';
import { activePlans, categoryById, providerById, sortByDesc } from '../../data/queries';
import { useStore } from '../../data/store';
import { usePaginated } from '../../hooks/usePaginated';
import { usePerform } from '../../hooks/usePerform';
import { useQueryState } from '../../hooks/useQueryState';
import { useTitle } from '../../hooks/useTitle';

export default function Services() {
    useTitle('Products');
    const { db, actions } = useStore();
    const perform = usePerform();
    const { confirm } = useFeedback();
    const [tab, setTab] = useQueryState('tab', 'pending_review');
    const [rejecting, setRejecting] = useState(null);
    const [reason, setReason] = useState('');
    const [reasonError, setReasonError] = useState(null);

    const list = sortByDesc(
        db.services.filter((s) => tab === 'all' || s.status === tab),
        'updated_at',
    );
    const { items, pagination } = usePaginated(list, 20);

    return (
        <div>
            <PageHeader title="Products" description="Review queue and catalogue. Only published products from approved providers appear in Explore." />

            <Tabs
                className="mb-4"
                value={tab}
                onChange={setTab}
                tabs={[
                    { value: 'pending_review', label: 'Review queue' },
                    { value: 'published', label: 'Published' },
                    { value: 'rejected', label: 'Rejected' },
                    { value: 'suspended', label: 'Suspended' },
                    { value: 'draft', label: 'Draft' },
                    { value: 'all', label: 'All' },
                ]}
            />

            {rejecting && (
                <form
                    className="tt-card mb-4 grid gap-3 p-5"
                    onSubmit={(e) => {
                        e.preventDefault();
                        if (!reason.trim()) return setReasonError('The reason field is required.');
                        if (perform(() => actions.rejectService(rejecting, reason), 'Listing rejected.')) {
                            setRejecting(null);
                            setReason('');
                            setReasonError(null);
                        }
                    }}
                >
                    <Textarea label="Reason for rejection (sent to the provider)" rows={3} value={reason} onChange={(e) => setReason(e.target.value)} error={reasonError} autoFocus />
                    <div className="flex gap-2">
                        <Button type="submit" variant="danger">
                            Reject listing
                        </Button>
                        <Button onClick={() => setRejecting(null)}>Cancel</Button>
                    </div>
                </form>
            )}

            {list.length === 0 ? (
                <Empty title="Nothing here" icon="squares-2x2" />
            ) : (
                <>
                    <div className="tt-card overflow-x-auto">
                        <table className="tt-table min-w-[860px]">
                            <thead>
                                <tr>
                                    <th>Product</th>
                                    <th>Provider</th>
                                    <th>Type</th>
                                    <th>Plans</th>
                                    <th>Status</th>
                                    <th>Featured</th>
                                    <th />
                                </tr>
                            </thead>
                            <tbody>
                                {items.map((s) => (
                                    <tr key={s.id}>
                                        <td>
                                            <Link to={`/admin/services/${s.slug}`} className="font-medium hover:text-brand">
                                                {s.title}
                                            </Link>
                                            <p className="text-xs text-zinc-500">{categoryById(db, s.category_id)?.name}</p>
                                        </td>
                                        <td>{providerById(db, s.provider_id).display_name}</td>
                                        <td className="text-zinc-600">{typeLabel(s.service_type)}</td>
                                        <td className="tabular-nums">{activePlans(db, s.id).length}</td>
                                        <td>
                                            <Status value={serviceStatus(s.status)} />
                                        </td>
                                        <td>
                                            <Switch checked={s.featured} onChange={() => actions.toggleFeatured(s.id)} label={`Feature ${s.title}`} />
                                        </td>
                                        <td className="text-right whitespace-nowrap">
                                            {s.status === 'pending_review' && (
                                                <>
                                                    <Button size="sm" variant="primary" onClick={() => perform(() => actions.approveService(s.id), `${s.title} approved and published.`)}>
                                                        Approve
                                                    </Button>
                                                    <Button
                                                        size="sm"
                                                        variant="ghost"
                                                        onClick={() => {
                                                            setRejecting(s.id);
                                                            window.scrollTo({ top: 0, behavior: 'smooth' });
                                                        }}
                                                    >
                                                        Reject
                                                    </Button>
                                                </>
                                            )}
                                            {s.status === 'published' && (
                                                <Button
                                                    size="sm"
                                                    variant="ghost"
                                                    onClick={async () => {
                                                        if (await confirm('Suspend this listing? Subscribers lose access while it is suspended.', { confirmLabel: 'Suspend', danger: true })) perform(() => actions.suspendService(s.id), 'Listing suspended.');
                                                    }}
                                                >
                                                    Suspend
                                                </Button>
                                            )}
                                            {s.status === 'suspended' && (
                                                <Button size="sm" onClick={() => perform(() => actions.reinstateService(s.id), 'Listing reinstated.')}>
                                                    Reinstate
                                                </Button>
                                            )}
                                        </td>
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

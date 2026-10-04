/* pages/provider/services.blade.php — My Products */
import { Button, Empty, PageHeader, Status, Tabs } from '../../components/ui';
import { serviceStatus, typeLabel } from '../../data/enums';
import { activePlans, categoryById, sortByDesc } from '../../data/queries';
import { usePerform } from '../../hooks/usePerform';
import { useQueryState } from '../../hooks/useQueryState';
import { useTitle } from '../../hooks/useTitle';
import { fmtDate } from '../../utils/format';
import { useProvider } from '../../hooks/useProvider';

export default function Services() {
    useTitle('My Products');
    const { db, actions, services } = useProvider();
    const perform = usePerform();
    const [tab, setTab] = useQueryState('tab', 'all');
    const list = sortByDesc(
        services.filter((s) => tab === 'all' || s.status === tab),
        'updated_at',
    );
    const count = (status) => services.filter((s) => s.status === status).length;

    return (
        <div>
            <PageHeader
                title="My Products"
                description="Draft → submit for review → admin approval → published. Each product has its own plans, files and customers."
                actions={
                    <Button variant="primary" icon="plus" href="/provider/services/create">
                        Create product
                    </Button>
                }
            />

            <Tabs
                className="mb-4"
                value={tab}
                onChange={setTab}
                tabs={[
                    { value: 'all', label: 'All' },
                    { value: 'published', label: 'Published', count: count('published') },
                    { value: 'draft', label: 'Draft', count: count('draft') },
                    { value: 'pending_review', label: 'Pending Review', count: count('pending_review') },
                    { value: 'rejected', label: 'Rejected', count: count('rejected') },
                ]}
            />

            {list.length === 0 ? (
                <Empty
                    title="No products in this view"
                    icon="squares-2x2"
                    actions={
                        <Button size="sm" variant="primary" href="/provider/services/create">
                            Create product
                        </Button>
                    }
                />
            ) : (
                <div className="tt-card overflow-x-auto">
                    <table className="tt-table min-w-[760px]">
                        <thead>
                            <tr>
                                <th>Product</th>
                                <th>Status</th>
                                <th>Plans</th>
                                <th>Files</th>
                                <th>Subscriptions</th>
                                <th>Updated</th>
                                <th />
                            </tr>
                        </thead>
                        <tbody>
                            {list.map((s) => {
                                const editable = ['draft', 'rejected'].includes(s.status);
                                return (
                                    <tr key={s.id}>
                                        <td>
                                            <p className="font-medium">{s.title}</p>
                                            <p className="text-xs text-zinc-500">
                                                {typeLabel(s.service_type)} · {categoryById(db, s.category_id)?.name}
                                            </p>
                                            {s.status === 'rejected' && s.rejection_reason && <p className="mt-1 text-xs text-red-600">Rejected: {s.rejection_reason}</p>}
                                        </td>
                                        <td>
                                            <Status value={serviceStatus(s.status)} />
                                        </td>
                                        <td className="tabular-nums">{activePlans(db, s.id).length}</td>
                                        <td className="tabular-nums">{db.files.filter((f) => f.service_id === s.id).length}</td>
                                        <td className="tabular-nums">{db.subscriptions.filter((x) => x.service_id === s.id).length}</td>
                                        <td className="text-xs tabular-nums">{fmtDate(s.updated_at)}</td>
                                        <td className="text-right whitespace-nowrap">
                                            <Button size="sm" variant="ghost" href={`/provider/services/${s.slug}/edit`}>
                                                {editable ? 'Edit' : 'Manage'}
                                            </Button>
                                            {editable && (
                                                <Button size="sm" onClick={() => perform(() => actions.submitService(s.id), 'Submitted for review.')}>
                                                    Submit for review
                                                </Button>
                                            )}
                                            {s.status === 'pending_review' && (
                                                <Button size="sm" variant="ghost" onClick={() => perform(() => actions.withdrawService(s.id), 'Moved back to draft.')}>
                                                    Withdraw
                                                </Button>
                                            )}
                                            {s.status === 'published' && (
                                                <Button size="sm" variant="ghost" href={`/services/${s.slug}`}>
                                                    View live
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
    );
}

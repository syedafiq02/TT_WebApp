/* pages/provider/content.blade.php */
import { Link } from 'react-router-dom';
import { Empty, PageHeader, Pagination, Status } from '../../components/ui';
import { CONTENT_TYPES, contentStatus, ENTITLEMENTS } from '../../data/enums';
import { serviceById, sortByDesc } from '../../data/queries';
import { useProvider } from '../../hooks/useProvider';
import { usePaginated } from '../../hooks/usePaginated';
import { useTitle } from '../../hooks/useTitle';
import { fmtDate } from '../../utils/format';

export default function Content() {
    useTitle('Content');
    const { db, serviceIds } = useProvider();
    const all = sortByDesc(
        db.contents.filter((c) => serviceIds.includes(c.service_id)),
        'created_at',
    );
    const { items, pagination } = usePaginated(all, 25);

    return (
        <div>
            <PageHeader title="Content" description="Everything you have published to subscribers. Add new content from a service's edit page." />
            {all.length === 0 ? (
                <Empty title="No content yet" icon="document-text">
                    Open a service and use the Content panel to publish lessons, reports, signals or downloads.
                </Empty>
            ) : (
                <>
                    <div className="tt-card overflow-x-auto">
                        <table className="tt-table min-w-[720px]">
                            <thead>
                                <tr>
                                    <th>Title</th>
                                    <th>Service</th>
                                    <th>Type</th>
                                    <th>Access required</th>
                                    <th>Status</th>
                                    <th>Published</th>
                                </tr>
                            </thead>
                            <tbody>
                                {items.map((item) => {
                                    const svc = serviceById(db, item.service_id);
                                    return (
                                        <tr key={item.id}>
                                            <td className="font-medium">
                                                <Link to={`/provider/services/${svc.slug}/edit`} className="hover:text-brand">
                                                    {item.title}
                                                </Link>
                                            </td>
                                            <td className="text-zinc-600">{svc.title}</td>
                                            <td>{CONTENT_TYPES[item.type]}</td>
                                            <td className="text-zinc-600">{ENTITLEMENTS[item.required_entitlement].label}</td>
                                            <td>
                                                <Status value={contentStatus(item.status)} />
                                            </td>
                                            <td className="text-xs tabular-nums">{item.published_at ? fmtDate(item.published_at) : '—'}</td>
                                        </tr>
                                    );
                                })}
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

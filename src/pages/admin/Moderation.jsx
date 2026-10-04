/* pages/admin/moderation.blade.php — Content Moderation */
import { Badge, Button, PageHeader, Pagination, Status } from '../../components/ui';
import { CONTENT_TYPES, contentStatus, FLAGGED_TERMS } from '../../data/enums';
import { providerById, serviceById, sortByDesc } from '../../data/queries';
import { useStore } from '../../data/store';
import { usePaginated } from '../../hooks/usePaginated';
import { usePerform } from '../../hooks/usePerform';
import { useTitle } from '../../hooks/useTitle';

const flagged = (item) => {
    const text = `${item.title} ${item.summary ?? ''} ${item.body ?? ''}`.toLowerCase();
    return FLAGGED_TERMS.some((t) => text.includes(t));
};

export default function Moderation() {
    useTitle('Content Moderation');
    const { db, actions } = useStore();
    const perform = usePerform();
    const { items, pagination } = usePaginated(sortByDesc(db.contents, 'created_at'), 25);

    return (
        <div>
            <PageHeader title="Content Moderation" description="Recently published provider content. Items containing prohibited claim language are flagged." />

            <div className="tt-card overflow-x-auto">
                <table className="tt-table min-w-[860px]">
                    <thead>
                        <tr>
                            <th>Content</th>
                            <th>Service</th>
                            <th>Provider</th>
                            <th>Status</th>
                            <th>Check</th>
                            <th />
                        </tr>
                    </thead>
                    <tbody>
                        {items.length === 0 && (
                            <tr>
                                <td colSpan={6} className="text-center text-zinc-500">
                                    No content yet.
                                </td>
                            </tr>
                        )}
                        {items.map((item) => {
                            const svc = serviceById(db, item.service_id);
                            return (
                                <tr key={item.id}>
                                    <td className="font-medium">
                                        {item.title}
                                        <p className="text-xs font-normal text-zinc-500">{CONTENT_TYPES[item.type]}</p>
                                    </td>
                                    <td>{svc.title}</td>
                                    <td className="text-zinc-600">{providerById(db, svc.provider_id).display_name}</td>
                                    <td>
                                        <Status value={contentStatus(item.status)} />
                                    </td>
                                    <td>
                                        {flagged(item) ? (
                                            <Badge size="sm" color="red" icon="flag">
                                                Claim language
                                            </Badge>
                                        ) : (
                                            <span className="text-xs text-zinc-400">OK</span>
                                        )}
                                    </td>
                                    <td className="text-right">
                                        {item.status === 'published' && (
                                            <Button size="sm" variant="ghost" onClick={() => perform(() => actions.hideContent(item.id), 'Content hidden.')}>
                                                Hide
                                            </Button>
                                        )}
                                    </td>
                                </tr>
                            );
                        })}
                    </tbody>
                </table>
            </div>
            <div className="mt-6">
                <Pagination {...pagination} />
            </div>
        </div>
    );
}

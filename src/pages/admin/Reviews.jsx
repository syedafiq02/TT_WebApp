/* pages/admin/reviews.blade.php — Reviews & Reports */
import { Button, PageHeader, Pagination, Status } from '../../components/ui';
import { reviewStatus } from '../../data/enums';
import { serviceById, sortByDesc, userOf } from '../../data/queries';
import { useStore } from '../../data/store';
import { usePaginated } from '../../hooks/usePaginated';
import { usePerform } from '../../hooks/usePerform';
import { useTitle } from '../../hooks/useTitle';

export default function Reviews() {
    useTitle('Reviews & Reports');
    const { db, actions } = useStore();
    const perform = usePerform();
    const { items, pagination } = usePaginated(sortByDesc(db.reviews, 'created_at'), 25);

    return (
        <div>
            <PageHeader title="Reviews & Reports" description="Moderate subscriber reviews. A report queue for providers and listings is planned for the next phase." />

            <div className="tt-card overflow-x-auto">
                <table className="tt-table min-w-[860px]">
                    <thead>
                        <tr>
                            <th>Service</th>
                            <th>Reviewer</th>
                            <th>Rating</th>
                            <th>Review</th>
                            <th>Status</th>
                            <th />
                        </tr>
                    </thead>
                    <tbody>
                        {items.length === 0 && (
                            <tr>
                                <td colSpan={6} className="text-center text-zinc-500">
                                    No reviews yet.
                                </td>
                            </tr>
                        )}
                        {items.map((r) => (
                            <tr key={r.id}>
                                <td>{serviceById(db, r.service_id).title}</td>
                                <td>{userOf(db, r.user_id)?.name}</td>
                                <td className="font-medium text-amber-600 tabular-nums">{r.rating}/5</td>
                                <td className="max-w-sm text-zinc-600">
                                    <p className="line-clamp-2">{r.body}</p>
                                </td>
                                <td>
                                    <Status value={reviewStatus(r.status)} />
                                </td>
                                <td className="text-right">
                                    {r.status === 'published' ? (
                                        <Button size="sm" variant="ghost" onClick={() => perform(() => actions.setReviewStatus(r.id, 'hidden'), 'Review hidden.')}>
                                            Hide
                                        </Button>
                                    ) : (
                                        <Button size="sm" onClick={() => perform(() => actions.setReviewStatus(r.id, 'published'), 'Review published.')}>
                                            Publish
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
        </div>
    );
}

/* pages/provider/reviews.blade.php */
import { Empty, PageHeader } from '../../components/ui';
import { serviceById, sortByDesc, userOf } from '../../data/queries';
import { useProvider } from '../../hooks/useProvider';
import { useTitle } from '../../hooks/useTitle';
import { fmtDate } from '../../utils/format';

export default function Reviews() {
    useTitle('Reviews');
    const { db, serviceIds } = useProvider();
    const reviews = sortByDesc(
        db.reviews.filter((r) => serviceIds.includes(r.service_id) && r.status === 'published'),
        'created_at',
    );

    return (
        <div>
            <PageHeader title="Reviews" description="Reviews come only from customers who subscribed to your services." />
            {reviews.length === 0 ? (
                <Empty title="No reviews yet" icon="star" />
            ) : (
                <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                    {reviews.map((r) => (
                        <div key={r.id} className="tt-card grid gap-2 p-5">
                            <div className="flex items-center justify-between text-sm">
                                <b className="font-medium">{userOf(db, r.user_id)?.name}</b>
                                <span className="text-xs text-zinc-500 tabular-nums">{fmtDate(r.created_at)}</span>
                            </div>
                            <p className="text-xs text-zinc-500">
                                {serviceById(db, r.service_id).title} · <span className="font-medium text-amber-600 tabular-nums">{r.rating}/5</span>
                            </p>
                            {r.body && <p className="text-sm text-zinc-700">{r.body}</p>}
                        </div>
                    ))}
                </div>
            )}
        </div>
    );
}

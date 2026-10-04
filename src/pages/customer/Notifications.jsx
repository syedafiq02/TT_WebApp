/* pages/customer/notifications.blade.php */
import { Link } from 'react-router-dom';
import { Button, Empty, Icon, PageHeader, Pagination } from '../../components/ui';
import { sortByDesc } from '../../data/queries';
import { useStore } from '../../data/store';
import { usePaginated } from '../../hooks/usePaginated';
import { useTitle } from '../../hooks/useTitle';
import { diffForHumans } from '../../utils/format';

export default function Notifications() {
    useTitle('Notifications');
    const { db, user, actions } = useStore();
    const all = sortByDesc(
        db.notifications.filter((n) => n.user_id === user.id),
        'created_at',
    );
    const { items, pagination } = usePaginated(all, 20);

    return (
        <div>
            <PageHeader
                title="Notifications"
                description="Updates about your subscriptions, payments and services."
                actions={
                    <Button size="sm" onClick={() => actions.markAllRead()} disabled={!all.some((n) => !n.read_at)}>
                        Mark all as read
                    </Button>
                }
            />

            {all.length === 0 ? (
                <Empty title="You're all caught up" icon="bell" />
            ) : (
                <>
                    <div className="tt-card">
                        {items.map((n) => (
                            <div key={n.id} className="flex gap-4 border-b border-zinc-100 px-5 py-4 last:border-0">
                                <Icon name={n.data.icon ?? 'bell'} variant="mini" className={`mt-0.5 ${n.read_at ? 'text-zinc-400' : 'text-brand'}`} />
                                <div className="min-w-0 flex-1">
                                    <p className={n.read_at ? 'text-zinc-600' : 'font-semibold'}>{n.data.title}</p>
                                    <p className="text-sm text-zinc-500">{n.data.body}</p>
                                    {n.data.url && (
                                        <Link to={n.data.url} onClick={() => actions.markRead(n.id)} className="mt-1 inline-block text-sm text-brand hover:underline">
                                            View
                                        </Link>
                                    )}
                                </div>
                                <span className="shrink-0 text-xs text-zinc-400 tabular-nums">{diffForHumans(n.created_at)}</span>
                            </div>
                        ))}
                    </div>
                    <div className="mt-6">
                        <Pagination {...pagination} />
                    </div>
                </>
            )}
        </div>
    );
}

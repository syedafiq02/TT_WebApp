/* pages/customer/learning.blade.php */
import { Link } from 'react-router-dom';
import { Badge, Empty, PageHeader } from '../../components/ui';
import { CONTENT_TYPES } from '../../data/enums';
import { grantedTypes, serviceById, sortByDesc } from '../../data/queries';
import { useStore } from '../../data/store';
import { useTitle } from '../../hooks/useTitle';
import { fmtDay } from '../../utils/format';

export default function Learning() {
    useTitle('Learning / Content');
    const { db, user } = useStore();
    const serviceIds = db.services.filter((s) => grantedTypes(db, user.id, s).includes('content_access')).map((s) => s.id);
    const items = sortByDesc(
        db.contents.filter((c) => serviceIds.includes(c.service_id) && c.required_entitlement === 'content_access' && c.status === 'published'),
        'published_at',
    ).slice(0, 30);

    return (
        <div>
            <PageHeader title="Learning / Content" description="Lessons, articles, videos and reports from your subscriptions." />
            {items.length === 0 ? (
                <Empty title="No content yet" icon="academic-cap">
                    Content from academy, research and mentorship services you subscribe to will appear here.
                </Empty>
            ) : (
                <div className="tt-card">
                    {items.map((item) => {
                        const svc = serviceById(db, item.service_id);
                        return (
                            <Link key={item.id} to={`/dashboard/services/${svc.slug}?section=content_access`} className="flex items-center gap-4 border-b border-zinc-100 px-5 py-4 last:border-0 hover:bg-zinc-50">
                                <Badge size="sm">{CONTENT_TYPES[item.type]}</Badge>
                                <div className="min-w-0 flex-1">
                                    <p className="truncate font-medium">{item.title}</p>
                                    <p className="text-sm text-zinc-500">{svc.title}</p>
                                </div>
                                <span className="text-xs text-zinc-400 tabular-nums">{fmtDay(item.published_at)}</span>
                            </Link>
                        );
                    })}
                </div>
            )}
        </div>
    );
}

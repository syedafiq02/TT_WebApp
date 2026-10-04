/* pages/admin/audit-logs.blade.php */
import { PageHeader, Pagination, Select } from '../../components/ui';
import { sortByDesc, userOf } from '../../data/queries';
import { useStore } from '../../data/store';
import { usePaginated } from '../../hooks/usePaginated';
import { useQueryState } from '../../hooks/useQueryState';
import { useTitle } from '../../hooks/useTitle';
import { fmtDateTime } from '../../utils/format';

const FILTERS = { provider: 'Providers', service: 'Services', payment: 'Payments', payout: 'Payouts', subscription: 'Subscriptions', user: 'Users', category: 'Categories', review: 'Reviews', content: 'Content', advertising: 'Advertising' };

export default function AuditLogs() {
    useTitle('Audit Logs');
    const { db } = useStore();
    const [action, setAction] = useQueryState('action');
    const list = sortByDesc(
        db.auditLogs.filter((l) => !action || l.action.startsWith(`${action}.`)),
        'created_at',
    );
    const { items, pagination } = usePaginated(list, 40);

    return (
        <div>
            <PageHeader title="Audit Logs" description="Append-only record of approvals, rejections, suspensions, payments and payouts." />

            <div className="mb-4">
                <Select className="w-56" value={action} onChange={(e) => setAction(e.target.value)} aria-label="Action">
                    <option value="">All actions</option>
                    {Object.entries(FILTERS).map(([k, l]) => (
                        <option key={k} value={k}>
                            {l}
                        </option>
                    ))}
                </Select>
            </div>

            <div className="tt-card overflow-x-auto">
                <table className="tt-table min-w-[860px]">
                    <thead>
                        <tr>
                            <th>When</th>
                            <th>Action</th>
                            <th>Actor</th>
                            <th>Subject</th>
                            <th>Details</th>
                        </tr>
                    </thead>
                    <tbody>
                        {items.length === 0 && (
                            <tr>
                                <td colSpan={5} className="text-center text-zinc-500">
                                    No entries yet.
                                </td>
                            </tr>
                        )}
                        {items.map((log) => (
                            <tr key={log.id}>
                                <td className="text-xs whitespace-nowrap tabular-nums">{fmtDateTime(log.created_at)}</td>
                                <td className="font-mono text-xs font-medium text-zinc-800">{log.action}</td>
                                <td>{log.actor_id ? userOf(db, log.actor_id)?.name ?? 'Deleted user' : 'System'}</td>
                                <td className="text-xs text-zinc-600 tabular-nums">
                                    {log.subject_type} {log.subject_id ? `#${log.subject_id}` : ''}
                                </td>
                                <td className="max-w-sm truncate font-mono text-[11px] text-zinc-500">{log.properties ? JSON.stringify(log.properties) : ''}</td>
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

/* pages/admin/users.blade.php */
import { useEffect, useState } from 'react';
import { useFeedback } from '../../components/Feedback';
import { Badge, Button, Input, PageHeader, Pagination, Select, Status } from '../../components/ui';
import { USER_ROLES, userStatus } from '../../data/enums';
import { sortByDesc } from '../../data/queries';
import { useStore } from '../../data/store';
import { usePaginated } from '../../hooks/usePaginated';
import { usePerform } from '../../hooks/usePerform';
import { useQueryState } from '../../hooks/useQueryState';
import { useTitle } from '../../hooks/useTitle';
import { fmtDate } from '../../utils/format';

const ROLE_COLOR = { admin: 'yellow', provider: 'green', customer: 'zinc' };

export default function Users() {
    useTitle('Users');
    const { db, user, actions } = useStore();
    const perform = usePerform();
    const { confirm } = useFeedback();
    const [q, setQ] = useQueryState('q');
    const [role, setRole] = useQueryState('role');
    const [search, setSearch] = useState(q);

    useEffect(() => {
        const t = setTimeout(() => search !== q && setQ(search), 300);
        return () => clearTimeout(t);
    }, [search]); // eslint-disable-line react-hooks/exhaustive-deps

    const term = q.toLowerCase();
    const list = sortByDesc(
        db.users.filter((u) => (!term || u.name.toLowerCase().includes(term) || u.email.toLowerCase().includes(term)) && (!role || u.role === role)),
        'created_at',
    );
    const { items, pagination } = usePaginated(list, 25);

    return (
        <div>
            <PageHeader title="Users" description="All accounts. Suspended accounts are signed out and lose access to services." />

            <div className="mb-4 flex flex-wrap gap-3">
                <Input icon="magnifying-glass" placeholder="Search name or email" className="w-full max-w-sm" value={search} onChange={(e) => setSearch(e.target.value)} aria-label="Search users" />
                <Select className="w-44" value={role} onChange={(e) => setRole(e.target.value)} aria-label="Role">
                    <option value="">All roles</option>
                    {USER_ROLES.map((r) => (
                        <option key={r} value={r}>
                            {r[0].toUpperCase() + r.slice(1)}
                        </option>
                    ))}
                </Select>
            </div>

            <div className="tt-card overflow-x-auto">
                <table className="tt-table min-w-[760px]">
                    <thead>
                        <tr>
                            <th>Name</th>
                            <th>Email</th>
                            <th>Role</th>
                            <th>Status</th>
                            <th>Joined</th>
                            <th />
                        </tr>
                    </thead>
                    <tbody>
                        {items.length === 0 && (
                            <tr>
                                <td colSpan={6} className="text-center text-zinc-500">
                                    No users match these filters.
                                </td>
                            </tr>
                        )}
                        {items.map((u) => (
                            <tr key={u.id}>
                                <td className="font-medium">{u.name}</td>
                                <td className="text-zinc-600">{u.email}</td>
                                <td>
                                    <Badge size="sm" color={ROLE_COLOR[u.role]}>
                                        {u.role[0].toUpperCase() + u.role.slice(1)}
                                    </Badge>
                                </td>
                                <td>
                                    <Status value={userStatus(u.status)} />
                                </td>
                                <td className="text-xs tabular-nums">{fmtDate(u.created_at)}</td>
                                <td className="text-right">
                                    {u.status === 'active' ? (
                                        u.id !== user.id && (
                                            <Button
                                                size="sm"
                                                variant="ghost"
                                                onClick={async () => {
                                                    if (await confirm(`Suspend ${u.email}?`, { confirmLabel: 'Suspend', danger: true })) perform(() => actions.setUserStatus(u.id, 'suspended'), 'User suspended.');
                                                }}
                                            >
                                                Suspend
                                            </Button>
                                        )
                                    ) : (
                                        <Button size="sm" onClick={() => perform(() => actions.setUserStatus(u.id, 'active'), 'User reactivated.')}>
                                            Reactivate
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

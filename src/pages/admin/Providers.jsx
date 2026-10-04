/* pages/admin/providers.blade.php */
import { Link } from 'react-router-dom';
import { useFeedback } from '../../components/Feedback';
import { Button, Empty, PageHeader, Status } from '../../components/ui';
import { providerStatus } from '../../data/enums';
import { providerServices, userOf } from '../../data/queries';
import { useStore } from '../../data/store';
import { usePerform } from '../../hooks/usePerform';
import { useTitle } from '../../hooks/useTitle';
import { fmtDate } from '../../utils/format';

export default function Providers() {
    useTitle('Providers');
    const { db, actions } = useStore();
    const perform = usePerform();
    const { confirm } = useFeedback();
    const providers = db.providers.filter((p) => ['approved', 'suspended'].includes(p.status)).sort((a, b) => a.display_name.localeCompare(b.display_name));

    return (
        <div>
            <PageHeader title="Providers" description="Approved and suspended providers. New applications are under Provider Applications." />
            {providers.length === 0 ? (
                <Empty title="No approved providers yet" icon="check-badge" />
            ) : (
                <div className="tt-card overflow-x-auto">
                    <table className="tt-table min-w-[760px]">
                        <thead>
                            <tr>
                                <th>Provider</th>
                                <th>Account</th>
                                <th>Services</th>
                                <th>Approved</th>
                                <th>Status</th>
                                <th />
                            </tr>
                        </thead>
                        <tbody>
                            {providers.map((p) => (
                                <tr key={p.id}>
                                    <td>
                                        <Link to={`/providers/${p.slug}`} className="font-medium hover:text-brand">
                                            {p.display_name}
                                        </Link>
                                        <p className="text-xs text-zinc-500">{p.specialisation}</p>
                                    </td>
                                    <td className="text-zinc-600">{userOf(db, p.user_id)?.email}</td>
                                    <td className="tabular-nums">{providerServices(db, p.id).length}</td>
                                    <td className="text-xs tabular-nums">{fmtDate(p.approved_at)}</td>
                                    <td>
                                        <Status value={providerStatus(p.status)} />
                                    </td>
                                    <td className="text-right">
                                        {p.status === 'approved' ? (
                                            <Button
                                                size="sm"
                                                variant="ghost"
                                                onClick={async () => {
                                                    if (await confirm(`Suspend ${p.display_name}? Their listings will be hidden.`, { confirmLabel: 'Suspend', danger: true })) perform(() => actions.suspendProvider(p.id), 'Provider suspended.');
                                                }}
                                            >
                                                Suspend
                                            </Button>
                                        ) : (
                                            <Button size="sm" onClick={() => perform(() => actions.reinstateProvider(p.id), 'Provider reinstated.')}>
                                                Reinstate
                                            </Button>
                                        )}
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            )}
        </div>
    );
}

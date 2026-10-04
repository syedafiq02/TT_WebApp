/* pages/provider/customers.blade.php */
import { Button, Empty, PageHeader, Pagination, Status } from '../../components/ui';
import { bookingStatus, subscriptionStatus } from '../../data/enums';
import { planById, serviceById, sortByAsc, sortByDesc, userOf } from '../../data/queries';
import { useProvider } from '../../hooks/useProvider';
import { usePaginated } from '../../hooks/usePaginated';
import { usePerform } from '../../hooks/usePerform';
import { useTitle } from '../../hooks/useTitle';
import { fmtDate, fmtSession } from '../../utils/format';

export default function Customers() {
    useTitle('Customers');
    const { db, actions, provider, serviceIds } = useProvider();
    const perform = usePerform();
    const subs = sortByDesc(
        db.subscriptions.filter((s) => serviceIds.includes(s.service_id)),
        'starts_at',
    );
    const bookings = sortByAsc(
        db.bookings.filter((b) => b.provider_id === provider.id && ['requested', 'confirmed'].includes(b.status)),
        'scheduled_at',
    );
    const { items, pagination } = usePaginated(subs, 20);
    const setBooking = (id, status) => perform(() => actions.setBookingStatus(id, status), `Booking ${status[0].toUpperCase()}${status.slice(1)}.`);

    return (
        <div>
            <PageHeader title="Customers" description="Subscribers across your services and upcoming bookings." />

            {bookings.length > 0 && (
                <section className="tt-card mb-6">
                    <h2 className="border-b border-zinc-200 px-5 py-4 text-[15px] font-semibold">Bookings to manage</h2>
                    {bookings.map((b) => (
                        <div key={b.id} className="flex flex-wrap items-center justify-between gap-3 border-b border-zinc-100 px-5 py-3 text-sm last:border-0">
                            <div>
                                <p className="font-medium">
                                    {userOf(db, b.user_id).name} · {serviceById(db, b.service_id).title}
                                </p>
                                <p className="text-xs text-zinc-500 tabular-nums">{fmtSession(b.scheduled_at)}</p>
                                {b.notes && <p className="text-xs text-zinc-600">“{b.notes}”</p>}
                            </div>
                            <div className="flex items-center gap-2">
                                <Status value={bookingStatus(b.status)} />
                                {b.status === 'requested' ? (
                                    <Button size="xs" variant="primary" onClick={() => setBooking(b.id, 'confirmed')}>
                                        Confirm
                                    </Button>
                                ) : (
                                    <Button size="xs" onClick={() => setBooking(b.id, 'completed')}>
                                        Mark completed
                                    </Button>
                                )}
                                <Button size="xs" variant="ghost" onClick={() => setBooking(b.id, 'cancelled')}>
                                    Cancel
                                </Button>
                            </div>
                        </div>
                    ))}
                </section>
            )}

            {subs.length === 0 ? (
                <Empty title="No customers yet" icon="users">
                    Customers appear here when they subscribe to your published services.
                </Empty>
            ) : (
                <>
                    <div className="tt-card overflow-x-auto">
                        <table className="tt-table min-w-[720px]">
                            <thead>
                                <tr>
                                    <th>Customer</th>
                                    <th>Service</th>
                                    <th>Plan</th>
                                    <th>Since</th>
                                    <th>Ends</th>
                                    <th>Status</th>
                                </tr>
                            </thead>
                            <tbody>
                                {items.map((sub) => (
                                    <tr key={sub.id}>
                                        <td className="font-medium">{userOf(db, sub.user_id)?.name}</td>
                                        <td>{serviceById(db, sub.service_id).title}</td>
                                        <td>{planById(db, sub.plan_id).name}</td>
                                        <td className="text-xs tabular-nums">{fmtDate(sub.starts_at)}</td>
                                        <td className="text-xs tabular-nums">{sub.expires_at ? fmtDate(sub.expires_at) : '—'}</td>
                                        <td>
                                            <Status value={subscriptionStatus(sub.status)} />
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                    <div className="mt-6">
                        <Pagination {...pagination} />
                    </div>
                    <p className="mt-4 text-xs text-zinc-500">Customer contact details are shared only as needed to deliver the service, in line with PDPA.</p>
                </>
            )}
        </div>
    );
}

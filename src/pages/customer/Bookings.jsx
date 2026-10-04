/* pages/customer/bookings.blade.php */
import { Button, Empty, PageHeader, Status } from '../../components/ui';
import { bookingStatus } from '../../data/enums';
import { providerById, serviceById, sortByDesc } from '../../data/queries';
import { useStore } from '../../data/store';
import { useTitle } from '../../hooks/useTitle';
import { fmtSession } from '../../utils/format';

export default function Bookings() {
    useTitle('Bookings');
    const { db, user } = useStore();
    const bookings = sortByDesc(
        db.bookings.filter((b) => b.user_id === user.id),
        'scheduled_at',
    );

    return (
        <div>
            <PageHeader title="Bookings" description="Mentoring and consultation sessions. Request new sessions from the service's access page." />
            {bookings.length === 0 ? (
                <Empty title="No bookings yet" icon="calendar">
                    Services that include sessions let you request a time from their access page.
                </Empty>
            ) : (
                <div className="tt-card overflow-x-auto">
                    <table className="tt-table min-w-[640px]">
                        <thead>
                            <tr>
                                <th>Session</th>
                                <th>Provider</th>
                                <th>Date &amp; time</th>
                                <th>Status</th>
                                <th />
                            </tr>
                        </thead>
                        <tbody>
                            {bookings.map((b) => (
                                <tr key={b.id}>
                                    <td className="font-medium">{serviceById(db, b.service_id).title}</td>
                                    <td className="text-zinc-600">{providerById(db, b.provider_id).display_name}</td>
                                    <td className="text-xs tabular-nums">{fmtSession(b.scheduled_at)}</td>
                                    <td>
                                        <Status value={bookingStatus(b.status)} />
                                    </td>
                                    <td className="text-right">
                                        {b.meeting_url && b.status === 'confirmed' && (
                                            <Button size="sm" href={b.meeting_url} external>
                                                Join
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

/* pages/admin/applications.blade.php — Provider Applications */
import { useState } from 'react';
import { useFeedback } from '../../components/Feedback';
import { Button, Callout, Empty, PageHeader, Status, Tabs, Textarea } from '../../components/ui';
import { providerStatus } from '../../data/enums';
import { sortByDesc, userOf } from '../../data/queries';
import { useStore } from '../../data/store';
import { usePerform } from '../../hooks/usePerform';
import { useQueryState } from '../../hooks/useQueryState';
import { useTitle } from '../../hooks/useTitle';
import { cx, fmtDay } from '../../utils/format';

export default function Applications() {
    useTitle('Provider Applications');
    const { db, actions } = useStore();
    const perform = usePerform();
    const { confirm } = useFeedback();
    const [tab, setTab] = useQueryState('tab', 'pending');
    const [selected, setSelected] = useQueryState('selected');
    const [notes, setNotes] = useState('');
    const [notesError, setNotesError] = useState(null);

    const list = sortByDesc(
        db.providers.filter((p) => p.status === tab),
        'submitted_at',
    );
    const current = list.find((p) => String(p.id) === selected) ?? list[0];
    const applicant = current && userOf(db, current.user_id);
    const reviewer = current?.reviewed_by && userOf(db, current.reviewed_by);

    return (
        <div>
            <PageHeader title="Provider Applications" description="Applicants cannot publish anything until approved here. Every decision is written to the audit log." />

            <Tabs
                className="mb-4"
                value={tab}
                onChange={(v) => {
                    setTab(v);
                    setSelected('');
                }}
                tabs={[
                    { value: 'pending', label: 'Pending' },
                    { value: 'rejected', label: 'Rejected' },
                    { value: 'approved', label: 'Approved' },
                ]}
            />

            {list.length === 0 ? (
                <Empty title={`No ${tab} applications`} icon="inbox" />
            ) : (
                <div className="grid grid-cols-1 gap-6 xl:grid-cols-[minmax(0,1fr)_minmax(0,1.2fr)]">
                    <div className="tt-card self-start">
                        {list.map((app) => (
                            <button
                                key={app.id}
                                onClick={() => {
                                    setSelected(String(app.id));
                                    setNotes('');
                                    setNotesError(null);
                                }}
                                className={cx('flex w-full cursor-pointer items-center justify-between gap-3 border-b border-zinc-100 px-5 py-3 text-left text-sm last:border-0 hover:bg-zinc-50', current?.id === app.id && 'bg-brand-soft/60')}
                            >
                                <div>
                                    <p className="font-medium">{app.display_name}</p>
                                    <p className="text-xs text-zinc-500">
                                        {app.specialisation} · {userOf(db, app.user_id)?.email}
                                    </p>
                                </div>
                                <span className="text-xs text-zinc-400 tabular-nums">{fmtDay(app.submitted_at)}</span>
                            </button>
                        ))}
                    </div>

                    {current && (
                        <div className="tt-card grid content-start gap-5 p-6">
                            <div className="flex items-center justify-between gap-3">
                                <h2 className="text-xl font-semibold">{current.display_name}</h2>
                                <Status value={providerStatus(current.status)} />
                            </div>
                            <dl className="grid grid-cols-[auto_1fr] gap-x-6 gap-y-2 text-sm">
                                <dt className="text-zinc-500">Applicant</dt>
                                <dd>
                                    {applicant?.name} · {applicant?.email}
                                </dd>
                                <dt className="text-zinc-500">Specialisation</dt>
                                <dd>{current.specialisation}</dd>
                                <dt className="text-zinc-500">Experience</dt>
                                <dd>{current.experience_years} years</dd>
                                <dt className="text-zinc-500">SSM</dt>
                                <dd>{current.business_registration || '—'}</dd>
                                <dt className="text-zinc-500">Website</dt>
                                <dd className="break-all">{current.website || '—'}</dd>
                            </dl>
                            <div>
                                <p className="tt-label mb-1">Bio</p>
                                <p className="text-sm whitespace-pre-line text-zinc-700">{current.bio}</p>
                            </div>
                            <div>
                                <p className="tt-label mb-1">Track record</p>
                                <p className="text-sm whitespace-pre-line text-zinc-700">{current.application_notes}</p>
                            </div>
                            <div>
                                <p className="tt-label mb-1">Declarations</p>
                                <p className="text-sm text-zinc-700">{Object.values(current.declarations ?? {}).filter(Boolean).length} of 5 accepted</p>
                            </div>
                            {current.review_notes && (
                                <Callout icon="chat-bubble-left">
                                    Review notes: {current.review_notes} {reviewer && <>— {reviewer.name}</>}
                                </Callout>
                            )}
                            {current.status === 'pending' && (
                                <>
                                    <Textarea label="Notes to the applicant" description="Required when rejecting." rows={3} value={notes} onChange={(e) => setNotes(e.target.value)} error={notesError} />
                                    <div className="flex gap-2">
                                        <Button
                                            variant="primary"
                                            icon="check"
                                            onClick={async () => {
                                                if (await confirm(`Approve ${current.display_name} as a provider?`, { confirmLabel: 'Approve' })) {
                                                    perform(() => actions.approveProvider(current.id, notes), `${current.display_name} approved.`);
                                                    setSelected('');
                                                }
                                            }}
                                        >
                                            Approve
                                        </Button>
                                        <Button
                                            variant="danger"
                                            icon="x-mark"
                                            onClick={() => {
                                                if (!notes.trim()) return setNotesError('The notes field is required when rejecting.');
                                                if (perform(() => actions.rejectProvider(current.id, notes), 'Application rejected.')) setSelected('');
                                            }}
                                        >
                                            Reject
                                        </Button>
                                    </div>
                                </>
                            )}
                        </div>
                    )}
                </div>
            )}
        </div>
    );
}

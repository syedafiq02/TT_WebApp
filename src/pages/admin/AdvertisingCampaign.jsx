/* Admin: review one advertising application and manage the campaign. */
import { useState } from 'react';
import { useParams } from 'react-router-dom';
import { useFeedback } from '../../components/Feedback';
import { AdDetails, AdStatusPair, AdTimeline, campaignName } from '../../components/sponsored/AdParts';
import { AdCreative, SponsoredPlacement } from '../../components/sponsored';
import { Button, Callout, Crumbs, Input, PageHeader, Select, Textarea } from '../../components/ui';
import { AD_CAMPAIGN_STATUSES, AD_PAYMENT_STATUSES, AD_PLACEMENTS, AD_REVIEW_STATUSES, adPaymentStatus, toDateInput } from '../../data/advertising';
import { userOf } from '../../data/queries';
import { useStore } from '../../data/store';
import { usePerform } from '../../hooks/usePerform';
import { useTitle } from '../../hooks/useTitle';
import { money } from '../../utils/format';
import ErrorPage from '../errors/ErrorPage';

function EditCampaign({ c, db, actions, perform }) {
    const [form, setForm] = useState({
        placement: c.placement,
        package_id: String(c.package_id),
        price: String(c.price_minor / 100),
        start_date: toDateInput(c.start_date),
        end_date: toDateInput(c.end_date),
        cta_label: c.cta_label ?? '',
        description: c.description,
    });
    const [errors, setErrors] = useState({});
    const set = (k) => (e) => setForm((f) => ({ ...f, [k]: e.target.value }));

    const save = (e) => {
        e.preventDefault();
        const errs = {};
        if (!form.start_date) errs.start_date = 'Start date is required.';
        if (!form.end_date) errs.end_date = 'End date is required.';
        else if (form.start_date && new Date(form.end_date) <= new Date(form.start_date)) errs.end_date = 'The end date must be after the start date.';
        if (!(Number(form.price) >= 0) || form.price === '') errs.price = 'Enter a price of 0 or more.';
        if (form.description.trim().length < 20) errs.description = 'The description must be at least 20 characters.';
        setErrors(errs);
        if (Object.keys(errs).length) return;
        const start = new Date(form.start_date);
        const end = new Date(form.end_date);
        perform(
            () =>
                actions.updateAdCampaign(c.id, {
                    placement: form.placement,
                    package_id: Number(form.package_id),
                    price_minor: Math.round(Number(form.price) * 100),
                    start_date: start.toISOString(),
                    end_date: end.toISOString(),
                    duration_days: Math.round((end - start) / 86400000),
                    cta_label: form.cta_label.trim(),
                    description: form.description.trim(),
                }),
            'Campaign details saved.',
        );
    };

    return (
        <form onSubmit={save} className="tt-card grid gap-4 p-6 sm:grid-cols-2" noValidate>
            <h2 className="font-semibold sm:col-span-2">Edit campaign</h2>
            <Select label="Assigned placement" value={form.placement} onChange={set('placement')} options={Object.entries(AD_PLACEMENTS).map(([value, p]) => ({ value, label: p.label }))} />
            <Select
                label="Package"
                value={form.package_id}
                onChange={(e) => {
                    const pkg = db.adPackages.find((p) => String(p.id) === e.target.value);
                    setForm((f) => ({ ...f, package_id: e.target.value, price: String(pkg.price_minor / 100) }));
                }}
                options={db.adPackages.map((p) => ({ value: String(p.id), label: `${p.name}${p.is_active ? '' : ' (inactive)'}` }))}
            />
            <Input label="Illustrative price (RM)" type="number" min={0} step="0.01" value={form.price} onChange={set('price')} error={errors.price} description="Defaults to the package price." />
            <Input label="Call-to-action label" value={form.cta_label} onChange={set('cta_label')} />
            <Input label="Start date" type="date" value={form.start_date} onChange={set('start_date')} error={errors.start_date} />
            <Input label="End date" type="date" value={form.end_date} onChange={set('end_date')} error={errors.end_date} />
            <Textarea label="Ad description" rows={3} className="sm:col-span-2" value={form.description} onChange={set('description')} error={errors.description} />
            <div className="flex justify-end sm:col-span-2">
                <Button type="submit" variant="primary">
                    Save changes
                </Button>
            </div>
        </form>
    );
}

export default function AdvertisingCampaign() {
    const { reference } = useParams();
    const { db, actions } = useStore();
    const perform = usePerform();
    const { confirm } = useFeedback();
    const c = db.adCampaigns.find((x) => x.reference === reference);
    useTitle(c ? `Review ${c.reference}` : 'Advertising');
    const [note, setNote] = useState('');
    const [noteError, setNoteError] = useState(null);
    const [payment, setPayment] = useState(c?.payment_status ?? 'not_required');

    if (!c) return <ErrorPage code={404} />;
    const pkg = db.adPackages.find((p) => p.id === c.package_id);
    const reviewing = AD_REVIEW_STATUSES.includes(c.status);
    const isCampaign = AD_CAMPAIGN_STATUSES.includes(c.status);
    const finished = ['completed', 'cancelled', 'rejected'].includes(c.status);

    const decide = async (decision) => {
        setNoteError(null);
        if (decision !== 'approved' && !note.trim()) return setNoteError(decision === 'rejected' ? 'Give a reason for the rejection.' : 'Describe the changes needed.');
        if (decision === 'rejected' && !(await confirm(`Reject ${c.company}'s application? The advertiser will see your reason.`, { confirmLabel: 'Reject application', danger: true }))) return;
        if (decision === 'approved' && !(await confirm(`Approve ${c.company}'s application? It will move to awaiting payment (demo).`, { confirmLabel: 'Approve' }))) return;
        const labels = { approved: 'Application approved.', rejected: 'Application rejected.', changes_requested: 'Changes requested from the advertiser.' };
        if (perform(() => actions.reviewAd(c.id, decision, note.trim()), labels[decision])) setNote('');
    };

    const setStatus = async (status) => {
        if (status === 'cancelled' && !(await confirm(`Cancel campaign ${c.reference}? It will be removed from its placement.`, { confirmLabel: 'Cancel campaign', danger: true }))) return;
        perform(() => actions.setAdStatus(c.id, status), `Campaign marked ${status}.`);
    };

    return (
        <div>
            <Crumbs items={[{ label: 'Advertising', href: '/admin/advertising?tab=' + (isCampaign ? 'campaigns' : 'applications') }, { label: c.reference }]} />
            <PageHeader eyebrow="Advertising review" title={campaignName(c)} description={`${AD_PLACEMENTS[c.placement]?.label} · ${pkg?.name ?? '—'} · ${money(c.price_minor)} (illustrative)`} actions={<AdStatusPair campaign={c} />} />

            {c.status === 'changes_requested' && (
                <Callout variant="warning" icon="exclamation-triangle" className="mb-6">
                    Waiting for the advertiser to update: {c.change_request}
                </Callout>
            )}
            {c.status === 'rejected' && (
                <Callout variant="danger" icon="x-circle" className="mb-6">
                    Rejected: {c.rejection_reason}
                </Callout>
            )}

            <div className="grid grid-cols-1 gap-6 xl:grid-cols-[minmax(0,1.5fr)_minmax(0,1fr)]">
                <div className="grid content-start gap-6">
                    <section className="tt-card grid gap-4 p-6">
                        <h2 className="font-semibold">Advertiser &amp; campaign</h2>
                        <AdDetails campaign={c} pkg={pkg} account={userOf(db, c.user_id)} />
                        <div>
                            <p className="tt-label mb-1">Campaign description</p>
                            <p className="text-sm whitespace-pre-line text-zinc-700">{c.description}</p>
                        </div>
                        {c.notes && (
                            <div>
                                <p className="tt-label mb-1">Additional notes</p>
                                <p className="text-sm whitespace-pre-line text-zinc-700">{c.notes}</p>
                            </div>
                        )}
                        <Callout icon="flag" variant="secondary">
                            Check for guaranteed-return, &quot;risk-free&quot; or &quot;never lose&quot; claims and confirm the advertiser&apos;s licensing where relevant before approving.
                        </Callout>
                    </section>

                    <section className="grid gap-3 sm:grid-cols-[minmax(0,1fr)_220px]">
                        <div className="grid content-start gap-2">
                            <span className="tt-label">Placement preview</span>
                            <SponsoredPlacement placement={c.placement} ad={c} preview />
                        </div>
                        <div className="grid content-start gap-2">
                            <span className="tt-label">Creative</span>
                            <AdCreative ad={c} className="aspect-video w-full rounded-lg border border-zinc-200" />
                            <span className="truncate text-xs text-zinc-500">{c.creative_name ?? 'No creative uploaded'}</span>
                        </div>
                    </section>

                    {!finished && <EditCampaign key={c.updated_at} c={c} db={db} actions={actions} perform={perform} />}
                </div>

                <aside className="grid content-start gap-6 xl:sticky xl:top-24 xl:self-start">
                    {reviewing && (
                        <section className="tt-card grid gap-4 p-6">
                            <h2 className="font-semibold">Review decision</h2>
                            <Textarea label="Note to the advertiser" description="Required to reject or request changes. Optional when approving." rows={3} value={note} onChange={(e) => setNote(e.target.value)} error={noteError} />
                            <Button variant="primary" icon="check" onClick={() => decide('approved')} disabled={c.status === 'changes_requested'}>
                                Approve application
                            </Button>
                            <Button icon="pencil-square" onClick={() => decide('changes_requested')}>
                                Request changes
                            </Button>
                            <Button variant="danger" icon="x-mark" onClick={() => decide('rejected')}>
                                Reject
                            </Button>
                            {c.status === 'changes_requested' && <p className="text-xs text-zinc-500">Approval is available once the advertiser resubmits.</p>}
                        </section>
                    )}

                    {isCampaign && (
                        <section className="tt-card grid gap-4 p-6">
                            <h2 className="font-semibold">Campaign status</h2>
                            {!finished ? (
                                <div className="grid grid-cols-2 gap-2">
                                    <Button size="sm" icon="calendar" disabled={c.status === 'scheduled'} onClick={() => setStatus('scheduled')}>
                                        Scheduled
                                    </Button>
                                    <Button size="sm" icon="signal" disabled={c.status === 'active'} onClick={() => setStatus('active')}>
                                        Active
                                    </Button>
                                    <Button size="sm" icon="check-circle" disabled={c.status !== 'active'} onClick={() => setStatus('completed')}>
                                        Completed
                                    </Button>
                                    <Button size="sm" variant="danger" icon="x-circle" onClick={() => setStatus('cancelled')}>
                                        Cancel
                                    </Button>
                                </div>
                            ) : (
                                <p className="text-sm text-zinc-600">This campaign is {c.status}; no further status changes.</p>
                            )}
                            <p className="text-xs text-zinc-500">A campaign can only be scheduled or made active once its payment is recorded as paid (or not required).</p>

                            <div className="grid gap-3 border-t border-zinc-100 pt-4">
                                <Select label="Payment status (demo)" value={payment} onChange={(e) => setPayment(e.target.value)} options={AD_PAYMENT_STATUSES.map((s) => ({ value: s, label: adPaymentStatus(s).label }))} />
                                <Button disabled={payment === c.payment_status} onClick={() => perform(() => actions.setAdPayment(c.id, payment), 'Payment status updated (demo).')}>
                                    Update payment status
                                </Button>
                                <p className="text-xs text-zinc-500">No real payment is processed. This only changes the demo record.</p>
                            </div>
                        </section>
                    )}

                    <section className="tt-card p-6">
                        <h2 className="mb-4 font-semibold">History</h2>
                        <AdTimeline campaign={c} db={db} />
                    </section>
                </aside>
            </div>
        </div>
    );
}

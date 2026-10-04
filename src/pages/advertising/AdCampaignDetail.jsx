/* Advertiser view of one application / campaign. */
import { useParams } from 'react-router-dom';
import { useFeedback } from '../../components/Feedback';
import { AdDetails, AdStatusPair, AdTimeline, campaignName } from '../../components/sponsored/AdParts';
import { AdCreative, SponsoredPlacement } from '../../components/sponsored';
import { Button, Callout, Crumbs, PageHeader } from '../../components/ui';
import { AD_PLACEMENTS, AD_WITHDRAWABLE } from '../../data/advertising';
import { useStore } from '../../data/store';
import { usePerform } from '../../hooks/usePerform';
import { useTitle } from '../../hooks/useTitle';
import { fmtDate } from '../../utils/format';
import ErrorPage from '../errors/ErrorPage';

/** What the advertiser should know about the current state. Never implies "live" or "paid" unless it is. */
function StateCallout({ c }) {
    switch (c.status) {
        case 'draft':
            return <Callout icon="document-text">This application is a draft and has not been sent for review.</Callout>;
        case 'pending_review':
            return <Callout icon="clock">Your application is waiting for the platform team to review it. Nothing is live and no payment is due yet.</Callout>;
        case 'changes_requested':
            return (
                <Callout variant="warning" icon="exclamation-triangle">
                    <b className="font-semibold">Changes requested:</b> {c.change_request} Update the application and resubmit it.
                </Callout>
            );
        case 'rejected':
            return (
                <Callout variant="danger" icon="x-circle">
                    <b className="font-semibold">Not approved:</b> {c.rejection_reason}
                </Callout>
            );
        case 'approved':
            return c.payment_status === 'awaiting_payment' ? (
                <Callout variant="warning" icon="credit-card">
                    Approved — awaiting payment. In production the platform team would send an invoice; the campaign is scheduled only after payment. This demo does not take payments.
                </Callout>
            ) : (
                <Callout variant="success" icon="check-circle">
                    Approved. The platform team will schedule the campaign.
                </Callout>
            );
        case 'scheduled':
            return (
                <Callout variant="success" icon="calendar">
                    Scheduled to start on {fmtDate(c.start_date)}. It is not live yet.
                </Callout>
            );
        case 'active':
            return (
                <Callout variant="success" icon="signal">
                    Live until {fmtDate(c.end_date)} in: {AD_PLACEMENTS[c.placement].where}.
                </Callout>
            );
        case 'completed':
            return <Callout icon="check-circle">This campaign ended on {fmtDate(c.end_date)}.</Callout>;
        case 'cancelled':
            return <Callout icon="x-circle">This campaign was cancelled.{c.payment_status === 'refunded' ? ' A refund was recorded (demo).' : ''}</Callout>;
        default:
            return null;
    }
}

export default function AdCampaignDetail() {
    const { reference } = useParams();
    const { db, user, actions } = useStore();
    const perform = usePerform();
    const { confirm } = useFeedback();
    const c = db.adCampaigns.find((x) => x.reference === reference && x.user_id === user.id);
    useTitle(c ? c.reference : 'Campaign');
    if (!c) return <ErrorPage code={404} />;
    const pkg = db.adPackages.find((p) => p.id === c.package_id);

    return (
        <div>
            <Crumbs items={[{ label: 'Advertising', href: '/dashboard/advertising' }, { label: c.reference }]} />
            <PageHeader
                eyebrow={AD_PLACEMENTS[c.placement]?.label}
                title={campaignName(c)}
                actions={
                    <>
                        <AdStatusPair campaign={c} />
                        {['draft', 'changes_requested'].includes(c.status) && (
                            <Button size="sm" variant="primary" icon="pencil-square" href={`/advertise/apply?edit=${c.reference}`}>
                                {c.status === 'draft' ? 'Continue editing' : 'Edit & resubmit'}
                            </Button>
                        )}
                        {AD_WITHDRAWABLE.includes(c.status) && (
                            <Button
                                size="sm"
                                variant="ghost"
                                className="text-red-600!"
                                onClick={async () => {
                                    if (await confirm(`Withdraw ${c.reference}? The application will be cancelled and cannot be reopened.`, { confirmLabel: 'Withdraw', danger: true })) perform(() => actions.withdrawAd(c.id), 'Application withdrawn.');
                                }}
                            >
                                Withdraw
                            </Button>
                        )}
                    </>
                }
            />

            <StateCallout c={c} />

            <div className="mt-6 grid grid-cols-1 gap-6 xl:grid-cols-[minmax(0,1.4fr)_minmax(0,1fr)]">
                <div className="grid content-start gap-6">
                    <section className="tt-card grid gap-4 p-6">
                        <h2 className="font-semibold">Application details</h2>
                        <AdDetails campaign={c} pkg={pkg} />
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
                    </section>
                    <section className="grid gap-3">
                        <h2 className="tt-section-title">Placement preview</h2>
                        <SponsoredPlacement placement={c.placement} ad={c} preview />
                        <p className="text-xs text-zinc-500">Preview only. {c.status === 'active' ? 'This is how the placement appears on the site.' : 'The placement is not shown on the site until the campaign is active.'}</p>
                    </section>
                </div>

                <aside className="grid content-start gap-6">
                    <section className="tt-card grid gap-3 p-6">
                        <h2 className="font-semibold">Creative</h2>
                        <AdCreative ad={c} className="aspect-video w-full rounded-lg border border-zinc-200" />
                        <p className="text-xs text-zinc-500">{c.creative_name ?? 'No creative uploaded — a neutral placeholder is used.'}</p>
                    </section>
                    <section className="tt-card p-6">
                        <h2 className="mb-4 font-semibold">History</h2>
                        <AdTimeline campaign={c} db={db} />
                    </section>
                </aside>
            </div>
        </div>
    );
}

/* pages/admin/service-review.blade.php — review one product */
import { useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import { useFeedback } from '../../components/Feedback';
import { Badge, Button, Callout, Icon, PageHeader, Status, Textarea } from '../../components/ui';
import { ENTITLEMENTS, planPrice, planStatus, planTerm, planTermLabel, providerStatus, serviceStatus, termLabel, typeLabel } from '../../data/enums';
import { categoryById, plansFor, providerById, serviceBySlug, userOf } from '../../data/queries';
import { useStore } from '../../data/store';
import { usePerform } from '../../hooks/usePerform';
import { useTitle } from '../../hooks/useTitle';
import { fmtDate, fmtDateTime, humanFileSize } from '../../utils/format';
import ErrorPage from '../errors/ErrorPage';

export default function ServiceReview() {
    const { slug } = useParams();
    const { db, actions } = useStore();
    const perform = usePerform();
    const { confirm, toast } = useFeedback();
    const s = serviceBySlug(db, slug);
    useTitle(s ? `Review ${s.title}` : 'Product review');
    const [reason, setReason] = useState('');
    const [reasonError, setReasonError] = useState(null);

    if (!s) return <ErrorPage code={404} />;

    const provider = providerById(db, s.provider_id);
    const category = categoryById(db, s.category_id);
    const parent = category?.parent_id ? categoryById(db, category.parent_id) : null;
    const files = db.files.filter((f) => f.service_id === s.id);
    const reviewer = s.reviewed_by && userOf(db, s.reviewed_by);

    return (
        <div>
            <nav className="mb-4 flex items-center gap-2 text-sm text-zinc-500">
                <Link to="/admin/services" className="hover:text-zinc-900">
                    Products
                </Link>
                <Icon name="chevron-right" variant="micro" />
                <span className="text-zinc-700">{s.title}</span>
            </nav>

            <PageHeader
                title={s.title}
                eyebrow="Product review"
                description={s.short_description}
                actions={
                    <>
                        <Status value={serviceStatus(s.status)} />
                        <Button size="sm" href={`/services/${s.slug}`}>
                            Preview public page
                        </Button>
                    </>
                }
            />

            <div className="grid grid-cols-1 gap-6 xl:grid-cols-[minmax(0,1.5fr)_minmax(0,1fr)]">
                <div className="grid content-start gap-6">
                    <section className="tt-card grid gap-4 p-6">
                        <h2 className="font-semibold">Product information</h2>
                        <dl className="grid grid-cols-[auto_1fr] gap-x-6 gap-y-2 text-sm">
                            <dt className="text-zinc-500">Provider</dt>
                            <dd className="flex flex-wrap items-center gap-2">
                                <Link to={`/providers/${provider.slug}`} className="hover:text-brand">
                                    {provider.display_name}
                                </Link>
                                · <Status value={providerStatus(provider.status)} />
                            </dd>
                            <dt className="text-zinc-500">Category</dt>
                            <dd>
                                {parent?.name} › {category?.name}
                            </dd>
                            <dt className="text-zinc-500">Type</dt>
                            <dd>{typeLabel(s.service_type)}</dd>
                            <dt className="text-zinc-500">Access</dt>
                            <dd className="flex flex-wrap gap-1">
                                {s.access_types.map((t) => (
                                    <Badge key={t} size="sm" icon={ENTITLEMENTS[t].icon}>
                                        {ENTITLEMENTS[t].label}
                                    </Badge>
                                ))}
                            </dd>
                            <dt className="text-zinc-500">Platforms</dt>
                            <dd>{(s.platforms ?? []).join(', ') || '—'}</dd>
                            <dt className="text-zinc-500">Submitted</dt>
                            <dd className="text-xs tabular-nums">{s.submitted_at ? fmtDateTime(s.submitted_at) : '—'}</dd>
                            <dt className="text-zinc-500">Customers</dt>
                            <dd className="tabular-nums">{db.subscriptions.filter((x) => x.service_id === s.id).length}</dd>
                        </dl>
                        <div>
                            <p className="tt-label mb-1">Description</p>
                            <p className="text-sm whitespace-pre-line text-zinc-700">{s.description}</p>
                        </div>
                        {s.features?.length > 0 && (
                            <div>
                                <p className="tt-label mb-1">Features</p>
                                <ul className="list-inside list-disc text-sm text-zinc-700">
                                    {s.features.map((f) => (
                                        <li key={f}>{f}</li>
                                    ))}
                                </ul>
                            </div>
                        )}
                        {s.external_access_url && (
                            <div>
                                <p className="tt-label mb-1">External access</p>
                                <p className="text-xs break-all text-zinc-700 tabular-nums">
                                    {s.external_access_label} · {s.external_access_url}
                                </p>
                            </div>
                        )}
                        <Callout icon="flag" variant="secondary">
                            Check for guaranteed-profit, &quot;100% accuracy&quot;, &quot;never lose&quot; or &quot;risk-free&quot; claims before approving.
                        </Callout>
                    </section>

                    <section className="tt-card">
                        <h2 className="border-b border-zinc-200 px-6 py-4 text-[15px] font-semibold">Pricing</h2>
                        {plansFor(db, s.id).length === 0 ? (
                            <p className="px-6 py-4 text-sm text-zinc-500">No plans.</p>
                        ) : (
                            plansFor(db, s.id).map((p) => (
                                <div key={p.id} className="flex items-center justify-between gap-3 border-b border-zinc-100 px-6 py-3 text-sm last:border-0">
                                    <div>
                                        <p className="font-medium">{p.name}</p>
                                        <p className="text-xs text-zinc-500">
                                            {termLabel(planTerm(p))} · {planTermLabel(p)}
                                            {p.session_count ? ` · ${p.session_count} sessions` : ''}
                                        </p>
                                    </div>
                                    <div className="flex items-center gap-3">
                                        <span className="tabular-nums">{planPrice(p)}</span>
                                        <Status value={planStatus(p.status)} />
                                    </div>
                                </div>
                            ))
                        )}
                    </section>

                    <section className="tt-card">
                        <h2 className="border-b border-zinc-200 px-6 py-4 text-[15px] font-semibold">Uploaded files</h2>
                        {files.length === 0 ? (
                            <p className="px-6 py-4 text-sm text-zinc-500">No files uploaded.</p>
                        ) : (
                            files.map((file) => (
                                <div key={file.id} className="border-b border-zinc-100 px-6 py-4 last:border-0">
                                    <div className="flex flex-wrap items-center justify-between gap-3">
                                        <div>
                                            <p className="font-medium">
                                                {file.title} {!file.is_active && <Badge size="sm">Hidden</Badge>}
                                            </p>
                                            <p className="text-xs text-zinc-500">{file.description}</p>
                                        </div>
                                        <Button size="xs" variant="ghost" onClick={() => perform(() => actions.toggleFileByAdmin(file.id), file.is_active ? 'File hidden from customers.' : 'File available to customers.')}>
                                            {file.is_active ? 'Hide from customers' : 'Make available'}
                                        </Button>
                                    </div>
                                    <div className="mt-2 grid gap-1">
                                        {file.versions.map((v) => (
                                            <div key={v.id} className="flex flex-wrap items-center justify-between gap-2 text-xs">
                                                <span className="text-zinc-600 tabular-nums">
                                                    v{v.version} · {v.original_name} · {humanFileSize(v.size_bytes)} · <span className="font-mono">sha256 {v.checksum_sha256.slice(0, 12)}…</span>{' '}
                                                    {v.is_current && (
                                                        <Badge size="sm" color="green">
                                                            Current
                                                        </Badge>
                                                    )}
                                                </span>
                                                <Button size="xs" variant="ghost" icon="arrow-down-tray" onClick={() => toast(`Download link for ${v.original_name} created. Static preview: no file is transferred.`)}>
                                                    Download to review
                                                </Button>
                                            </div>
                                        ))}
                                    </div>
                                </div>
                            ))
                        )}
                    </section>
                </div>

                <aside className="tt-card grid content-start gap-4 p-6 xl:sticky xl:top-24 xl:self-start">
                    <h2 className="font-semibold">Decision</h2>
                    {s.status === 'pending_review' ? (
                        <>
                            <Button
                                variant="primary"
                                icon="check"
                                onClick={async () => {
                                    if (await confirm(`Approve and publish ${s.title}?`, { confirmLabel: 'Approve and publish' })) perform(() => actions.approveService(s.id), 'Approved and published.');
                                }}
                            >
                                Approve and publish
                            </Button>
                            <Textarea label="Reason for rejection" rows={3} value={reason} onChange={(e) => setReason(e.target.value)} error={reasonError} />
                            <Button
                                variant="danger"
                                onClick={() => {
                                    if (!reason.trim()) return setReasonError('The reason field is required.');
                                    setReasonError(null);
                                    perform(() => actions.rejectService(s.id, reason), 'Listing rejected.');
                                }}
                            >
                                Reject
                            </Button>
                        </>
                    ) : s.status === 'published' ? (
                        <>
                            <p className="text-sm text-zinc-600">
                                Published {fmtDate(s.published_at)}
                                {reviewer ? ` · approved by ${reviewer.name}` : ''}.
                            </p>
                            <Button
                                variant="danger"
                                onClick={async () => {
                                    if (await confirm('Suspend this product? Customers lose access while it is suspended.', { confirmLabel: 'Suspend product', danger: true })) perform(() => actions.suspendService(s.id), 'Product suspended.');
                                }}
                            >
                                Suspend product
                            </Button>
                        </>
                    ) : (
                        <>
                            <p className="text-sm text-zinc-600">No decision needed while the product is {s.status.replace('_', ' ')}.</p>
                            {s.rejection_reason && <p className="text-sm text-red-600">Last rejection: {s.rejection_reason}</p>}
                        </>
                    )}
                </aside>
            </div>
        </div>
    );
}

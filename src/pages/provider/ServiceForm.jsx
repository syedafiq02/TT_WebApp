/* pages/provider/service-form.blade.php — create / edit a listing, its plans and content. */
import { useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { Button, Callout, Checkbox, CheckboxGroup, Empty, Input, PageHeader, Select, Status, Textarea } from '../../components/ui';
import { allowedBillingTypes, allowedEntitlements, billingTypeLabel, CONTENT_TYPES, contentStatus, ENTITLEMENTS, planPrice, planStatus, planTermLabel, SERVICE_TYPES, serviceStatus } from '../../data/enums';
import { children, currentVersion, plansFor, roots, serviceBySlug } from '../../data/queries';
import { useFeedback } from '../../components/Feedback';
import { useProvider } from '../../hooks/useProvider';
import { usePerform } from '../../hooks/usePerform';
import { useTitle } from '../../hooks/useTitle';
import { humanFileSize } from '../../utils/format';
import ErrorPage from '../errors/ErrorPage';

const PLATFORMS = ['MT4', 'MT5', 'TradingView', 'Web'];

function initialForm(service) {
    if (!service) {
        return { title: '', category_id: '', service_type: 'academy', short_description: '', description: '', level: '', platforms: [], access_types: [...SERVICE_TYPES.academy.defaults], features: '', faqs: '', external_access_label: '', external_access_url: '', external_access_instructions: '' };
    }
    return {
        title: service.title,
        category_id: String(service.category_id),
        service_type: service.service_type,
        short_description: service.short_description,
        description: service.description ?? '',
        level: service.level ?? '',
        platforms: service.platforms ?? [],
        access_types: service.access_types,
        features: (service.features ?? []).join('\n'),
        faqs: (service.faqs ?? []).map((f) => `${f.q}\n${f.a}`).join('\n\n'),
        external_access_label: service.external_access_label ?? '',
        external_access_url: service.external_access_url ?? '',
        external_access_instructions: service.external_access_instructions ?? '',
    };
}

const readImage = (file) =>
    new Promise((resolve) => {
        const reader = new FileReader();
        reader.onload = () => resolve(reader.result);
        reader.readAsDataURL(file);
    });

function ServiceFormPage() {
    const { slug } = useParams();
    const { db, actions, provider } = useProvider();
    const navigate = useNavigate();
    const perform = usePerform();
    const { toast } = useFeedback();
    const service = slug ? serviceBySlug(db, slug) : null;
    useTitle(service ? `Edit ${service.title}` : 'Create Product');

    const [form, setForm] = useState(() => initialForm(service));
    const [errors, setErrors] = useState({});
    const [screenshots, setScreenshots] = useState([]);
    const [plan, setPlan] = useState({ name: '', price: '', billing: 'recurring', interval: 'month', count: 1, sessions: '' });
    const [planErrors, setPlanErrors] = useState({});
    const [content, setContent] = useState({ title: '', type: 'lesson', summary: '', body: '', url: '', preview: false });
    const [contentError, setContentError] = useState(null);

    if (slug && (!service || service.provider_id !== provider.id)) return <ErrorPage code={404} />;

    const editable = !service || ['draft', 'rejected'].includes(service.status);
    const set = (k) => (e) => setForm({ ...form, [k]: e.target.value });
    const plans = service ? plansFor(db, service.id) : [];
    const contents = service ? db.contents.filter((c) => c.service_id === service.id).sort((a, b) => a.sort_order - b.sort_order) : [];
    const files = service ? db.files.filter((f) => f.service_id === service.id) : [];

    const save = async (e) => {
        e.preventDefault();
        const errs = {};
        if (!form.title.trim()) errs.title = 'The title field is required.';
        if (!form.category_id) errs.category_id = 'The category id field is required.';
        if (!form.short_description.trim()) errs.short_description = 'The short description field is required.';
        if (form.external_access_url && !/^https?:\/\/\S+$/.test(form.external_access_url)) errs.external_access_url = 'The external access url field must be a valid URL.';
        setErrors(errs);
        if (Object.keys(errs).length) return;

        const gallery = [...(service?.gallery ?? []), ...(await Promise.all(screenshots.map(readImage)))].slice(0, 6);
        const data = {
            ...form,
            category_id: Number(form.category_id),
            level: form.level || null,
            features: form.features.split(/\r?\n/).map((l) => l.trim()).filter(Boolean),
            faqs: form.faqs
                .trim()
                .split(/\r?\n\s*\r?\n/)
                .map((block) => block.trim().split(/\r?\n/))
                .filter((p) => p.length >= 2 && p[0].trim())
                .map(([q, ...a]) => ({ q: q.trim(), a: a.join('\n').trim() })),
            external_access_label: form.external_access_label || null,
            external_access_url: form.external_access_url || null,
            external_access_instructions: form.external_access_instructions || null,
            gallery,
        };
        let saved;
        if (perform(() => (saved = actions.saveService(service?.id, data)))) {
            setScreenshots([]);
            toast(`Service saved as ${saved.status.replace('_', ' ')}.`);
            if (!service) navigate(`/provider/services/${saved.slug}/edit`, { replace: true });
        }
    };

    const addPlan = (e) => {
        e.preventDefault();
        const errs = {};
        if (!plan.name.trim()) errs.name = 'The plan name field is required.';
        if (!(Number(plan.price) >= 1)) errs.price = 'The plan price field must be at least 1.';
        setPlanErrors(errs);
        if (Object.keys(errs).length) return;
        const ok = perform(
            () =>
                actions.addPlan(service.id, {
                    name: plan.name.trim(),
                    price_minor: Math.round(Number(plan.price) * 100),
                    billing_type: plan.billing,
                    interval_unit: plan.interval || null,
                    interval_count: plan.interval ? Number(plan.count) || 1 : null,
                    session_count: plan.sessions ? Number(plan.sessions) : null,
                }),
            'Plan added.',
        );
        if (ok) setPlan({ ...plan, name: '', price: '', sessions: '' });
    };

    const addContent = (e) => {
        e.preventDefault();
        if (!content.title.trim()) return setContentError('The content title field is required.');
        setContentError(null);
        perform(
            () =>
                actions.addContent(service.id, {
                    title: content.title.trim(),
                    type: content.type,
                    summary: content.summary || null,
                    body: content.body || null,
                    external_url: content.url || null,
                    is_preview: content.preview,
                }),
            'Content published to subscribers.',
        );
        setContent({ title: '', type: content.type, summary: '', body: '', url: '', preview: false });
    };

    const categoryOptions = roots(db).flatMap((root) => children(db, root.id).map((c) => ({ value: String(c.id), label: `${root.name} › ${c.name}` })));

    return (
        <div>
            <PageHeader
                title={service ? service.title : 'Create Product'}
                eyebrow={service ? 'Edit product' : 'New product'}
                description="Products go live only after the platform team approves them. Customers who buy this product get access to this product only."
                actions={
                    service && (
                        <>
                            <Status value={serviceStatus(service.status)} />
                            <Button size="sm" href={`/services/${service.slug}`}>
                                Preview
                            </Button>
                            {editable && (
                                <Button size="sm" variant="primary" onClick={() => perform(() => actions.submitService(service.id), 'Submitted. The platform team will review your listing.')}>
                                    Submit for review
                                </Button>
                            )}
                        </>
                    )
                }
            />

            {service?.status === 'rejected' && service.rejection_reason ? (
                <Callout variant="danger" icon="x-circle" className="mb-6">
                    Not approved: {service.rejection_reason} Update the listing and submit it again.
                </Callout>
            ) : (
                service &&
                !editable && (
                    <Callout icon="lock-closed" className="mb-6">
                        This listing is {service.status.replace('_', ' ')}, so its details and pricing are locked. You can still publish content to subscribers.
                    </Callout>
                )
            )}

            <div className="grid grid-cols-1 gap-6 xl:grid-cols-[minmax(0,1fr)_minmax(0,1fr)]">
                <form onSubmit={save} className="tt-card grid content-start gap-4 p-6" noValidate>
                    <h2 className="font-semibold">Product details</h2>
                    <fieldset disabled={!editable} className="grid gap-4">
                        <Input label="Product name" value={form.title} onChange={set('title')} error={errors.title} />
                        <div className="grid gap-4 sm:grid-cols-2">
                            <Select label="Category" placeholder="Choose a category" value={form.category_id} onChange={set('category_id')} options={categoryOptions} error={errors.category_id} />
                            <Select
                                label="Service type"
                                value={form.service_type}
                                onChange={(e) => setForm({ ...form, service_type: e.target.value, access_types: [...SERVICE_TYPES[e.target.value].defaults] })}
                                options={Object.entries(SERVICE_TYPES).map(([value, t]) => ({ value, label: t.label }))}
                            />
                        </div>
                        <Textarea label="Short description" rows={2} description="Shown on service cards. Avoid performance promises." value={form.short_description} onChange={set('short_description')} error={errors.short_description} />
                        <Textarea label="Full description" rows={6} value={form.description} onChange={set('description')} />
                        <div className="grid gap-4 sm:grid-cols-2">
                            <Select label="Experience level" value={form.level} onChange={set('level')}>
                                <option value="">Any level</option>
                                {['Beginner', 'Intermediate', 'Advanced'].map((l) => (
                                    <option key={l} value={l}>
                                        {l}
                                    </option>
                                ))}
                            </Select>
                            <CheckboxGroup label="Platforms" options={PLATFORMS.map((p) => ({ value: p, label: p }))} value={form.platforms} onChange={(v) => setForm({ ...form, platforms: v })} />
                        </div>
                        <CheckboxGroup
                            label="How customers access this product"
                            description="Each item becomes an entitlement to this product, granted after successful payment."
                            options={allowedEntitlements(form.service_type).map((e) => ({ value: e, label: ENTITLEMENTS[e].label }))}
                            value={form.access_types}
                            onChange={(v) => setForm({ ...form, access_types: v })}
                        />
                        {form.access_types.includes('external_access') && (
                            <div className="grid gap-3 rounded-xl border border-zinc-200 bg-zinc-50/70 p-4">
                                <p className="text-sm font-medium">
                                    External access <span className="font-normal text-zinc-500">· shown only to customers with access</span>
                                </p>
                                <div className="grid gap-3 sm:grid-cols-2">
                                    <Input label="Button label" placeholder="Join the private channel" value={form.external_access_label} onChange={set('external_access_label')} />
                                    <Input label="Invite / access link" placeholder="https://" value={form.external_access_url} onChange={set('external_access_url')} error={errors.external_access_url} />
                                </div>
                                <Textarea label="Instructions" rows={2} value={form.external_access_instructions} onChange={set('external_access_instructions')} />
                            </div>
                        )}
                        <Textarea label="Features (one per line)" rows={4} value={form.features} onChange={set('features')} />
                        <Textarea label="FAQ" rows={5} description="Write the question on the first line and the answer below it. Leave a blank line between questions." value={form.faqs} onChange={set('faqs')} />
                        <div className="grid gap-2">
                            <Input type="file" multiple accept="image/*" label="Screenshots (up to 6)" onChange={(e) => setScreenshots([...e.target.files].slice(0, 6))} />
                            {service?.gallery?.length > 0 && (
                                <div className="flex flex-wrap gap-2">
                                    {service.gallery.map((src, i) => (
                                        <div key={i} className="relative">
                                            <img src={src} alt="" className="h-16 w-24 rounded-md border border-zinc-200 object-cover" />
                                            {editable && (
                                                <button
                                                    type="button"
                                                    onClick={() => perform(() => actions.saveService(service.id, { gallery: service.gallery.filter((_, j) => j !== i) }))}
                                                    className="absolute -top-2 -right-2 grid size-5 cursor-pointer place-items-center rounded-full bg-zinc-100 text-xs"
                                                    aria-label="Remove screenshot"
                                                >
                                                    ×
                                                </button>
                                            )}
                                        </div>
                                    ))}
                                </div>
                            )}
                        </div>
                    </fieldset>
                    {editable && (
                        <div className="flex justify-end">
                            <Button type="submit" variant="primary">
                                {service ? 'Save changes' : 'Create draft'}
                            </Button>
                        </div>
                    )}
                </form>

                <div className="grid content-start gap-6">
                    {!service ? (
                        <Empty title="Plans and content come next" icon="tag">
                            Save the listing as a draft first, then add pricing plans and content.
                        </Empty>
                    ) : (
                        <>
                            <section className="tt-card">
                                <div className="flex items-center justify-between border-b border-zinc-100 px-6 py-4">
                                    <h2 className="font-semibold">Files</h2>
                                    <Button size="sm" icon="arrow-up-tray" href={`/provider/files?product=${service.id}`}>
                                        Manage files
                                    </Button>
                                </div>
                                {files.length === 0 ? (
                                    <p className="px-6 py-4 text-sm text-zinc-500">{service.access_types.includes('download_access') ? 'No files yet. Downloads need at least one file.' : 'Enable Downloads above to deliver files.'}</p>
                                ) : (
                                    files.map((f) => {
                                        const v = currentVersion(f);
                                        return (
                                            <div key={f.id} className="flex items-center justify-between gap-3 border-b border-zinc-100 px-6 py-2.5 text-sm last:border-0">
                                                <span>{f.title}</span>
                                                <span className="text-xs text-zinc-500 tabular-nums">
                                                    v{v?.version} · {v && humanFileSize(v.size_bytes)}
                                                </span>
                                            </div>
                                        );
                                    })
                                )}
                            </section>

                            <section className="tt-card">
                                <h2 className="border-b border-zinc-200 px-6 py-4 text-[15px] font-semibold">Plans &amp; pricing</h2>
                                {plans.length === 0 ? (
                                    <p className="px-6 py-4 text-sm text-zinc-500">Add at least one plan before submitting for review.</p>
                                ) : (
                                    plans.map((p) => (
                                        <div key={p.id} className="flex items-center justify-between gap-3 border-b border-zinc-100 px-6 py-3 text-sm">
                                            <div>
                                                <p className="font-medium">{p.name}</p>
                                                <p className="text-xs text-zinc-500">
                                                    {billingTypeLabel(p.billing_type)} · {planTermLabel(p)}
                                                </p>
                                            </div>
                                            <div className="flex items-center gap-3">
                                                <span className="tabular-nums">{planPrice(p)}</span>
                                                <Status value={planStatus(p.status)} />
                                                {editable && (
                                                    <Button size="xs" variant="ghost" onClick={() => actions.togglePlan(p.id)}>
                                                        {p.status === 'active' ? 'Disable' : 'Enable'}
                                                    </Button>
                                                )}
                                            </div>
                                        </div>
                                    ))
                                )}
                                {editable && (
                                    <form onSubmit={addPlan} className="grid gap-3 p-6 sm:grid-cols-2" noValidate>
                                        <Input label="Plan name" placeholder="Monthly" value={plan.name} onChange={(e) => setPlan({ ...plan, name: e.target.value })} error={planErrors.name} />
                                        <Input label="Price (RM)" type="number" step="0.01" value={plan.price} onChange={(e) => setPlan({ ...plan, price: e.target.value })} error={planErrors.price} />
                                        <Select
                                            label="Billing"
                                            value={plan.billing}
                                            onChange={(e) => setPlan({ ...plan, billing: e.target.value, interval: e.target.value === 'recurring' && !plan.interval ? 'month' : plan.interval })}
                                            options={allowedBillingTypes(service.service_type).map((b) => ({ value: b, label: billingTypeLabel(b) }))}
                                        />
                                        <div className="grid grid-cols-2 gap-3">
                                            <Input type="number" label="Every / for" value={plan.count} onChange={(e) => setPlan({ ...plan, count: e.target.value })} />
                                            <Select label="Unit" value={plan.interval} onChange={(e) => setPlan({ ...plan, interval: e.target.value })}>
                                                {plan.billing === 'one_time' && <option value="">No end date</option>}
                                                {['day', 'week', 'month', 'year'].map((u) => (
                                                    <option key={u} value={u}>
                                                        {u[0].toUpperCase() + u.slice(1)}(s)
                                                    </option>
                                                ))}
                                            </Select>
                                        </div>
                                        <Input type="number" label="Sessions included (optional)" value={plan.sessions} onChange={(e) => setPlan({ ...plan, sessions: e.target.value })} />
                                        <div className="flex items-end justify-end">
                                            <Button type="submit">Add plan</Button>
                                        </div>
                                    </form>
                                )}
                            </section>

                            <section className="tt-card">
                                <h2 className="border-b border-zinc-200 px-6 py-4 text-[15px] font-semibold">Content</h2>
                                {contents.map((item) => (
                                    <div key={item.id} className="flex items-center justify-between gap-3 border-b border-zinc-100 px-6 py-3 text-sm">
                                        <div className="min-w-0">
                                            <p className="truncate font-medium">{item.title}</p>
                                            <p className="text-xs text-zinc-500">
                                                {CONTENT_TYPES[item.type]} · requires {ENTITLEMENTS[item.required_entitlement].label.toLowerCase()}
                                                {item.is_preview ? ' · free preview' : ''}
                                            </p>
                                        </div>
                                        <div className="flex items-center gap-2">
                                            <Status value={contentStatus(item.status)} />
                                            <Button size="xs" variant="ghost" onClick={() => actions.toggleContent(item.id)}>
                                                {item.status === 'published' ? 'Hide' : 'Publish'}
                                            </Button>
                                        </div>
                                    </div>
                                ))}
                                <form onSubmit={addContent} className="grid gap-3 p-6" noValidate>
                                    <div className="grid gap-3 sm:grid-cols-2">
                                        <Input label="Title" value={content.title} onChange={(e) => setContent({ ...content, title: e.target.value })} error={contentError} />
                                        <Select label="Type" value={content.type} onChange={(e) => setContent({ ...content, type: e.target.value })} options={Object.entries(CONTENT_TYPES).map(([value, label]) => ({ value, label }))} />
                                    </div>
                                    <Input label="Summary (optional)" value={content.summary} onChange={(e) => setContent({ ...content, summary: e.target.value })} />
                                    <Textarea label="Body" rows={4} description="Lessons, articles and signal posts. For signals include entry zone, stop loss and targets." value={content.body} onChange={(e) => setContent({ ...content, body: e.target.value })} />
                                    <Input label="Video, file or document link (optional)" value={content.url} onChange={(e) => setContent({ ...content, url: e.target.value })} />
                                    <div className="flex flex-wrap items-center justify-between gap-3">
                                        <Checkbox label="Free preview on the public page" checked={content.preview} onChange={(e) => setContent({ ...content, preview: e.target.checked })} />
                                        <Button type="submit">Publish content</Button>
                                    </div>
                                </form>
                            </section>
                        </>
                    )}
                </div>
            </div>
        </div>
    );
}

/** Remount per product so state never leaks between create and edit. */
export default function ServiceForm() {
    const { slug } = useParams();
    return <ServiceFormPage key={slug ?? 'new'} />;
}

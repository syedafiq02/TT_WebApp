/* Advertiser application form: new application, draft, or edit & resubmit. */
import { useRef, useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import { AdDemoNotice } from '../../components/sponsored/AdParts';
import { SponsoredPlacement } from '../../components/sponsored';
import { Button, Callout, Icon, Input, PageHeader, Select, Status, Textarea } from '../../components/ui';
import { AD_CATEGORIES, AD_DURATIONS, AD_OBJECTIVES, AD_PLACEMENTS, adStatus, toDateInput } from '../../data/advertising';
import { useStore } from '../../data/store';
import { usePerform } from '../../hooks/usePerform';
import { useTitle } from '../../hooks/useTitle';
import { daysFromNow, fmtDate, money } from '../../utils/format';
import ErrorPage from '../errors/ErrorPage';

const MAX_CREATIVE_BYTES = 2 * 1024 * 1024;
const CREATIVE_TYPES = ['image/png', 'image/jpeg', 'image/webp'];
const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/;
const URL_RE = /^https?:\/\/[^\s.]+\.[^\s]{2,}$/i;
const PHONE_RE = /^\+?[0-9\s-]{8,20}$/;

function initialForm(existing, user, packages, params) {
    if (existing) {
        return {
            company: existing.company, contact_person: existing.contact_person, email: existing.email, phone: existing.phone, website: existing.website,
            category: existing.category, placement: existing.placement, package_id: String(existing.package_id), start_date: toDateInput(existing.start_date),
            duration_days: String(existing.duration_days), objective: existing.objective, description: existing.description, notes: existing.notes ?? '',
            cta_label: existing.cta_label ?? '', creative: existing.creative, creative_name: existing.creative_name,
        };
    }
    const pkg = packages.find((p) => String(p.id) === params.get('package')) ?? packages.find((p) => p.placements.includes(params.get('placement'))) ?? packages[0];
    const placement = AD_PLACEMENTS[params.get('placement')] && pkg?.placements.includes(params.get('placement')) ? params.get('placement') : pkg?.placements[0] ?? 'sponsored_listing';
    return {
        company: '', contact_person: user.name, email: user.email, phone: '', website: '', category: '', placement,
        package_id: pkg ? String(pkg.id) : '', start_date: toDateInput(daysFromNow(14)), duration_days: String(pkg?.duration_days ?? 30),
        objective: '', description: '', notes: '', cta_label: '', creative: null, creative_name: null,
    };
}

export default function AdApply() {
    const { db, user, actions } = useStore();
    const perform = usePerform();
    const [params] = useSearchParams();
    const editRef = params.get('edit');
    const existing = editRef ? db.adCampaigns.find((c) => c.reference === editRef && c.user_id === user.id) : null;
    useTitle(existing ? `Edit ${existing.reference}` : 'Start advertising');

    const packages = db.adPackages.filter((p) => p.is_active || p.id === existing?.package_id);
    const [form, setForm] = useState(() => initialForm(existing, user, packages, params));
    const [errors, setErrors] = useState({});
    const [busy, setBusy] = useState(null);
    const [submitted, setSubmitted] = useState(null);
    const fileRef = useRef(null);

    if (editRef && !existing) return <ErrorPage code={404} />;
    if (existing && !['draft', 'changes_requested'].includes(existing.status) && !submitted) {
        return <ErrorPage code={403} message="This application is under review or already decided, so it can no longer be edited." action={{ href: `/dashboard/advertising/${existing.reference}`, label: 'View application' }} />;
    }

    const set = (k) => (e) => setForm((f) => ({ ...f, [k]: e.target.value }));
    const pkg = packages.find((p) => String(p.id) === form.package_id);

    const choosePackage = (e) => {
        const next = packages.find((p) => String(p.id) === e.target.value);
        setForm((f) => ({ ...f, package_id: e.target.value, duration_days: String(next.duration_days), placement: next.placements.includes(f.placement) ? f.placement : next.placements[0] }));
    };

    const chooseCreative = (e) => {
        const file = e.target.files[0];
        if (!file) return;
        if (!CREATIVE_TYPES.includes(file.type)) return setErrors((x) => ({ ...x, creative: 'The creative must be a PNG, JPG or WebP image.' }));
        if (file.size > MAX_CREATIVE_BYTES) return setErrors((x) => ({ ...x, creative: 'The creative must not be larger than 2 MB.' }));
        const reader = new FileReader();
        reader.onload = () => {
            setForm((f) => ({ ...f, creative: reader.result, creative_name: file.name }));
            setErrors((x) => ({ ...x, creative: null }));
        };
        reader.readAsDataURL(file);
    };

    const validate = (draft) => {
        const e = {};
        const req = (k, label) => !String(form[k] ?? '').trim() && (e[k] = `${label} is required.`);
        req('company', 'Company / brand name');
        if (draft) return e;
        req('contact_person', 'Contact person');
        req('category', 'Business category');
        req('objective', 'Campaign objective');
        if (!EMAIL_RE.test(form.email.trim())) e.email = form.email.trim() ? 'Enter a valid business email address.' : 'Business email is required.';
        if (!PHONE_RE.test(form.phone.trim())) e.phone = form.phone.trim() ? 'Enter a valid contact number, e.g. +60 12-345 6789.' : 'Contact number is required.';
        if (!URL_RE.test(form.website.trim())) e.website = form.website.trim() ? 'Enter a full website URL starting with https://' : 'Website URL is required.';
        if (!pkg) e.package_id = 'Choose a package.';
        else if (!pkg.placements.includes(form.placement)) e.placement = `The ${pkg.name} package does not include ${AD_PLACEMENTS[form.placement].label}.`;
        if (!form.start_date) e.start_date = 'Campaign start date is required.';
        else if (new Date(form.start_date) <= new Date()) e.start_date = 'Choose a start date after today.';
        if (form.description.trim().length < 20) e.description = form.description.trim() ? 'Describe the campaign in at least 20 characters.' : 'Campaign description is required.';
        if (/guarantee|risk[- ]free|never lose|100%/i.test(`${form.description} ${form.cta_label}`)) e.description = 'Remove guaranteed-return or "risk-free" claims; they are not allowed in ads on Terpaling Trader.';
        return e;
    };

    const save = (submit) => {
        const e = validate(!submit);
        setErrors(e);
        if (Object.keys(e).length) {
            document.querySelector('[aria-invalid="true"]')?.focus();
            return;
        }
        setBusy(submit ? 'submit' : 'draft');
        setTimeout(() => {
            let reference;
            const ok = perform(
                () => {
                    reference = actions.saveAdApplication(existing?.id, { ...form, company: form.company.trim(), email: form.email.trim(), website: form.website.trim() }, submit);
                },
                submit ? 'Application submitted for review.' : 'Draft saved.',
            );
            setBusy(null);
            if (ok) setSubmitted({ reference, submit });
        }, 600);
    };

    if (submitted) {
        return (
            <div className="mx-auto grid max-w-xl justify-items-center gap-6 py-10 text-center">
                <span className="grid size-16 place-items-center rounded-full border border-green-200 bg-green-50 text-green-600">
                    <Icon name={submitted.submit ? 'check' : 'document-text'} className="size-8" />
                </span>
                <div className="grid gap-2">
                    <h1 className="text-3xl font-semibold tracking-tight text-zinc-900">{submitted.submit ? 'Application submitted' : 'Draft saved'}</h1>
                    <p className="text-zinc-600">
                        {submitted.submit
                            ? 'The platform team will review your application and creative. You can follow its status in your advertising dashboard.'
                            : 'Your draft is saved in this browser. Submit it when you are ready for review.'}
                    </p>
                </div>
                <div className="tt-card grid w-full gap-3 p-6 text-left text-sm">
                    <div className="flex items-center justify-between">
                        <span className="text-zinc-500">Application reference</span>
                        <span className="font-semibold text-zinc-900 tabular-nums">{submitted.reference}</span>
                    </div>
                    <div className="flex items-center justify-between">
                        <span className="text-zinc-500">Status</span>
                        <Status value={adStatus(submitted.submit ? 'pending_review' : 'draft')} />
                    </div>
                    <p className="border-t border-zinc-100 pt-3 text-xs text-zinc-500">Demo only: this application was stored in your browser and was not sent to Terpaling Trader.</p>
                </div>
                <div className="flex flex-wrap justify-center gap-3">
                    <Button variant="primary" href={`/dashboard/advertising/${submitted.reference}`}>
                        View application
                    </Button>
                    <Button href="/dashboard/advertising">Advertising dashboard</Button>
                </div>
            </div>
        );
    }

    const previewAd = { ...form, company: form.company || 'Your Brand', description: form.description || 'Your campaign description appears here.', accent: '#2563eb', website: null };

    return (
        <div>
            <PageHeader
                eyebrow={existing ? `Edit ${existing.reference}` : 'Advertising application'}
                title={existing ? 'Update your application' : 'Start advertising'}
                description="Tell us about your brand and campaign. Every application and creative is reviewed before anything is published."
                actions={<Button href="/advertise">Placements &amp; packages</Button>}
            />

            <AdDemoNotice className="mb-6" />

            {existing?.status === 'changes_requested' && (
                <Callout variant="warning" icon="exclamation-triangle" className="mb-6">
                    <b className="font-semibold">Changes requested:</b> {existing.change_request}
                </Callout>
            )}

            <form
                noValidate
                onSubmit={(e) => {
                    e.preventDefault();
                    save(true);
                }}
                className="grid grid-cols-1 gap-6 xl:grid-cols-[minmax(0,1fr)_380px]"
            >
                <div className="grid content-start gap-6">
                    <section className="tt-card grid gap-4 p-6 sm:grid-cols-2">
                        <h2 className="font-semibold sm:col-span-2">Advertiser</h2>
                        <Input label="Company / Brand Name" required value={form.company} onChange={set('company')} error={errors.company} className="sm:col-span-2" autoComplete="organization" />
                        <Input label="Contact Person" required value={form.contact_person} onChange={set('contact_person')} error={errors.contact_person} autoComplete="name" />
                        <Input label="Business Email" type="email" required value={form.email} onChange={set('email')} error={errors.email} autoComplete="email" />
                        <Input label="Contact Number" type="tel" required placeholder="+60 12-345 6789" value={form.phone} onChange={set('phone')} error={errors.phone} autoComplete="tel" />
                        <Input label="Website URL" type="url" required placeholder="https://" value={form.website} onChange={set('website')} error={errors.website} autoComplete="url" />
                        <Select label="Business Category" required placeholder="Choose a category" value={form.category} onChange={set('category')} error={errors.category} className="sm:col-span-2" options={Object.entries(AD_CATEGORIES).map(([value, label]) => ({ value, label }))} />
                    </section>

                    <section className="tt-card grid gap-4 p-6 sm:grid-cols-2">
                        <h2 className="font-semibold sm:col-span-2">Campaign</h2>
                        <Select label="Preferred Package" required placeholder="Choose a package" value={form.package_id} onChange={choosePackage} error={errors.package_id} options={packages.map((p) => ({ value: String(p.id), label: `${p.name} · ${money(p.price_minor, 'MYR', false)} / ${p.duration_days} days` }))} />
                        <Select
                            label="Advertising Placement"
                            required
                            value={form.placement}
                            onChange={set('placement')}
                            error={errors.placement}
                            description={pkg ? `Included in ${pkg.name}: ${pkg.placements.map((p) => AD_PLACEMENTS[p].label).join(', ')}` : undefined}
                            options={Object.entries(AD_PLACEMENTS).map(([value, p]) => ({ value, label: p.label }))}
                        />
                        <Input label="Campaign Start Date" type="date" required min={toDateInput(daysFromNow(1))} value={form.start_date} onChange={set('start_date')} error={errors.start_date} />
                        <Select label="Campaign Duration" required value={form.duration_days} onChange={set('duration_days')} options={AD_DURATIONS.map((n) => ({ value: String(n), label: `${n} days` }))} />
                        <Select label="Campaign Objective" required placeholder="Choose an objective" value={form.objective} onChange={set('objective')} error={errors.objective} className="sm:col-span-2" options={Object.entries(AD_OBJECTIVES).map(([value, label]) => ({ value, label }))} />
                        <Textarea
                            label="Campaign Description"
                            required
                            rows={4}
                            className="sm:col-span-2"
                            description="Shown in the ad. Avoid guaranteed-profit, “risk-free” or performance claims."
                            maxLength={280}
                            value={form.description}
                            onChange={set('description')}
                            error={errors.description}
                        />
                        <Input label="Call-to-action label (optional)" placeholder="Learn more" maxLength={32} value={form.cta_label} onChange={set('cta_label')} />
                        <div className="hidden sm:block" />
                        <Textarea label="Additional Notes (optional)" rows={3} className="sm:col-span-2" value={form.notes} onChange={set('notes')} />
                    </section>

                    <section className="tt-card grid gap-4 p-6">
                        <div>
                            <h2 className="font-semibold">Upload Creative / Banner</h2>
                            <p className="mt-1 text-sm text-zinc-500">Optional. PNG, JPG or WebP, up to 2 MB. Previewed in your browser only — the file is not uploaded anywhere.</p>
                        </div>
                        <div className="rounded-lg border border-dashed border-zinc-300 bg-zinc-50/70 p-4">
                            <input ref={fileRef} type="file" accept={CREATIVE_TYPES.join(',')} onChange={chooseCreative} aria-label="Creative image" aria-invalid={errors.creative ? 'true' : undefined} className="tt-control h-auto! py-1.5 file:mr-3 file:rounded-md file:border-0 file:bg-zinc-100 file:px-3 file:py-1.5 file:text-sm file:font-medium file:text-zinc-700" />
                            {errors.creative && <p className="mt-2 text-sm font-medium text-red-500">{errors.creative}</p>}
                        </div>
                        {form.creative && (
                            <div className="flex flex-wrap items-center gap-4">
                                <img src={form.creative} alt="Selected creative" className="h-20 w-36 rounded-md border border-zinc-200 object-cover" />
                                <div className="grid gap-1 text-sm">
                                    <span className="font-medium text-zinc-800">{form.creative_name}</span>
                                    <Button
                                        size="xs"
                                        variant="ghost"
                                        className="w-max"
                                        onClick={() => {
                                            setForm((f) => ({ ...f, creative: null, creative_name: null }));
                                            if (fileRef.current) fileRef.current.value = '';
                                        }}
                                    >
                                        Remove
                                    </Button>
                                </div>
                            </div>
                        )}
                    </section>
                </div>

                <aside className="grid content-start gap-4 xl:sticky xl:top-24 xl:self-start">
                    <div className="tt-card grid gap-4 p-6">
                        <span className="tt-label">Summary</span>
                        <dl className="grid gap-2 text-sm">
                            <div className="flex justify-between gap-4">
                                <dt className="text-zinc-500">Package</dt>
                                <dd className="font-medium text-zinc-900">{pkg?.name ?? '—'}</dd>
                            </div>
                            <div className="flex justify-between gap-4">
                                <dt className="text-zinc-500">Placement</dt>
                                <dd className="text-right font-medium text-zinc-900">{AD_PLACEMENTS[form.placement]?.label}</dd>
                            </div>
                            <div className="flex justify-between gap-4">
                                <dt className="text-zinc-500">Dates</dt>
                                <dd className="text-right text-zinc-900 tabular-nums">{form.start_date ? `${fmtDate(form.start_date)} · ${form.duration_days} days` : '—'}</dd>
                            </div>
                            <div className="flex justify-between gap-4 border-t border-zinc-100 pt-2 text-base font-semibold">
                                <dt>Illustrative price</dt>
                                <dd className="tabular-nums">{pkg ? money(pkg.price_minor) : '—'}</dd>
                            </div>
                        </dl>
                        <p className="text-xs text-amber-700">Draft pricing for {pkg?.duration_days ?? '—'} days, subject to administrator approval. No payment is taken in this demo.</p>
                        <Button type="submit" variant="primary" loading={busy === 'submit'} disabled={!!busy}>
                            {existing?.status === 'changes_requested' ? 'Resubmit for review' : 'Submit application'}
                        </Button>
                        <Button onClick={() => save(false)} loading={busy === 'draft'} disabled={!!busy}>
                            Save as draft
                        </Button>
                    </div>
                    <div className="grid gap-2">
                        <span className="tt-label">Live preview · {AD_PLACEMENTS[form.placement]?.label}</span>
                        <SponsoredPlacement placement={form.placement} ad={previewAd} preview />
                    </div>
                </aside>
            </form>
        </div>
    );
}

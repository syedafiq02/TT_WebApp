/* pages/provider/apply.blade.php — application form, or its status once submitted. */
import { useState } from 'react';
import { Button, Callout, Checkbox, Icon, Input, PageHeader, Status, Textarea } from '../../components/ui';
import { PROVIDER_DECLARATIONS, providerStatus } from '../../data/enums';
import { providerForUser } from '../../data/queries';
import { useStore } from '../../data/store';
import { usePerform } from '../../hooks/usePerform';
import { useTitle } from '../../hooks/useTitle';
import { cx, fmtDate } from '../../utils/format';

const FIELDS = ['display_name', 'headline', 'specialisation', 'experience_years', 'website', 'business_registration', 'bio', 'application_notes'];

export default function Apply() {
    useTitle('Become a Provider');
    const { db, user, actions } = useStore();
    const perform = usePerform();
    const p = providerForUser(db, user.id);
    const [form, setForm] = useState(() => (p?.status === 'rejected' ? Object.fromEntries(FIELDS.map((f) => [f, p[f] ?? ''])) : { ...Object.fromEntries(FIELDS.map((f) => [f, ''])), display_name: user.name }));
    const [declarations, setDeclarations] = useState(() => Object.fromEntries(Object.keys(PROVIDER_DECLARATIONS).map((k) => [k, false])));
    const [errors, setErrors] = useState({});
    const set = (k) => (e) => setForm({ ...form, [k]: e.target.value });

    if (p && p.status !== 'rejected') {
        const steps = [
            ['Application submitted', fmtDate(p.submitted_at), 'done'],
            ['Platform review', 'Identity, background, track record and marketing claims.', p.status === 'pending' ? 'now' : 'done'],
            ['Approved', p.approved_at ? `Approved ${fmtDate(p.approved_at)}` : 'Unlocks the provider dashboard.', p.status === 'approved' ? 'done' : 'todo'],
            ['Create your first listing', 'Draft a service, add plans, then submit it for listing review.', 'todo'],
            ['Published', 'Traders can discover and subscribe.', 'todo'],
        ];
        return (
            <div>
                <PageHeader title="Provider application" eyebrow="Curated model" description={`Application for ${p.display_name}`} />
                <div className="grid grid-cols-1 gap-6 lg:grid-cols-[minmax(0,1fr)_320px]">
                    <div className="tt-card p-6">
                        <ol className="grid gap-5">
                            {steps.map(([label, detail, state], i) => (
                                <li key={label} className="flex gap-4">
                                    <span className={cx('grid size-8 shrink-0 place-items-center rounded-full border text-xs', state === 'done' ? 'border-brand bg-brand text-white' : state === 'now' ? 'border-amber-400 text-amber-700' : 'border-zinc-200 text-zinc-500')}>
                                        {state === 'done' ? <Icon name="check" variant="micro" /> : i + 1}
                                    </span>
                                    <div>
                                        <p className="font-medium">{label}</p>
                                        <p className="text-sm text-zinc-500">{detail}</p>
                                    </div>
                                </li>
                            ))}
                        </ol>
                    </div>
                    <div className="tt-card grid content-start gap-3 p-6">
                        <span className="text-sm text-zinc-500">Status</span>
                        <Status value={providerStatus(p.status)} />
                        {p.status === 'approved' ? (
                            <Button variant="primary" href="/provider">
                                Open provider dashboard
                            </Button>
                        ) : p.status === 'suspended' ? (
                            <p className="text-sm text-zinc-600">Your provider account is suspended. {p.review_notes}</p>
                        ) : (
                            <p className="text-sm text-zinc-600">Your account stays a trader account until approval. You cannot publish services yet.</p>
                        )}
                    </div>
                </div>
            </div>
        );
    }

    const submit = (e) => {
        e.preventDefault();
        const errs = {};
        if (!form.display_name.trim()) errs.display_name = 'The display name field is required.';
        if (!form.specialisation.trim()) errs.specialisation = 'The specialisation field is required.';
        if (form.experience_years === '' || Number(form.experience_years) < 0 || Number(form.experience_years) > 60) errs.experience_years = 'The experience years field must be between 0 and 60.';
        if (form.website && !/^https?:\/\/\S+$/.test(form.website)) errs.website = 'The website field must be a valid URL.';
        if (form.bio.trim().length < 40) errs.bio = 'The bio field must be at least 40 characters.';
        if (form.application_notes.trim().length < 40) errs.application_notes = 'Tell us a little more about your track record (at least 40 characters).';
        if (!Object.values(declarations).every(Boolean)) errs.declarations = 'All declarations must be accepted.';
        setErrors(errs);
        if (Object.keys(errs).length) return;
        perform(() => actions.applyAsProvider({ ...form, experience_years: Number(form.experience_years), declarations }), 'Application submitted. The platform team will review it.');
    };

    return (
        <div>
            <PageHeader title="Apply to become a provider" eyebrow="Curated model" description="Every application is reviewed by the platform team. Approval is required before any service can be published." />

            {p?.status === 'rejected' && (
                <Callout variant="danger" icon="x-circle" className="mb-6">
                    Your previous application was not approved: {p.review_notes}. You can update it and apply again.
                </Callout>
            )}

            <form onSubmit={submit} className="grid max-w-3xl gap-6" noValidate>
                <section className="tt-card grid gap-4 p-6 sm:grid-cols-2">
                    <h2 className="font-semibold sm:col-span-2">Profile</h2>
                    <Input label="Provider / brand name" value={form.display_name} onChange={set('display_name')} error={errors.display_name} />
                    <Input label="Specialisation" placeholder="e.g. Gold signals, EA development" value={form.specialisation} onChange={set('specialisation')} error={errors.specialisation} />
                    <Input label="Headline (optional)" className="sm:col-span-2" value={form.headline} onChange={set('headline')} />
                    <Input type="number" label="Years of trading experience" value={form.experience_years} onChange={set('experience_years')} error={errors.experience_years} />
                    <Input label="SSM registration (optional)" value={form.business_registration} onChange={set('business_registration')} />
                    <Input label="Website or sample work (optional)" className="sm:col-span-2" value={form.website} onChange={set('website')} error={errors.website} />
                    <Textarea label="Public bio" rows={4} className="sm:col-span-2" value={form.bio} onChange={set('bio')} error={errors.bio} />
                </section>

                <section className="tt-card grid gap-4 p-6">
                    <h2 className="font-semibold">Track record</h2>
                    <Textarea label="Experience, credentials and verifiable results (including losing periods)" rows={5} value={form.application_notes} onChange={set('application_notes')} error={errors.application_notes} />
                    <p className="text-xs text-zinc-500">Supporting documents (IC, SSM, statements) will be requested by email during review.</p>
                </section>

                <section className="tt-card grid gap-3 p-6">
                    <h2 className="font-semibold">Declarations</h2>
                    {Object.entries(PROVIDER_DECLARATIONS).map(([key, text]) => (
                        <Checkbox key={key} label={text} checked={declarations[key]} onChange={(e) => setDeclarations({ ...declarations, [key]: e.target.checked })} />
                    ))}
                    {errors.declarations && <p className="text-sm text-red-600">{errors.declarations}</p>}
                </section>

                <div className="flex justify-end">
                    <Button type="submit" variant="primary">
                        Submit application
                    </Button>
                </div>
            </form>
        </div>
    );
}

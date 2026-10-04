/* pages/provider/profile.blade.php */
import { useState } from 'react';
import { Button, Input, PageHeader, Status, Textarea } from '../../components/ui';
import { providerStatus } from '../../data/enums';
import { useProvider } from '../../hooks/useProvider';
import { usePerform } from '../../hooks/usePerform';
import { useTitle } from '../../hooks/useTitle';
import { fmtDate } from '../../utils/format';

export default function Profile() {
    useTitle('Provider Profile');
    const { actions, provider } = useProvider();
    const perform = usePerform();
    const [form, setForm] = useState({
        display_name: provider.display_name,
        headline: provider.headline ?? '',
        bio: provider.bio ?? '',
        specialisation: provider.specialisation ?? '',
        experience_years: provider.experience_years ?? '',
        website: provider.website ?? '',
    });
    const [errors, setErrors] = useState({});
    const set = (k) => (e) => setForm({ ...form, [k]: e.target.value });

    const save = (e) => {
        e.preventDefault();
        const errs = {};
        if (!form.display_name.trim()) errs.display_name = 'The display name field is required.';
        if (form.website && !/^https?:\/\/\S+$/.test(form.website)) errs.website = 'The website field must be a valid URL.';
        setErrors(errs);
        if (Object.keys(errs).length) return;
        perform(() => actions.updateProviderProfile({ ...form, experience_years: form.experience_years === '' ? null : Number(form.experience_years) }), 'Profile updated.');
    };

    return (
        <div>
            <PageHeader title="Provider Profile" description="How traders see you on your public profile." actions={<Button href={`/providers/${provider.slug}`}>View public profile</Button>} />

            <div className="grid grid-cols-1 gap-6 lg:grid-cols-[minmax(0,1fr)_300px]">
                <form onSubmit={save} className="tt-card grid gap-4 p-6 sm:grid-cols-2" noValidate>
                    <Input label="Display name" value={form.display_name} onChange={set('display_name')} error={errors.display_name} />
                    <Input label="Specialisation" value={form.specialisation} onChange={set('specialisation')} />
                    <Input label="Headline" className="sm:col-span-2" value={form.headline} onChange={set('headline')} />
                    <Input type="number" label="Years of experience" value={form.experience_years} onChange={set('experience_years')} />
                    <Input label="Website" value={form.website} onChange={set('website')} error={errors.website} />
                    <Textarea label="Bio" rows={6} className="sm:col-span-2" value={form.bio} onChange={set('bio')} />
                    <div className="flex justify-end sm:col-span-2">
                        <Button type="submit" variant="primary">
                            Save profile
                        </Button>
                    </div>
                </form>
                <div className="tt-card grid content-start gap-3 p-6 text-sm">
                    <span className="tt-eyebrow">Verification</span>
                    <Status value={providerStatus(provider.status)} />
                    <p className="text-zinc-600">Approved {fmtDate(provider.approved_at)}</p>
                    <p className="text-xs text-zinc-500">Changes to your name are recorded in the audit log.</p>
                </div>
            </div>
        </div>
    );
}

/* pages/settings/profile.blade.php + delete-user-form/modal */
import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useFeedback } from '../../components/Feedback';
import { Button, Input, Modal } from '../../components/ui';
import { useStore } from '../../data/store';
import { useTitle } from '../../hooks/useTitle';
import SettingsShell from './SettingsShell';

export default function Profile() {
    useTitle('Profile settings');
    const { user, actions } = useStore();
    const { toast } = useFeedback();
    const navigate = useNavigate();
    const [name, setName] = useState(user.name);
    const [email, setEmail] = useState(user.email);
    const [errors, setErrors] = useState({});
    const [saved, setSaved] = useState(false);
    const [deleting, setDeleting] = useState(false);
    const [password, setPassword] = useState('');
    const [deleteError, setDeleteError] = useState(null);

    const save = (e) => {
        e.preventDefault();
        const errs = {};
        if (!name.trim()) errs.name = 'The name field is required.';
        if (!/^\S+@\S+\.\S+$/.test(email)) errs.email = 'The email field must be a valid email address.';
        setErrors(errs);
        if (Object.keys(errs).length) return;
        actions.updateProfile({ name: name.trim(), email: email.trim() });
        setSaved(true);
        toast('Profile updated.');
        setTimeout(() => setSaved(false), 2000);
    };

    return (
        <SettingsShell heading="Profile" subheading="Update your name and email address">
            <form onSubmit={save} className="my-6 w-full space-y-6" noValidate>
                <Input label="Name" required autoComplete="name" value={name} onChange={(e) => setName(e.target.value)} error={errors.name} />
                <Input label="Email" type="email" required autoComplete="email" value={email} onChange={(e) => setEmail(e.target.value)} error={errors.email} />
                <div className="flex items-center gap-4">
                    <Button variant="primary" type="submit">
                        Save
                    </Button>
                    {saved && <span className="text-sm text-zinc-500">Saved.</span>}
                </div>
            </form>

            <section className="mt-10 space-y-6 border-t border-zinc-200 pt-8">
                <div className="relative mb-5">
                    <h3 className="text-base font-medium text-zinc-800">Delete account</h3>
                    <p className="text-sm text-zinc-500">Delete your account and all of its resources</p>
                </div>
                <Button variant="danger" onClick={() => setDeleting(true)}>
                    Delete account
                </Button>
            </section>

            <Modal open={deleting} onClose={() => setDeleting(false)}>
                <form
                    className="space-y-6"
                    onSubmit={(e) => {
                        e.preventDefault();
                        if (!password) return setDeleteError('The password field is required.');
                        actions.deleteAccount();
                        navigate('/');
                    }}
                >
                    <div className="pr-6">
                        <h2 className="text-lg font-semibold text-zinc-900">Are you sure you want to delete your account?</h2>
                        <p className="mt-2 text-sm text-zinc-500">
                            Once your account is deleted, all of its resources and data will be permanently deleted. Please enter your password to confirm you would like to permanently delete your account.
                        </p>
                    </div>
                    <Input label="Password" viewable value={password} onChange={(e) => setPassword(e.target.value)} error={deleteError} />
                    <div className="flex justify-end space-x-2">
                        <Button variant="filled" onClick={() => setDeleting(false)}>
                            Cancel
                        </Button>
                        <Button variant="danger" type="submit">
                            Delete account
                        </Button>
                    </div>
                </form>
            </Modal>
        </SettingsShell>
    );
}

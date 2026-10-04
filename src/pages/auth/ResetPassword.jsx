/* pages/auth/reset-password.blade.php */
import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useFeedback } from '../../components/Feedback';
import { Button, Input } from '../../components/ui';
import { useTitle } from '../../hooks/useTitle';
import { AuthHeader } from '../../layouts/AuthLayout';

export default function ResetPassword() {
    useTitle('Reset password');
    const navigate = useNavigate();
    const { toast } = useFeedback();
    const [form, setForm] = useState({ email: '', password: '', confirm: '' });
    const [error, setError] = useState(null);

    return (
        <div className="flex flex-col gap-6">
            <AuthHeader title="Reset password" description="Please enter your new password below" />
            <form
                className="flex flex-col gap-6"
                onSubmit={(e) => {
                    e.preventDefault();
                    if (form.password.length < 8) return setError('The password field must be at least 8 characters.');
                    if (form.password !== form.confirm) return setError('The password field confirmation does not match.');
                    toast('Your password has been reset.');
                    navigate('/login');
                }}
            >
                <Input label="Email" type="email" required autoComplete="email" value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} />
                <Input label="Password" required autoComplete="new-password" placeholder="Password" viewable value={form.password} onChange={(e) => setForm({ ...form, password: e.target.value })} error={error} />
                <Input label="Confirm password" required autoComplete="new-password" placeholder="Confirm password" viewable value={form.confirm} onChange={(e) => setForm({ ...form, confirm: e.target.value })} />
                <Button type="submit" variant="primary" className="w-full">
                    Reset password
                </Button>
            </form>
        </div>
    );
}

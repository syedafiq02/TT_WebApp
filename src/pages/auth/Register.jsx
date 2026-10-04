/* pages/auth/register.blade.php */
import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Button, Input } from '../../components/ui';
import { useStore, WorkflowError } from '../../data/store';
import { useTitle } from '../../hooks/useTitle';
import { AuthHeader } from '../../layouts/AuthLayout';

export default function Register() {
    useTitle('Register');
    const { actions } = useStore();
    const navigate = useNavigate();
    const [form, setForm] = useState({ name: '', email: '', password: '', password_confirmation: '' });
    const [errors, setErrors] = useState({});
    const set = (k) => (e) => setForm({ ...form, [k]: e.target.value });

    const submit = (e) => {
        e.preventDefault();
        const errs = {};
        if (!form.name.trim()) errs.name = 'The name field is required.';
        if (!/^\S+@\S+\.\S+$/.test(form.email)) errs.email = 'The email field must be a valid email address.';
        if (form.password.length < 8) errs.password = 'The password field must be at least 8 characters.';
        else if (form.password !== form.password_confirmation) errs.password = 'The password field confirmation does not match.';
        setErrors(errs);
        if (Object.keys(errs).length) return;
        try {
            actions.register(form);
            navigate('/email/verify');
        } catch (err) {
            if (!(err instanceof WorkflowError)) throw err;
            setErrors({ email: err.message });
        }
    };

    return (
        <div className="flex flex-col gap-6">
            <AuthHeader title="Create an account" description="Enter your details below to create your account" />
            <form onSubmit={submit} className="flex flex-col gap-6" noValidate>
                <Input label="Name" required autoFocus autoComplete="name" placeholder="Full name" value={form.name} onChange={set('name')} error={errors.name} />
                <Input label="Email address" type="email" required autoComplete="email" placeholder="email@example.com" value={form.email} onChange={set('email')} error={errors.email} />
                <Input label="Password" required autoComplete="new-password" placeholder="Password" viewable value={form.password} onChange={set('password')} error={errors.password} />
                <Input label="Confirm password" required autoComplete="new-password" placeholder="Confirm password" viewable value={form.password_confirmation} onChange={set('password_confirmation')} />
                <Button type="submit" variant="primary" className="w-full">
                    Create account
                </Button>
            </form>
            <div className="space-x-1 text-center text-sm text-zinc-400">
                <span>Already have an account?</span>
                <Link className="font-medium text-brand hover:text-brand-hover" to="/login">
                    Log in
                </Link>
            </div>
        </div>
    );
}

/* pages/auth/forgot-password.blade.php */
import { useState } from 'react';
import { Link } from 'react-router-dom';
import { Button, Input } from '../../components/ui';
import { useTitle } from '../../hooks/useTitle';
import { AuthHeader, SessionStatus } from '../../layouts/AuthLayout';

export default function ForgotPassword() {
    useTitle('Forgot password');
    const [email, setEmail] = useState('');
    const [status, setStatus] = useState(null);
    const [busy, setBusy] = useState(false);

    return (
        <div className="flex flex-col gap-6">
            <AuthHeader title="Forgot password" description="Enter your email to receive a password reset link" />
            <SessionStatus status={status} />
            <form
                className="flex flex-col gap-6"
                onSubmit={(e) => {
                    e.preventDefault();
                    setBusy(true);
                    setTimeout(() => {
                        setBusy(false);
                        setStatus('A reset link will be sent if the account exists.');
                    }, 600);
                }}
            >
                <Input label="Email address" type="email" required autoFocus placeholder="email@example.com" value={email} onChange={(e) => setEmail(e.target.value)} />
                <Button variant="primary" type="submit" className="w-full" loading={busy}>
                    Email password reset link
                </Button>
            </form>
            <div className="space-x-1 text-center text-sm text-zinc-600">
                <span>Or, return to</span>
                <Link className="font-medium text-brand hover:text-brand-hover" to="/login">
                    log in
                </Link>
            </div>
            <p className="text-center text-xs text-zinc-400">
                Static preview: no email is sent.{' '}
                <Link to="/reset-password" className="underline">
                    Open the reset form
                </Link>
            </p>
        </div>
    );
}

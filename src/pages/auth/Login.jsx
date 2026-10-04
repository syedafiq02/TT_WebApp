/* pages/auth/login.blade.php — with a demo account picker for the static build. */
import { useState } from 'react';
import { Link, useNavigate, useSearchParams } from 'react-router-dom';
import { Button, Checkbox, Icon, Input } from '../../components/ui';
import { DEMO_ACCOUNTS } from '../../data/seed';
import { useStore, WorkflowError } from '../../data/store';
import { useTitle } from '../../hooks/useTitle';
import { AuthHeader } from '../../layouts/AuthLayout';

export default function Login() {
    useTitle('Log in');
    const { actions } = useStore();
    const navigate = useNavigate();
    const [params] = useSearchParams();
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [error, setError] = useState(null);
    const [busy, setBusy] = useState(false);

    const signIn = (address) => {
        setError(null);
        setBusy(true);
        setTimeout(() => {
            try {
                actions.login(address);
                navigate(params.get('redirect') || '/dashboard', { replace: true });
            } catch (e) {
                if (!(e instanceof WorkflowError)) throw e;
                setError(e.message);
                setBusy(false);
            }
        }, 400);
    };

    return (
        <div className="flex flex-col gap-6">
            <AuthHeader title="Log in to your account" description="Enter your email and password below to log in" />

            <form
                className="flex flex-col gap-6"
                onSubmit={(e) => {
                    e.preventDefault();
                    signIn(email);
                }}
            >
                <Input label="Email address" type="email" required autoFocus autoComplete="email" placeholder="email@example.com" value={email} onChange={(e) => setEmail(e.target.value)} error={error} />
                <div className="relative">
                    <Input label="Password" required autoComplete="current-password" placeholder="Password" viewable value={password} onChange={(e) => setPassword(e.target.value)} />
                    <Link className="absolute end-0 top-0 text-sm font-medium text-brand hover:text-brand-hover" to="/forgot-password">
                        Forgot your password?
                    </Link>
                </div>
                <Checkbox label="Remember me" />
                <Button variant="primary" type="submit" className="w-full" loading={busy}>
                    Log in
                </Button>
            </form>

            <div className="grid gap-3 rounded-xl border border-zinc-200 bg-zinc-50/70 p-4">
                <div>
                    <p className="text-sm font-semibold text-zinc-900">Demo accounts</p>
                    <p className="text-xs text-zinc-500">Static preview: choose an account to sign in. Any password works.</p>
                </div>
                <div className="grid gap-1.5">
                    {DEMO_ACCOUNTS.map((a) => (
                        <button
                            key={a.email}
                            type="button"
                            disabled={busy}
                            onClick={() => signIn(a.email)}
                            className="flex cursor-pointer items-center gap-3 rounded-lg border border-zinc-200 bg-white px-3 py-2 text-left transition-colors hover:border-brand-line hover:bg-brand-soft/40 disabled:opacity-60"
                        >
                            <span className="tt-icon-tile size-8!">
                                <Icon name={a.icon} variant="micro" />
                            </span>
                            <span className="grid min-w-0 flex-1 leading-tight">
                                <span className="text-sm font-medium text-zinc-900">{a.label}</span>
                                <span className="truncate text-xs text-zinc-500">{a.description}</span>
                            </span>
                            <Icon name="chevron-right" variant="micro" className="text-zinc-400" />
                        </button>
                    ))}
                </div>
            </div>

            <div className="space-x-1 text-center text-sm text-zinc-400">
                <span>Don&apos;t have an account?</span>
                <Link className="font-medium text-brand hover:text-brand-hover" to="/register">
                    Sign up
                </Link>
            </div>
        </div>
    );
}

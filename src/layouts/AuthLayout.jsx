/* layouts/auth/simple.blade.php: brand panel + form card. */
import { Link, Outlet } from 'react-router-dom';
import { AiSupportWidget } from '../components/AiSupportWidget';
import { AppLogo, AppLogoIcon } from '../components/AppLogo';
import { Icon } from '../components/ui';
import { useStore } from '../data/store';

export default function AuthLayout() {
    const { user } = useStore();
    return (
        <div className="min-h-screen bg-canvas font-sans text-zinc-900 antialiased">
            <div className="grid min-h-svh lg:grid-cols-[minmax(0,1fr)_minmax(0,1.05fr)]">
                <aside className="relative hidden overflow-hidden border-e border-zinc-200 bg-white lg:flex lg:flex-col lg:justify-between lg:p-12">
                    <div className="pointer-events-none absolute inset-0 [background-image:linear-gradient(#e2e8f0_1px,transparent_1px),linear-gradient(90deg,#e2e8f0_1px,transparent_1px)] [background-size:48px_48px] opacity-50 [mask-image:radial-gradient(ellipse_70%_60%_at_30%_40%,#000,transparent_75%)]" />
                    <AppLogo to="/" className="relative" />

                    <div className="relative grid max-w-md gap-6">
                        <h2 className="text-3xl leading-tight font-semibold tracking-tight text-zinc-900">One account for every trading service you rely on.</h2>
                        <p className="text-[15px] leading-relaxed text-zinc-500">Discover reviewed providers, subscribe to individual products and manage access, renewals and downloads from a single hub.</p>
                        <ul className="grid gap-3 text-sm text-zinc-700">
                            {[
                                ['check-badge', 'Curated, verified providers'],
                                ['shield-check', 'Every listing reviewed before publication'],
                                ['squares-2x2', 'Centralised access to all your products'],
                            ].map(([icon, text]) => (
                                <li key={text} className="flex items-center gap-3">
                                    <span className="tt-icon-tile size-8!">
                                        <Icon name={icon} variant="micro" />
                                    </span>
                                    {text}
                                </li>
                            ))}
                        </ul>
                    </div>

                    <p className="relative text-xs leading-relaxed text-zinc-400">Trading involves risk. Services are educational and analytical and are not personalised investment advice.</p>
                </aside>

                <main className="flex flex-col items-center justify-center gap-6 px-4 py-10 sm:px-6">
                    <Link to="/" className="lg:hidden">
                        <AppLogoIcon className="h-10 min-w-10 text-base" />
                        <span className="sr-only">Terpaling Trader</span>
                    </Link>
                    <div className="tt-card flex w-full max-w-[420px] flex-col gap-6 p-6 sm:p-8">
                        <Outlet />
                    </div>
                    <p className="text-center text-xs text-zinc-400">© {new Date().getFullYear()} Terpaling Trader · Curated providers · Centralised access</p>
                </main>
            </div>
            {user && <AiSupportWidget />}
        </div>
    );
}

/** x-auth-session-status */
export function SessionStatus({ status }) {
    if (!status) return null;
    return <div className="rounded-lg border border-green-200 bg-green-50 px-3 py-2 text-center text-sm font-medium text-green-700">{status}</div>;
}

export function AuthHeader({ title, description }) {
    return (
        <div className="flex w-full flex-col gap-1.5 text-center">
            <h1 className="text-2xl font-semibold tracking-tight text-zinc-900">{title}</h1>
            <p className="text-sm text-zinc-500">{description}</p>
        </div>
    );
}

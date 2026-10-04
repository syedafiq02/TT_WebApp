/* layouts/public.blade.php: header, footer and AI widget for catalogue/checkout pages. */
import { useEffect, useState } from 'react';
import { Link, Outlet, useLocation } from 'react-router-dom';
import { AiSupportWidget } from '../components/AiSupportWidget';
import { AppLogo } from '../components/AppLogo';
import { Button, Icon } from '../components/ui';
import { useStore } from '../data/store';
import { cx } from '../utils/format';

export default function PublicLayout() {
    const { user } = useStore();
    const { pathname } = useLocation();
    const [open, setOpen] = useState(false);

    useEffect(() => {
        setOpen(false);
        window.scrollTo(0, 0);
    }, [pathname]);

    const navCls = (active) => cx('rounded-lg px-3 py-2 transition-colors', active ? 'bg-brand-soft text-brand' : 'text-zinc-600 hover:bg-zinc-100 hover:text-zinc-900');
    const mobileLink = 'flex items-center justify-between border-b border-zinc-100 py-3.5';

    return (
        <div className="min-h-screen bg-canvas font-sans text-zinc-900">
            <header className="sticky top-0 z-40 border-b border-zinc-200 bg-white/90 backdrop-blur supports-[backdrop-filter]:bg-white/80">
                <div className="mx-auto flex h-16 max-w-7xl items-center gap-8 px-4 sm:px-6 lg:px-10">
                    <AppLogo to="/" />
                    <nav className="hidden items-center gap-1 text-sm font-medium lg:flex" aria-label="Main">
                        <Link to="/services" className={navCls(pathname.startsWith('/services'))}>
                            Explore
                        </Link>
                        <Link to="/providers" className={navCls(pathname.startsWith('/providers'))}>
                            Providers
                        </Link>
                        <Link to="/#how" className={navCls(false)}>
                            How It Works
                        </Link>
                        <Link to="/#about" className={navCls(false)}>
                            About
                        </Link>
                        <Link to="/advertise" className={navCls(pathname.startsWith('/advertise'))}>
                            Advertise
                        </Link>
                    </nav>
                    <div className="ml-auto hidden items-center gap-2 lg:flex">
                        <Link to="/provider/apply" className="rounded-lg px-3 py-2 text-sm font-medium text-zinc-600 transition-colors hover:bg-zinc-100 hover:text-zinc-900">
                            Become a Provider
                        </Link>
                        <span className="h-5 w-px bg-zinc-200" />
                        {user ? (
                            <Button size="sm" variant="primary" href="/dashboard">
                                Dashboard
                            </Button>
                        ) : (
                            <>
                                <Button size="sm" variant="ghost" href="/login">
                                    Login
                                </Button>
                                <Button size="sm" variant="primary" href="/register">
                                    Get Started
                                </Button>
                            </>
                        )}
                    </div>
                    <button className="ml-auto grid size-10 cursor-pointer place-items-center rounded-lg border border-zinc-200 bg-white text-zinc-700 lg:hidden" onClick={() => setOpen((o) => !o)} aria-expanded={open} aria-label="Menu">
                        <Icon name={open ? 'x-mark' : 'bars-3'} className="size-5" />
                    </button>
                </div>
                {open && (
                    <div className="tt-anim-fade border-t border-zinc-200 bg-white px-4 pb-5 sm:px-6 lg:hidden">
                        <nav className="grid text-base font-medium text-zinc-800">
                            {[
                                ['/services', 'Explore'],
                                ['/providers', 'Providers'],
                                ['/#how', 'How It Works'],
                                ['/provider/apply', 'Become a Provider'],
                                ['/advertise', 'Advertise'],
                            ].map(([to, label]) => (
                                <Link key={to} to={to} className={mobileLink}>
                                    {label} <Icon name="chevron-right" variant="micro" className="text-zinc-400" />
                                </Link>
                            ))}
                        </nav>
                        <div className="mt-4 grid gap-2">
                            {user ? (
                                <Button variant="primary" href="/dashboard">
                                    Dashboard
                                </Button>
                            ) : (
                                <>
                                    <Button variant="primary" href="/register">
                                        Get Started
                                    </Button>
                                    <Button href="/login">Login</Button>
                                </>
                            )}
                        </div>
                    </div>
                )}
            </header>

            <main>
                <Outlet />
            </main>

            <footer className="mt-24 border-t border-zinc-200 bg-white">
                <div className="mx-auto grid max-w-7xl gap-8 px-4 py-12 sm:px-6 lg:px-10">
                    <div className="flex flex-wrap items-center justify-between gap-6">
                        <AppLogo to="/" />
                        <nav className="flex flex-wrap gap-x-6 gap-y-2 text-sm font-medium text-zinc-600">
                            <Link to="/services" className="transition-colors hover:text-brand">
                                Explore Services
                            </Link>
                            <Link to="/providers" className="transition-colors hover:text-brand">
                                Providers
                            </Link>
                            <Link to="/provider/apply" className="transition-colors hover:text-brand">
                                Become a Provider
                            </Link>
                            <Link to="/advertise" className="transition-colors hover:text-brand">
                                Advertise
                            </Link>
                        </nav>
                    </div>
                    <div className="grid gap-4 border-t border-zinc-100 pt-6">
                        <p className="flex gap-2 text-xs leading-relaxed text-zinc-500">
                            <Icon name="information-circle" variant="micro" className="mt-0.5 shrink-0 text-zinc-400" />
                            <span>
                                <b className="font-semibold text-zinc-700">Risk disclaimer.</b> Trading involves risk. Information and services provided through the platform should not be interpreted as a guarantee of trading results. Services are educational and analytical and are not personalised investment advice.
                            </span>
                        </p>
                        <p className="text-xs text-zinc-400">© {new Date().getFullYear()} Terpaling Trader</p>
                    </div>
                </div>
            </footer>

            <AiSupportWidget />
        </div>
    );
}

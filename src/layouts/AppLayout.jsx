/*
 * layouts/app.blade.php + layouts/app/sidebar.blade.php: the dashboard shell
 * shared by the customer, provider and admin areas.
 */
import { useEffect, useState } from 'react';
import { Link, Outlet, useLocation, useNavigate } from 'react-router-dom';
import { AiSupportWidget } from '../components/AiSupportWidget';
import { AppLogo } from '../components/AppLogo';
import { Button, Icon } from '../components/ui';
import { UserMenu } from '../components/UserMenu';
import { areaLabel, isActive, navItems, switcher } from '../data/navigation';
import { unreadCount } from '../data/queries';
import { useStore } from '../data/store';
import { TitleContext } from '../hooks/useTitle';
import { cx } from '../utils/format';

function Sidebar({ area, onNavigate }) {
    const { db, user, actions } = useStore();
    const { pathname } = useLocation();
    const navigate = useNavigate();
    const items = navItems(area, db, user);
    const groups = [];
    items.forEach((item) => {
        const heading = item.group ?? '';
        const last = groups[groups.length - 1];
        if (last && last.heading === heading) last.items.push(item);
        else groups.push({ heading, items: [item] });
    });
    const dot = area === 'admin' ? 'text-amber-500' : area === 'provider' ? 'text-green-600' : 'text-brand';
    const targets = switcher(area, db, user);

    return (
        <>
            <div className="mx-1 mb-1 flex items-center gap-2 rounded-lg border border-zinc-200 bg-zinc-50 px-3 py-2">
                <span className={cx('tt-dot', dot)} />
                <span className="text-xs font-medium text-zinc-600">{areaLabel(area)} workspace</span>
            </div>

            <nav className="grid content-start" aria-label={`${areaLabel(area)} navigation`}>
                {groups.map((g, i) => (
                    <div key={i}>
                        {g.heading ? <p className="tt-nav-heading">{g.heading}</p> : <div className="h-3" />}
                        <div className="grid gap-0.5">
                            {g.items.map((item) => {
                                const current = isActive(item, pathname);
                                return (
                                    <Link key={item.to} to={item.to} onClick={onNavigate} className={cx('tt-nav-item', current && 'is-active')} aria-current={current ? 'page' : undefined}>
                                        <Icon name={item.icon} />
                                        <span className="flex-1 truncate">{item.label}</span>
                                        {item.badge ? (
                                            <span className={cx('rounded-full px-1.5 py-px text-[11px] font-semibold tabular-nums', current ? 'bg-brand text-white' : 'bg-zinc-100 text-zinc-600')}>{item.badge}</span>
                                        ) : null}
                                    </Link>
                                );
                            })}
                        </div>
                    </div>
                ))}
            </nav>

            <div className="flex-1" />

            <div className="mt-6 grid gap-0.5 border-t border-zinc-200 pt-4">
                {targets.length > 0 && <p className="tt-nav-heading pt-0!">Switch workspace</p>}
                {targets.map((t) => (
                    <Link key={t.key} to={t.to} onClick={onNavigate} className="tt-nav-item">
                        <Icon name={t.icon} />
                        <span className="truncate">{t.label}</span>
                    </Link>
                ))}
                <Link to="/services" onClick={onNavigate} className="tt-nav-item">
                    <Icon name="magnifying-glass" />
                    <span className="truncate">Explore services</span>
                </Link>
                <button
                    type="button"
                    onClick={() => {
                        actions.logout();
                        navigate('/');
                    }}
                    className="tt-nav-item w-full cursor-pointer hover:bg-red-50! hover:text-red-700! [&:hover_svg]:text-red-600!"
                >
                    <Icon name="arrow-right-start-on-rectangle" />
                    <span>Log out</span>
                </button>
            </div>
        </>
    );
}

export default function AppLayout({ area = 'customer' }) {
    const { db, user } = useStore();
    const { pathname } = useLocation();
    const [title, setTitle] = useState(null);
    const [mobileOpen, setMobileOpen] = useState(false);
    const unread = unreadCount(db, user.id);
    const home = area === 'provider' ? '/provider' : area === 'admin' ? '/admin' : '/dashboard';

    useEffect(() => {
        setMobileOpen(false);
        window.scrollTo(0, 0);
    }, [pathname]);

    useEffect(() => {
        if (!mobileOpen) return;
        const onKey = (e) => e.key === 'Escape' && setMobileOpen(false);
        document.addEventListener('keydown', onKey);
        return () => document.removeEventListener('keydown', onKey);
    }, [mobileOpen]);

    return (
        <TitleContext.Provider value={setTitle}>
            <div className="min-h-screen bg-canvas font-sans text-zinc-900 lg:grid lg:grid-cols-[260px_minmax(0,1fr)]">
                {/* Desktop sidebar */}
                <aside className="sticky top-0 hidden h-screen flex-col overflow-y-auto border-e border-zinc-200 bg-white px-3 py-4 lg:flex">
                    <div className="flex items-center justify-between px-2 pb-4">
                        <AppLogo to={home} />
                    </div>
                    <Sidebar area={area} />
                </aside>

                {/* Mobile sidebar */}
                {mobileOpen && (
                    <div className="fixed inset-0 z-50 lg:hidden">
                        <div className="tt-anim-fade absolute inset-0 bg-zinc-900/30" onClick={() => setMobileOpen(false)} />
                        <aside className="tt-anim-slide absolute inset-y-0 left-0 flex w-[260px] max-w-[85vw] flex-col overflow-y-auto border-e border-zinc-200 bg-white pt-[max(1rem,env(safe-area-inset-top))] pr-3 pb-[max(1rem,env(safe-area-inset-bottom))] pl-[max(0.75rem,env(safe-area-inset-left))]">
                            <div className="flex items-center justify-between px-2 pb-4">
                                <AppLogo to={home} onClick={() => setMobileOpen(false)} />
                                <button className="grid size-8 cursor-pointer place-items-center rounded-md text-zinc-500 hover:bg-zinc-100" onClick={() => setMobileOpen(false)} aria-label="Close sidebar">
                                    <Icon name="x-mark" variant="mini" />
                                </button>
                            </div>
                            <Sidebar area={area} onNavigate={() => setMobileOpen(false)} />
                        </aside>
                    </div>
                )}

                <div className="min-w-0">
                    <header className="sticky top-0 z-40 flex h-16 items-center gap-2 border-b border-zinc-200 bg-white/90 px-4 backdrop-blur supports-[backdrop-filter]:bg-white/80 lg:px-8">
                        <button className="-ml-1 grid size-10 cursor-pointer place-items-center rounded-lg text-zinc-600 hover:bg-zinc-100 lg:hidden" onClick={() => setMobileOpen(true)} aria-label="Open sidebar">
                            <Icon name="bars-3" variant="mini" />
                        </button>
                        <AppLogo to={home} className="ms-2 lg:hidden" hideTextOnMobile />

                        {title && (
                            <p className="hidden text-sm text-zinc-500 lg:block">
                                {areaLabel(area)}
                                <span className="mx-1.5 text-zinc-300">/</span>
                                <span className="font-medium text-zinc-900">{title}</span>
                            </p>
                        )}

                        <div className="flex-1" />

                        <div className="flex items-center gap-1.5">
                            <Button size="sm" variant="ghost" icon="magnifying-glass" href="/services" className="max-sm:hidden">
                                Explore
                            </Button>
                            <Link
                                to="/dashboard/notifications"
                                className="relative grid size-9 place-items-center rounded-lg text-zinc-500 transition-colors hover:bg-zinc-100 hover:text-zinc-900"
                                aria-label={`Notifications${unread ? ` (${unread} unread)` : ''}`}
                            >
                                <Icon name="bell" className="size-5" />
                                {unread > 0 && <span className="absolute top-2 right-2 size-2 rounded-full bg-brand ring-2 ring-white" />}
                            </Link>
                            <span className="mx-1 h-6 w-px bg-zinc-200" />
                            <UserMenu />
                        </div>
                    </header>

                    <main className="bg-canvas px-4 py-6 sm:px-6 lg:px-10 lg:py-8">
                        <div className="mx-auto w-full max-w-7xl">
                            <Outlet />
                        </div>
                    </main>
                </div>
            </div>
            <AiSupportWidget />
        </TitleContext.Provider>
    );
}

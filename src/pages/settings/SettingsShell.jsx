/* partials/settings-heading + pages/settings/layout.blade.php */
import { Link, useLocation } from 'react-router-dom';
import { Icon, PageHeader } from '../../components/ui';
import { cx } from '../../utils/format';

export default function SettingsShell({ heading, subheading, children }) {
    const { pathname } = useLocation();
    return (
        <section className="w-full">
            <PageHeader title="Settings" description="Manage your profile and account settings" />
            <div className="grid items-start gap-6 md:grid-cols-[220px_minmax(0,1fr)]">
                <nav className="flex gap-1 overflow-x-auto md:grid" aria-label="Settings">
                    {[
                        ['/settings/profile', 'Profile', 'user'],
                        ['/settings/security', 'Security', 'shield-check'],
                    ].map(([to, label, icon]) => {
                        const active = pathname === to || (to === '/settings/profile' && pathname === '/settings');
                        return (
                            <Link key={to} to={to} className={cx('tt-nav-item shrink-0', active && 'is-active')} aria-current={active ? 'page' : undefined}>
                                <Icon name={icon} />
                                {label}
                            </Link>
                        );
                    })}
                </nav>

                <div className="tt-card p-6 sm:p-8">
                    <h2 className="text-lg font-semibold text-zinc-900">{heading}</h2>
                    <p className="mt-1 text-sm text-zinc-500">{subheading}</p>
                    <div className="mt-6 w-full max-w-lg">{children}</div>
                </div>
            </div>
        </section>
    );
}

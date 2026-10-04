/* App\Support\Navigation: sidebar items per dashboard area, defined in one place. */
import { canAccessAdmin, canAccessProvider, unreadCount } from './queries';

export function navItems(area, db, user) {
    if (area === 'provider') {
        return [
            { label: 'Overview', to: '/provider', icon: 'home', exact: true },
            { label: 'My Products', to: '/provider/services', icon: 'squares-2x2', group: 'Products', match: (p) => p === '/provider/services' || /^\/provider\/services\/[^/]+\/edit$/.test(p) },
            { label: 'Create Product', to: '/provider/services/create', icon: 'plus-circle', group: 'Products' },
            { label: 'Plans & Pricing', to: '/provider/plans', icon: 'tag', group: 'Products' },
            { label: 'Files', to: '/provider/files', icon: 'arrow-down-tray', group: 'Products' },
            { label: 'Content', to: '/provider/content', icon: 'document-text', group: 'Products' },
            { label: 'Customers', to: '/provider/customers', icon: 'users', group: 'Business' },
            { label: 'Sales & Revenue', to: '/provider/revenue', icon: 'chart-bar', group: 'Business' },
            { label: 'Payouts', to: '/provider/payouts', icon: 'banknotes', group: 'Business' },
            { label: 'Reviews', to: '/provider/reviews', icon: 'star', group: 'Business' },
            { label: 'Provider Profile', to: '/provider/profile', icon: 'identification', group: 'Account' },
        ];
    }

    if (area === 'admin') {
        return [
            { label: 'Dashboard', to: '/admin', icon: 'home', exact: true },
            { label: 'Provider Applications', to: '/admin/provider-applications', icon: 'inbox-arrow-down', group: 'Curation', badge: db.providers.filter((p) => p.status === 'pending').length },
            { label: 'Providers', to: '/admin/providers', icon: 'check-badge', group: 'Curation' },
            { label: 'Products', to: '/admin/services', icon: 'squares-2x2', group: 'Curation', match: (p) => p.startsWith('/admin/services'), badge: db.services.filter((s) => s.status === 'pending_review').length },
            { label: 'Categories', to: '/admin/categories', icon: 'tag', group: 'Curation' },
            { label: 'Reviews & Reports', to: '/admin/reviews', icon: 'flag', group: 'Curation' },
            { label: 'Content Moderation', to: '/admin/moderation', icon: 'eye', group: 'Curation' },
            { label: 'Subscriptions', to: '/admin/subscriptions', icon: 'arrow-path', group: 'Commerce' },
            { label: 'Orders & Payments', to: '/admin/orders', icon: 'credit-card', group: 'Commerce' },
            { label: 'Payouts', to: '/admin/payouts', icon: 'banknotes', group: 'Commerce', badge: db.payouts.filter((p) => p.status === 'requested').length },
            { label: 'Users', to: '/admin/users', icon: 'users', group: 'Platform' },
            { label: 'Settings', to: '/admin/settings', icon: 'cog-6-tooth', group: 'Platform' },
            { label: 'Audit Logs', to: '/admin/audit-logs', icon: 'clipboard-document-list', group: 'Platform' },
        ];
    }

    return [
        { label: 'Overview', to: '/dashboard', icon: 'home', exact: true },
        { label: 'My Services', to: '/dashboard/services', icon: 'squares-2x2', group: 'Products', match: (p) => p.startsWith('/dashboard/services') },
        { label: 'My Subscriptions', to: '/dashboard/subscriptions', icon: 'arrow-path', group: 'Products' },
        { label: 'Learning / Content', to: '/dashboard/learning', icon: 'academic-cap', group: 'Products' },
        { label: 'Bookings', to: '/dashboard/bookings', icon: 'calendar', group: 'Products' },
        { label: 'Payments & Billing', to: '/dashboard/billing', icon: 'credit-card', group: 'Account' },
        { label: 'Notifications', to: '/dashboard/notifications', icon: 'bell', group: 'Account', badge: unreadCount(db, user.id) },
        { label: 'Account Settings', to: '/settings/profile', icon: 'cog-6-tooth', group: 'Account', match: (p) => p.startsWith('/settings') },
    ];
}

/** Other areas this user may switch to. */
export function switcher(current, db, user) {
    const areas = [{ key: 'customer', label: 'My trading hub', to: '/dashboard', icon: 'user' }];
    if (canAccessProvider(db, user)) areas.push({ key: 'provider', label: 'Provider dashboard', to: '/provider', icon: 'briefcase' });
    if (canAccessAdmin(user)) areas.push({ key: 'admin', label: 'Admin console', to: '/admin', icon: 'shield-check' });
    return areas.filter((a) => a.key !== current);
}

export const areaLabel = (area) => ({ provider: 'Provider', admin: 'Admin' })[area] ?? 'Trader';

export function isActive(item, pathname) {
    if (item.match) return item.match(pathname);
    return item.exact ? pathname === item.to : pathname === item.to;
}

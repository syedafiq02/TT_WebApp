/*
 * Read helpers over the mock database — the equivalents of the Eloquent
 * relations and scopes used by the Laravel pages.
 */
import { isFuture } from '../utils/format';

export const byId = (list, id) => list.find((x) => x.id === Number(id));

export const userOf = (db, id) => byId(db.users, id);
export const providerById = (db, id) => byId(db.providers, id);
export const providerBySlug = (db, slug) => db.providers.find((p) => p.slug === slug);
export const providerForUser = (db, userId) => db.providers.find((p) => p.user_id === userId) ?? null;
export const serviceById = (db, id) => byId(db.services, id);
export const serviceBySlug = (db, slug) => db.services.find((s) => s.slug === slug);
export const planById = (db, id) => byId(db.plans, id);
export const categoryById = (db, id) => byId(db.categories, id);

export const roots = (db, activeOnly = true) =>
    db.categories.filter((c) => c.parent_id === null && (!activeOnly || c.is_active)).sort((a, b) => a.sort_order - b.sort_order);
export const children = (db, rootId, activeOnly = true) =>
    db.categories.filter((c) => c.parent_id === rootId && (!activeOnly || c.is_active)).sort((a, b) => a.sort_order - b.sort_order);
export const selfAndChildIds = (db, cat) => [cat.id, ...db.categories.filter((c) => c.parent_id === cat.id).map((c) => c.id)];

export const plansFor = (db, serviceId) =>
    db.plans.filter((p) => p.service_id === serviceId).sort((a, b) => a.sort_order - b.sort_order || a.price_minor - b.price_minor);
export const activePlans = (db, serviceId) => plansFor(db, serviceId).filter((p) => p.status === 'active');
export const cheapestPlan = (db, serviceId) => [...activePlans(db, serviceId)].sort((a, b) => a.price_minor - b.price_minor)[0] ?? null;

export const isApprovedProvider = (db, providerId) => providerById(db, providerId)?.status === 'approved';

/** Service::scopePubliclyVisible() */
export const publicServices = (db) => db.services.filter((s) => s.status === 'published' && isApprovedProvider(db, s.provider_id));

/** Service::scopeWithRating() */
export function rating(db, serviceId) {
    const list = db.reviews.filter((r) => r.service_id === serviceId && r.status === 'published');
    return { count: list.length, avg: list.length ? list.reduce((a, r) => a + r.rating, 0) / list.length : 0 };
}

/** Subscription::isCurrentlyActive() */
export const isCurrentlyActive = (sub) => sub.status === 'active' && (sub.expires_at === null || isFuture(sub.expires_at));

/** Entitlement types the user currently holds for a product (AccessManager::grantedTypes). */
export function grantedTypes(db, userId, service) {
    // Entitlements outlive a cancelled renewal: access lasts until the paid period ends.
    const holds = db.subscriptions.some(
        (s) => s.user_id === userId && s.service_id === service.id && ['active', 'cancelled'].includes(s.status) && (s.expires_at === null || isFuture(s.expires_at)),
    );
    if (!holds || ['suspended', 'archived'].includes(service.status)) return [];
    return service.access_types;
}

export const hasAnyAccess = (db, userId, service) => grantedTypes(db, userId, service).length > 0;

export const userSubscriptions = (db, userId) => db.subscriptions.filter((s) => s.user_id === userId);

export const latestSubscription = (db, userId, serviceId) =>
    db.subscriptions
        .filter((s) => s.user_id === userId && s.service_id === serviceId)
        .sort((a, b) => new Date(b.starts_at) - new Date(a.starts_at))[0] ?? null;

export const providerServices = (db, providerId) => db.services.filter((s) => s.provider_id === providerId);
export const providerServiceIds = (db, providerId) => providerServices(db, providerId).map((s) => s.id);

export const unreadCount = (db, userId) => db.notifications.filter((n) => n.user_id === userId && !n.read_at).length;

export const currentVersion = (file) => file.versions.find((v) => v.is_current) ?? null;
export const fileDownloads = (file) => file.versions.reduce((a, v) => a + v.downloads, 0);

export const sortByDesc = (list, key) => [...list].sort((a, b) => new Date(b[key] ?? 0) - new Date(a[key] ?? 0));
export const sortByAsc = (list, key) => [...list].sort((a, b) => new Date(a[key] ?? 0) - new Date(b[key] ?? 0));

/** Gates from AppServiceProvider. */
export const canAccessAdmin = (user) => user?.status === 'active' && user?.role === 'admin';
export const canAccessProvider = (db, user) => user?.status === 'active' && providerForUser(db, user.id)?.status === 'approved';

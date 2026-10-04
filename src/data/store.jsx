/*
 * Client-side data store. Stands in for Laravel + the database: holds the
 * mock records in React state (persisted to localStorage so a demo session
 * survives reloads) and exposes the domain actions from app/Actions/* as
 * plain functions. Rule violations throw WorkflowError with the same
 * messages the Laravel actions use.
 */
import { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react';
import { accessEndsAt, allowedBillingTypes, contentEntitlement, planTerm, typeLabel } from './enums';
import { activePlans, canAccessProvider, hasAnyAccess, planById, providerForUser, serviceById, userOf } from './queries';
import { createSeed } from './seed';
import { bps, EARNING_HOLD_DAYS, MINIMUM_PAYOUT_MINOR, money, PLATFORM_FEE_BPS, slugify } from '../utils/format';

const DB_KEY = 'tt-demo-db-v1';
const USER_KEY = 'tt-demo-user-v1';

export class WorkflowError extends Error {}

function load(key, fallback) {
    try {
        const raw = localStorage.getItem(key);
        return raw ? JSON.parse(raw) : fallback();
    } catch {
        return fallback();
    }
}

function save(key, value) {
    try {
        if (value === null) localStorage.removeItem(key);
        else localStorage.setItem(key, JSON.stringify(value));
    } catch {
        /* storage unavailable: the demo still works for this page view */
    }
}

const now = () => new Date().toISOString();
const nextId = (list) => list.reduce((m, x) => Math.max(m, x.id), 0) + 1;
const fail = (message) => {
    throw new WorkflowError(message);
};

const StoreContext = createContext(null);

export function StoreProvider({ children }) {
    const [db, setDb] = useState(() => load(DB_KEY, createSeed));
    const [userId, setUserId] = useState(() => load(USER_KEY, () => null));

    useEffect(() => save(DB_KEY, db), [db]);
    useEffect(() => save(USER_KEY, userId), [userId]);

    const user = userId ? userOf(db, userId) ?? null : null;

    // Run the logic synchronously on a copy so validation errors surface to the
    // caller immediately, then commit the copy as the new state.
    const run = useCallback(
        (fn) => {
            const draft = structuredClone(db);
            const result = fn(draft);
            setDb(draft);
            return result;
        },
        [db],
    );

    const audit = (draft, action, subject_type, subject_id, properties = null) => {
        draft.auditLogs.unshift({ id: nextId(draft.auditLogs), action, actor_id: userId, subject_type, subject_id, properties, created_at: now() });
    };

    const notify = (draft, user_id, icon, title, body, url) => {
        draft.notifications.push({ id: nextId(draft.notifications), user_id, data: { icon, title, body, url }, created_at: now(), read_at: null });
    };

    const actions = useMemo(() => {
        const myProvider = (draft) => providerForUser(draft, userId);

        return {
            /* ---------------------------------------------------- Auth */
            login(email) {
                const found = db.users.find((u) => u.email.toLowerCase() === email.trim().toLowerCase());
                if (!found) fail('These credentials do not match our records.');
                if (found.status === 'suspended') fail('This account has been suspended. Contact support for help.');
                setUserId(found.id);
                return found;
            },
            logout() {
                setUserId(null);
            },
            register({ name, email }) {
                if (db.users.some((u) => u.email.toLowerCase() === email.toLowerCase())) fail('The email has already been taken.');
                const id = run((d) => {
                    const newId = nextId(d.users);
                    d.users.push({ id: newId, name, email, role: 'customer', status: 'active', created_at: now() });
                    return newId;
                });
                setUserId(id);
            },
            resetDemo() {
                setDb(createSeed());
            },

            /* ---------------------------------------- Account settings */
            updateProfile({ name, email }) {
                run((d) => Object.assign(userOf(d, userId), { name, email }));
            },
            deleteAccount() {
                run((d) => {
                    d.users = d.users.filter((u) => u.id !== userId);
                });
                setUserId(null);
            },
            setTwoFactor(enabled) {
                run((d) => {
                    d.security[userId] = { ...(d.security[userId] ?? {}), twoFactor: enabled };
                });
            },
            setPasskeys(passkeys) {
                run((d) => {
                    d.security[userId] = { ...(d.security[userId] ?? {}), passkeys };
                });
            },

            /* ------------------------------------------------ Checkout */
            /** CreateOrder + StartPayment + (TestGateway outcome) + CompletePayment */
            checkout(planId, outcome = 'approve') {
                return run((d) => {
                    const plan = planById(d, planId);
                    const service = serviceById(d, plan.service_id);
                    if (service.status !== 'published') fail('This service is not available for purchase.');
                    if (plan.status !== 'active') fail('This plan is no longer available.');
                    if (providerForUser(d, userId)?.id === service.provider_id) fail('You cannot subscribe to your own service.');
                    if (hasAnyAccess(d, userId, service)) fail('You already have access to this service.');

                    const paid = outcome === 'approve';
                    const orderId = nextId(d.orders);
                    const reference = `TT-${Date.now().toString(36).toUpperCase().slice(-6)}${String(orderId).padStart(3, '0')}`;
                    d.orders.push({
                        id: orderId, reference, user_id: userId, status: paid ? 'paid' : 'failed', currency: 'MYR',
                        subtotal_minor: plan.price_minor, discount_minor: 0, total_minor: plan.price_minor, created_at: now(), paid_at: paid ? now() : null,
                        items: [{ service_id: service.id, plan_id: plan.id, description: `${service.title} · ${plan.name}`, plan_snapshot: { name: plan.name, price_minor: plan.price_minor } }],
                        payments: [{
                            gateway: 'test', method: 'Test gateway', status: paid ? 'succeeded' : 'failed', amount_minor: plan.price_minor,
                            transaction_reference: paid ? `TEST-${orderId}${Date.now() % 10000}` : null, failure_reason: paid ? null : 'The payment was declined on the test payment page.',
                        }],
                    });

                    if (paid) {
                        const term = planTerm(plan);
                        d.subscriptions.push({
                            id: nextId(d.subscriptions), user_id: userId, service_id: service.id, plan_id: plan.id, order_id: orderId, status: 'active', term,
                            starts_at: now(), expires_at: accessEndsAt(plan), auto_renew: term === 'recurring', sessions_remaining: plan.session_count ?? null, cancelled_at: null,
                            license: service.access_types.includes('license_access')
                                ? { license_key: `TT-${Math.random().toString(36).slice(2, 6).toUpperCase()}-${Math.random().toString(36).slice(2, 6).toUpperCase()}-${Math.random().toString(36).slice(2, 6).toUpperCase()}`, activations: [], activation_limit: 2 }
                                : null,
                        });
                        const fee = bps(plan.price_minor, PLATFORM_FEE_BPS);
                        d.earnings.push({
                            id: nextId(d.earnings), provider_id: service.provider_id, order_id: orderId, description: `${service.title} · ${plan.name}`,
                            gross_minor: plan.price_minor, platform_fee_minor: fee, net_minor: plan.price_minor - fee, fee_bps: PLATFORM_FEE_BPS, currency: 'MYR',
                            status: 'pending', available_at: new Date(Date.now() + EARNING_HOLD_DAYS * 86400000).toISOString(), payout_id: null, created_at: now(),
                        });
                        notify(d, userId, 'credit-card', 'Payment successful', `Your payment of ${money(plan.price_minor)} for ${service.title} was received.`, `/dashboard/services/${service.slug}`);
                        notify(d, userId, 'check-circle', 'Subscription activated', `You now have access to ${service.title}.`, `/dashboard/services/${service.slug}`);
                        audit(d, 'payment.succeeded', 'Payment', orderId, { reference });
                    }
                    return reference;
                });
            },

            /* -------------------------------------------- Customer area */
            cancelRenewal(subId) {
                run((d) => {
                    const sub = d.subscriptions.find((s) => s.id === subId);
                    if (sub.status !== 'active') return;
                    Object.assign(sub, { status: 'cancelled', cancelled_at: now(), auto_renew: false });
                });
            },
            requestBooking(serviceId, scheduledAt, notes) {
                run((d) => {
                    const service = serviceById(d, serviceId);
                    if (!hasAnyAccess(d, userId, service) || !service.access_types.includes('booking_access')) fail('Your subscription does not include bookings for this service.');
                    if (new Date(scheduledAt) <= new Date()) fail('Choose a time in the future.');
                    const sub = d.subscriptions.filter((s) => s.user_id === userId && s.service_id === serviceId).sort((a, b) => new Date(b.starts_at) - new Date(a.starts_at))[0];
                    if (sub.sessions_remaining !== null && sub.sessions_remaining <= 0) fail('You have used all sessions in your plan.');
                    if (sub.sessions_remaining !== null) sub.sessions_remaining -= 1;
                    d.bookings.push({ id: nextId(d.bookings), user_id: userId, service_id: serviceId, provider_id: service.provider_id, subscription_id: sub.id, scheduled_at: new Date(scheduledAt).toISOString(), duration_minutes: 60, status: 'requested', notes: notes || null, meeting_url: null });
                    const provider = d.providers.find((p) => p.id === service.provider_id);
                    notify(d, provider.user_id, 'calendar', 'Booking requested', `${userOf(d, userId).name} requested a ${service.title} session.`, '/provider/customers');
                });
            },
            submitReview(serviceId, ratingValue, body) {
                run((d) => {
                    if (!d.subscriptions.some((s) => s.user_id === userId && s.service_id === serviceId)) fail('Only subscribers of this service can review it.');
                    const existing = d.reviews.find((r) => r.user_id === userId && r.service_id === serviceId);
                    if (existing) Object.assign(existing, { rating: ratingValue, body: body || null, status: 'published' });
                    else d.reviews.push({ id: nextId(d.reviews), user_id: userId, service_id: serviceId, rating: ratingValue, body: body || null, status: 'published', created_at: now() });
                });
            },
            recordDownload(versionId) {
                run((d) => {
                    for (const f of d.files) {
                        const v = f.versions.find((x) => x.id === versionId);
                        if (v) v.downloads += 1;
                    }
                });
            },
            markAllRead() {
                run((d) => d.notifications.forEach((n) => n.user_id === userId && !n.read_at && (n.read_at = now())));
            },
            markRead(id) {
                run((d) => {
                    const n = d.notifications.find((x) => x.id === id);
                    if (n && !n.read_at) n.read_at = now();
                });
            },

            /* ---------------------------------------- Provider workflow */
            applyAsProvider(data) {
                run((d) => {
                    const existing = providerForUser(d, userId);
                    if (existing && existing.status !== 'rejected') fail('You already have a provider application or account.');
                    const record = {
                        ...(existing ?? { id: nextId(d.providers), user_id: userId }),
                        ...data, slug: slugify(data.display_name), status: 'pending', submitted_at: now(), review_notes: null, rejected_at: null,
                    };
                    d.providers = d.providers.filter((p) => p.id !== record.id).concat(record);
                    audit(d, 'provider.application_submitted', 'Provider', record.id);
                });
            },
            updateProviderProfile(data) {
                run((d) => {
                    const p = myProvider(d);
                    if (p.display_name !== data.display_name) audit(d, 'provider.renamed', 'Provider', p.id, { display_name: data.display_name });
                    Object.assign(p, data);
                });
            },
            saveService(serviceId, data) {
                return run((d) => {
                    const provider = myProvider(d);
                    if (serviceId) {
                        const s = serviceById(d, serviceId);
                        if (s.provider_id !== provider.id) fail('You can only edit your own services.');
                        if (!['draft', 'rejected'].includes(s.status)) fail(`This service cannot be edited while it is ${s.status.replace('_', ' ')}.`);
                        Object.assign(s, data, { updated_at: now() });
                        return s;
                    }
                    let slug = slugify(data.title);
                    if (d.services.some((s) => s.slug === slug)) slug = `${slug}-${nextId(d.services)}`;
                    const s = { id: nextId(d.services), provider_id: provider.id, slug, status: 'draft', featured: false, gallery: [], updated_at: now(), ...data };
                    d.services.push(s);
                    return s;
                });
            },
            addPlan(serviceId, plan) {
                run((d) => {
                    const s = serviceById(d, serviceId);
                    if (!allowedBillingTypes(s.service_type).includes(plan.billing_type)) fail(`${typeLabel(s.service_type)} services cannot use ${plan.billing_type === 'one_time' ? 'One Time' : 'Recurring'} billing.`);
                    if (plan.billing_type === 'recurring' && !plan.interval_unit) fail('Recurring plans need a billing interval.');
                    d.plans.push({ id: nextId(d.plans), service_id: serviceId, currency: 'MYR', status: 'active', description: null, sort_order: d.plans.filter((p) => p.service_id === serviceId).length, ...plan });
                });
            },
            togglePlan(planId) {
                run((d) => {
                    const p = planById(d, planId);
                    p.status = p.status === 'active' ? 'inactive' : 'active';
                });
            },
            addContent(serviceId, item) {
                run((d) => {
                    d.contents.push({ id: nextId(d.contents), service_id: serviceId, required_entitlement: contentEntitlement(item.type), status: 'published', published_at: now(), created_at: now(), sort_order: d.contents.filter((c) => c.service_id === serviceId).length, ...item });
                });
            },
            toggleContent(contentId) {
                run((d) => {
                    const c = d.contents.find((x) => x.id === contentId);
                    c.status = c.status === 'published' ? 'hidden' : 'published';
                    if (c.status === 'published' && !c.published_at) c.published_at = now();
                });
            },
            submitService(serviceId) {
                run((d) => {
                    const s = serviceById(d, serviceId);
                    if (!canAccessProvider(d, userOf(d, userId))) fail('Your provider account must be approved before you can submit services for review.');
                    if (!['draft', 'rejected'].includes(s.status)) fail(`A ${s.status} service cannot be moved to Pending Review.`);
                    if (activePlans(d, serviceId).length === 0) fail('Add at least one active pricing plan before submitting.');
                    if (s.access_types.includes('download_access') && !d.files.some((f) => f.service_id === serviceId && f.versions.length)) fail('This product includes downloads. Upload at least one file before submitting.');
                    if (s.access_types.includes('external_access') && !s.external_access_url) fail('Add the external access link before submitting.');
                    Object.assign(s, { status: 'pending_review', submitted_at: now(), updated_at: now(), rejection_reason: null });
                    audit(d, 'service.submitted', 'Service', s.id);
                });
            },
            withdrawService(serviceId) {
                run((d) => Object.assign(serviceById(d, serviceId), { status: 'draft', updated_at: now() }));
            },
            createFile(serviceId, { title, description, fileName, size, version, notes }) {
                run((d) => {
                    const versionId = d.files.flatMap((f) => f.versions).reduce((m, v) => Math.max(m, v.id), 0) + 1;
                    d.files.push({
                        id: nextId(d.files), service_id: serviceId, title, description: description || null, is_active: true, sort_order: d.files.filter((f) => f.service_id === serviceId).length,
                        versions: [{ id: versionId, version, original_name: fileName, size_bytes: size, released_at: now(), release_notes: notes || null, downloads: 0, is_current: true, checksum_sha256: crypto.randomUUID().replace(/-/g, '').repeat(2) }],
                    });
                });
            },
            addVersion(fileId, { fileName, size, version, notes, makeCurrent }) {
                run((d) => {
                    const f = d.files.find((x) => x.id === fileId);
                    if (f.versions.some((v) => v.version === version)) fail(`Version ${version} already exists for this file.`);
                    const versionId = d.files.flatMap((x) => x.versions).reduce((m, v) => Math.max(m, v.id), 0) + 1;
                    if (makeCurrent) f.versions.forEach((v) => (v.is_current = false));
                    f.versions.unshift({ id: versionId, version, original_name: fileName, size_bytes: size, released_at: now(), release_notes: notes || null, downloads: 0, is_current: !!makeCurrent, checksum_sha256: crypto.randomUUID().replace(/-/g, '').repeat(2) });
                });
            },
            setCurrentVersion(fileId, versionId) {
                run((d) => d.files.find((x) => x.id === fileId).versions.forEach((v) => (v.is_current = v.id === versionId)));
            },
            toggleFileActive(fileId) {
                run((d) => {
                    const f = d.files.find((x) => x.id === fileId);
                    f.is_active = !f.is_active;
                });
            },
            deleteVersion(fileId, versionId) {
                run((d) => {
                    const f = d.files.find((x) => x.id === fileId);
                    if (f.versions.find((v) => v.id === versionId)?.is_current) fail('Make another version current before deleting this one.');
                    f.versions = f.versions.filter((v) => v.id !== versionId);
                });
            },
            deleteFile(fileId) {
                run((d) => {
                    d.files = d.files.filter((f) => f.id !== fileId);
                });
            },
            setBookingStatus(bookingId, status) {
                run((d) => {
                    const b = d.bookings.find((x) => x.id === bookingId);
                    b.status = status;
                    if (status === 'confirmed' && !b.meeting_url) b.meeting_url = `https://meet.example.com/tt-${b.id}`;
                    notify(d, b.user_id, 'calendar', `Booking ${status}`, `Your ${serviceById(d, b.service_id).title} session was ${status}.`, '/dashboard/bookings');
                });
            },
            requestPayout() {
                run((d) => {
                    const p = myProvider(d);
                    const available = d.earnings.filter((e) => e.provider_id === p.id && e.status === 'available' && !e.payout_id);
                    const total = available.reduce((a, e) => a + e.net_minor, 0);
                    if (total < MINIMUM_PAYOUT_MINOR) fail(`Available balance is below the minimum payout of ${money(MINIMUM_PAYOUT_MINOR)}.`);
                    const id = nextId(d.payouts);
                    d.payouts.push({ id, provider_id: p.id, amount_minor: total, currency: 'MYR', status: 'requested', reference: null, requested_at: now(), processed_at: null });
                    available.forEach((e) => (e.payout_id = id));
                    audit(d, 'payout.requested', 'Payout', id, { amount_minor: total });
                });
            },

            /* -------------------------------------------------- Admin */
            approveProvider(providerId, notes) {
                run((d) => {
                    const p = d.providers.find((x) => x.id === providerId);
                    if (!['pending', 'suspended'].includes(p.status)) fail('Only pending or suspended providers can be approved.');
                    const reinstated = p.status === 'suspended';
                    Object.assign(p, { status: 'approved', approved_at: p.approved_at ?? now(), review_notes: notes || p.review_notes, reviewed_by: userId, suspended_at: null });
                    const account = userOf(d, p.user_id);
                    if (account.role === 'customer') account.role = 'provider';
                    notify(d, p.user_id, 'check-badge', 'Provider application approved', 'Your provider dashboard is now available. Create your first product.', '/provider');
                    audit(d, reinstated ? 'provider.reinstated' : 'provider.approved', 'Provider', p.id, notes ? { notes } : null);
                });
            },
            rejectProvider(providerId, notes) {
                run((d) => {
                    const p = d.providers.find((x) => x.id === providerId);
                    if (p.status !== 'pending') fail('Only pending applications can be rejected.');
                    if (!notes?.trim()) fail('Add notes to the applicant before rejecting.');
                    Object.assign(p, { status: 'rejected', rejected_at: now(), review_notes: notes, reviewed_by: userId });
                    notify(d, p.user_id, 'x-circle', 'Provider application not approved', notes, '/provider/apply');
                    audit(d, 'provider.rejected', 'Provider', p.id, { notes });
                });
            },
            suspendProvider(providerId) {
                run((d) => {
                    const p = d.providers.find((x) => x.id === providerId);
                    if (p.status !== 'approved') fail('Only approved providers can be suspended.');
                    Object.assign(p, { status: 'suspended', suspended_at: now() });
                    audit(d, 'provider.suspended', 'Provider', p.id);
                });
            },
            reinstateProvider(providerId) {
                run((d) => {
                    Object.assign(d.providers.find((x) => x.id === providerId), { status: 'approved', suspended_at: null });
                    audit(d, 'provider.reinstated', 'Provider', providerId);
                });
            },
            approveService(serviceId) {
                run((d) => {
                    const s = serviceById(d, serviceId);
                    if (d.providers.find((p) => p.id === s.provider_id).status !== 'approved') fail('The provider is not approved, so this service cannot be published.');
                    Object.assign(s, { status: 'published', published_at: s.published_at ?? now(), reviewed_by: userId, updated_at: now() });
                    notify(d, d.providers.find((p) => p.id === s.provider_id).user_id, 'check-badge', 'Product approved', `${s.title} is now published.`, '/provider/services');
                    audit(d, 'service.approved', 'Service', s.id);
                });
            },
            rejectService(serviceId, reason) {
                run((d) => {
                    if (!reason?.trim()) fail('Give a reason so the provider can fix the listing.');
                    const s = serviceById(d, serviceId);
                    Object.assign(s, { status: 'rejected', rejection_reason: reason, reviewed_by: userId, updated_at: now() });
                    notify(d, d.providers.find((p) => p.id === s.provider_id).user_id, 'x-circle', 'Product not approved', `${s.title}: ${reason}`, `/provider/services/${s.slug}/edit`);
                    audit(d, 'service.rejected', 'Service', s.id, { reason });
                });
            },
            suspendService(serviceId) {
                run((d) => {
                    Object.assign(serviceById(d, serviceId), { status: 'suspended', updated_at: now() });
                    audit(d, 'service.suspended', 'Service', serviceId);
                });
            },
            reinstateService(serviceId) {
                run((d) => {
                    Object.assign(serviceById(d, serviceId), { status: 'published', updated_at: now() });
                    audit(d, 'service.reinstated', 'Service', serviceId);
                });
            },
            toggleFeatured(serviceId) {
                run((d) => {
                    const s = serviceById(d, serviceId);
                    s.featured = !s.featured;
                });
            },
            toggleFileByAdmin(fileId) {
                run((d) => {
                    const f = d.files.find((x) => x.id === fileId);
                    f.is_active = !f.is_active;
                    audit(d, f.is_active ? 'file.shown' : 'file.hidden', 'ServiceFile', fileId);
                });
            },
            createCategory({ name, parent_id, description }) {
                run((d) => {
                    const id = nextId(d.categories);
                    d.categories.push({ id, name, slug: slugify(name), description: description || null, parent_id: parent_id ? Number(parent_id) : null, sort_order: 99, is_active: true });
                    audit(d, 'category.created', 'ServiceCategory', id, { name });
                });
            },
            toggleCategory(categoryId) {
                run((d) => {
                    const c = d.categories.find((x) => x.id === categoryId);
                    c.is_active = !c.is_active;
                    audit(d, c.is_active ? 'category.activated' : 'category.deactivated', 'ServiceCategory', c.id);
                });
            },
            suspendSubscription(subId) {
                run((d) => {
                    d.subscriptions.find((s) => s.id === subId).status = 'suspended';
                    audit(d, 'subscription.suspended', 'Subscription', subId);
                });
            },
            approvePayout(payoutId) {
                run((d) => {
                    const p = d.payouts.find((x) => x.id === payoutId);
                    if (p.status !== 'requested') fail(`This payout is already ${p.status}.`);
                    Object.assign(p, { status: 'approved' });
                    audit(d, 'payout.approved', 'Payout', p.id);
                });
            },
            rejectPayout(payoutId) {
                run((d) => {
                    const p = d.payouts.find((x) => x.id === payoutId);
                    Object.assign(p, { status: 'rejected', processed_at: now() });
                    d.earnings.forEach((e) => e.payout_id === p.id && (e.payout_id = null));
                    audit(d, 'payout.rejected', 'Payout', p.id);
                });
            },
            markPayoutPaid(payoutId, reference) {
                run((d) => {
                    if (!reference?.trim()) fail('Enter the bank transfer reference.');
                    const p = d.payouts.find((x) => x.id === payoutId);
                    Object.assign(p, { status: 'paid', reference, processed_at: now() });
                    d.earnings.forEach((e) => e.payout_id === p.id && (e.status = 'paid_out'));
                    notify(d, d.providers.find((x) => x.id === p.provider_id).user_id, 'banknotes', 'Payout paid', `Your payout was transferred. Reference ${reference}.`, '/provider/payouts');
                    audit(d, 'payout.paid', 'Payout', p.id, { reference });
                });
            },
            setReviewStatus(reviewId, status) {
                run((d) => {
                    d.reviews.find((r) => r.id === reviewId).status = status;
                    audit(d, `review.${status}`, 'Review', reviewId);
                });
            },
            hideContent(contentId) {
                run((d) => {
                    const c = d.contents.find((x) => x.id === contentId);
                    c.status = 'hidden';
                    audit(d, 'content.hidden', 'ServiceContent', c.id, { title: c.title });
                });
            },
            setUserStatus(targetId, status) {
                run((d) => {
                    if (targetId === userId) fail('You cannot suspend your own account.');
                    d.users.find((u) => u.id === targetId).status = status;
                    audit(d, status === 'suspended' ? 'user.suspended' : 'user.reactivated', 'User', targetId);
                });
            },
        };
    }, [db, userId, run]);

    const value = useMemo(() => ({ db, user, actions }), [db, user, actions]);
    return <StoreContext.Provider value={value}>{children}</StoreContext.Provider>;
}

export function useStore() {
    return useContext(StoreContext);
}


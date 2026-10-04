/* Route middleware: auth, can:access-provider, can:access-admin. */
import { Navigate, Outlet, useLocation } from 'react-router-dom';
import { canAccessAdmin, canAccessProvider } from '../data/queries';
import { useStore } from '../data/store';
import ErrorPage from '../pages/errors/ErrorPage';

export function RequireAuth() {
    const { user } = useStore();
    const location = useLocation();
    if (!user) return <Navigate to={`/login?redirect=${encodeURIComponent(location.pathname + location.search)}`} replace />;
    return <Outlet />;
}

export function RequireProvider() {
    const { db, user } = useStore();
    if (!canAccessProvider(db, user)) return <ErrorPage code={403} message="This area is for approved providers. Apply to become a provider first." action={{ href: '/provider/apply', label: 'Provider application' }} />;
    return <Outlet />;
}

export function RequireAdmin() {
    const { user } = useStore();
    if (!canAccessAdmin(user)) return <ErrorPage code={403} message="This area is for the platform team." />;
    return <Outlet />;
}

export function GuestOnly() {
    const { user } = useStore();
    const location = useLocation();
    const redirect = new URLSearchParams(location.search).get('redirect');
    if (user) return <Navigate to={redirect || '/dashboard'} replace />;
    return <Outlet />;
}

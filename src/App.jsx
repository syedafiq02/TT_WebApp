/*
 * Route table — mirrors routes/web.php and routes/settings.php.
 * Each area is code-split so the landing page stays light.
 */
import { lazy, Suspense } from 'react';
import { Route, Routes } from 'react-router-dom';
import { GuestOnly, RequireAdmin, RequireAuth, RequireProvider } from './components/Guards';
import { Spinner } from './components/ui';
import AppLayout from './layouts/AppLayout';
import AuthLayout from './layouts/AuthLayout';
import PublicLayout from './layouts/PublicLayout';
import ErrorPage from './pages/errors/ErrorPage';

const Landing = lazy(() => import('./pages/Landing'));

const CatalogIndex = lazy(() => import('./pages/catalog/Services'));
const CatalogShow = lazy(() => import('./pages/catalog/ServiceShow'));
const CatalogProviders = lazy(() => import('./pages/catalog/Providers'));
const CatalogProvider = lazy(() => import('./pages/catalog/ProviderShow'));

const Checkout = lazy(() => import('./pages/checkout/Checkout'));
const TestPayment = lazy(() => import('./pages/checkout/TestPayment'));
const OrderStatus = lazy(() => import('./pages/checkout/OrderStatus'));

const Login = lazy(() => import('./pages/auth/Login'));
const Register = lazy(() => import('./pages/auth/Register'));
const ForgotPassword = lazy(() => import('./pages/auth/ForgotPassword'));
const ResetPassword = lazy(() => import('./pages/auth/ResetPassword'));
const VerifyEmail = lazy(() => import('./pages/auth/VerifyEmail'));
const ConfirmPassword = lazy(() => import('./pages/auth/ConfirmPassword'));
const TwoFactorChallenge = lazy(() => import('./pages/auth/TwoFactorChallenge'));

const CustomerOverview = lazy(() => import('./pages/customer/Overview'));
const CustomerServices = lazy(() => import('./pages/customer/Services'));
const CustomerAccess = lazy(() => import('./pages/customer/Access'));
const CustomerSubscriptions = lazy(() => import('./pages/customer/Subscriptions'));
const CustomerLearning = lazy(() => import('./pages/customer/Learning'));
const CustomerBookings = lazy(() => import('./pages/customer/Bookings'));
const CustomerBilling = lazy(() => import('./pages/customer/Billing'));
const CustomerNotifications = lazy(() => import('./pages/customer/Notifications'));
const SettingsProfile = lazy(() => import('./pages/settings/Profile'));
const SettingsSecurity = lazy(() => import('./pages/settings/Security'));

const ProviderApply = lazy(() => import('./pages/provider/Apply'));
const ProviderOverview = lazy(() => import('./pages/provider/Overview'));
const ProviderServices = lazy(() => import('./pages/provider/Services'));
const ProviderServiceForm = lazy(() => import('./pages/provider/ServiceForm'));
const ProviderFiles = lazy(() => import('./pages/provider/Files'));
const ProviderCustomers = lazy(() => import('./pages/provider/Customers'));
const ProviderContent = lazy(() => import('./pages/provider/Content'));
const ProviderPlans = lazy(() => import('./pages/provider/Plans'));
const ProviderRevenue = lazy(() => import('./pages/provider/Revenue'));
const ProviderPayouts = lazy(() => import('./pages/provider/Payouts'));
const ProviderReviews = lazy(() => import('./pages/provider/Reviews'));
const ProviderProfile = lazy(() => import('./pages/provider/Profile'));

const AdminDashboard = lazy(() => import('./pages/admin/Dashboard'));
const AdminUsers = lazy(() => import('./pages/admin/Users'));
const AdminApplications = lazy(() => import('./pages/admin/Applications'));
const AdminProviders = lazy(() => import('./pages/admin/Providers'));
const AdminServices = lazy(() => import('./pages/admin/Services'));
const AdminServiceReview = lazy(() => import('./pages/admin/ServiceReview'));
const AdminCategories = lazy(() => import('./pages/admin/Categories'));
const AdminSubscriptions = lazy(() => import('./pages/admin/Subscriptions'));
const AdminOrders = lazy(() => import('./pages/admin/Orders'));
const AdminPayouts = lazy(() => import('./pages/admin/Payouts'));
const AdminReviews = lazy(() => import('./pages/admin/Reviews'));
const AdminModeration = lazy(() => import('./pages/admin/Moderation'));
const AdminSettings = lazy(() => import('./pages/admin/Settings'));
const AdminAuditLogs = lazy(() => import('./pages/admin/AuditLogs'));
const AdminAdvertising = lazy(() => import('./pages/admin/Advertising'));
const AdminAdvertisingCampaign = lazy(() => import('./pages/admin/AdvertisingCampaign'));

const Advertise = lazy(() => import('./pages/advertising/Advertise'));
const AdApply = lazy(() => import('./pages/advertising/AdApply'));
const AdDashboard = lazy(() => import('./pages/advertising/AdDashboard'));
const AdCampaignDetail = lazy(() => import('./pages/advertising/AdCampaignDetail'));

function Loading() {
    return (
        <div className="grid min-h-[50vh] place-items-center text-brand" role="status" aria-label="Loading">
            <Spinner className="size-6" />
        </div>
    );
}

export default function App() {
    return (
        <Suspense fallback={<Loading />}>
            <Routes>
                <Route path="/" element={<Landing />} />

                {/* Public */}
                <Route element={<PublicLayout />}>
                    <Route path="services" element={<CatalogIndex />} />
                    <Route path="services/:slug" element={<CatalogShow />} />
                    <Route path="providers" element={<CatalogProviders />} />
                    <Route path="providers/:slug" element={<CatalogProvider />} />
                    <Route path="advertise" element={<Advertise />} />
                    <Route element={<RequireAuth />}>
                        <Route path="checkout/:planId" element={<Checkout />} />
                        <Route path="payments/test/:planId" element={<TestPayment />} />
                        <Route path="orders/:reference" element={<OrderStatus />} />
                    </Route>
                </Route>

                {/* Auth (Fortify views) */}
                <Route element={<AuthLayout />}>
                    <Route element={<GuestOnly />}>
                        <Route path="login" element={<Login />} />
                        <Route path="register" element={<Register />} />
                        <Route path="forgot-password" element={<ForgotPassword />} />
                        <Route path="reset-password" element={<ResetPassword />} />
                        <Route path="two-factor-challenge" element={<TwoFactorChallenge />} />
                    </Route>
                    <Route path="email/verify" element={<VerifyEmail />} />
                    <Route path="user/confirm-password" element={<ConfirmPassword />} />
                </Route>

                <Route element={<RequireAuth />}>
                    {/* Customer dashboard + account settings */}
                    <Route element={<AppLayout area="customer" />}>
                        <Route path="dashboard" element={<CustomerOverview />} />
                        <Route path="dashboard/services" element={<CustomerServices />} />
                        <Route path="dashboard/services/:slug" element={<CustomerAccess />} />
                        <Route path="dashboard/subscriptions" element={<CustomerSubscriptions />} />
                        <Route path="dashboard/learning" element={<CustomerLearning />} />
                        <Route path="dashboard/bookings" element={<CustomerBookings />} />
                        <Route path="dashboard/billing" element={<CustomerBilling />} />
                        <Route path="dashboard/notifications" element={<CustomerNotifications />} />
                        <Route path="settings" element={<SettingsProfile />} />
                        <Route path="settings/profile" element={<SettingsProfile />} />
                        <Route path="settings/security" element={<SettingsSecurity />} />
                        <Route path="provider/apply" element={<ProviderApply />} />
                        <Route path="advertise/apply" element={<AdApply />} />
                        <Route path="dashboard/advertising" element={<AdDashboard />} />
                        <Route path="dashboard/advertising/:reference" element={<AdCampaignDetail />} />
                    </Route>

                    {/* Provider dashboard */}
                    <Route element={<RequireProvider />}>
                        <Route element={<AppLayout area="provider" />}>
                            <Route path="provider" element={<ProviderOverview />} />
                            <Route path="provider/services" element={<ProviderServices />} />
                            <Route path="provider/services/create" element={<ProviderServiceForm />} />
                            <Route path="provider/services/:slug/edit" element={<ProviderServiceForm />} />
                            <Route path="provider/files" element={<ProviderFiles />} />
                            <Route path="provider/customers" element={<ProviderCustomers />} />
                            <Route path="provider/content" element={<ProviderContent />} />
                            <Route path="provider/plans" element={<ProviderPlans />} />
                            <Route path="provider/revenue" element={<ProviderRevenue />} />
                            <Route path="provider/payouts" element={<ProviderPayouts />} />
                            <Route path="provider/reviews" element={<ProviderReviews />} />
                            <Route path="provider/profile" element={<ProviderProfile />} />
                        </Route>
                    </Route>

                    {/* Admin console */}
                    <Route element={<RequireAdmin />}>
                        <Route element={<AppLayout area="admin" />}>
                            <Route path="admin" element={<AdminDashboard />} />
                            <Route path="admin/users" element={<AdminUsers />} />
                            <Route path="admin/provider-applications" element={<AdminApplications />} />
                            <Route path="admin/providers" element={<AdminProviders />} />
                            <Route path="admin/services" element={<AdminServices />} />
                            <Route path="admin/services/:slug" element={<AdminServiceReview />} />
                            <Route path="admin/categories" element={<AdminCategories />} />
                            <Route path="admin/subscriptions" element={<AdminSubscriptions />} />
                            <Route path="admin/orders" element={<AdminOrders />} />
                            <Route path="admin/payouts" element={<AdminPayouts />} />
                            <Route path="admin/reviews" element={<AdminReviews />} />
                            <Route path="admin/moderation" element={<AdminModeration />} />
                            <Route path="admin/settings" element={<AdminSettings />} />
                            <Route path="admin/audit-logs" element={<AdminAuditLogs />} />
                            <Route path="admin/advertising" element={<AdminAdvertising />} />
                            <Route path="admin/advertising/:reference" element={<AdminAdvertisingCampaign />} />
                        </Route>
                    </Route>
                </Route>

                <Route path="*" element={<ErrorPage code={404} />} />
            </Routes>
        </Suspense>
    );
}

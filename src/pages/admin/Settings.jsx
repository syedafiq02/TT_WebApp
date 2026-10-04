/* pages/admin/settings.blade.php — read-only platform configuration */
import { PageHeader } from '../../components/ui';
import { useStore } from '../../data/store';
import { useTitle } from '../../hooks/useTitle';
import { CURRENCY, EARNING_HOLD_DAYS, MINIMUM_PAYOUT_MINOR, money, PLATFORM_FEE_BPS } from '../../utils/format';

export default function Settings() {
    useTitle('Settings');
    const { db } = useStore();
    const settings = {
        Currency: CURRENCY,
        'Platform fee': `${PLATFORM_FEE_BPS / 100}%`,
        'Earning holding period': `${EARNING_HOLD_DAYS} days`,
        'Minimum payout': money(MINIMUM_PAYOUT_MINOR),
        'Payment gateway': db.settings.gateway,
        Environment: db.settings.environment,
    };

    return (
        <div>
            <PageHeader title="Settings" description="Platform configuration. Values come from config/terpaling.php and environment variables; editing them in the console is planned for a later phase." />
            <div className="tt-card max-w-2xl">
                {Object.entries(settings).map(([label, value]) => (
                    <div key={label} className="flex items-center justify-between border-b border-zinc-100 px-6 py-3.5 text-sm last:border-0">
                        <span className="text-zinc-600">{label}</span>
                        <span className="tabular-nums">{value}</span>
                    </div>
                ))}
            </div>
        </div>
    );
}

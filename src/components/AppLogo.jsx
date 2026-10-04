/*
 * x-app-logo / x-app-logo-icon. The "TT" mark is the temporary placeholder
 * from the Laravel app; replace the inner <span> with an <img> when the final
 * logo is ready.
 */
import { Link } from 'react-router-dom';
import { cx } from '../utils/format';

export function AppLogoIcon({ className }) {
    return (
        <span aria-hidden="true" className={cx('inline-flex items-center justify-center rounded-lg bg-brand font-display leading-none font-bold tracking-tight text-white shadow-[inset_0_-1px_0_rgb(0_0_0/0.12)]', className)}>
            <span className="px-1 text-[0.8em]">TT</span>
        </span>
    );
}

export function AppLogo({ to = '/', className, hideTextOnMobile = false, onClick }) {
    return (
        <Link to={to} onClick={onClick} className={cx('flex items-center gap-2.5 px-1', className)}>
            <AppLogoIcon className="h-8 min-w-8 text-sm" />
            <span className={cx('grid leading-none', hideTextOnMobile && 'max-sm:hidden')}>
                <span className="text-[13.5px] font-bold tracking-[0.08em] text-zinc-900 uppercase">Terpaling Trader</span>
                <span className="mt-1 text-[11px] font-medium text-zinc-500">Trading services platform</span>
            </span>
        </Link>
    );
}

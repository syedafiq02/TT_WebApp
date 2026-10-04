/*
 * x-app-logo / x-app-logo-icon. The Terpaling Trader logo is white on
 * transparent, so it sits on a brand-coloured tile.
 */
import { Link } from 'react-router-dom';
import logo from '../assets/logo.png';
import { cx } from '../utils/format';

export function AppLogoIcon({ className }) {
    return (
        <span aria-hidden="true" className={cx('inline-flex shrink-0 items-center justify-center rounded-lg bg-brand shadow-[inset_0_-1px_0_rgb(0_0_0/0.12)]', className)}>
            <img src={logo} alt="" draggable="false" className="h-auto w-3/4" />
        </span>
    );
}

export function AppLogo({ to = '/', className, hideTextOnMobile = false, onClick }) {
    return (
        <Link to={to} onClick={onClick} className={cx('flex items-center gap-2.5 px-1', className)}>
            <AppLogoIcon className="size-8" />
            <span className={cx('grid leading-none', hideTextOnMobile && 'max-sm:hidden')}>
                <span className="text-[13.5px] font-bold tracking-[0.08em] text-zinc-900 uppercase">Terpaling Trader</span>
                <span className="mt-1 text-[11px] font-medium text-zinc-500">Trading services platform</span>
            </span>
        </Link>
    );
}

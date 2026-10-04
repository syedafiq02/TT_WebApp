/* x-desktop-user-menu, plus two demo-only items for the static build. */
import { useNavigate } from 'react-router-dom';
import { useStore } from '../data/store';
import { usePwa } from '../pwa';
import { userInitials } from '../utils/format';
import { useFeedback } from './Feedback';
import { Dropdown, Icon, MenuItem, MenuSeparator } from './ui';

export function UserMenu() {
    const { user, actions } = useStore();
    const { confirm, toast } = useFeedback();
    const navigate = useNavigate();
    const { installMethod, install } = usePwa();
    const ini = userInitials(user.name);

    return (
        <Dropdown
            className="min-w-60"
            trigger={({ toggle, open }) => (
                <button type="button" onClick={toggle} aria-expanded={open} className="flex cursor-pointer items-center gap-2.5 rounded-lg p-1 pe-2 text-start transition-colors hover:bg-zinc-100">
                    <span className="grid size-8 shrink-0 place-items-center rounded-full bg-brand-soft text-xs font-semibold text-brand">{ini}</span>
                    <span className="hidden min-w-0 leading-tight sm:grid">
                        <span className="max-w-40 truncate text-sm font-medium text-zinc-900">{user.name}</span>
                    </span>
                    <Icon name="chevron-down" variant="micro" className="hidden text-zinc-400 sm:block" />
                </button>
            )}
        >
            <div className="flex items-center gap-2.5 px-2 py-2 text-start text-sm">
                <span className="grid size-9 shrink-0 place-items-center rounded-full bg-brand-soft text-xs font-semibold text-brand">{ini}</span>
                <div className="grid min-w-0 flex-1 leading-tight">
                    <span className="truncate font-medium text-zinc-900">{user.name}</span>
                    <span className="truncate text-xs text-zinc-500">{user.email}</span>
                </div>
            </div>
            <MenuSeparator />
            <MenuItem href="/dashboard" icon="home">
                My trading hub
            </MenuItem>
            <MenuItem href="/settings/profile" icon="cog-6-tooth">
                Settings
            </MenuItem>
            {installMethod && (
                <MenuItem icon="arrow-down-tray" onClick={install}>
                    Install Terpaling Trader
                </MenuItem>
            )}
            <MenuSeparator />
            <MenuItem
                icon="arrow-path"
                onClick={() => {
                    actions.logout();
                    navigate('/login');
                }}
            >
                Switch demo account
            </MenuItem>
            <MenuItem
                icon="arrow-uturn-left"
                onClick={async () => {
                    if (await confirm('Restore all demo data to its original state? Changes you made in this browser will be lost.', { confirmLabel: 'Reset demo data' })) {
                        actions.resetDemo();
                        toast('Demo data restored.');
                    }
                }}
            >
                Reset demo data
            </MenuItem>
            <MenuSeparator />
            <MenuItem
                icon="arrow-right-start-on-rectangle"
                danger
                onClick={() => {
                    actions.logout();
                    navigate('/');
                }}
            >
                Log out
            </MenuItem>
        </Dropdown>
    );
}

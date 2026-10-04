/*
 * PWA interface: the "Install Terpaling Trader" instructions for browsers
 * without an install prompt (iOS, macOS Safari) and the "new version"
 * notice. Mounted once in main.jsx; the install entry points themselves are
 * in UserMenu, PublicLayout and the landing footer.
 */
import { Button, Icon, Modal } from '../components/ui';
import { usePwa } from '.';

const GUIDES = {
    ios: {
        intro: 'Add Terpaling Trader to your Home Screen to open it like an app, full screen and without the browser toolbar.',
        steps: [
            <>
                In Safari, tap the <b className="font-semibold text-zinc-900">Share</b> button <ShareIcon /> in the toolbar (at the top on iPad).
            </>,
            <>
                Scroll down and tap <b className="font-semibold text-zinc-900">Add to Home Screen</b>.
            </>,
            <>
                Tap <b className="font-semibold text-zinc-900">Add</b>, then open Terpaling Trader from your Home Screen.
            </>,
        ],
        note: 'Using another browser? Open this page in Safari, or look for Add to Home Screen in that browser’s share menu.',
    },
    'macos-safari': {
        intro: 'Add Terpaling Trader to your Dock to open it in its own window, like an app.',
        steps: [
            <>
                In the menu bar, choose <b className="font-semibold text-zinc-900">File → Add to Dock</b>.
            </>,
            <>
                Click <b className="font-semibold text-zinc-900">Add</b>, then open Terpaling Trader from the Dock or Launchpad.
            </>,
        ],
    },
};

export function PwaUi() {
    const { guide, closeGuide, updateReady, dismissUpdate, reload } = usePwa();
    const g = GUIDES[guide];

    return (
        <>
            <Modal open={!!g} onClose={closeGuide} className="max-w-md" labelledBy="tt-install-title">
                {g && (
                    <div className="grid gap-5">
                        <div className="grid gap-2 pr-6">
                            <h2 id="tt-install-title" className="text-base font-semibold text-zinc-900">
                                Install Terpaling Trader
                            </h2>
                            <p className="text-sm text-zinc-600">{g.intro}</p>
                        </div>
                        <ol className="grid gap-3">
                            {g.steps.map((step, i) => (
                                <li key={i} className="flex gap-3 text-sm text-zinc-700">
                                    <span className="grid size-6 shrink-0 place-items-center rounded-full bg-brand-soft text-xs font-semibold text-brand">{i + 1}</span>
                                    <span className="pt-0.5">{step}</span>
                                </li>
                            ))}
                        </ol>
                        {g.note && <p className="text-xs text-zinc-500">{g.note}</p>}
                        <div className="flex justify-end">
                            <Button onClick={closeGuide}>Done</Button>
                        </div>
                    </div>
                )}
            </Modal>

            {updateReady && (
                <div className="pointer-events-none fixed inset-x-4 top-[calc(4.5rem+env(safe-area-inset-top))] z-[65] mx-auto grid max-w-md" aria-live="polite">
                    <div role="status" className="tt-anim-pop pointer-events-auto flex items-center gap-3 rounded-xl border border-zinc-200 bg-white p-3 ps-4 text-sm font-medium text-zinc-800 shadow-lg">
                        <Icon name="arrow-path" variant="mini" className="shrink-0 text-brand" />
                        <span className="flex-1">A new version of Terpaling Trader is available.</span>
                        <Button size="sm" variant="primary" onClick={reload}>
                            Refresh
                        </Button>
                        <button className="cursor-pointer text-zinc-400 hover:text-zinc-700" onClick={dismissUpdate} aria-label="Dismiss">
                            <Icon name="x-mark" variant="micro" />
                        </button>
                    </div>
                </div>
            )}
        </>
    );
}

/* Renders nothing unless this browser can install the app and it is not installed yet. */
export function InstallAppButton({ className, children = 'Install app' }) {
    const { installMethod, install } = usePwa();
    if (!installMethod) return null;
    return (
        <button type="button" onClick={install} className={className}>
            {children}
        </button>
    );
}

// iOS Share glyph (Heroicons arrow-up-on-square), inline so the steps match what Safari shows.
function ShareIcon() {
    return (
        <svg className="inline size-4 -translate-y-px align-middle text-brand" fill="none" viewBox="0 0 24 24" strokeWidth={1.8} stroke="currentColor" aria-label="Share">
            <path strokeLinecap="round" strokeLinejoin="round" d="M9 8.25H7.5a2.25 2.25 0 0 0-2.25 2.25v9a2.25 2.25 0 0 0 2.25 2.25h9a2.25 2.25 0 0 0 2.25-2.25v-9a2.25 2.25 0 0 0-2.25-2.25H15m0-3-3-3m0 0-3 3m3-3V15" />
        </svg>
    );
}

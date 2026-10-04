/*
 * Flux::toast() and wire:confirm replacements: a toast stack and a promise-
 * based confirm dialog, both available through hooks.
 */
import { createContext, useCallback, useContext, useRef, useState } from 'react';
import { Button, Icon, Modal } from './ui';

const FeedbackContext = createContext(null);

export function FeedbackProvider({ children }) {
    const [toasts, setToasts] = useState([]);
    const [dialog, setDialog] = useState(null);
    const seq = useRef(0);

    const toast = useCallback((text, variant = 'success') => {
        const id = ++seq.current;
        setToasts((t) => [...t.slice(-2), { id, text, variant }]);
        setTimeout(() => setToasts((t) => t.filter((x) => x.id !== id)), 4000);
    }, []);

    const confirm = useCallback(
        (message, { confirmLabel = 'Confirm', danger = false } = {}) =>
            new Promise((resolve) => setDialog({ message, confirmLabel, danger, resolve })),
        [],
    );

    const close = (result) => {
        dialog?.resolve(result);
        setDialog(null);
    };

    return (
        <FeedbackContext.Provider value={{ toast, confirm }}>
            {children}

            <div className="pointer-events-none fixed right-4 bottom-[max(1rem,env(safe-area-inset-bottom))] z-[70] grid w-[min(24rem,calc(100vw-2rem))] gap-2 max-sm:bottom-24" aria-live="polite">
                {toasts.map((t) => (
                    <div key={t.id} role="status" className="tt-anim-pop pointer-events-auto flex items-start gap-3 rounded-xl border border-zinc-200 bg-white p-4 text-sm font-medium text-zinc-800 shadow-lg">
                        <Icon
                            name={t.variant === 'danger' ? 'x-circle' : t.variant === 'warning' ? 'exclamation-triangle' : 'check-circle'}
                            variant="mini"
                            className={t.variant === 'danger' ? 'text-red-500' : t.variant === 'warning' ? 'text-amber-500' : 'text-green-600'}
                        />
                        <span className="flex-1">{t.text}</span>
                        <button className="cursor-pointer text-zinc-400 hover:text-zinc-700" onClick={() => setToasts((all) => all.filter((x) => x.id !== t.id))} aria-label="Dismiss">
                            <Icon name="x-mark" variant="micro" />
                        </button>
                    </div>
                ))}
            </div>

            <Modal open={!!dialog} onClose={() => close(false)} className="max-w-md">
                <div className="grid gap-6">
                    <div className="grid gap-2 pr-6">
                        <h2 className="text-base font-semibold text-zinc-900">Are you sure?</h2>
                        <p className="text-sm text-zinc-600">{dialog?.message}</p>
                    </div>
                    <div className="flex justify-end gap-2">
                        <Button onClick={() => close(false)}>Cancel</Button>
                        <Button variant={dialog?.danger ? 'danger' : 'primary'} onClick={() => close(true)}>
                            {dialog?.confirmLabel}
                        </Button>
                    </div>
                </div>
            </Modal>
        </FeedbackContext.Provider>
    );
}

export function useFeedback() {
    return useContext(FeedbackContext);
}

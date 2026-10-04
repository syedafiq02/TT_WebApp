/*
 * pages/settings/security.blade.php + two-factor-setup-modal + recovery-codes
 * + passkeys. Behind password.confirm, like the Laravel route.
 */
import { useMemo, useState } from 'react';
import { Navigate } from 'react-router-dom';
import { useFeedback } from '../../components/Feedback';
import { Badge, Button, Icon, Input, Modal } from '../../components/ui';
import { useStore } from '../../data/store';
import { useTitle } from '../../hooks/useTitle';
import { diffForHumans } from '../../utils/format';
import SettingsShell from './SettingsShell';

const CONFIRM_TTL = 3 * 60 * 60 * 1000;

function passwordConfirmed() {
    try {
        return Date.now() - Number(sessionStorage.getItem('tt-password-confirmed') ?? 0) < CONFIRM_TTL;
    } catch {
        return true;
    }
}

const randomCode = () => `${Math.random().toString(36).slice(2, 7)}-${Math.random().toString(36).slice(2, 7)}`.toUpperCase();
const SETUP_KEY = 'JBSW Y3DP EHPK 3PXP';

/** Decorative QR-style grid (no real secret in a static build). */
function FakeQr() {
    const cells = useMemo(() => Array.from({ length: 21 * 21 }, (_, i) => ((i * 7919) % 13) % 3 === 0), []);
    const finder = (r, c) => [
        [0, 0],
        [0, 14],
        [14, 0],
    ].some(([y, x]) => r >= y && r < y + 7 && c >= x && c < x + 7 && (r === y || r === y + 6 || c === x || c === x + 6 || (r > y + 1 && r < y + 5 && c > x + 1 && c < x + 5)));
    return (
        <svg viewBox="0 0 21 21" className="size-44" shapeRendering="crispEdges" aria-label="QR code for your authenticator app">
            {cells.map((on, i) => {
                const r = Math.floor(i / 21);
                const c = i % 21;
                const inFinderZone = (r < 8 && c < 8) || (r < 8 && c > 12) || (r > 12 && c < 8);
                return (inFinderZone ? finder(r, c) : on) ? <rect key={i} x={c} y={r} width="1" height="1" fill="#0f172a" /> : null;
            })}
        </svg>
    );
}

export default function Security() {
    useTitle('Security settings');
    const { db, user, actions } = useStore();
    const { toast } = useFeedback();
    const security = db.security[user.id] ?? {};
    const [pw, setPw] = useState({ current: '', password: '', confirm: '' });
    const [pwError, setPwError] = useState({});
    const [setupOpen, setSetupOpen] = useState(false);
    const [verifyStep, setVerifyStep] = useState(false);
    const [code, setCode] = useState('');
    const [copied, setCopied] = useState(false);
    const [codes, setCodes] = useState(() => Array.from({ length: 8 }, randomCode));
    const [showCodes, setShowCodes] = useState(false);
    const [addingPasskey, setAddingPasskey] = useState(false);
    const [passkeyName, setPasskeyName] = useState('Chrome on Windows');
    const [deletingPasskey, setDeletingPasskey] = useState(null);

    if (!passwordConfirmed()) return <Navigate to="/user/confirm-password?redirect=/settings/security" replace />;

    const passkeys = security.passkeys ?? [];

    const savePassword = (e) => {
        e.preventDefault();
        const errs = {};
        if (!pw.current) errs.current = 'The current password field is required.';
        if (pw.password.length < 8) errs.password = 'The password field must be at least 8 characters.';
        else if (pw.password !== pw.confirm) errs.password = 'The password field confirmation does not match.';
        setPwError(errs);
        if (Object.keys(errs).length) return;
        setPw({ current: '', password: '', confirm: '' });
        toast('Password updated.');
    };

    const closeSetup = () => {
        setSetupOpen(false);
        setVerifyStep(false);
        setCode('');
    };

    return (
        <SettingsShell heading="Update password" subheading="Ensure your account is using a long, random password to stay secure">
            <form onSubmit={savePassword} className="mt-6 space-y-6" noValidate>
                <Input label="Current password" required autoComplete="current-password" viewable value={pw.current} onChange={(e) => setPw({ ...pw, current: e.target.value })} error={pwError.current} />
                <Input label="New password" required autoComplete="new-password" viewable value={pw.password} onChange={(e) => setPw({ ...pw, password: e.target.value })} error={pwError.password} />
                <Input label="Confirm password" required autoComplete="new-password" viewable value={pw.confirm} onChange={(e) => setPw({ ...pw, confirm: e.target.value })} />
                <div className="flex items-center gap-4">
                    <Button variant="primary" type="submit">
                        Save
                    </Button>
                </div>
            </form>

            {/* Two-factor authentication */}
            <section className="mt-10 border-t border-zinc-200 pt-8">
                <h3 className="text-base font-medium text-zinc-800">Two-factor authentication</h3>
                <p className="text-sm text-zinc-500">Manage your two-factor authentication settings</p>

                <div className="mt-6 flex w-full flex-col space-y-6 text-sm">
                    {security.twoFactor ? (
                        <div className="space-y-4">
                            <p className="text-zinc-600">You will be prompted for a secure, random pin during login, which you can retrieve from the TOTP-supported application on your phone.</p>
                            <div className="flex justify-start">
                                <Button variant="danger" onClick={() => actions.setTwoFactor(false)}>
                                    Disable 2FA
                                </Button>
                            </div>

                            <div className="rounded-xl border border-zinc-200 shadow-xs">
                                <div className="space-y-2 p-5">
                                    <div className="flex items-center gap-2">
                                        <Icon name="lock-closed" variant="mini" className="text-zinc-500" />
                                        <h4 className="font-medium text-zinc-800">2FA recovery codes</h4>
                                    </div>
                                    <p className="text-zinc-500">Recovery codes let you regain access if you lose your 2FA device. Store them in a secure password manager.</p>
                                </div>
                                <div className="px-5 pb-5">
                                    <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                                        <Button variant="primary" icon={showCodes ? 'eye-slash' : 'eye'} onClick={() => setShowCodes((s) => !s)}>
                                            {showCodes ? 'Hide recovery codes' : 'View recovery codes'}
                                        </Button>
                                        {showCodes && (
                                            <Button
                                                icon="arrow-path"
                                                onClick={() => {
                                                    setCodes(Array.from({ length: 8 }, randomCode));
                                                    toast('Recovery codes regenerated.');
                                                }}
                                            >
                                                Regenerate codes
                                            </Button>
                                        )}
                                    </div>
                                    {showCodes && (
                                        <div className="mt-3 space-y-3">
                                            <div className="grid gap-1 rounded-lg bg-zinc-100 p-4 font-mono text-sm">
                                                {codes.map((c) => (
                                                    <div key={c} className="select-text">
                                                        {c}
                                                    </div>
                                                ))}
                                            </div>
                                            <p className="text-xs text-zinc-500">Each recovery code can be used once to access your account and will be removed after use. If you need more, click Regenerate codes above.</p>
                                        </div>
                                    )}
                                </div>
                            </div>
                        </div>
                    ) : (
                        <div className="space-y-4">
                            <p className="text-zinc-500">When you enable two-factor authentication, you will be prompted for a secure pin during login. This pin can be retrieved from a TOTP-supported application on your phone.</p>
                            <Button variant="primary" onClick={() => setSetupOpen(true)}>
                                Enable 2FA
                            </Button>
                        </div>
                    )}
                </div>
            </section>

            {/* Passkeys */}
            <section className="mt-10 border-t border-zinc-200 pt-8">
                <h3 className="text-base font-medium text-zinc-800">Passkeys</h3>
                <p className="text-sm text-zinc-500">Manage your passkeys for passwordless sign-in</p>

                <div className="mt-6 flex w-full flex-col space-y-6 text-sm">
                    <div className="overflow-hidden rounded-lg border border-zinc-200">
                        {passkeys.length === 0 ? (
                            <div className="p-8 text-center">
                                <div className="mx-auto mb-4 flex size-14 items-center justify-center rounded-2xl bg-zinc-100">
                                    <Icon name="key" className="size-7 text-zinc-400" />
                                </div>
                                <p className="font-medium">No passkeys yet</p>
                                <p className="mt-1 text-zinc-500">Add a passkey to sign in without a password</p>
                            </div>
                        ) : (
                            passkeys.map((p, i) => (
                                <div key={p.id} className={`flex items-center justify-between p-4 ${i < passkeys.length - 1 ? 'border-b border-zinc-200' : ''}`}>
                                    <div className="flex items-center gap-4">
                                        <div className="flex size-10 shrink-0 items-center justify-center rounded-xl bg-zinc-100">
                                            <Icon name="key" className="size-5 text-zinc-500" />
                                        </div>
                                        <div className="space-y-1">
                                            <div className="flex items-center gap-2.5">
                                                <p className="font-medium tracking-tight">{p.name}</p>
                                                <Badge size="sm">Platform authenticator</Badge>
                                            </div>
                                            <p className="text-xs text-zinc-500">Added {diffForHumans(p.created_at)}</p>
                                        </div>
                                    </div>
                                    <Button variant="ghost" size="sm" icon="trash" className="text-red-500 hover:bg-red-50 hover:text-red-600" aria-label="Remove passkey" onClick={() => setDeletingPasskey(p)} />
                                </div>
                            ))
                        )}
                    </div>

                    {addingPasskey ? (
                        <div className="space-y-4 rounded-lg border border-zinc-200 bg-zinc-50 p-4">
                            <Input label="Passkey name" placeholder="e.g., MacBook Pro, iPhone" value={passkeyName} onChange={(e) => setPasskeyName(e.target.value)} autoFocus />
                            <p className="-mt-2 text-sm text-zinc-500">Give this passkey a name to help you identify it later.</p>
                            <div className="flex gap-2">
                                <Button
                                    variant="primary"
                                    disabled={!passkeyName.trim()}
                                    onClick={() => {
                                        actions.setPasskeys([...passkeys, { id: Date.now(), name: passkeyName.trim(), created_at: new Date().toISOString() }]);
                                        setAddingPasskey(false);
                                        toast('Passkey registered.');
                                    }}
                                >
                                    Register passkey
                                </Button>
                                <Button variant="ghost" onClick={() => setAddingPasskey(false)}>
                                    Cancel
                                </Button>
                            </div>
                        </div>
                    ) : (
                        <div>
                            <Button variant="primary" icon="plus" onClick={() => setAddingPasskey(true)}>
                                Add passkey
                            </Button>
                        </div>
                    )}
                </div>
            </section>

            {/* 2FA setup modal */}
            <Modal open={setupOpen} onClose={closeSetup} className="max-w-md">
                <div className="space-y-6">
                    <div className="flex flex-col items-center space-y-4">
                        <div className="w-auto rounded-full border border-zinc-100 bg-white p-0.5 shadow-sm">
                            <div className="rounded-full border border-zinc-200 bg-zinc-100 p-2.5">
                                <Icon name="qr-code" />
                            </div>
                        </div>
                        <div className="space-y-2 text-center">
                            <h2 className="text-lg font-semibold text-zinc-900">{verifyStep ? 'Verify authentication code' : 'Enable two-factor authentication'}</h2>
                            <p className="text-sm text-zinc-500">{verifyStep ? 'Enter the 6-digit code from your authenticator app.' : 'To finish enabling two-factor authentication, scan the QR code or enter the setup key in your authenticator app.'}</p>
                        </div>
                    </div>

                    {verifyStep ? (
                        <div className="space-y-6">
                            <Input label="OTP Code" inputMode="numeric" maxLength={6} autoFocus value={code} onChange={(e) => setCode(e.target.value.replace(/\D/g, ''))} className="[&_input]:text-center [&_input]:text-lg [&_input]:tracking-[0.6em]" />
                            <div className="flex items-center space-x-3">
                                <Button className="flex-1" onClick={() => setVerifyStep(false)}>
                                    Back
                                </Button>
                                <Button
                                    variant="primary"
                                    className="flex-1"
                                    disabled={code.length < 6}
                                    onClick={() => {
                                        actions.setTwoFactor(true);
                                        closeSetup();
                                        toast('Two-factor authentication enabled.');
                                    }}
                                >
                                    Confirm
                                </Button>
                            </div>
                        </div>
                    ) : (
                        <>
                            <div className="flex justify-center">
                                <div className="grid aspect-square w-64 place-items-center overflow-hidden rounded-lg border border-zinc-200 bg-white p-4">
                                    <FakeQr />
                                </div>
                            </div>
                            <Button variant="primary" className="w-full" onClick={() => setVerifyStep(true)}>
                                Continue
                            </Button>
                            <div className="space-y-4">
                                <div className="relative flex w-full items-center justify-center">
                                    <div className="absolute inset-0 top-1/2 h-px w-full bg-zinc-200" />
                                    <span className="relative bg-white px-2 text-sm text-zinc-600">or, enter the code manually</span>
                                </div>
                                <div className="flex w-full items-stretch rounded-xl border border-zinc-200">
                                    <input type="text" readOnly value={SETUP_KEY} className="w-full bg-transparent p-3 text-zinc-900 outline-none" />
                                    <button
                                        className="cursor-pointer border-l border-zinc-200 px-3 transition-colors"
                                        aria-label="Copy setup key"
                                        onClick={() => {
                                            navigator.clipboard?.writeText(SETUP_KEY.replace(/\s/g, '')).catch(() => {});
                                            setCopied(true);
                                            setTimeout(() => setCopied(false), 1500);
                                        }}
                                    >
                                        <Icon name={copied ? 'check' : 'document-duplicate'} className={copied ? 'size-5 text-green-500' : 'size-5'} />
                                    </button>
                                </div>
                            </div>
                        </>
                    )}
                </div>
            </Modal>

            {/* Remove passkey modal */}
            <Modal open={!!deletingPasskey} onClose={() => setDeletingPasskey(null)} className="max-w-md">
                <div className="space-y-6">
                    <div className="space-y-2 pr-6">
                        <h2 className="text-lg font-semibold text-zinc-900">Remove passkey</h2>
                        <p className="text-sm text-zinc-500">Are you sure you want to remove the passkey &quot;{deletingPasskey?.name}&quot;? You will no longer be able to use it to sign in.</p>
                    </div>
                    <div className="flex justify-end gap-3">
                        <Button onClick={() => setDeletingPasskey(null)}>Cancel</Button>
                        <Button
                            variant="danger"
                            onClick={() => {
                                actions.setPasskeys(passkeys.filter((p) => p.id !== deletingPasskey.id));
                                setDeletingPasskey(null);
                                toast('Passkey removed.');
                            }}
                        >
                            Remove passkey
                        </Button>
                    </div>
                </div>
            </Modal>
        </SettingsShell>
    );
}

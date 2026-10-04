/* pages/auth/two-factor-challenge.blade.php */
import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Button, Input } from '../../components/ui';
import { useTitle } from '../../hooks/useTitle';
import { AuthHeader } from '../../layouts/AuthLayout';

export default function TwoFactorChallenge() {
    useTitle('Two-factor authentication');
    const navigate = useNavigate();
    const [recovery, setRecovery] = useState(false);

    return (
        <div className="flex flex-col gap-6">
            <AuthHeader
                title={recovery ? 'Recovery code' : 'Authentication code'}
                description={recovery ? 'Please confirm access to your account by entering one of your emergency recovery codes.' : 'Enter the authentication code provided by your authenticator application.'}
            />
            <form
                className="flex flex-col gap-6"
                onSubmit={(e) => {
                    e.preventDefault();
                    navigate('/login');
                }}
            >
                {recovery ? (
                    <Input label="Recovery code" autoFocus autoComplete="one-time-code" />
                ) : (
                    <Input label="OTP code" inputMode="numeric" maxLength={6} autoFocus autoComplete="one-time-code" placeholder="123456" className="[&_input]:text-center [&_input]:tracking-[0.5em]" />
                )}
                <Button variant="primary" type="submit" className="w-full">
                    Continue
                </Button>
            </form>
            <div className="space-x-1 text-center text-sm text-zinc-500">
                <span>or you can</span>
                <button className="cursor-pointer font-medium text-brand underline-offset-4 hover:underline" onClick={() => setRecovery((r) => !r)}>
                    {recovery ? 'login using an authentication code' : 'login using a recovery code'}
                </button>
            </div>
        </div>
    );
}

/* pages/auth/verify-email.blade.php */
import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Button } from '../../components/ui';
import { useStore } from '../../data/store';
import { useTitle } from '../../hooks/useTitle';

export default function VerifyEmail() {
    useTitle('Email verification');
    const { actions, user } = useStore();
    const navigate = useNavigate();
    const [sent, setSent] = useState(false);

    return (
        <div className="mt-4 flex flex-col gap-6">
            <p className="text-center text-sm text-zinc-600">Please verify your email address by clicking on the link we just emailed to you.</p>
            {sent && <p className="text-center text-sm font-medium text-green-600">A new verification link has been sent to the email address you provided during registration.</p>}
            <div className="flex flex-col items-center justify-between space-y-3">
                <Button variant="primary" className="w-full" onClick={() => setSent(true)}>
                    Resend verification email
                </Button>
                {user && (
                    <Button variant="ghost" className="w-full" onClick={() => navigate('/dashboard')}>
                        Continue to dashboard (preview)
                    </Button>
                )}
                <Button
                    variant="ghost"
                    className="text-sm"
                    onClick={() => {
                        actions.logout();
                        navigate('/');
                    }}
                >
                    Log out
                </Button>
            </div>
        </div>
    );
}

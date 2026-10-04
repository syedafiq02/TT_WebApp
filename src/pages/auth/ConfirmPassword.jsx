/* pages/auth/confirm-password.blade.php (password.confirm middleware) */
import { useNavigate, useSearchParams } from 'react-router-dom';
import { Button, Input } from '../../components/ui';
import { useTitle } from '../../hooks/useTitle';
import { AuthHeader } from '../../layouts/AuthLayout';

export default function ConfirmPassword() {
    useTitle('Confirm password');
    const navigate = useNavigate();
    const [params] = useSearchParams();

    return (
        <div className="flex flex-col gap-6">
            <AuthHeader title="Confirm password" description="This is a secure area of the application. Please confirm your password before continuing." />
            <form
                className="flex flex-col gap-6"
                onSubmit={(e) => {
                    e.preventDefault();
                    try {
                        sessionStorage.setItem('tt-password-confirmed', String(Date.now()));
                    } catch {
                        /* storage unavailable */
                    }
                    navigate(params.get('redirect') || '/settings/security', { replace: true });
                }}
            >
                <Input label="Password" required autoComplete="current-password" placeholder="Password" viewable />
                <Button variant="primary" type="submit" className="w-full">
                    Confirm
                </Button>
            </form>
        </div>
    );
}

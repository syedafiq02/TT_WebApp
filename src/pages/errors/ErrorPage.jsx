import { AppLogoIcon } from '../../components/AppLogo';
import { Button } from '../../components/ui';
import { useTitle } from '../../hooks/useTitle';

const TITLES = { 403: 'Forbidden', 404: 'Not Found' };

export default function ErrorPage({ code = 404, message, action }) {
    useTitle(TITLES[code]);
    return (
        <div className="grid min-h-[70vh] place-items-center bg-canvas px-4 py-16">
            <div className="grid max-w-md justify-items-center gap-4 text-center">
                <AppLogoIcon className="h-10 min-w-10 text-base" />
                <p className="text-sm font-semibold text-brand tabular-nums">{code}</p>
                <h1 className="text-3xl font-semibold tracking-tight text-zinc-900">{code === 404 ? 'Page not found' : 'You do not have access to this page'}</h1>
                <p className="text-[15px] text-zinc-500">{message ?? "Sorry, we couldn't find the page you're looking for."}</p>
                <div className="mt-2 flex flex-wrap justify-center gap-2">
                    {action && (
                        <Button variant="primary" href={action.href}>
                            {action.label}
                        </Button>
                    )}
                    <Button href="/">Back to home</Button>
                </div>
            </div>
        </div>
    );
}

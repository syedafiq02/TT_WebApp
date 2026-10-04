/* pages/catalog/provider.blade.php — public provider profile */
import { useParams } from 'react-router-dom';
import { ServiceCard } from '../../components/Cards';
import { Empty, Icon, Status } from '../../components/ui';
import { providerStatus } from '../../data/enums';
import { providerBySlug, providerForUser, publicServices } from '../../data/queries';
import { useStore } from '../../data/store';
import { useTitle } from '../../hooks/useTitle';
import { fmtMonthYear, initials } from '../../utils/format';
import ErrorPage from '../errors/ErrorPage';

export default function ProviderShow() {
    const { slug } = useParams();
    const { db, user } = useStore();
    const provider = providerBySlug(db, slug);
    useTitle(provider?.display_name);

    const canPreview = user && (user.role === 'admin' || providerForUser(db, user.id)?.id === provider?.id);
    if (!provider || (provider.status !== 'approved' && !canPreview)) return <ErrorPage code={404} />;

    const services = publicServices(db).filter((s) => s.provider_id === provider.id);
    const approved = provider.status === 'approved';

    return (
        <div>
            <section className="border-b border-zinc-200 bg-white">
                <div className="mx-auto grid max-w-7xl gap-8 px-4 py-10 sm:px-6 lg:grid-cols-[auto_1fr_300px] lg:px-10">
                    <span className="grid size-20 place-items-center rounded-2xl bg-brand-soft text-2xl font-semibold text-brand sm:size-24 sm:text-3xl">{initials(provider.display_name)}</span>
                    <div className="grid content-start gap-3">
                        {approved ? (
                            <span className="inline-flex w-max items-center gap-1 rounded-full bg-blue-50 px-2.5 py-0.5 text-xs font-medium text-blue-700 ring-1 ring-blue-600/15 ring-inset">
                                <Icon name="check-badge" variant="micro" />
                                Verified Provider
                            </span>
                        ) : (
                            <Status value={providerStatus(provider.status)} />
                        )}
                        <h1 className="text-3xl font-semibold tracking-tight text-zinc-900 sm:text-4xl">{provider.display_name}</h1>
                        {provider.headline && <p className="text-lg text-zinc-600">{provider.headline}</p>}
                        <div className="flex flex-wrap gap-4 text-sm text-zinc-500">
                            {provider.specialisation && <span>{provider.specialisation}</span>}
                            {provider.experience_years ? <span>{provider.experience_years} years experience</span> : null}
                            {provider.approved_at && <span>Verified since {fmtMonthYear(provider.approved_at)}</span>}
                        </div>
                    </div>
                    <div className="tt-card grid content-start gap-3 p-5 text-sm text-zinc-700">
                        <span className="tt-eyebrow">Platform verification</span>
                        {['Application reviewed by the platform team', 'Agreed to marketing and disclosure standards', 'Every listing reviewed before publication'].map((t) => (
                            <p key={t} className="flex gap-2">
                                <Icon name="check-badge" variant="micro" className="mt-0.5 shrink-0 text-brand" />
                                {t}
                            </p>
                        ))}
                    </div>
                </div>
            </section>

            <div className="mx-auto grid max-w-7xl gap-12 px-4 py-10 sm:px-6 lg:px-10">
                {provider.bio && (
                    <section className="grid gap-3">
                        <h2 className="tt-section-title">About</h2>
                        <p className="max-w-[68ch] leading-relaxed whitespace-pre-line text-zinc-700">{provider.bio}</p>
                    </section>
                )}

                <section className="grid gap-4">
                    <h2 className="tt-section-title">Services by this provider</h2>
                    {services.length === 0 ? (
                        <Empty title="No published services yet" icon="squares-2x2">
                            This provider has no published services yet.
                        </Empty>
                    ) : (
                        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
                            {services.map((s) => (
                                <ServiceCard key={s.id} service={s} />
                            ))}
                        </div>
                    )}
                </section>
            </div>
        </div>
    );
}

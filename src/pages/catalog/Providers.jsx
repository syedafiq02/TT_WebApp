/* pages/catalog/providers.blade.php */
import { ProviderCard } from '../../components/Cards';
import { Button, Empty } from '../../components/ui';
import { useStore } from '../../data/store';
import { useTitle } from '../../hooks/useTitle';

export default function Providers() {
    useTitle('Providers');
    const { db } = useStore();
    const providers = db.providers.filter((p) => p.status === 'approved').sort((a, b) => a.display_name.localeCompare(b.display_name));

    return (
        <div>
            <section className="border-b border-zinc-200 bg-white">
                <div className="mx-auto max-w-7xl px-4 py-10 sm:px-6 lg:px-10">
                    <span className="tt-eyebrow">Verified providers</span>
                    <h1 className="mt-3 font-display text-3xl font-semibold tracking-tight text-zinc-900 sm:text-4xl">Meet the Providers</h1>
                    <p className="mt-3 max-w-2xl text-[15px] leading-relaxed text-zinc-500">Every provider applied, passed the platform review and agreed to our marketing standards before listing a service.</p>
                </div>
            </section>

            <section className="mx-auto max-w-7xl px-4 py-10 sm:px-6 lg:px-10">
                {providers.length === 0 ? (
                    <Empty
                        title="No providers yet"
                        icon="user-group"
                        actions={
                            <Button size="sm" variant="primary" href="/provider/apply">
                                Apply as a provider
                            </Button>
                        }
                    >
                        Approved providers will appear here.
                    </Empty>
                ) : (
                    <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
                        {providers.map((p) => (
                            <ProviderCard key={p.id} provider={p} />
                        ))}
                    </div>
                )}
            </section>
        </div>
    );
}

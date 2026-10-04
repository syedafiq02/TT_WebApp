import { providerForUser, providerServiceIds, providerServices } from '../data/queries';
import { useStore } from '../data/store';

/** auth()->user()->provider plus the ids of its services, for the provider pages. */
export function useProvider() {
    const store = useStore();
    const provider = providerForUser(store.db, store.user.id);
    return { ...store, provider, services: providerServices(store.db, provider.id), serviceIds: providerServiceIds(store.db, provider.id) };
}

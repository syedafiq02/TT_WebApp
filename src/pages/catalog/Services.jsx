/* pages/catalog/index.blade.php — Explore Services */
import { useEffect, useMemo, useState } from 'react';
import { ServiceCard } from '../../components/Cards';
import { Button, Empty, Input, Pagination, Select } from '../../components/ui';
import { SERVICE_TYPES } from '../../data/enums';
import { children, providerById, publicServices, rating, roots, selfAndChildIds } from '../../data/queries';
import { useStore } from '../../data/store';
import { usePaginated } from '../../hooks/usePaginated';
import { useQueryState } from '../../hooks/useQueryState';
import { useTitle } from '../../hooks/useTitle';
import { cx, plural } from '../../utils/format';

export default function Services() {
    useTitle('Explore Services');
    const { db } = useStore();
    const [q, setQ] = useQueryState('q');
    const [category, setCategory] = useQueryState('category');
    const [type, setType] = useQueryState('type');
    const [sort, setSort] = useQueryState('sort', 'recommended');
    const [search, setSearch] = useState(q);
    const [loading, setLoading] = useState(false);

    // wire:model.live.debounce.300ms
    useEffect(() => {
        if (search === q) return;
        setLoading(true);
        const t = setTimeout(() => {
            setQ(search);
            setLoading(false);
        }, 300);
        return () => clearTimeout(t);
    }, [search]); // eslint-disable-line react-hooks/exhaustive-deps

    const results = useMemo(() => {
        const term = q.trim().toLowerCase();
        const selected = category ? db.categories.find((c) => c.slug === category) : null;
        const ids = selected ? selfAndChildIds(db, selected) : null;
        const list = publicServices(db).filter(
            (s) =>
                (!term || s.title.toLowerCase().includes(term) || s.short_description.toLowerCase().includes(term) || providerById(db, s.provider_id).display_name.toLowerCase().includes(term)) &&
                (!ids || ids.includes(s.category_id)) &&
                (!type || s.service_type === type),
        );
        if (sort === 'newest') return list.sort((a, b) => new Date(b.published_at) - new Date(a.published_at));
        if (sort === 'rating') return list.sort((a, b) => rating(db, b.id).avg - rating(db, a.id).avg);
        return list.sort((a, b) => Number(b.featured) - Number(a.featured) || new Date(b.published_at) - new Date(a.published_at));
    }, [db, q, category, type, sort]);

    const { items, pagination } = usePaginated(results, 12);

    const clear = () => {
        setSearch('');
        setQ('');
        setCategory('');
        setType('');
        setSort('recommended');
    };

    return (
        <div>
            <section className="border-b border-zinc-200 bg-white">
                <div className="mx-auto max-w-7xl px-4 py-10 sm:px-6 lg:px-10 lg:py-14">
                    <span className="tt-eyebrow">Marketplace</span>
                    <h1 className="mt-2 text-3xl font-semibold tracking-tight text-zinc-900 sm:text-4xl">Explore Services</h1>
                    <p className="mt-3 max-w-2xl text-[15px] leading-relaxed text-zinc-500">Every service here comes from a verified provider and was reviewed by the platform team before publication.</p>

                    <div className="mt-7 max-w-2xl">
                        <Input icon="magnifying-glass" placeholder="Search services, providers or categories..." value={search} onChange={(e) => setSearch(e.target.value)} clearable onClear={() => setSearch('')} aria-label="Search" />
                    </div>

                    <div className="mt-5 flex gap-2 overflow-x-auto pb-1 [scrollbar-width:none]">
                        <button onClick={() => setCategory('')} className={cx('tt-chip', category === '' && 'is-active')}>
                            All
                        </button>
                        {roots(db).map((root) => (
                            <span key={root.id} className="contents">
                                <button onClick={() => setCategory(root.slug)} className={cx('tt-chip', category === root.slug && 'is-active')}>
                                    {root.name}
                                </button>
                                {children(db, root.id).map((child) => (
                                    <button key={child.id} onClick={() => setCategory(child.slug)} className={cx('tt-chip px-3! text-[13px]! text-zinc-500', category === child.slug && 'is-active')}>
                                        {child.name}
                                    </button>
                                ))}
                            </span>
                        ))}
                    </div>
                </div>
            </section>

            <section className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-10">
                <div className="mb-6 flex flex-wrap items-center justify-between gap-4">
                    <p className="text-sm text-zinc-500">
                        <span className="font-semibold text-zinc-900 tabular-nums">{results.length}</span> {plural('service', results.length)}
                    </p>
                    <div className="grid w-full grid-cols-2 gap-3 sm:w-[26rem]">
                        <Select size="sm" value={type} onChange={(e) => setType(e.target.value)} aria-label="Service type">
                            <option value="">All service types</option>
                            {Object.entries(SERVICE_TYPES).map(([value, t]) => (
                                <option key={value} value={value}>
                                    {t.label}
                                </option>
                            ))}
                        </Select>
                        <Select size="sm" value={sort} onChange={(e) => setSort(e.target.value)} aria-label="Sort">
                            <option value="recommended">Recommended</option>
                            <option value="newest">Newest</option>
                            <option value="rating">Highest rated</option>
                        </Select>
                    </div>
                </div>

                <div className={cx('transition-opacity', loading && 'opacity-60')}>
                    {results.length === 0 ? (
                        <Empty
                            title="No services match these filters"
                            icon="magnifying-glass"
                            actions={
                                <Button size="sm" onClick={clear}>
                                    Clear filters
                                </Button>
                            }
                        >
                            Curated services appear here once providers are approved and their listings pass review.
                        </Empty>
                    ) : (
                        <>
                            <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
                                {items.map((s) => (
                                    <ServiceCard key={s.id} service={s} />
                                ))}
                            </div>
                            <div className="mt-8">
                                <Pagination {...pagination} />
                            </div>
                        </>
                    )}
                </div>
            </section>
        </div>
    );
}

import { useQueryState } from './useQueryState';

/** WithPagination: slices a list and keeps the page number in the URL. */
export function usePaginated(items, perPage) {
    const [pageParam, setPage] = useQueryState('page', '1');
    const pages = Math.max(1, Math.ceil(items.length / perPage));
    const page = Math.min(Math.max(1, Number(pageParam) || 1), pages);
    const slice = items.slice((page - 1) * perPage, page * perPage);
    return {
        items: slice,
        pagination: { page, total: items.length, perPage, onChange: (p) => { setPage(String(p)); window.scrollTo({ top: 0, behavior: 'smooth' }); } },
    };
}

import { useCallback } from 'react';
import { useSearchParams } from 'react-router-dom';

/** Livewire #[Url] property: state kept in the query string. */
export function useQueryState(key, fallback = '') {
    const [params, setParams] = useSearchParams();
    const value = params.get(key) ?? fallback;
    const setValue = useCallback(
        (next) =>
            setParams(
                (prev) => {
                    const p = new URLSearchParams(prev);
                    if (next === fallback || next === '' || next === null || next === undefined) p.delete(key);
                    else p.set(key, next);
                    if (key !== 'page') p.delete('page');
                    return p;
                },
                { replace: true },
            ),
        [key, fallback, setParams],
    );
    return [value, setValue];
}

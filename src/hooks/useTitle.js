import { createContext, useContext, useEffect } from 'react';

/** Lets the dashboard header show the current page title ("Trader / Billing"). */
export const TitleContext = createContext(null);

/** partials/head.blade.php: "<title> · Terpaling Trader". */
export function useTitle(title) {
    const setHeaderTitle = useContext(TitleContext);
    useEffect(() => {
        document.title = title ? `${title} · Terpaling Trader` : 'Terpaling Trader';
        setHeaderTitle?.(title);
    }, [title, setHeaderTitle]);
}

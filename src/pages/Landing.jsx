/*
 * Landing page: resources/views/landing.blade.php + public/landing/landing.js.
 * Styling is the original landing.css, scoped to `.lp` at build time.
 * Featured services, providers and categories come from the mock store.
 */
import { useCallback, useEffect, useRef, useState } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { AiSupportWidget } from '../components/AiSupportWidget';
import { SponsoredBanner } from '../components/sponsored';
import { liveAds } from '../data/advertising';
import { planTermLabel, typeLabel } from '../data/enums';
import { categoryById, children, cheapestPlan, providerById, providerServices, publicServices, rating, roots } from '../data/queries';
import { useStore } from '../data/store';
import { useTitle } from '../hooks/useTitle';
import { usePwa } from '../pwa';
import { initials, plural } from '../utils/format';
import '../styles/landing.css';

const ICONS = {
    arrow: '<path d="M5 12h14m-6-6 6 6-6 6"/>',
    chev: '<path d="m9 6 6 6-6 6"/>',
    menu: '<path d="M3 6h18M3 12h18M3 18h18"/>',
    x: '<path d="M18 6 6 18M6 6l12 12"/>',
    check: '<path d="M20 6 9 17l-5-5"/>',
    verified: '<path d="M12 2l2.4 2.1 3.2-.3.9 3.1 2.8 1.6-1 3 1 3-2.8 1.6-.9 3.1-3.2-.3L12 22l-2.4-2.1-3.2.3-.9-3.1-2.8-1.6 1-3-1-3 2.8-1.6.9-3.1 3.2.3z"/><path d="m8.5 12 2.5 2.5 4.5-5"/>',
    shield: '<path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/><path d="m9 12 2 2 4-4"/>',
    book: '<path d="M4 19.5A2.5 2.5 0 0 1 6.5 17H20V3H6.5A2.5 2.5 0 0 0 4 5.5z"/><path d="M4 19.5A2.5 2.5 0 0 0 6.5 22H20v-5"/>',
    signal: '<path d="M22 12h-4l-3 9L9 3l-3 9H2"/>',
    cpu: '<rect x="5" y="5" width="14" height="14" rx="2"/><rect x="9" y="9" width="6" height="6"/><path d="M9 2v3M15 2v3M9 19v3M15 19v3M2 9h3M2 15h3M19 9h3M19 15h3"/>',
    chart: '<path d="M7 2v4M7 16v6M17 4v4M17 14v6"/><rect x="5" y="6" width="4" height="10" rx="1"/><rect x="15" y="8" width="4" height="6" rx="1"/>',
    trend: '<path d="M3 3v18h18"/><path d="m7 14 4-4 3 3 5-6"/>',
    briefcase: '<rect x="2" y="7" width="20" height="14" rx="2"/><path d="M16 7V5a2 2 0 0 0-2-2h-4a2 2 0 0 0-2 2v2M2 13h20"/>',
    tool: '<path d="M14.7 6.3a1 1 0 0 0 0 1.4l1.6 1.6a1 1 0 0 0 1.4 0l3.8-3.8a6 6 0 0 1-7.9 7.9l-6.9 6.9a2.1 2.1 0 0 1-3-3l6.9-6.9a6 6 0 0 1 7.9-7.9z"/>',
    search: '<circle cx="11" cy="11" r="7"/><path d="m20 20-3.5-3.5"/>',
    layers: '<path d="M12 2 2 7l10 5 10-5z"/><path d="m2 17 10 5 10-5"/><path d="m2 12 10 5 10-5"/>',
    lock: '<rect x="4" y="11" width="16" height="10" rx="2"/><path d="M8 11V7a4 4 0 0 1 8 0v4"/>',
    grid: '<rect x="3" y="3" width="7" height="7" rx="1.5"/><rect x="14" y="3" width="7" height="7" rx="1.5"/><rect x="3" y="14" width="7" height="7" rx="1.5"/><rect x="14" y="14" width="7" height="7" rx="1.5"/>',
    user: '<circle cx="12" cy="8" r="4"/><path d="M4 21a8 8 0 0 1 16 0"/>',
    users: '<circle cx="9" cy="8" r="4"/><path d="M2 21a7 7 0 0 1 14 0"/><path d="M16 4a4 4 0 0 1 0 8"/><path d="M22 21a7 7 0 0 0-4-6.3"/>',
    home: '<path d="M3 10.5 12 3l9 7.5V20a1 1 0 0 1-1 1h-5v-6H9v6H4a1 1 0 0 1-1-1z"/>',
    refresh: '<path d="M21 12a9 9 0 1 1-2.6-6.4L21 8"/><path d="M21 3v5h-5"/>',
    card: '<rect x="2" y="5" width="20" height="14" rx="2"/><path d="M2 10h20M6 15h4"/>',
    bell: '<path d="M6 8a6 6 0 0 1 12 0c0 7 3 9 3 9H3s3-2 3-9"/><path d="M10.3 21a1.94 1.94 0 0 0 3.4 0"/>',
    send: '<path d="m22 2-7 20-4-9-9-4z"/><path d="M22 2 11 13"/>',
    camera: '<rect x="3" y="3" width="18" height="18" rx="5"/><circle cx="12" cy="12" r="4"/><path d="M17.5 6.5h.01"/>',
    play: '<rect x="2" y="5" width="20" height="14" rx="4"/><path d="m10 9 5 3-5 3z"/>',
    music: '<path d="M9 18V5l11-2v13"/><circle cx="6" cy="18" r="3"/><circle cx="17" cy="16" r="3"/>',
    info: '<circle cx="12" cy="12" r="10"/><path d="M12 16v-4M12 8h.01"/>',
    star: '<path d="M12 2l3.1 6.3 6.9 1-5 4.9 1.2 6.8L12 17.8 5.8 21l1.2-6.8-5-4.9 6.9-1z"/>',
};

const CATEGORY_ICONS = { 'trading-education': 'book', 'trading-intelligence': 'signal', 'trading-tools': 'cpu', 'professional-services': 'briefcase' };
const TYPE_ICONS = { academy: 'book', mentorship: 'users', signals: 'signal', market_research: 'trend', expert_advisor: 'cpu', indicator: 'chart', trading_tool: 'tool', consultancy: 'briefcase', technical_setup: 'tool' };
const SECTIONS = ['providers', 'how', 'about', 'services', 'featured', 'preview', 'for-providers'];

function I({ n, className, style }) {
    return <svg className={className} style={style} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true" dangerouslySetInnerHTML={{ __html: ICONS[n] ?? '' }} />;
}

/* Temporary text placeholder until the final logo is supplied. */
function Mark() {
    return (
        <span className="mark">
            <span className="mark-text" aria-hidden="true">
                TT
            </span>
        </span>
    );
}

function Logo() {
    return (
        <Link className="logo" to="/" aria-label="Terpaling Trader, home" onClick={() => window.scrollTo({ top: 0 })}>
            <Mark />
            <span>
                <b>Terpaling Trader</b>
                <span className="tag">Trading services platform</span>
            </span>
        </Link>
    );
}

export default function Landing() {
    useTitle(null);
    const { db, user } = useStore();
    const { installMethod, install } = usePwa();
    const { hash } = useLocation();
    const [menuOpen, setMenuOpen] = useState(false);
    const [scrolled, setScrolled] = useState(false);
    const [active, setActive] = useState(null);
    const [toast, setToast] = useState(null);
    const toastTimer = useRef(null);

    const categories = roots(db);
    const featured = publicServices(db)
        .sort((a, b) => Number(b.featured) - Number(a.featured) || new Date(b.published_at) - new Date(a.published_at))
        .slice(0, 4);
    const providers = db.providers
        .filter((p) => p.status === 'approved')
        .sort((a, b) => new Date(b.approved_at) - new Date(a.approved_at))
        .slice(0, 4);

    const banner = liveAds(db, 'featured_banner')[0];

    const closeMenu = useCallback(() => {
        setMenuOpen(false);
        document.body.style.overflow = '';
    }, []);

    const scrollTo = (id) => {
        closeMenu();
        const el = document.getElementById(id);
        if (el) {
            const top = el.getBoundingClientRect().top + window.scrollY - 80;
            window.scrollTo({ top, behavior: window.matchMedia('(prefers-reduced-motion: reduce)').matches ? 'auto' : 'smooth' });
            history.replaceState(null, '', `#${id}`);
        }
    };

    const soon = () => {
        setToast('This part is planned for the next draft.');
        clearTimeout(toastTimer.current);
        toastTimer.current = setTimeout(() => setToast(null), 2800);
    };

    useEffect(() => {
        const onScroll = () => setScrolled(window.scrollY > 8);
        onScroll();
        window.addEventListener('scroll', onScroll, { passive: true });
        const onKey = (e) => e.key === 'Escape' && closeMenu();
        document.addEventListener('keydown', onKey);
        return () => {
            window.removeEventListener('scroll', onScroll);
            document.removeEventListener('keydown', onKey);
            document.body.style.overflow = '';
            clearTimeout(toastTimer.current);
        };
    }, [closeMenu]);

    // Highlight the nav item for the section in view.
    useEffect(() => {
        if (!('IntersectionObserver' in window)) return;
        const io = new IntersectionObserver((entries) => entries.forEach((en) => en.isIntersecting && setActive(en.target.id === 'hero' ? null : en.target.id)), { rootMargin: '-45% 0px -50% 0px' });
        ['hero', 'providers', 'how', 'about'].forEach((id) => {
            const el = document.getElementById(id);
            if (el) io.observe(el);
        });
        return () => io.disconnect();
    }, []);

    // Deep links such as /#how from the other pages.
    useEffect(() => {
        const id = hash.replace('#', '');
        if (SECTIONS.includes(id)) requestAnimationFrame(() => document.getElementById(id)?.scrollIntoView());
        else window.scrollTo(0, 0);
    }, [hash]);

    const toggleMenu = () => {
        const next = !menuOpen;
        setMenuOpen(next);
        document.body.style.overflow = next ? 'hidden' : '';
    };

    const navBtn = (id, label) => (
        <button className={active === id ? 'on' : undefined} onClick={() => scrollTo(id)}>
            {label}
        </button>
    );

    return (
        <div className="lp">
            {/* 01 NAVIGATION */}
            <header className={`nav${scrolled ? ' scrolled' : ''}`} id="top">
                <div className="wrap">
                    <Logo />
                    <nav className="nav-links" aria-label="Main">
                        <Link to="/services">Explore</Link>
                        {navBtn('providers', 'Providers')}
                        {navBtn('how', 'How It Works')}
                        {navBtn('about', 'About')}
                        <Link to="/advertise">Advertise</Link>
                    </nav>
                    <div className="nav-right">
                        <Link className="nav-provider hide-m" to="/provider/apply">
                            <I n="verified" />
                            Become a Provider
                        </Link>
                        <span className="nav-sep hide-m" />
                        {user ? (
                            <Link className="btn btn-primary btn-sm hide-m" to="/dashboard">
                                Dashboard
                            </Link>
                        ) : (
                            <>
                                <Link className="btn btn-ghost btn-sm hide-m" to="/login">
                                    Login
                                </Link>
                                <Link className="btn btn-primary btn-sm hide-m" to="/register">
                                    Get Started
                                </Link>
                            </>
                        )}
                        <button className="burger" aria-label={menuOpen ? 'Close menu' : 'Open menu'} aria-expanded={menuOpen} onClick={toggleMenu}>
                            <I n={menuOpen ? 'x' : 'menu'} />
                        </button>
                    </div>
                </div>
            </header>
            <nav className={`mnav${menuOpen ? ' open' : ''}`} id="mnav" aria-label="Mobile">
                <Link className="ml" to="/services" onClick={closeMenu}>
                    Explore
                    <I n="chev" />
                </Link>
                <button className="ml" onClick={() => scrollTo('providers')}>
                    Providers
                    <I n="chev" />
                </button>
                <button className="ml" onClick={() => scrollTo('how')}>
                    How It Works
                    <I n="chev" />
                </button>
                <button className="ml" onClick={() => scrollTo('about')}>
                    About
                    <I n="chev" />
                </button>
                <Link className="ml" to="/provider/apply" onClick={closeMenu}>
                    Become a Provider
                    <I n="chev" />
                </Link>
                <Link className="ml" to="/advertise" onClick={closeMenu}>
                    Advertise
                    <I n="chev" />
                </Link>
                <div className="btns">
                    {user ? (
                        <Link className="btn btn-primary" to="/dashboard" onClick={closeMenu}>
                            Go to dashboard
                        </Link>
                    ) : (
                        <>
                            <Link className="btn btn-primary" to="/register" onClick={closeMenu}>
                                Get Started
                            </Link>
                            <Link className="btn btn-secondary" to="/login" onClick={closeMenu}>
                                Login
                            </Link>
                        </>
                    )}
                </div>
            </nav>

            <main id="landing">
                {/* 02 HERO */}
                <section className="hero" id="hero" aria-labelledby="hero-title">
                    <div className="wrap hero-grid">
                        <div className="copy">
                            <span className="eyebrow">Terpaling Trader · Curated trading services platform</span>
                            <h1 id="hero-title" style={{ marginTop: 18 }}>
                                Malaysia's <span className="accent">One-Stop</span> Trading Community
                            </h1>
                            <p className="lede">Discover curated trading education, signals, tools, mentorship and professional services, all in one platform.</p>
                            <div className="ctas">
                                <Link className="btn btn-primary btn-lg" to="/services">
                                    Explore Services <I n="arrow" className="arrow" />
                                </Link>
                                <Link className="btn btn-secondary btn-lg" to="/provider/apply">
                                    Become a Provider
                                </Link>
                            </div>
                            <div className="trustline" aria-label="Platform principles">
                                <span>Curated Providers</span>
                                <i />
                                <span>Centralised Access</span>
                                <i />
                                <span>One Trading Ecosystem</span>
                            </div>
                        </div>

                        <div className="eco" role="img" aria-label="Diagram: Academy, Signals, EA and Tools, and Consultancy all connect to one central platform">
                            <span className="eco-chip c-tl">Mentorship</span>
                            <span className="eco-chip c-tr">Indicators</span>
                            <span className="eco-chip c-bl">Market Research</span>
                            <span className="eco-chip c-br">Trading Tools</span>

                            {[
                                ['n-top', 'book', 'Academy', ['Courses · Lessons', 'Progress tracking'], 'Reviewed educators'],
                                ['n-left', 'signal', 'Signals', ['Signal feed', 'Market updates'], 'Reviewed providers'],
                                ['n-right', 'cpu', 'EA & Tools', ['Licences', 'Versioned downloads'], 'Reviewed developers'],
                                ['n-bottom', 'briefcase', 'Consultancy', ['Booked sessions', 'Written notes'], 'Reviewed consultants'],
                            ].map(([pos, icon, title, lines, verified]) => (
                                <div key={pos} className={`eco-node ${pos}`}>
                                    <div className="h">
                                        <span className="i">
                                            <I n={icon} />
                                        </span>
                                        <b>{title}</b>
                                    </div>
                                    <div className="m">
                                        {lines[0]}
                                        <br />
                                        {lines[1]}
                                    </div>
                                    <div className="v">
                                        <I n="verified" />
                                        {verified}
                                    </div>
                                </div>
                            ))}

                            <span className="wire w-v w-top" />
                            <span className="wire w-v w-bottom" />
                            <span className="wire w-h w-left" />
                            <span className="wire w-h w-right" />

                            <div className="eco-core">
                                <div className="top">
                                    <Mark />
                                    <div>
                                        <b>Terpaling Trader</b>
                                        <span>Your trading hub</span>
                                    </div>
                                </div>
                                <div className="eco-search">
                                    <I n="search" />
                                    Search services, providers…
                                </div>
                                <div className="eco-steps">
                                    <span className="on">DISCOVER</span>
                                    <span>SUBSCRIBE</span>
                                    <span>ACCESS</span>
                                </div>
                                <div className="foot">
                                    <span>
                                        <b>1</b> account
                                    </span>
                                    <span>
                                        <b>{Math.max(1, categories.length)}</b> categories
                                    </span>
                                    <span>
                                        <b>100%</b> reviewed
                                    </span>
                                </div>
                            </div>
                        </div>
                    </div>
                </section>

                {/* 03 SCOPE BAR */}
                <section className="scope" aria-label="Platform scope">
                    <div className="wrap">
                        <ul>
                            <li className="first">
                                <I n="shield" />
                                Curated services
                            </li>
                            <li>
                                <I n="book" />
                                Trading education
                            </li>
                            <li>
                                <I n="trend" />
                                Market research
                            </li>
                            <li>
                                <I n="tool" />
                                Trading tools
                            </li>
                            <li>
                                <I n="briefcase" />
                                Professional services
                            </li>
                        </ul>
                    </div>
                </section>

                {/* 04 EXPLORE SERVICES */}
                <section className="section" id="services" aria-labelledby="services-title">
                    <div className="wrap">
                        <div className="s-head">
                            <div className="lead">
                                <span className="eyebrow">Explore services</span>
                                <h2 id="services-title">Everything You Need to Trade</h2>
                                <p>Explore a curated selection of trading services built for different stages of your trading journey.</p>
                            </div>
                            <Link className="btn btn-outline" to="/services">
                                Browse all services <I n="arrow" className="arrow" />
                            </Link>
                        </div>
                        <div className="cats" style={{ gridTemplateColumns: `repeat(${Math.max(1, Math.min(5, categories.length))}, minmax(0, 1fr))` }}>
                            {categories.map((c, i) => (
                                <Link key={c.id} className="cat" to={`/services?category=${c.slug}`}>
                                    <span className="num">{String(i + 1).padStart(2, '0')}</span>
                                    <span className="ico">
                                        <I n={CATEGORY_ICONS[c.slug] ?? 'layers'} />
                                    </span>
                                    <h3>{c.name}</h3>
                                    <p>{c.description}</p>
                                    <span className="tags">
                                        {children(db, c.id)
                                            .slice(0, 3)
                                            .map((ch) => (
                                                <span key={ch.id}>{ch.name}</span>
                                            ))}
                                    </span>
                                    <span className="go">
                                        Explore
                                        <I n="arrow" />
                                    </span>
                                </Link>
                            ))}
                        </div>
                        <p className="swipe-hint">Swipe to see all categories →</p>
                    </div>
                </section>

                {/* 05 FEATURED SERVICES */}
                <section className="section" id="featured" aria-labelledby="featured-title">
                    <div className="wrap">
                        <div className="s-head">
                            <div className="lead">
                                <span className="eyebrow">Featured services</span>
                                <h2 id="featured-title">Discover Curated Services</h2>
                                <p>Explore services from providers selected for the platform.</p>
                            </div>
                            <Link className="btn btn-outline" to="/services">
                                View all services <I n="arrow" className="arrow" />
                            </Link>
                        </div>
                        <div className="svcs">
                            {featured.length === 0 && (
                                <div className="empty-note">
                                    <b>Curated services appear here once they are approved.</b>Every listing is reviewed by the platform team before it is published.
                                </div>
                            )}
                            {featured.map((s) => {
                                const plan = cheapestPlan(db, s.id);
                                const r = rating(db, s.id);
                                return (
                                    <article key={s.id} className="svc">
                                        <div className="svc-top">
                                            <div className="row">
                                                <span className="badge kind">
                                                    <I n={TYPE_ICONS[s.service_type] ?? 'layers'} />
                                                    {typeLabel(s.service_type)}
                                                </span>
                                                <span className="badge verified">
                                                    <I n="shield" />
                                                    Reviewed
                                                </span>
                                            </div>
                                            <p className="svc-desc">{s.short_description}</p>
                                        </div>
                                        <div className="svc-body">
                                            <h3>{s.title}</h3>
                                            <div className="svc-prov">
                                                {providerById(db, s.provider_id).display_name} <I n="verified" />
                                            </div>
                                            <div className="svc-meta">
                                                <span>{categoryById(db, s.category_id).name}</span>
                                                {(s.platforms ?? []).slice(0, 2).map((p) => (
                                                    <span key={p}>{p}</span>
                                                ))}
                                            </div>
                                            {r.count > 0 ? (
                                                <div className="svc-rate">
                                                    <span className="stars">
                                                        {Array.from({ length: Math.round(r.avg) }, (_, i) => (
                                                            <I key={i} n="star" />
                                                        ))}
                                                    </span>
                                                    <b>{r.avg.toFixed(1)}</b>
                                                    {r.count} reviews
                                                </div>
                                            ) : (
                                                <div className="svc-rate">New listing</div>
                                            )}
                                            <div className="svc-foot">
                                                {plan ? (
                                                    <span className="price">
                                                        <small>RM</small>
                                                        <b>{(plan.price_minor / 100).toLocaleString('en-US', { minimumFractionDigits: plan.price_minor % 100 ? 2 : 0 })}</b>
                                                        <span>{planTermLabel(plan)}</span>
                                                    </span>
                                                ) : (
                                                    <span className="price">
                                                        <span>Plans coming soon</span>
                                                    </span>
                                                )}
                                                <Link className="btn btn-outline btn-sm" to={`/services/${s.slug}`}>
                                                    View Service
                                                </Link>
                                            </div>
                                        </div>
                                    </article>
                                );
                            })}
                        </div>
                    </div>
                </section>

                {/* Sponsored: one featured banner, only while a paid campaign is active */}
                {banner && (
                    <section className="section" aria-label="Sponsored" style={{ paddingBlock: 0 }}>
                        <div className="wrap">
                            <SponsoredBanner ad={banner} />
                        </div>
                    </section>
                )}

                {/* 06 CURATED PROVIDERS */}
                <section className="section" id="providers" aria-labelledby="providers-title">
                    <div className="wrap">
                        <div className="s-head">
                            <div className="lead">
                                <span className="eyebrow gold">Curated providers</span>
                                <h2 id="providers-title">Meet the Providers</h2>
                                <p>Discover services from selected providers within the trading community.</p>
                            </div>
                            <Link className="btn btn-outline" to="/providers">
                                All providers <I n="arrow" className="arrow" />
                            </Link>
                        </div>
                        <div className="provs">
                            {providers.length === 0 && (
                                <div className="empty-note">
                                    <b>Verified providers will be listed here.</b>Providers apply, are reviewed and approved before they can offer services.
                                </div>
                            )}
                            {providers.map((p) => {
                                const count = providerServices(db, p.id).filter((s) => s.status === 'published').length;
                                return (
                                    <article key={p.id} className="prov">
                                        <div className="who">
                                            <span className="ava" style={{ '--ava-bg': 'var(--brand-soft)' }}>
                                                <span>{initials(p.display_name)}</span>
                                            </span>
                                            <div>
                                                <h3>{p.display_name}</h3>
                                                <div className="spec">{p.specialisation || 'Trading services'}</div>
                                            </div>
                                        </div>
                                        <span className="badge verified" style={{ width: 'max-content' }}>
                                            <I n="verified" />
                                            Verified Provider
                                        </span>
                                        <p>{p.headline || (p.bio.length > 140 ? `${p.bio.slice(0, 140)}...` : p.bio)}</p>
                                        <div className="facts">
                                            <div>
                                                <b>{count}</b>
                                                <span>{plural('Service', count)}</span>
                                            </div>
                                            {p.experience_years ? (
                                                <div>
                                                    <b>{p.experience_years} yrs</b>
                                                    <span>Experience</span>
                                                </div>
                                            ) : null}
                                        </div>
                                        <Link className="link-arrow" to={`/providers/${p.slug}`}>
                                            View Profile <I n="arrow" />
                                        </Link>
                                    </article>
                                );
                            })}
                        </div>
                        <p className="vet-note">
                            <I n="shield" />
                            Every provider is reviewed and approved by the platform team before their services are published.
                        </p>
                    </div>
                </section>

                {/* 07 HOW IT WORKS */}
                <section className="section" id="how" aria-labelledby="how-title">
                    <div className="wrap">
                        <div className="s-head">
                            <div className="lead">
                                <span className="eyebrow">How it works</span>
                                <h2 id="how-title">One Platform. Four Simple Steps.</h2>
                            </div>
                        </div>
                        <ol className="steps" style={{ listStyle: 'none', margin: 0, padding: 0 }}>
                            {[
                                ['search', '01', 'Discover', 'Explore curated trading services.'],
                                ['layers', '02', 'Choose', 'Compare services and subscription plans.'],
                                ['lock', '03', 'Subscribe', 'Complete your subscription securely.'],
                                ['grid', '04', 'Access', 'Manage and access your service from your trading hub.'],
                            ].map(([icon, n, title, text]) => (
                                <li key={n} className="step">
                                    <span className="k">
                                        <I n={icon} />
                                    </span>
                                    <span className="n">{n}</span>
                                    <h3>{title}</h3>
                                    <p>{text}</p>
                                </li>
                            ))}
                        </ol>
                    </div>
                </section>

                {/* 08 ABOUT */}
                <section className="section" id="about" aria-labelledby="about-title">
                    <div className="wrap">
                        <div className="s-head">
                            <div className="lead">
                                <span className="eyebrow">About the platform</span>
                                <h2 id="about-title">Built Around the Trading Community</h2>
                                <p>Terpaling Trader brings selected trading services into one ecosystem, so Malaysian traders can find, subscribe to and manage them from a single place.</p>
                            </div>
                        </div>
                        <div className="why">
                            {[
                                ['verified', 'gold', 'Curated Providers', 'Services are reviewed before appearing on the platform.'],
                                ['user', '', 'One Account', 'Manage your trading services from a single account.'],
                                ['grid', '', 'Centralised Access', 'Subscriptions, content and service access in one place.'],
                                ['layers', '', 'Growing Ecosystem', 'Discover education, tools, research and services within one community.'],
                            ].map(([icon, cls, title, text]) => (
                                <div key={title}>
                                    <span className={`i ${cls}`.trim()}>
                                        <I n={icon} />
                                    </span>
                                    <h3>{title}</h3>
                                    <p>{text}</p>
                                </div>
                            ))}
                        </div>
                    </div>
                </section>

                {/* 09 PLATFORM PREVIEW (illustrative) */}
                <section className="section" id="preview" aria-labelledby="preview-title">
                    <div className="wrap">
                        <div className="s-head">
                            <div className="lead">
                                <span className="eyebrow">Platform preview</span>
                                <h2 id="preview-title">Your Trading Hub</h2>
                                <p>One place for every service you subscribe to: access, renewals, billing and updates.</p>
                            </div>
                            <span className="draft-tag" style={{ color: 'var(--muted)' }}>
                                Illustration · example data
                            </span>
                        </div>
                        <div className="preview-wrap">
                            <div className="frame" aria-label="Illustrative dashboard with example data">
                                <div className="frame-bar">
                                    <span className="dots">
                                        <i />
                                        <i />
                                        <i />
                                    </span>
                                    <span className="url">
                                        <I n="lock" />
                                        My trading hub
                                    </span>
                                    <span style={{ width: 46 }} />
                                </div>
                                <div className="app">
                                    <aside className="app-side">
                                        <div className="who">
                                            <span className="av">ET</span>
                                            <div>
                                                <b>Example Trader</b>
                                                <span>Trader account</span>
                                            </div>
                                        </div>
                                        <span className="it on">
                                            <I n="home" />
                                            Overview
                                        </span>
                                        <span className="it">
                                            <I n="grid" />
                                            My Services
                                        </span>
                                        <span className="it">
                                            <I n="refresh" />
                                            Subscriptions
                                        </span>
                                        <span className="it">
                                            <I n="book" />
                                            Learning
                                        </span>
                                        <span className="it">
                                            <I n="card" />
                                            Billing
                                        </span>
                                        <span className="it">
                                            <I n="bell" />
                                            Notifications<span className="c">2</span>
                                        </span>
                                    </aside>
                                    <div className="app-main">
                                        <div className="app-head">
                                            <div>
                                                <h3>Good morning.</h3>
                                                <p>Here's your trading hub.</p>
                                            </div>
                                            <span className="mini-btn">
                                                <I n="search" style={{ width: 13, height: 13, marginRight: 6 }} />
                                                Explore services
                                            </span>
                                        </div>
                                        <div className="tiles">
                                            <div className="tile">
                                                <span>Active services</span>
                                                <b>3</b>
                                                <em>All in one account</em>
                                            </div>
                                            <div className="tile">
                                                <span>Upcoming renewal</span>
                                                <b>28 Oct</b>
                                                <em>Signals plan</em>
                                            </div>
                                            <div className="tile">
                                                <span>Monthly total</span>
                                                <b>RM 543</b>
                                                <em>Across 3 services</em>
                                            </div>
                                        </div>
                                        <div className="app-cols">
                                            <div className="panel">
                                                <div className="panel-h">
                                                    My Services<span>3 active</span>
                                                </div>
                                                <div className="svc-row">
                                                    <span className="t">
                                                        <I n="signal" />
                                                    </span>
                                                    <div>
                                                        <b>Example signal service</b>
                                                        <span className="s">Trading Signals · Renews 28 Oct</span>
                                                    </div>
                                                    <span className="badge active">
                                                        <span className="dot" />
                                                        Active
                                                    </span>
                                                    <span className="mini-btn g">Access</span>
                                                </div>
                                                <div className="svc-row">
                                                    <span className="t">
                                                        <I n="book" />
                                                    </span>
                                                    <div>
                                                        <b>Example academy</b>
                                                        <div className="pg">
                                                            <span className="bar">
                                                                <i />
                                                            </span>
                                                            <span>65%</span>
                                                        </div>
                                                    </div>
                                                    <span className="badge active">
                                                        <span className="dot" />
                                                        Active
                                                    </span>
                                                    <span className="mini-btn">Continue</span>
                                                </div>
                                                <div className="svc-row">
                                                    <span className="t">
                                                        <I n="cpu" />
                                                    </span>
                                                    <div>
                                                        <b>Example MT5 EA</b>
                                                        <span className="s">Licence active · v1.2.0</span>
                                                    </div>
                                                    <span className="badge active">
                                                        <span className="dot" />
                                                        Active
                                                    </span>
                                                    <span className="mini-btn">Download</span>
                                                </div>
                                            </div>
                                            <div style={{ display: 'grid', gap: 14 }}>
                                                <div className="panel">
                                                    <div className="panel-h">
                                                        Upcoming Renewal<span>Auto-renew on</span>
                                                    </div>
                                                    <div className="renew">
                                                        <span className="d">28 October</span>
                                                        <div className="kv">
                                                            <span>Signals · Monthly</span>
                                                            <b>RM 189.00</b>
                                                        </div>
                                                        <div className="kv">
                                                            <span>Payment method</span>
                                                            <b>FPX</b>
                                                        </div>
                                                    </div>
                                                </div>
                                                <div className="panel">
                                                    <div className="panel-h">
                                                        Recent activity<span>Today</span>
                                                    </div>
                                                    <div className="renew">
                                                        <div className="kv">
                                                            <span>New version available · Example MT5 EA</span>
                                                            <b>v1.2.0</b>
                                                        </div>
                                                        <div className="kv">
                                                            <span>New lesson published · Example academy</span>
                                                            <b>08:42</b>
                                                        </div>
                                                        <div className="kv">
                                                            <span>Payment received · Signals plan</span>
                                                            <b>RM 189.00</b>
                                                        </div>
                                                    </div>
                                                </div>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            </div>
                            <div className="callouts">
                                {[
                                    ['01', 'Every subscription in one list', 'Signals, courses, tools and consultations side by side.'],
                                    ['02', 'Renewals and billing', 'See what renews next and manage auto-renew in one tap.'],
                                    ['03', 'Access from one hub', 'Open lessons, signals, licences and bookings, even for tools that run in MT5 or TradingView.'],
                                ].map(([n, title, text]) => (
                                    <div key={n} className="callout">
                                        <span className="n">{n}</span>
                                        <div>
                                            <b>{title}</b>
                                            <p>{text}</p>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </div>
                    </div>
                </section>

                {/* 10 PROVIDER CTA */}
                <section className="section" id="for-providers" aria-labelledby="pcta-title">
                    <div className="wrap">
                        <div className="pcta">
                            <div className="copy">
                                <span className="eyebrow gold">For providers</span>
                                <h2 id="pcta-title">Have a Trading Service?</h2>
                                <p className="lead">Join a curated ecosystem built to connect quality trading services with Malaysian traders.</p>
                                <div>
                                    <Link className="btn btn-primary btn-lg" to="/provider/apply">
                                        Apply as a Provider <I n="arrow" className="arrow" />
                                    </Link>
                                </div>
                                <p className="note">
                                    <I n="shield" />
                                    Applications are reviewed before services are published.
                                </p>
                            </div>
                            <div className="pipe" aria-label="Provider approval process">
                                <div className="pipe-h">
                                    <b>How providers join</b>
                                    <span className="badge verified">
                                        <I n="shield" />
                                        Curated
                                    </span>
                                </div>
                                <div className="ps done">
                                    <span className="k">
                                        <I n="check" />
                                    </span>
                                    <div>
                                        <b>Apply</b>
                                        <p>Profile, experience and sample work.</p>
                                    </div>
                                </div>
                                <div className="ps gate">
                                    <span className="k">
                                        <I n="shield" />
                                    </span>
                                    <div>
                                        <b>Platform review</b>
                                        <p>Identity, background and marketing claims.</p>
                                    </div>
                                    <span className="badge verified">Review</span>
                                </div>
                                <div className="ps">
                                    <span className="k">3</span>
                                    <div>
                                        <b>Create your listing</b>
                                        <p>Service details, plans and content.</p>
                                    </div>
                                </div>
                                <div className="ps gate">
                                    <span className="k">
                                        <I n="shield" />
                                    </span>
                                    <div>
                                        <b>Listing review</b>
                                        <p>Each service is checked before going live.</p>
                                    </div>
                                    <span className="badge verified">Review</span>
                                </div>
                                <div className="ps">
                                    <span className="k">5</span>
                                    <div>
                                        <b>Published</b>
                                        <p>Traders can discover and subscribe.</p>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                </section>

                {/* 11 FINAL CTA */}
                <section className="section" aria-labelledby="final-title">
                    <div className="wrap">
                        <div className="final">
                            <span className="eyebrow">One account · every service</span>
                            <h2 id="final-title">Everything You Need to Trade, In One Place.</h2>
                            <p>Explore education, signals, tools, research and professional services from curated providers.</p>
                            <div className="ctas">
                                <Link className="btn btn-primary btn-lg" to="/services">
                                    Explore Services <I n="arrow" className="arrow" />
                                </Link>
                                <Link className="btn btn-secondary btn-lg" to={user ? '/dashboard' : '/register'}>
                                    Get Started
                                </Link>
                            </div>
                        </div>
                    </div>
                </section>
            </main>

            {/* 12 FOOTER */}
            <footer className="footer">
                <div className="wrap">
                    <div className="f-grid">
                        <div className="f-brand">
                            <Logo />
                            <p>Curated providers. Centralised access. One trading ecosystem for Malaysian traders.</p>
                        </div>
                        <div>
                            <h4>Platform</h4>
                            <ul>
                                <li>
                                    <button onClick={() => scrollTo('about')}>About</button>
                                </li>
                                <li>
                                    <Link to="/services" style={{ color: 'var(--fg-2)', fontSize: 14 }}>
                                        Explore Services
                                    </Link>
                                </li>
                                <li>
                                    <Link to="/providers" style={{ color: 'var(--fg-2)', fontSize: 14 }}>
                                        Providers
                                    </Link>
                                </li>
                                <li>
                                    <button onClick={() => scrollTo('how')}>How It Works</button>
                                </li>
                                <li>
                                    <Link to="/advertise" style={{ color: 'var(--fg-2)', fontSize: 14 }}>
                                        Advertise
                                    </Link>
                                </li>
                                {installMethod && (
                                    <li>
                                        <button onClick={install}>Install app</button>
                                    </li>
                                )}
                            </ul>
                        </div>
                        <div>
                            <h4>Services</h4>
                            <ul>
                                {categories.map((c) => (
                                    <li key={c.id}>
                                        <Link to={`/services?category=${c.slug}`} style={{ color: 'var(--fg-2)', fontSize: 14 }}>
                                            {c.name}
                                        </Link>
                                    </li>
                                ))}
                            </ul>
                        </div>
                        <div>
                            <h4>Support</h4>
                            <ul>
                                {['FAQ', 'Contact', 'Terms', 'Privacy'].map((label) => (
                                    <li key={label}>
                                        <button onClick={soon}>{label}</button>
                                    </li>
                                ))}
                            </ul>
                        </div>
                        <div>
                            <h4>Community</h4>
                            <div className="socials">
                                {[
                                    ['send', 'Telegram'],
                                    ['camera', 'Instagram'],
                                    ['play', 'YouTube'],
                                    ['music', 'TikTok'],
                                    ['users', 'Facebook'],
                                ].map(([icon, label]) => (
                                    <button key={label} onClick={soon} aria-label={`${label} (placeholder)`}>
                                        <I n={icon} />
                                    </button>
                                ))}
                            </div>
                        </div>
                    </div>
                    <div className="f-bottom">
                        <p className="disclaimer">
                            <I n="info" />
                            <span>
                                <b style={{ color: 'var(--fg-2)', fontWeight: 550 }}>Risk disclaimer.</b> Trading involves risk. Information and services provided through the platform should not be interpreted as a guarantee of trading results. Services are educational and analytical and are not personalised investment advice.
                            </span>
                        </p>
                        <div className="f-legal">
                            <span>© {new Date().getFullYear()} Terpaling Trader</span>
                            <span className="draft-tag">Early access</span>
                        </div>
                    </div>
                </div>
            </footer>

            {toast && (
                <div className="toast" role="status">
                    <I n="info" />
                    <span>{toast}</span>
                </div>
            )}

            <AiSupportWidget />
        </div>
    );
}

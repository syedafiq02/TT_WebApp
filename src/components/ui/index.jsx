/*
 * React stand-ins for the Flux components used by the Laravel views.
 * Class lists are taken from the Flux stubs so buttons, fields, badges and
 * callouts render the same as the original pages.
 */
import { useEffect, useId, useRef, useState } from 'react';
import { createPortal } from 'react-dom';
import { Link } from 'react-router-dom';
import { cx } from '../../utils/format';
import { ICONS } from './icons';

/* ------------------------------------------------------------------ Icon */

export function Icon({ name, variant = 'outline', className, ...rest }) {
    const set = ICONS[name] ?? ICONS.inbox;
    const Cmp = set[variant] ?? set.outline;
    const size = variant === 'micro' ? 'size-4' : variant === 'mini' ? 'size-5' : 'size-6';
    return <Cmp aria-hidden="true" data-slot="icon" className={cx('shrink-0', size, className)} {...rest} />;
}

/* ---------------------------------------------------------------- Button */

const BTN_SIZE = {
    base: 'h-10 text-sm rounded-lg gap-2',
    sm: 'h-8 text-sm rounded-md gap-2',
    xs: 'h-6 text-xs rounded-md gap-1',
};
const BTN_PAD = {
    base: ['ps-4', 'ps-3', 'pe-4', 'pe-3', 'w-10'],
    sm: ['ps-3', 'ps-2', 'pe-3', 'pe-2', 'w-8'],
    xs: ['ps-2', 'ps-1', 'pe-2', 'pe-1', 'w-6'],
};
const BTN_VARIANT = {
    primary: 'bg-[var(--color-accent)] hover:bg-[color-mix(in_oklab,_var(--color-accent),_transparent_10%)] text-[var(--color-accent-foreground)] border border-black/10 shadow-[inset_0px_1px_rgb(255_255_255/.2)]',
    filled: 'bg-zinc-800/5 hover:bg-zinc-800/10 text-zinc-800',
    outline: 'bg-white hover:bg-zinc-50 text-zinc-800 border border-zinc-200 border-b-zinc-300/80',
    danger: 'bg-red-500 hover:bg-red-600 text-white shadow-[inset_0px_1px_var(--color-red-500),inset_0px_2px_rgb(255_255_255/.15)]',
    ghost: 'bg-transparent hover:bg-zinc-800/5 text-zinc-800',
    subtle: 'bg-transparent hover:bg-zinc-800/5 text-zinc-500 hover:text-zinc-800',
};

export function Button({
    variant = 'outline',
    size = 'base',
    icon,
    iconTrailing,
    href,
    external,
    loading = false,
    className,
    children,
    type = 'button',
    ...rest
}) {
    const square = !children;
    const [psDefault, psIcon, peDefault, peIcon, sq] = BTN_PAD[size];
    const classes = cx(
        'relative inline-flex items-center justify-center font-medium whitespace-nowrap transition-colors duration-150',
        'disabled:opacity-50 disabled:cursor-default disabled:pointer-events-none disabled:shadow-none',
        BTN_SIZE[size],
        square ? sq : cx(icon ? psIcon : psDefault, iconTrailing ? peIcon : peDefault),
        BTN_VARIANT[variant],
        variant === 'outline' && size !== 'xs' && 'shadow-xs',
        'cursor-pointer',
        className,
    );
    const iconVariant = size === 'xs' || !square ? 'micro' : 'mini';
    const content = (
        <>
            {loading ? <Spinner className="size-4" /> : icon && <Icon name={icon} variant={iconVariant} />}
            {children}
            {iconTrailing && <Icon name={iconTrailing} variant={iconVariant} />}
        </>
    );

    if (href) {
        if (external) {
            return (
                <a href={href} target="_blank" rel="noopener noreferrer" className={classes} {...rest}>
                    {content}
                </a>
            );
        }
        return (
            <Link to={href} className={classes} {...rest}>
                {content}
            </Link>
        );
    }

    return (
        <button type={type} className={classes} disabled={rest.disabled || loading} {...rest}>
            {content}
        </button>
    );
}

export function Spinner({ className }) {
    return (
        <svg className={cx('animate-spin', className)} viewBox="0 0 24 24" fill="none" aria-hidden="true">
            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
        </svg>
    );
}

/* ---------------------------------------------------------------- Fields */

export function Field({ label, description, error, htmlFor, className, children }) {
    return (
        <div className={cx('grid content-start gap-2', className)}>
            {label && (
                <label htmlFor={htmlFor} className="text-sm leading-tight font-medium text-zinc-700">
                    {label}
                </label>
            )}
            {description && <p className="-mt-0.5 text-sm text-zinc-500">{description}</p>}
            {children}
            {error && <p className="text-sm font-medium text-red-500">{error}</p>}
        </div>
    );
}

export function Input({ label, description, error, icon, className, size, viewable, clearable, onClear, type = 'text', ...rest }) {
    const id = useId();
    const [show, setShow] = useState(false);
    const inputType = viewable ? (show ? 'text' : 'password') : type;
    return (
        <Field label={label} description={description} error={error} htmlFor={id} className={className}>
            <div className="relative">
                {icon && <Icon name={icon} variant="outline" className="pointer-events-none absolute top-1/2 left-3 size-5 -translate-y-1/2 text-zinc-400" />}
                <input
                    id={id}
                    type={inputType}
                    aria-invalid={error ? 'true' : undefined}
                    className={cx(
                        'tt-control',
                        size === 'sm' ? 'h-8 py-1' : 'h-10 py-2',
                        type === 'file' && 'h-auto! py-1.5 file:mr-3 file:rounded-md file:border-0 file:bg-zinc-100 file:px-3 file:py-1.5 file:text-sm file:font-medium file:text-zinc-700',
                        icon && 'ps-10',
                        (viewable || clearable) && 'pe-10',
                    )}
                    {...rest}
                />
                {viewable && (
                    <button type="button" onClick={() => setShow((s) => !s)} className="absolute top-1/2 right-2 grid size-7 -translate-y-1/2 cursor-pointer place-items-center rounded-md text-zinc-400 hover:text-zinc-700" aria-label={show ? 'Hide password' : 'Show password'}>
                        <Icon name={show ? 'eye-slash' : 'eye'} variant="mini" className="size-4" />
                    </button>
                )}
                {clearable && rest.value && (
                    <button type="button" onClick={onClear} className="absolute top-1/2 right-2 grid size-7 -translate-y-1/2 cursor-pointer place-items-center rounded-md text-zinc-400 hover:text-zinc-700" aria-label="Clear">
                        <Icon name="x-mark" variant="micro" />
                    </button>
                )}
            </div>
        </Field>
    );
}

export function Textarea({ label, description, error, className, rows = 4, ...rest }) {
    const id = useId();
    return (
        <Field label={label} description={description} error={error} htmlFor={id} className={className}>
            <textarea id={id} rows={rows} aria-invalid={error ? 'true' : undefined} className="tt-control resize-y py-2 leading-normal" {...rest} />
        </Field>
    );
}

export function Select({ label, description, error, className, size, placeholder, options = [], children, ...rest }) {
    const id = useId();
    return (
        <Field label={label} description={description} error={error} htmlFor={id} className={className}>
            <select id={id} aria-invalid={error ? 'true' : undefined} className={cx('tt-control tt-select-chevron cursor-pointer', size === 'sm' ? 'h-8 py-1' : 'h-10 py-2')} {...rest}>
                {placeholder && (
                    <option value="" disabled>
                        {placeholder}
                    </option>
                )}
                {options.map((o) => (
                    <option key={o.value} value={o.value}>
                        {o.label}
                    </option>
                ))}
                {children}
            </select>
        </Field>
    );
}

export function Checkbox({ label, description, className, ...rest }) {
    const id = useId();
    return (
        <div className={cx('flex gap-3', className)}>
            <input id={id} type="checkbox" className="tt-check mt-px" {...rest} />
            {(label || description) && (
                <label htmlFor={id} className="grid cursor-pointer gap-1">
                    {label && <span className="text-sm leading-tight font-medium text-zinc-800">{label}</span>}
                    {description && <span className="text-sm text-zinc-500">{description}</span>}
                </label>
            )}
        </div>
    );
}

export function CheckboxGroup({ label, description, options, value, onChange, disabled, className }) {
    const toggle = (v) => onChange(value.includes(v) ? value.filter((x) => x !== v) : [...value, v]);
    return (
        <fieldset className={cx('grid content-start gap-3', className)} disabled={disabled}>
            {label && <legend className="mb-2 text-sm leading-tight font-medium text-zinc-700">{label}</legend>}
            {description && <p className="-mt-1 text-sm text-zinc-500">{description}</p>}
            {options.map((o) => (
                <Checkbox key={o.value} label={o.label} checked={value.includes(o.value)} onChange={() => toggle(o.value)} />
            ))}
        </fieldset>
    );
}

/** Flux radio group, variant="cards". */
export function RadioCards({ options, value, onChange, name }) {
    return (
        <div className="flex flex-col gap-3">
            {options.map((o) => (
                <label
                    key={o.value}
                    className={cx(
                        'flex cursor-pointer gap-3 rounded-lg border p-4 shadow-xs transition-colors',
                        value === o.value ? 'border-brand ring-1 ring-brand' : 'border-zinc-200 hover:border-zinc-300',
                    )}
                >
                    <input type="radio" name={name} className="tt-radio mt-px" checked={value === o.value} onChange={() => onChange(o.value)} />
                    <span className="grid gap-1">
                        <span className="text-sm leading-tight font-medium text-zinc-800">{o.label}</span>
                        {o.description && <span className="text-sm text-zinc-500">{o.description}</span>}
                    </span>
                </label>
            ))}
        </div>
    );
}

export function Switch({ checked, onChange, label }) {
    return (
        <button
            type="button"
            role="switch"
            aria-checked={checked}
            aria-label={label}
            onClick={() => onChange(!checked)}
            className={cx('relative inline-flex h-5 w-8 shrink-0 cursor-pointer items-center rounded-full p-0.5 transition-colors', checked ? 'bg-brand' : 'bg-zinc-800/15')}
        >
            <span className={cx('size-3.5 rounded-full bg-white shadow-sm transition-transform', checked ? 'translate-x-3' : 'translate-x-0.5')} />
        </button>
    );
}

/* ------------------------------------------------------- Badges & status */

const BADGE_COLORS = {
    zinc: 'text-zinc-700 bg-zinc-400/15',
    red: 'text-red-700 bg-red-400/20',
    green: 'text-green-800 bg-green-400/20',
    yellow: 'text-yellow-800 bg-yellow-400/25',
    amber: 'text-amber-700 bg-amber-400/25',
    blue: 'text-blue-800 bg-blue-400/20',
};

export function Badge({ color = 'zinc', size, icon, className, children }) {
    return (
        <span className={cx('inline-flex items-center gap-1 rounded-md px-2 font-medium whitespace-nowrap', size === 'sm' ? 'py-1 text-xs' : 'py-1 text-sm', BADGE_COLORS[color], className)}>
            {icon && <Icon name={icon} variant="micro" className="size-3" />}
            {children}
        </span>
    );
}

const TONES = {
    green: 'bg-green-50 text-green-700 ring-green-600/20',
    amber: 'bg-amber-50 text-amber-700 ring-amber-600/20',
    yellow: 'bg-amber-50 text-amber-700 ring-amber-600/20',
    red: 'bg-red-50 text-red-700 ring-red-600/15',
    blue: 'bg-blue-50 text-blue-700 ring-blue-600/20',
    sky: 'bg-blue-50 text-blue-700 ring-blue-600/20',
};

/** x-tt.status — pass an enum value ({label, tone}) or a tone + label. */
export function Status({ value, label, tone, className }) {
    const t = tone ?? value?.tone ?? 'zinc';
    return (
        <span className={cx('inline-flex w-max items-center gap-1.5 rounded-full px-2.5 py-0.5 text-xs font-medium whitespace-nowrap ring-1 ring-inset', TONES[t] ?? 'bg-zinc-100 text-zinc-600 ring-zinc-500/15', className)}>
            <span className="tt-dot" />
            {label ?? value?.label}
        </span>
    );
}

/* ---------------------------------------------------------------- Callout */

const CALLOUTS = {
    success: ['border-green-200 bg-green-50', 'text-green-800', 'text-green-600'],
    danger: ['border-red-200 bg-red-50', 'text-red-800', 'text-red-500'],
    warning: ['border-amber-200 bg-amber-50', 'text-amber-800', 'text-amber-500'],
    secondary: ['border-zinc-200 bg-zinc-50', 'text-zinc-700', 'text-zinc-400'],
    default: ['border-zinc-200 bg-white', 'text-zinc-700', 'text-zinc-400'],
};

export function Callout({ variant = 'default', icon, className, children }) {
    const [box, text, ic] = CALLOUTS[variant] ?? CALLOUTS.default;
    return (
        <div className={cx('flex gap-3 rounded-xl border p-4 text-sm leading-relaxed', box, text, className)} role={variant === 'danger' ? 'alert' : undefined}>
            {icon && <Icon name={icon} variant="mini" className={cx('mt-px', ic)} />}
            <div className="min-w-0 flex-1">{children}</div>
        </div>
    );
}

/* -------------------------------------------------------------- tt-* kit */

export function PageHeader({ title, description, eyebrow, actions }) {
    return (
        <div className="mb-8 flex flex-wrap items-end justify-between gap-x-6 gap-y-4">
            <div className="grid max-w-2xl gap-1.5">
                {eyebrow && <span className="tt-eyebrow">{eyebrow}</span>}
                <h1 className="text-2xl font-semibold tracking-tight text-zinc-900 sm:text-[28px] sm:leading-tight">{title}</h1>
                {description && <p className="text-[15px] leading-relaxed text-zinc-500">{description}</p>}
            </div>
            {actions && <div className="flex flex-wrap items-center gap-2">{actions}</div>}
        </div>
    );
}

export function Stat({ label, value, hint, icon, className }) {
    return (
        <div className={cx('tt-card flex items-start justify-between gap-4 p-5', className)}>
            <div className="grid min-w-0 gap-1">
                <span className="text-sm font-medium text-zinc-500">{label}</span>
                <span className="truncate text-[26px] leading-tight font-semibold tracking-tight text-zinc-900 tabular-nums">{value}</span>
                {hint && <span className="text-xs text-zinc-400">{hint}</span>}
            </div>
            {icon && (
                <span className="tt-icon-tile">
                    <Icon name={icon} variant="mini" className="size-5" />
                </span>
            )}
        </div>
    );
}

export function Empty({ title, icon = 'inbox', actions, className, children }) {
    return (
        <div className={cx('grid justify-items-center gap-2 rounded-xl border border-dashed border-zinc-300 bg-white px-6 py-12 text-center', className)}>
            <span className="mb-1 grid size-12 place-items-center rounded-full bg-brand-soft text-brand">
                <Icon name={icon} className="size-6" />
            </span>
            <p className="text-[15px] font-semibold text-zinc-900">{title}</p>
            {children && <div className="max-w-md text-sm leading-relaxed text-zinc-500">{children}</div>}
            {actions && <div className="mt-3 flex flex-wrap justify-center gap-2">{actions}</div>}
        </div>
    );
}

export function Crumbs({ items }) {
    return (
        <nav className="tt-crumbs" aria-label="Breadcrumb">
            {items.map((item, i) => (
                <span key={i} className="contents">
                    {i > 0 && <Icon name="chevron-right" variant="micro" className="text-zinc-400" />}
                    {item.href ? (
                        <Link to={item.href}>{item.label}</Link>
                    ) : (
                        <span aria-current="page">{item.label}</span>
                    )}
                </span>
            ))}
        </nav>
    );
}

export function Avatar({ initials, className }) {
    return <span className={cx('grid size-10 shrink-0 place-items-center rounded-lg bg-zinc-200 text-sm font-medium text-zinc-800', className)}>{initials}</span>;
}

export function Tabs({ tabs, value, onChange, className }) {
    return (
        <div className={cx('tt-tabs', className)} role="tablist">
            {tabs.map((t) => (
                <button key={t.value} role="tab" aria-selected={value === t.value} onClick={() => onChange(t.value)} className={cx('tt-tab', value === t.value && 'is-active')}>
                    {t.icon && <Icon name={t.icon} variant="micro" />}
                    {t.label}
                    {t.count !== undefined && <span className="tt-count">{t.count}</span>}
                </button>
            ))}
        </div>
    );
}

export function Chips({ options, value, onChange, className }) {
    return (
        <div className={cx('flex gap-2 overflow-x-auto pb-1 [scrollbar-width:none]', className)}>
            {options.map((o) => (
                <button key={o.value} onClick={() => onChange(o.value)} className={cx('tt-chip', o.className, value === o.value && 'is-active')}>
                    {o.label}
                </button>
            ))}
        </div>
    );
}

/* ------------------------------------------------------------- Pagination */

export function Pagination({ page, total, perPage, onChange }) {
    const pages = Math.ceil(total / perPage);
    if (pages <= 1) return null;
    const from = (page - 1) * perPage + 1;
    const to = Math.min(page * perPage, total);
    const btn = 'grid h-9 min-w-9 cursor-pointer place-items-center rounded-lg border border-zinc-200 bg-white px-3 text-sm font-medium text-zinc-700 shadow-xs transition-colors hover:bg-zinc-50 disabled:cursor-default disabled:opacity-50';
    return (
        <nav className="flex flex-wrap items-center justify-between gap-3" aria-label="Pagination">
            <p className="text-sm text-zinc-500">
                Showing <span className="font-medium text-zinc-900 tabular-nums">{from}</span> to <span className="font-medium text-zinc-900 tabular-nums">{to}</span> of{' '}
                <span className="font-medium text-zinc-900 tabular-nums">{total}</span> results
            </p>
            <div className="flex gap-1.5">
                <button className={btn} disabled={page === 1} onClick={() => onChange(page - 1)} aria-label="Previous page">
                    <Icon name="arrow-left" variant="micro" />
                </button>
                {Array.from({ length: pages }, (_, i) => i + 1).map((p) => (
                    <button key={p} className={cx(btn, p === page && 'border-brand-line! bg-brand-soft! text-brand!')} aria-current={p === page ? 'page' : undefined} onClick={() => onChange(p)}>
                        {p}
                    </button>
                ))}
                <button className={btn} disabled={page === pages} onClick={() => onChange(page + 1)} aria-label="Next page">
                    <Icon name="arrow-right" variant="micro" />
                </button>
            </div>
        </nav>
    );
}

/* ------------------------------------------------------------------ Modal */

export function Modal({ open, onClose, className, children, labelledBy }) {
    const panel = useRef(null);
    // Keep the latest onClose without re-running the effect: callers usually pass an
    // inline function, and re-running would steal focus on every render while typing.
    const closeRef = useRef(onClose);
    closeRef.current = onClose;
    useEffect(() => {
        if (!open) return;
        const onKey = (e) => e.key === 'Escape' && closeRef.current();
        document.addEventListener('keydown', onKey);
        const prev = document.body.style.overflow;
        document.body.style.overflow = 'hidden';
        (panel.current?.querySelector('input:not([type=hidden]),select,textarea') ?? panel.current?.querySelector('button'))?.focus();
        return () => {
            document.removeEventListener('keydown', onKey);
            document.body.style.overflow = prev;
        };
    }, [open]);
    if (!open) return null;
    return createPortal(
        <div className="fixed inset-0 z-[60] grid place-items-center overflow-y-auto p-4">
            <div className="tt-anim-fade fixed inset-0 bg-zinc-900/40" onClick={onClose} />
            <div ref={panel} role="dialog" aria-modal="true" aria-labelledby={labelledBy} className={cx('tt-anim-pop relative w-full max-w-lg rounded-xl border border-zinc-200 bg-white p-6 shadow-xl sm:p-8', className)}>
                <button onClick={onClose} className="absolute top-3 right-3 grid size-8 cursor-pointer place-items-center rounded-md text-zinc-400 hover:bg-zinc-100 hover:text-zinc-700" aria-label="Close">
                    <Icon name="x-mark" variant="mini" />
                </button>
                {children}
            </div>
        </div>,
        document.body,
    );
}

/* --------------------------------------------------------------- Dropdown */

export function Dropdown({ trigger, children, align = 'end', className }) {
    const [open, setOpen] = useState(false);
    const root = useRef(null);
    useEffect(() => {
        if (!open) return;
        const onDoc = (e) => !root.current?.contains(e.target) && setOpen(false);
        const onKey = (e) => e.key === 'Escape' && setOpen(false);
        document.addEventListener('mousedown', onDoc);
        document.addEventListener('keydown', onKey);
        return () => {
            document.removeEventListener('mousedown', onDoc);
            document.removeEventListener('keydown', onKey);
        };
    }, [open]);
    return (
        <div ref={root} className="relative">
            {trigger({ open, toggle: () => setOpen((o) => !o) })}
            {open && (
                <div
                    role="menu"
                    onClick={() => setOpen(false)}
                    className={cx('tt-anim-pop absolute top-full z-50 mt-1.5 rounded-lg border border-zinc-200 bg-white p-[.3125rem] shadow-xs', align === 'end' ? 'right-0' : 'left-0', className)}
                >
                    {children}
                </div>
            )}
        </div>
    );
}

export function MenuItem({ icon, href, onClick, danger, children }) {
    const cls = cx('flex w-full cursor-pointer items-center gap-2 rounded-md px-2 py-1.5 text-start text-sm font-medium', danger ? 'text-zinc-800 hover:bg-red-50 hover:text-red-700' : 'text-zinc-800 hover:bg-zinc-50');
    const content = (
        <>
            {icon && <Icon name={icon} variant="mini" className="text-zinc-400" />}
            {children}
        </>
    );
    return href ? (
        <Link to={href} className={cls} role="menuitem">
            {content}
        </Link>
    ) : (
        <button type="button" onClick={onClick} className={cls} role="menuitem">
            {content}
        </button>
    );
}

export function MenuSeparator() {
    return <div className="-mx-[.3125rem] my-[.3125rem] h-px bg-zinc-200" />;
}

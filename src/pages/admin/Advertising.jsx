/* Admin: Advertising Management — overview, applications, campaigns and packages. */
import { useState } from 'react';
import { Link } from 'react-router-dom';
import { useFeedback } from '../../components/Feedback';
import { AdStatusPair, campaignName } from '../../components/sponsored/AdParts';
import { Badge, Button, CheckboxGroup, Dropdown, Empty, Icon, Input, MenuItem, MenuSeparator, Modal, PageHeader, Select, Stat, Status, Switch, Tabs, Textarea } from '../../components/ui';
import { AD_CAMPAIGN_STATUSES, AD_CATEGORIES, AD_PLACEMENTS, AD_REVIEW_STATUSES, adStatus, liveAds } from '../../data/advertising';
import { sortByAsc, sortByDesc } from '../../data/queries';
import { useStore } from '../../data/store';
import { usePerform } from '../../hooks/usePerform';
import { useQueryState } from '../../hooks/useQueryState';
import { useTitle } from '../../hooks/useTitle';
import { diffForHumans, fmtDate, money } from '../../utils/format';

const sum = (list) => list.reduce((a, c) => a + c.price_minor, 0);

function Filters({ q, setQ, status, setStatus, statuses, placement, setPlacement }) {
    return (
        <div className="mb-4 flex flex-wrap gap-3">
            <Input icon="magnifying-glass" placeholder="Search advertiser, reference or email" className="w-full max-w-sm" value={q} onChange={(e) => setQ(e.target.value)} aria-label="Search" />
            <Select className="w-48" value={status} onChange={(e) => setStatus(e.target.value)} aria-label="Status">
                <option value="">All statuses</option>
                {statuses.map((s) => (
                    <option key={s} value={s}>
                        {adStatus(s).label}
                    </option>
                ))}
            </Select>
            {setPlacement && (
                <Select className="w-52" value={placement} onChange={(e) => setPlacement(e.target.value)} aria-label="Placement">
                    <option value="">All placements</option>
                    {Object.entries(AD_PLACEMENTS).map(([k, p]) => (
                        <option key={k} value={k}>
                            {p.label}
                        </option>
                    ))}
                </Select>
            )}
        </div>
    );
}

function Overview({ db }) {
    const all = db.adCampaigns.filter((c) => c.status !== 'draft');
    const paid = all.filter((c) => c.payment_status === 'paid');
    const awaiting = all.filter((c) => c.payment_status === 'awaiting_payment');
    const queue = sortByAsc(
        all.filter((c) => AD_REVIEW_STATUSES.includes(c.status)),
        'created_at',
    );
    return (
        <div className="grid gap-8">
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
                <Stat label="Total applications" value={all.length} icon="inbox-arrow-down" hint="Excluding drafts" />
                <Stat label="Pending review" value={all.filter((c) => c.status === 'pending_review').length} icon="clock" hint={`${all.filter((c) => c.status === 'changes_requested').length} awaiting changes`} />
                <Stat label="Approved campaigns" value={all.filter((c) => ['approved', 'scheduled'].includes(c.status)).length} icon="check-badge" hint="Approved or scheduled" />
                <Stat label="Active campaigns" value={all.filter((c) => c.status === 'active').length} icon="signal" />
                <Stat label="Advertising revenue" value={money(sum(paid))} icon="banknotes" hint={`Illustrative · mock data · ${money(sum(awaiting))} awaiting`} />
            </div>

            <div className="grid grid-cols-1 gap-6 xl:grid-cols-2">
                <section className="tt-card overflow-hidden">
                    <div className="tt-card-head">
                        <h2>Review queue</h2>
                        <Link to="/admin/advertising?tab=applications" className="tt-link text-sm">
                            All applications
                        </Link>
                    </div>
                    {queue.length === 0 ? (
                        <div className="flex items-center gap-3 px-5 py-5 text-sm text-zinc-500">
                            <Icon name="check-circle" variant="mini" className="text-green-600" />
                            No applications waiting for review.
                        </div>
                    ) : (
                        queue.map((c) => (
                            <Link key={c.id} to={`/admin/advertising/${c.reference}`} className="tt-row tt-row-link">
                                <div className="flex min-w-0 items-center gap-3">
                                    <span className="tt-icon-tile size-9">
                                        <Icon name={AD_PLACEMENTS[c.placement].icon} variant="micro" />
                                    </span>
                                    <div className="min-w-0">
                                        <p className="truncate font-medium text-zinc-900">{c.company}</p>
                                        <p className="truncate text-xs text-zinc-500">
                                            {AD_PLACEMENTS[c.placement].label} · {diffForHumans(c.updated_at)}
                                        </p>
                                    </div>
                                </div>
                                <Status value={adStatus(c.status)} />
                            </Link>
                        ))
                    )}
                </section>

                <section className="tt-card overflow-hidden">
                    <div className="tt-card-head">
                        <h2>Live placements</h2>
                        <span className="text-xs text-zinc-500">Active, paid campaigns within their dates</span>
                    </div>
                    {Object.entries(AD_PLACEMENTS).map(([key, p]) => {
                        const live = liveAds(db, key);
                        return (
                            <div key={key} className="tt-row">
                                <div className="flex min-w-0 items-center gap-3">
                                    <span className="tt-icon-tile size-9">
                                        <Icon name={p.icon} variant="micro" />
                                    </span>
                                    <div className="min-w-0">
                                        <p className="font-medium text-zinc-900">{p.label}</p>
                                        <p className="truncate text-xs text-zinc-500">{live.length ? live.map((c) => c.company).join(', ') : 'Nothing live'}</p>
                                    </div>
                                </div>
                                <span className="rounded-md bg-zinc-100 px-2 py-1 text-xs font-semibold text-zinc-700 tabular-nums">{live.length}</span>
                            </div>
                        );
                    })}
                </section>
            </div>
        </div>
    );
}

function Applications({ db, pkgName }) {
    const [q, setQ] = useState('');
    const [status, setStatus] = useState('pending_review');
    const term = q.trim().toLowerCase();
    const list = sortByDesc(
        db.adCampaigns.filter(
            (c) => c.status !== 'draft' && (status ? c.status === status : true) && (!term || `${c.company} ${c.reference} ${c.email}`.toLowerCase().includes(term)),
        ),
        'created_at',
    );
    return (
        <>
            <Filters q={q} setQ={setQ} status={status} setStatus={setStatus} statuses={['pending_review', 'changes_requested', 'approved', 'rejected', 'cancelled']} />
            <div className="tt-card overflow-x-auto">
                <table className="tt-table min-w-[900px]">
                    <thead>
                        <tr>
                            <th>Advertiser</th>
                            <th>Category</th>
                            <th>Placement · Package</th>
                            <th>Submitted</th>
                            <th>Status</th>
                            <th />
                        </tr>
                    </thead>
                    <tbody>
                        {list.length === 0 && (
                            <tr>
                                <td colSpan={6} className="text-center text-zinc-500">
                                    No applications match these filters.
                                </td>
                            </tr>
                        )}
                        {list.map((c) => (
                            <tr key={c.id}>
                                <td>
                                    <p className="font-medium text-zinc-900">{c.company}</p>
                                    <p className="text-xs text-zinc-500 tabular-nums">
                                        {c.reference} · {c.email}
                                    </p>
                                </td>
                                <td className="text-zinc-600">{AD_CATEGORIES[c.category]}</td>
                                <td>
                                    {AD_PLACEMENTS[c.placement]?.label}
                                    <p className="text-xs text-zinc-500">
                                        {pkgName(c.package_id)} · {money(c.price_minor)}
                                    </p>
                                </td>
                                <td className="text-xs tabular-nums">{fmtDate(c.created_at)}</td>
                                <td>
                                    <Status value={adStatus(c.status)} />
                                </td>
                                <td className="text-right">
                                    <Button size="sm" variant={AD_REVIEW_STATUSES.includes(c.status) ? 'primary' : 'ghost'} href={`/admin/advertising/${c.reference}`}>
                                        {c.status === 'pending_review' ? 'Review' : 'View'}
                                    </Button>
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>
        </>
    );
}

function Campaigns({ db, pkgName, actions, perform, confirm }) {
    const [q, setQ] = useState('');
    const [status, setStatus] = useState('');
    const [placement, setPlacement] = useState('');
    const term = q.trim().toLowerCase();
    const list = sortByDesc(
        db.adCampaigns.filter(
            (c) => AD_CAMPAIGN_STATUSES.includes(c.status) && (!status || c.status === status) && (!placement || c.placement === placement) && (!term || `${c.company} ${c.reference}`.toLowerCase().includes(term)),
        ),
        'start_date',
    );
    const setStatusFor = async (c, next) => {
        if (next === 'cancelled' && !(await confirm(`Cancel ${c.company}'s campaign ${c.reference}? It will be removed from any placement.`, { confirmLabel: 'Cancel campaign', danger: true }))) return;
        perform(() => actions.setAdStatus(c.id, next), `${c.reference} marked ${next}.`);
    };
    return (
        <>
            <Filters q={q} setQ={setQ} status={status} setStatus={setStatus} statuses={AD_CAMPAIGN_STATUSES} placement={placement} setPlacement={setPlacement} />
            {list.length === 0 ? (
                <Empty title="No campaigns match these filters" icon="megaphone" />
            ) : (
                <div className="tt-card overflow-x-auto">
                    <table className="tt-table min-w-[980px]">
                        <thead>
                            <tr>
                                <th>Campaign</th>
                                <th>Placement</th>
                                <th>Package · price</th>
                                <th>Dates</th>
                                <th>Status · Payment</th>
                                <th className="w-12" aria-label="Actions" />
                            </tr>
                        </thead>
                        <tbody>
                            {list.map((c) => (
                                <tr key={c.id}>
                                    <td>
                                        <Link to={`/admin/advertising/${c.reference}`} className="font-medium text-zinc-900 hover:text-brand">
                                            {campaignName(c)}
                                        </Link>
                                        <p className="text-xs text-zinc-500 tabular-nums">{c.reference}</p>
                                    </td>
                                    <td className="text-zinc-600">{AD_PLACEMENTS[c.placement]?.label}</td>
                                    <td>
                                        {pkgName(c.package_id)}
                                        <p className="text-xs text-zinc-500 tabular-nums">{money(c.price_minor)}</p>
                                    </td>
                                    <td className="text-xs whitespace-nowrap tabular-nums">
                                        {fmtDate(c.start_date)} – {fmtDate(c.end_date)}
                                    </td>
                                    <td>
                                        <AdStatusPair campaign={c} />
                                    </td>
                                    <td className="text-right">
                                        <Dropdown
                                            className="min-w-56"
                                            trigger={({ toggle, open }) => (
                                                <button type="button" onClick={toggle} aria-expanded={open} aria-label={`Actions for ${c.reference}`} className="grid size-8 cursor-pointer place-items-center rounded-md text-zinc-500 hover:bg-zinc-100 hover:text-zinc-900">
                                                    <Icon name="ellipsis-horizontal" variant="mini" />
                                                </button>
                                            )}
                                        >
                                            <MenuItem icon="pencil-square" href={`/admin/advertising/${c.reference}`}>
                                                Manage campaign
                                            </MenuItem>
                                            <MenuSeparator />
                                            {c.status !== 'scheduled' && !['completed', 'cancelled'].includes(c.status) && (
                                                <MenuItem icon="calendar" onClick={() => setStatusFor(c, 'scheduled')}>
                                                    Mark scheduled
                                                </MenuItem>
                                            )}
                                            {c.status !== 'active' && !['completed', 'cancelled'].includes(c.status) && (
                                                <MenuItem icon="signal" onClick={() => setStatusFor(c, 'active')}>
                                                    Mark active
                                                </MenuItem>
                                            )}
                                            {c.status === 'active' && (
                                                <MenuItem icon="check-circle" onClick={() => setStatusFor(c, 'completed')}>
                                                    Mark completed
                                                </MenuItem>
                                            )}
                                            <MenuItem icon="credit-card" onClick={() => perform(() => actions.setAdPayment(c.id, c.payment_status === 'paid' ? 'awaiting_payment' : 'paid'), 'Payment status updated (demo).')}>
                                                {c.payment_status === 'paid' ? 'Mark payment outstanding' : 'Mark as paid (demo)'}
                                            </MenuItem>
                                            {!['completed', 'cancelled'].includes(c.status) && (
                                                <>
                                                    <MenuSeparator />
                                                    <MenuItem icon="x-circle" danger onClick={() => setStatusFor(c, 'cancelled')}>
                                                        Cancel campaign
                                                    </MenuItem>
                                                </>
                                            )}
                                        </Dropdown>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            )}
        </>
    );
}

const EMPTY_PACKAGE = { name: '', description: '', placements: ['sponsored_listing'], duration_days: '30', price: '', features: '' };

function Packages({ db, actions, perform }) {
    const [editing, setEditing] = useState(null);
    const [errors, setErrors] = useState({});

    const open = (pkg) => {
        setErrors({});
        setEditing(
            pkg
                ? { id: pkg.id, name: pkg.name, description: pkg.description, placements: pkg.placements, duration_days: String(pkg.duration_days), price: String(pkg.price_minor / 100), features: pkg.features.join('\n') }
                : { ...EMPTY_PACKAGE },
        );
    };

    const save = (e) => {
        e.preventDefault();
        const errs = {};
        if (!editing.name.trim()) errs.name = 'The package name is required.';
        if (editing.placements.length === 0) errs.placements = 'Choose at least one placement.';
        if (!(Number(editing.duration_days) >= 1 && Number(editing.duration_days) <= 365)) errs.duration_days = 'Enter a duration between 1 and 365 days.';
        if (!(Number(editing.price) >= 0) || editing.price === '') errs.price = 'Enter an illustrative price (0 or more).';
        setErrors(errs);
        if (Object.keys(errs).length) return;
        const ok = perform(
            () =>
                actions.saveAdPackage({
                    ...(editing.id ? { id: editing.id } : {}),
                    name: editing.name.trim(),
                    description: editing.description.trim(),
                    placements: editing.placements,
                    duration_days: Number(editing.duration_days),
                    price_minor: Math.round(Number(editing.price) * 100),
                    features: editing.features.split(/\r?\n/).map((l) => l.trim()).filter(Boolean),
                }),
            editing.id ? 'Package updated.' : 'Package added.',
        );
        if (ok) setEditing(null);
    };

    return (
        <>
            <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
                <p className="text-sm text-zinc-500">Prices are illustrative draft pricing. Inactive packages are hidden from the advertise page and new applications.</p>
                <Button variant="primary" icon="plus" onClick={() => open(null)}>
                    Add package
                </Button>
            </div>
            <div className="tt-card overflow-x-auto">
                <table className="tt-table min-w-[860px]">
                    <thead>
                        <tr>
                            <th>Package</th>
                            <th>Placements</th>
                            <th>Duration</th>
                            <th className="text-right">Illustrative price</th>
                            <th>Campaigns</th>
                            <th>Active</th>
                            <th />
                        </tr>
                    </thead>
                    <tbody>
                        {db.adPackages.map((p) => (
                            <tr key={p.id}>
                                <td>
                                    <p className="font-medium text-zinc-900">{p.name}</p>
                                    <p className="max-w-xs truncate text-xs text-zinc-500">{p.description}</p>
                                </td>
                                <td>
                                    <div className="flex flex-wrap gap-1">
                                        {p.placements.map((pl) => (
                                            <Badge key={pl} size="sm">
                                                {AD_PLACEMENTS[pl].label}
                                            </Badge>
                                        ))}
                                    </div>
                                </td>
                                <td className="tabular-nums">{p.duration_days} days</td>
                                <td className="text-right tabular-nums">{money(p.price_minor)}</td>
                                <td className="tabular-nums">{db.adCampaigns.filter((c) => c.package_id === p.id).length}</td>
                                <td>
                                    <Switch checked={p.is_active} onChange={() => perform(() => actions.toggleAdPackage(p.id), p.is_active ? `${p.name} deactivated.` : `${p.name} activated.`)} label={`${p.is_active ? 'Deactivate' : 'Activate'} ${p.name}`} />
                                </td>
                                <td className="text-right">
                                    <Button size="sm" variant="ghost" icon="pencil-square" onClick={() => open(p)}>
                                        Edit
                                    </Button>
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>

            <Modal open={!!editing} onClose={() => setEditing(null)} className="max-w-xl">
                {editing && (
                    <form onSubmit={save} className="grid gap-4" noValidate>
                        <h2 className="pr-6 text-lg font-semibold text-zinc-900">{editing.id ? `Edit ${editing.name}` : 'Add package'}</h2>
                        <Input label="Package name" value={editing.name} onChange={(e) => setEditing({ ...editing, name: e.target.value })} error={errors.name} />
                        <Input label="Short description" value={editing.description} onChange={(e) => setEditing({ ...editing, description: e.target.value })} />
                        <CheckboxGroup
                            label="Placements"
                            options={Object.entries(AD_PLACEMENTS).map(([value, p]) => ({ value, label: p.label }))}
                            value={editing.placements}
                            onChange={(v) => setEditing({ ...editing, placements: v })}
                        />
                        {errors.placements && <p className="-mt-2 text-sm font-medium text-red-500">{errors.placements}</p>}
                        <div className="grid gap-4 sm:grid-cols-2">
                            <Input label="Duration (days)" type="number" min={1} value={editing.duration_days} onChange={(e) => setEditing({ ...editing, duration_days: e.target.value })} error={errors.duration_days} />
                            <Input label="Illustrative price (RM)" type="number" min={0} step="0.01" value={editing.price} onChange={(e) => setEditing({ ...editing, price: e.target.value })} error={errors.price} />
                        </div>
                        <Textarea label="Included features (one per line)" rows={4} value={editing.features} onChange={(e) => setEditing({ ...editing, features: e.target.value })} />
                        <div className="flex justify-end gap-2">
                            <Button onClick={() => setEditing(null)}>Cancel</Button>
                            <Button type="submit" variant="primary">
                                {editing.id ? 'Save package' : 'Add package'}
                            </Button>
                        </div>
                    </form>
                )}
            </Modal>
        </>
    );
}

export default function Advertising() {
    useTitle('Advertising');
    const { db, actions } = useStore();
    const perform = usePerform();
    const { confirm } = useFeedback();
    const [tab, setTab] = useQueryState('tab', 'overview');
    const pkgName = (id) => db.adPackages.find((p) => p.id === id)?.name ?? '—';
    const pending = db.adCampaigns.filter((c) => c.status === 'pending_review').length;

    return (
        <div>
            <PageHeader
                title="Advertising Management"
                eyebrow="Commerce"
                description="Review advertiser applications, manage sponsored campaigns and maintain the illustrative advertising packages. All figures come from demo data."
                actions={
                    <Button icon="arrow-top-right-on-square" href="/advertise">
                        Public advertise page
                    </Button>
                }
            />
            <Tabs
                className="mb-6"
                value={tab}
                onChange={setTab}
                tabs={[
                    { value: 'overview', label: 'Overview' },
                    { value: 'applications', label: 'Applications', count: pending },
                    { value: 'campaigns', label: 'Campaigns' },
                    { value: 'packages', label: 'Packages' },
                ]}
            />
            {tab === 'overview' && <Overview db={db} />}
            {tab === 'applications' && <Applications db={db} pkgName={pkgName} />}
            {tab === 'campaigns' && <Campaigns db={db} pkgName={pkgName} actions={actions} perform={perform} confirm={confirm} />}
            {tab === 'packages' && <Packages db={db} actions={actions} perform={perform} />}
        </div>
    );
}

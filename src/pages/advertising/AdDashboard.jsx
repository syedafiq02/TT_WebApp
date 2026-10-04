/* Advertiser dashboard: stats, campaign table with filters and an action menu. */
import { useState } from 'react';
import { Link } from 'react-router-dom';
import { useFeedback } from '../../components/Feedback';
import { AdStatusPair, campaignName } from '../../components/sponsored/AdParts';
import { Button, Dropdown, Empty, Icon, Input, MenuItem, MenuSeparator, PageHeader, Select, Stat } from '../../components/ui';
import { AD_PLACEMENTS, AD_REVIEW_STATUSES, AD_STATUSES, AD_WITHDRAWABLE, adStatus } from '../../data/advertising';
import { sortByDesc } from '../../data/queries';
import { useStore } from '../../data/store';
import { usePerform } from '../../hooks/usePerform';
import { useQueryState } from '../../hooks/useQueryState';
import { useTitle } from '../../hooks/useTitle';
import { fmtDate } from '../../utils/format';


export default function AdDashboard() {
    useTitle('Advertising');
    const { db, user, actions } = useStore();
    const perform = usePerform();
    const { confirm } = useFeedback();
    const [status, setStatus] = useQueryState('status');
    const [q, setQ] = useState('');

    const mine = sortByDesc(
        db.adCampaigns.filter((c) => c.user_id === user.id),
        'created_at',
    );
    const term = q.trim().toLowerCase();
    const list = mine.filter((c) => (!status || c.status === status) && (!term || `${c.company} ${c.reference} ${c.description}`.toLowerCase().includes(term)));
    const pkgName = (id) => db.adPackages.find((p) => p.id === id)?.name ?? '—';

    const withdraw = async (c) => {
        if (await confirm(`Withdraw ${c.reference}? The application will be cancelled and cannot be reopened.`, { confirmLabel: 'Withdraw', danger: true })) perform(() => actions.withdrawAd(c.id), 'Application withdrawn.');
    };

    return (
        <div>
            <PageHeader
                title="Advertising"
                description="Your advertising applications and campaigns on Terpaling Trader. Statuses and payments are simulated for this demo."
                actions={
                    <>
                        <Button icon="rectangle-group" href="/advertise">
                            Placements &amp; packages
                        </Button>
                        <Button variant="primary" icon="plus" href="/advertise/apply">
                            New campaign
                        </Button>
                    </>
                }
            />

            <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
                <Stat label="Total campaigns" value={mine.length} icon="megaphone" hint="Including drafts" />
                <Stat label="Pending applications" value={mine.filter((c) => AD_REVIEW_STATUSES.includes(c.status)).length} icon="clock" hint="Under review or awaiting your changes" />
                <Stat label="Active campaigns" value={mine.filter((c) => c.status === 'active').length} icon="signal" hint="Live right now" />
                <Stat label="Completed campaigns" value={mine.filter((c) => c.status === 'completed').length} icon="check-circle" />
            </div>

            {mine.length === 0 ? (
                <Empty
                    className="mt-8"
                    title="You haven't created any campaigns yet"
                    icon="megaphone"
                    actions={
                        <>
                            <Button size="sm" href="/advertise">
                                See placements
                            </Button>
                            <Button size="sm" variant="primary" href="/advertise/apply">
                                Start advertising
                            </Button>
                        </>
                    }
                >
                    Promote your trading product, service or brand with a clearly labelled sponsored placement. Every application is reviewed before it goes live.
                </Empty>
            ) : (
                <section className="mt-8 grid grid-cols-1 gap-4">
                    <div className="flex flex-wrap items-center gap-3">
                        <Input icon="magnifying-glass" placeholder="Search campaigns" className="w-full max-w-xs" value={q} onChange={(e) => setQ(e.target.value)} aria-label="Search campaigns" />
                        <Select className="w-48" value={status} onChange={(e) => setStatus(e.target.value)} aria-label="Filter by status">
                            <option value="">All statuses</option>
                            {AD_STATUSES.map((s) => (
                                <option key={s} value={s}>
                                    {adStatus(s).label}
                                </option>
                            ))}
                        </Select>
                    </div>

                    <div className="tt-card overflow-x-auto">
                        <table className="tt-table min-w-[960px]">
                            <thead>
                                <tr>
                                    <th>Campaign</th>
                                    <th>Placement</th>
                                    <th>Package</th>
                                    <th>Start</th>
                                    <th>End</th>
                                    <th>Status · Payment</th>
                                    <th className="w-12" aria-label="Actions" />
                                </tr>
                            </thead>
                            <tbody>
                                {list.length === 0 && (
                                    <tr>
                                        <td colSpan={7} className="text-center text-zinc-500">
                                            No campaigns match these filters.
                                        </td>
                                    </tr>
                                )}
                                {list.map((c) => (
                                    <tr key={c.id}>
                                        <td>
                                            <Link to={`/dashboard/advertising/${c.reference}`} className="font-medium text-zinc-900 hover:text-brand">
                                                {campaignName(c)}
                                            </Link>
                                            <p className="text-xs text-zinc-500 tabular-nums">{c.reference}</p>
                                        </td>
                                        <td className="text-zinc-600">{AD_PLACEMENTS[c.placement]?.label}</td>
                                        <td className="text-zinc-600">{pkgName(c.package_id)}</td>
                                        <td className="text-xs tabular-nums">{c.start_date ? fmtDate(c.start_date) : '—'}</td>
                                        <td className="text-xs tabular-nums">{c.end_date ? fmtDate(c.end_date) : '—'}</td>
                                        <td>
                                            <AdStatusPair campaign={c} />
                                        </td>
                                        <td className="text-right">
                                            <Dropdown
                                                className="min-w-48"
                                                trigger={({ toggle, open }) => (
                                                    <button type="button" onClick={toggle} aria-expanded={open} aria-label={`Actions for ${c.reference}`} className="grid size-8 cursor-pointer place-items-center rounded-md text-zinc-500 hover:bg-zinc-100 hover:text-zinc-900">
                                                        <Icon name="ellipsis-horizontal" variant="mini" />
                                                    </button>
                                                )}
                                            >
                                                <MenuItem icon="eye" href={`/dashboard/advertising/${c.reference}`}>
                                                    View details
                                                </MenuItem>
                                                {['draft', 'changes_requested'].includes(c.status) && (
                                                    <MenuItem icon="pencil-square" href={`/advertise/apply?edit=${c.reference}`}>
                                                        {c.status === 'draft' ? 'Continue editing' : 'Edit & resubmit'}
                                                    </MenuItem>
                                                )}
                                                {AD_WITHDRAWABLE.includes(c.status) && (
                                                    <>
                                                        <MenuSeparator />
                                                        <MenuItem icon="x-circle" danger onClick={() => withdraw(c)}>
                                                            Withdraw
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
                </section>
            )}
        </div>
    );
}

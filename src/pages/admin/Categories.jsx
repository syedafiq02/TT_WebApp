/* pages/admin/categories.blade.php */
import { useState } from 'react';
import { Button, Input, PageHeader, Select, Switch } from '../../components/ui';
import { children, roots } from '../../data/queries';
import { useStore } from '../../data/store';
import { usePerform } from '../../hooks/usePerform';
import { useTitle } from '../../hooks/useTitle';
import { cx } from '../../utils/format';

export default function Categories() {
    useTitle('Categories');
    const { db, actions } = useStore();
    const perform = usePerform();
    const [form, setForm] = useState({ name: '', parent_id: '', description: '' });
    const [error, setError] = useState(null);
    const rootList = roots(db, false);

    return (
        <div>
            <PageHeader title="Categories" description="Two levels: category and subcategory. Providers list services under a subcategory. Inactive categories are hidden from Explore and new listings." />

            <div className="grid grid-cols-1 gap-6 xl:grid-cols-[minmax(0,1.4fr)_minmax(0,1fr)]">
                <div className="grid content-start gap-4">
                    {rootList.map((root) => (
                        <section key={root.id} className="tt-card">
                            <div className="tt-card-head">
                                <div>
                                    <h2 className={cx('font-semibold', !root.is_active && 'text-zinc-500 line-through')}>{root.name}</h2>
                                    <p className="text-xs text-zinc-500">{root.description}</p>
                                </div>
                                <Switch checked={root.is_active} onChange={() => actions.toggleCategory(root.id)} label={`Toggle ${root.name}`} />
                            </div>
                            {children(db, root.id, false).map((child) => (
                                <div key={child.id} className="flex items-center justify-between border-b border-zinc-100 px-5 py-2.5 text-sm last:border-0">
                                    <span className={child.is_active ? undefined : 'text-zinc-500 line-through'}>
                                        {child.name} <span className="ml-2 text-xs text-zinc-400 tabular-nums">{db.services.filter((s) => s.category_id === child.id).length} services</span>
                                    </span>
                                    <Switch checked={child.is_active} onChange={() => actions.toggleCategory(child.id)} label={`Toggle ${child.name}`} />
                                </div>
                            ))}
                        </section>
                    ))}
                </div>

                <form
                    className="tt-card grid content-start gap-4 p-6 xl:sticky xl:top-24 xl:self-start"
                    noValidate
                    onSubmit={(e) => {
                        e.preventDefault();
                        if (!form.name.trim()) return setError('The name field is required.');
                        setError(null);
                        if (perform(() => actions.createCategory(form), 'Category added.')) setForm({ name: '', parent_id: '', description: '' });
                    }}
                >
                    <h2 className="font-semibold">Add category</h2>
                    <Input label="Name" value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} error={error} />
                    <Select label="Parent" value={form.parent_id} onChange={(e) => setForm({ ...form, parent_id: e.target.value })}>
                        <option value="">None (top-level category)</option>
                        {rootList.map((r) => (
                            <option key={r.id} value={r.id}>
                                {r.name}
                            </option>
                        ))}
                    </Select>
                    <Input label="Description (optional)" value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} />
                    <Button type="submit" variant="primary">
                        Add category
                    </Button>
                </form>
            </div>
        </div>
    );
}

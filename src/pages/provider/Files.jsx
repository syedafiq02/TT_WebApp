/* pages/provider/files.blade.php — product files and versions. Uploads are simulated. */
import { useState } from 'react';
import { useFeedback } from '../../components/Feedback';
import { Badge, Button, Callout, Checkbox, Empty, Icon, Input, PageHeader, Select, Spinner, Stat, Textarea } from '../../components/ui';
import { currentVersion, fileDownloads } from '../../data/queries';
import { useProvider } from '../../hooks/useProvider';
import { usePerform } from '../../hooks/usePerform';
import { useQueryState } from '../../hooks/useQueryState';
import { useTitle } from '../../hooks/useTitle';
import { FILE_EXTENSIONS, fmtDate, humanFileSize, MAX_UPLOAD_KB, plural } from '../../utils/format';

const VERSION_RE = /^[0-9A-Za-z.\-_]+$/;

function validateUpload(file) {
    if (!file) return 'The file field is required.';
    const ext = file.name.split('.').pop().toLowerCase();
    if (!FILE_EXTENSIONS.includes(ext)) return `The file field must be a file of type: ${FILE_EXTENSIONS.join(', ')}.`;
    if (file.size > MAX_UPLOAD_KB * 1024) return `The file field must not be greater than ${MAX_UPLOAD_KB} kilobytes.`;
    return null;
}

/** Simulates the Livewire temporary upload progress. */
const simulateUpload = (cb) => setTimeout(cb, 900);

export default function Files() {
    useTitle('Files');
    const { db, actions, services } = useProvider();
    const perform = usePerform();
    const { confirm } = useFeedback();
    const products = [...services].sort((a, b) => a.title.localeCompare(b.title));
    const [productParam, setProduct] = useQueryState('product', String(products[0]?.id ?? ''));
    const service = products.find((p) => String(p.id) === productParam) ?? products[0];

    const [form, setForm] = useState({ title: '', description: '', version: '1.0', notes: '', upload: null });
    const [errors, setErrors] = useState({});
    const [uploading, setUploading] = useState(false);
    const [versionFor, setVersionFor] = useState(null);
    const [vForm, setVForm] = useState({ version: '', notes: '', upload: null, makeCurrent: true });
    const [vErrors, setVErrors] = useState({});
    const [expanded, setExpanded] = useState(null);
    const [fileKey, setFileKey] = useState(0);

    const allFiles = db.files.filter((f) => services.some((s) => s.id === f.service_id));
    const totalDownloads = allFiles.reduce((a, f) => a + fileDownloads(f), 0);
    const files = service ? db.files.filter((f) => f.service_id === service.id).sort((a, b) => a.sort_order - b.sort_order) : [];

    if (products.length === 0) {
        return (
            <div>
                <PageHeader title="Files" description="Downloadable files for your products. Files are stored privately and only delivered to customers with an active download entitlement." />
                <Empty
                    title="Create a product first"
                    icon="squares-2x2"
                    actions={
                        <Button size="sm" variant="primary" href="/provider/services/create">
                            Create product
                        </Button>
                    }
                />
            </div>
        );
    }

    const createFile = (e) => {
        e.preventDefault();
        const errs = {};
        if (!form.title.trim()) errs.title = 'The title field is required.';
        const uploadError = validateUpload(form.upload);
        if (uploadError) errs.upload = uploadError;
        if (!VERSION_RE.test(form.version)) errs.version = 'The version field format is invalid.';
        setErrors(errs);
        if (Object.keys(errs).length) return;
        setUploading(true);
        simulateUpload(() => {
            const ok = perform(() => actions.createFile(service.id, { title: form.title.trim(), description: form.description, fileName: form.upload.name, size: form.upload.size, version: form.version, notes: form.notes }), 'File uploaded.');
            setUploading(false);
            if (ok) {
                setForm({ title: '', description: '', version: '1.0', notes: '', upload: null });
                setFileKey((k) => k + 1);
            }
        });
    };

    const addVersion = (e) => {
        e.preventDefault();
        const errs = {};
        const uploadError = validateUpload(vForm.upload);
        if (uploadError) errs.upload = uploadError;
        if (!VERSION_RE.test(vForm.version)) errs.version = vForm.version ? 'The version field format is invalid.' : 'The version field is required.';
        setVErrors(errs);
        if (Object.keys(errs).length) return;
        setUploading(true);
        simulateUpload(() => {
            const ok = perform(() => actions.addVersion(versionFor, { fileName: vForm.upload.name, size: vForm.upload.size, version: vForm.version, notes: vForm.notes, makeCurrent: vForm.makeCurrent }), `Version ${vForm.version} uploaded.`);
            setUploading(false);
            if (ok) {
                setVersionFor(null);
                setVForm({ version: '', notes: '', upload: null, makeCurrent: true });
            }
        });
    };

    return (
        <div>
            <PageHeader title="Files" description="Downloadable files for your products. Files are stored privately and only delivered to customers with an active download entitlement." />

            <div className="mb-6 flex flex-wrap items-end justify-between gap-4">
                <Select label="Product" className="w-full max-w-md" value={String(service.id)} onChange={(e) => setProduct(e.target.value)}>
                    {products.map((p) => {
                        const n = db.files.filter((f) => f.service_id === p.id).length;
                        return (
                            <option key={p.id} value={p.id}>
                                {p.title} ({n} {plural('file', n)})
                            </option>
                        );
                    })}
                </Select>
                <Stat label="Downloads (all products)" value={totalDownloads} icon="arrow-down-tray" className="min-w-56" />
            </div>

            {!service.access_types.includes('download_access') && (
                <Callout variant="warning" icon="exclamation-triangle" className="mb-6">
                    This product does not include <b className="font-semibold">Downloads</b> in what subscribers receive, so customers won&apos;t see these files. Enable it on the product&apos;s edit page.
                </Callout>
            )}

            <div className="grid grid-cols-1 gap-6 xl:grid-cols-[minmax(0,1.5fr)_minmax(0,1fr)]">
                <section className="grid content-start gap-3">
                    {files.length === 0 ? (
                        <Empty title="No files on this product yet" icon="arrow-up-tray">
                            Upload the product file, an installation guide and a user manual.
                        </Empty>
                    ) : (
                        files.map((file) => {
                            const cv = currentVersion(file);
                            return (
                                <div key={file.id} className="tt-card">
                                    <div className="flex flex-wrap items-start gap-4 p-5">
                                        <span className="tt-icon-tile size-10 rounded-lg">
                                            <Icon name="document" variant="mini" />
                                        </span>
                                        <div className="min-w-0 flex-1">
                                            <div className="flex flex-wrap items-center gap-2">
                                                <p className="font-semibold">{file.title}</p>
                                                {cv && (
                                                    <Badge size="sm" color="green">
                                                        v{cv.version}
                                                    </Badge>
                                                )}
                                                {!file.is_active && <Badge size="sm">Hidden</Badge>}
                                            </div>
                                            {file.description && <p className="mt-0.5 text-sm text-zinc-500">{file.description}</p>}
                                            {cv && (
                                                <p className="mt-1 text-xs text-zinc-500 tabular-nums">
                                                    {cv.original_name} · {humanFileSize(cv.size_bytes)} · uploaded {fmtDate(cv.released_at)} · {fileDownloads(file)} downloads
                                                </p>
                                            )}
                                        </div>
                                        <div className="flex flex-wrap gap-1">
                                            <Button size="xs" onClick={() => setVersionFor(file.id)}>
                                                New version
                                            </Button>
                                            <Button size="xs" variant="ghost" onClick={() => setExpanded(expanded === file.id ? null : file.id)}>
                                                Versions ({file.versions.length})
                                            </Button>
                                            <Button size="xs" variant="ghost" onClick={() => perform(() => actions.toggleFileActive(file.id), file.is_active ? 'File hidden from customers.' : 'File available to customers.')}>
                                                {file.is_active ? 'Hide' : 'Show'}
                                            </Button>
                                            <Button
                                                size="xs"
                                                variant="ghost"
                                                onClick={async () => {
                                                    if (await confirm(`Delete ${file.title} and all its versions? Customers will no longer be able to download it.`, { confirmLabel: 'Delete', danger: true }))
                                                        perform(() => actions.deleteFile(file.id), 'File and all its versions deleted.');
                                                }}
                                            >
                                                Delete
                                            </Button>
                                        </div>
                                    </div>

                                    {versionFor === file.id && (
                                        <form onSubmit={addVersion} className="grid gap-3 border-t border-zinc-200 p-5 sm:grid-cols-2" noValidate>
                                            <Input type="file" label="File" className="sm:col-span-2" onChange={(e) => setVForm({ ...vForm, upload: e.target.files[0] ?? null })} error={vErrors.upload} />
                                            <Input label="Version" placeholder="e.g. 1.1" value={vForm.version} onChange={(e) => setVForm({ ...vForm, version: e.target.value })} error={vErrors.version} />
                                            <div className="flex items-end">
                                                <Checkbox label="Make this the current version" checked={vForm.makeCurrent} onChange={(e) => setVForm({ ...vForm, makeCurrent: e.target.checked })} />
                                            </div>
                                            <Textarea label="Release notes / changelog" rows={3} className="sm:col-span-2" value={vForm.notes} onChange={(e) => setVForm({ ...vForm, notes: e.target.value })} />
                                            <div className="flex gap-2 sm:col-span-2">
                                                <Button type="submit" variant="primary" loading={uploading}>
                                                    Upload version
                                                </Button>
                                                <Button onClick={() => setVersionFor(null)}>Cancel</Button>
                                            </div>
                                            {uploading && (
                                                <div className="flex items-center gap-2 text-xs font-medium text-brand sm:col-span-2">
                                                    <Spinner className="size-4" />
                                                    Uploading…
                                                </div>
                                            )}
                                        </form>
                                    )}

                                    {expanded === file.id && (
                                        <div className="overflow-x-auto border-t border-zinc-200">
                                            <table className="tt-table min-w-[640px]">
                                                <thead>
                                                    <tr>
                                                        <th>Version</th>
                                                        <th>File</th>
                                                        <th>Size</th>
                                                        <th>Released</th>
                                                        <th>Downloads</th>
                                                        <th />
                                                    </tr>
                                                </thead>
                                                <tbody>
                                                    {file.versions.map((v) => (
                                                        <tr key={v.id}>
                                                            <td className="tabular-nums">
                                                                {v.version}{' '}
                                                                {v.is_current && (
                                                                    <Badge size="sm" color="green" className="ml-1">
                                                                        Current
                                                                    </Badge>
                                                                )}
                                                                {v.release_notes && <p className="max-w-xs font-sans text-xs whitespace-pre-line text-zinc-500">{v.release_notes}</p>}
                                                            </td>
                                                            <td className="text-xs text-zinc-600 tabular-nums">{v.original_name}</td>
                                                            <td className="text-xs tabular-nums">{humanFileSize(v.size_bytes)}</td>
                                                            <td className="text-xs tabular-nums">{fmtDate(v.released_at)}</td>
                                                            <td className="tabular-nums">{v.downloads}</td>
                                                            <td className="text-right whitespace-nowrap">
                                                                <Button size="xs" variant="ghost" onClick={() => perform(() => {}, `Download link for ${v.original_name} created. Static preview: no file is transferred.`)}>
                                                                    Download
                                                                </Button>
                                                                {!v.is_current && (
                                                                    <>
                                                                        <Button size="xs" variant="ghost" onClick={() => perform(() => actions.setCurrentVersion(file.id, v.id), `Version ${v.version} is now current.`)}>
                                                                            Make current
                                                                        </Button>
                                                                        <Button
                                                                            size="xs"
                                                                            variant="ghost"
                                                                            onClick={async () => {
                                                                                if (await confirm(`Delete version ${v.version}?`, { confirmLabel: 'Delete', danger: true })) perform(() => actions.deleteVersion(file.id, v.id), 'Version deleted.');
                                                                            }}
                                                                        >
                                                                            Delete
                                                                        </Button>
                                                                    </>
                                                                )}
                                                            </td>
                                                        </tr>
                                                    ))}
                                                </tbody>
                                            </table>
                                        </div>
                                    )}
                                </div>
                            );
                        })
                    )}
                </section>

                <form onSubmit={createFile} className="tt-card grid content-start gap-4 p-6" noValidate>
                    <div className="flex items-center gap-3">
                        <span className="tt-icon-tile">
                            <Icon name="arrow-up-tray" variant="mini" />
                        </span>
                        <div>
                            <h2 className="font-semibold text-zinc-900">Upload a new file</h2>
                            <p className="text-xs text-zinc-500">Stored privately, delivered only to entitled customers.</p>
                        </div>
                    </div>
                    <Input label="Title" placeholder="e.g. Installation Guide" value={form.title} onChange={(e) => setForm({ ...form, title: e.target.value })} error={errors.title} />
                    <Input label="Description (optional)" value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} />
                    <div className="rounded-lg border border-dashed border-zinc-300 bg-zinc-50/70 p-4 transition-colors hover:border-brand-line hover:bg-brand-soft/40">
                        <Input
                            key={fileKey}
                            type="file"
                            label="File"
                            description={`${FILE_EXTENSIONS.join(', ').toUpperCase()} · up to ${humanFileSize(MAX_UPLOAD_KB * 1024)}`}
                            onChange={(e) => setForm({ ...form, upload: e.target.files[0] ?? null })}
                            error={errors.upload}
                        />
                    </div>
                    {uploading && !versionFor && (
                        <div className="flex items-center gap-2 text-xs font-medium text-brand">
                            <Spinner className="size-4" />
                            Uploading…
                        </div>
                    )}
                    <Input label="Version" value={form.version} onChange={(e) => setForm({ ...form, version: e.target.value })} error={errors.version} />
                    <Textarea label="Release notes (optional)" rows={3} value={form.notes} onChange={(e) => setForm({ ...form, notes: e.target.value })} />
                    <Button type="submit" variant="primary" loading={uploading && !versionFor}>
                        Upload file
                    </Button>
                    <p className="text-xs text-zinc-500">New versions never remove customers&apos; access. Customers always receive the current version of active files.</p>
                </form>
            </div>
        </div>
    );
}

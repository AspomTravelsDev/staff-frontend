'use client';

import { useRef, useState, useTransition } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { useRouter } from 'next/navigation';
import Papa from 'papaparse';
import { toast } from 'sonner';
import { Plus, Download, Upload, ArrowRight, Package } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetDescription } from '@/components/ui/sheet';
import { callAction } from '@/lib/api/action-result';
import { loadCompanyInventory, saveCompanyAsset, importCompanyAssets } from '@/lib/api/company-inventory.actions';
import { getInventoryHistory } from '@/lib/api/inventory';
import type { InventoryHistory } from '@/lib/api/inventory';
import { assetKinds, assetStates, type CompanyAsset, type CompanyAssetInput, type CompanyInventoryResult, type RegisterState } from '@/lib/types/company-inventory';
import { AssetPhotoField } from './asset-photo-field';
import { RegisterStats } from './register-stats';
import { RegisterFilters } from './register-filters';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';

const selectClass = 'h-10 w-full rounded-md border border-input bg-background px-3 text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring';
const blank: CompanyAssetInput = { name: '', asset_kind: 'Laptop', brand: '', model: '', serial_number: '', photo_url: '', state: 'Storage', condition_rating: 'Good', condition_details: '', location: '', allocation_department: '', responsible_user_id: '', disposal_date: '', disposal_reason: '', notes: '' };
const errorMessage = (error: unknown) => error instanceof Error ? error.message : 'Unable to complete this action. Please try again.';
function readableHistory(notes?: string) {
  if (!notes) return 'Asset record updated.';
  const split = notes.indexOf(': {');
  if (split < 0) return notes;
  try {
    const record = JSON.parse(notes.slice(split + 2)) as { before: Record<string, unknown>; after: Record<string, unknown>; notes?: string };
    const changes = Object.entries(record.after).filter(([key, value]) => value !== record.before[key]);
    const text = changes.map(([key, value]) => `${key.replaceAll('_', ' ')}: ${record.before[key] ?? 'Not recorded'} → ${value ?? 'Not recorded'}`).join('\n');
    return [notes.slice(0, split), text, record.notes].filter(Boolean).join('\n');
  } catch { return notes; }
}
function downloadCsv(rows: Record<string, unknown>[], filename: string) {
  const csv = Papa.unparse(rows, { escapeFormulae: true });
  const url = URL.createObjectURL(new Blob([csv], { type: 'text/csv;charset=utf-8;' }));
  const a = document.createElement('a'); a.href = url; a.download = filename; a.click(); URL.revokeObjectURL(url);
}

export function CompanyInventory({ data, filters, employees }: { data: CompanyInventoryResult; filters: Record<string, string>; employees: { id: string; name: string }[] }) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();
  const [busy, setBusy] = useState(false);
  const [photo, setPhoto] = useState<File | null>(null);
  const [removePhoto, setRemovePhoto] = useState(false);
  const [selected, setSelected] = useState<CompanyAsset | null>(null);
  const [editing, setEditing] = useState(false);
  const [form, setForm] = useState<CompanyAssetInput>(blank);
  const [history, setHistory] = useState<InventoryHistory[] | null>(null);
  const [historyError, setHistoryError] = useState('');
  const [error, setError] = useState('');
  const file = useRef<HTMLInputElement>(null);
  function navigate(next: Record<string, string>) {
    startTransition(() => router.push(`/admin/company-inventory?${new URLSearchParams(next)}`));
  }
  async function openDetails(asset: CompanyAsset) {
    setSelected(asset); setEditing(false); setHistory(null); setHistoryError('');
    try { const result = await getInventoryHistory(String(asset.id)); setHistory(result.items); }
    catch (err) { setHistoryError(errorMessage(err)); }
  }
  function edit(asset?: CompanyAsset) {
    setPhoto(null); setRemovePhoto(false);
    setError(''); setSelected(asset ?? null); setForm(asset ? { ...blank, ...asset, asset_kind: asset.asset_kind || asset.asset_type || 'Other', state: asset.register_state || asset.status } : { ...blank }); setEditing(true);
  }
  async function save(event: React.FormEvent) {
    event.preventDefault(); setBusy(true); setError('');
    const input = Object.fromEntries(Object.entries(form).map(([key, value]) => [key, value === '' ? null : value])) as CompanyAssetInput;
    let photoData: FormData | undefined;
    if (photo || removePhoto) {
      photoData = new FormData();
      if (photo) photoData.set('photo', photo);
      if (removePhoto) photoData.set('remove_photo', '1');
    }
    try { await callAction(() => saveCompanyAsset(input, selected?.id, photoData)); toast.success(selected ? 'Asset updated' : 'Asset registered'); setEditing(false); setSelected(null); router.refresh(); }
    catch (err) { setError(errorMessage(err)); } finally { setBusy(false); }
  }
  async function exportAssets() {
    setBusy(true);
    try {
      const rows: CompanyAsset[] = [];
      let page = 1, pages = 1;
      do { const result = await callAction(() => loadCompanyInventory({ ...filters, page: String(page), limit: '100' })); rows.push(...result.items); pages = result.pagination.total_pages; page++; } while (page <= pages);
      downloadCsv(rows.map(a => ({ asset_tag: a.asset_tag, name: a.name, asset_kind: a.asset_kind || a.asset_type, brand: a.brand, model: a.model, serial_number: a.serial_number, state: a.register_state || a.status, allocated_to: a.assigned_to_user?.name || a.allocation_department, location: a.location, responsible_person: a.responsible_user?.name, condition_rating: a.condition_rating, condition_details: a.condition_details })), 'company-inventory.csv');
    } catch (err) { toast.error(errorMessage(err)); } finally { setBusy(false); }
  }
  async function importFile(upload: File) {
    setBusy(true);
    try {
      const parsed = Papa.parse<Record<string, string>>(await upload.text(), { header: true, skipEmptyLines: true });
      if (parsed.errors.length) throw new Error('The CSV could not be read. Check its formatting and try again.');
      if (!parsed.data.length || parsed.data.length > 200) throw new Error('Import between 1 and 200 assets at a time.');
      const inputs = parsed.data.map(row => ({ ...blank, ...Object.fromEntries(Object.entries(row).filter(([key]) => key in blank)), state: row.state || 'Storage' })) as CompanyAssetInput[];
      const result = await callAction(() => importCompanyAssets(inputs));
      toast.success(`${result.count} assets imported`); router.refresh();
    } catch (err) { toast.error(errorMessage(err)); } finally { setBusy(false); if (file.current) file.current.value = ''; }
  }
  const field = (key: keyof CompanyAssetInput, label: string, required = false, type = 'text') => <div className="space-y-2"><Label htmlFor={`asset-${key}`}>{label}</Label><Input id={`asset-${key}`} type={type} required={required} value={form[key] ?? ''} onChange={e => setForm({ ...form, [key]: e.target.value })} /></div>;
  const locked = Boolean(selected?.assigned_to || selected?.open_assignment);
  return <div className="flex flex-1 flex-col gap-6 p-4 pt-0" aria-busy={pending}>
    <header className="flex flex-wrap items-start justify-between gap-4"><div><h1 className="text-2xl font-bold">Company Inventory</h1><p className="mt-1 text-sm text-muted-foreground">Every asset, its location, and who is responsible.</p></div><div className="flex flex-wrap gap-2"><Button variant="outline" asChild><Link href="/admin/inventory">Assignments & clearance<ArrowRight className="size-4" /></Link></Button><Button onClick={() => edit()}><Plus className="size-4" />Add asset</Button></div></header>
    <RegisterStats counts={data.counts} activeState={filters.state} onChange={state => { const next = { ...filters }; delete next.page; if (state) next.state = state; else delete next.state; navigate(next); }} />
    <RegisterFilters key={new URLSearchParams(filters).toString()} filters={filters} pending={pending} onChange={navigate}><Button type="button" size="sm" variant="ghost" onClick={() => downloadCsv([{ name: '', asset_kind: 'Fan', state: 'Storage', condition_rating: 'Good', location: '', allocation_department: '', brand: '', model: '', serial_number: '' }], 'inventory-import-template.csv')}>CSV template</Button><Button type="button" size="sm" variant="outline" disabled={busy} onClick={() => file.current?.click()}><Upload className="size-4" />Import CSV</Button><Button type="button" size="sm" variant="outline" disabled={busy || !data.pagination.total} onClick={exportAssets}><Download className="size-4" />Export results</Button><input ref={file} type="file" accept=".csv,text/csv" className="hidden" aria-label="Import inventory CSV" onChange={e => { const upload = e.target.files?.[0]; if (upload) void importFile(upload); }} /></RegisterFilters>
    <p className="text-sm text-muted-foreground">{data.pagination.total} matching assets</p>
    <div className="rounded-xl border bg-card"><Table ><TableHeader ><TableRow>{['Asset', 'Category', 'Status', 'Allocated to', 'Location', 'Condition'].map(h => <TableHead key={h} className="px-4">{h}</TableHead>)}</TableRow></TableHeader><TableBody>{data.items.map(asset => <TableRow key={asset.id} className="border-t hover:bg-muted/30"><TableCell className="min-w-52 px-4 py-3"><button className="text-left font-medium underline-offset-4 hover:underline focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring" onClick={() => void openDetails(asset)}>{asset.name}</button><p className="mt-1 break-all text-xs text-muted-foreground">{asset.asset_tag}</p>{asset.serial_number && <p className="text-xs text-muted-foreground">S/N {asset.serial_number}</p>}</TableCell><TableCell className="px-4 py-3">{asset.asset_kind || asset.asset_type || 'Other'}</TableCell><TableCell className="min-w-40 px-4 py-3"><Badge variant={['Missing', 'Repairs'].includes(asset.register_state || asset.status) ? 'destructive' : 'secondary'}>{assetStates[asset.register_state || asset.status]}</Badge>{asset.open_assignment && <p className="mt-1 text-xs text-muted-foreground">{asset.open_assignment.status.replaceAll('_', ' ')}{asset.open_assignment.assignee ? ` · ${asset.open_assignment.assignee.name}` : ''}</p>}</TableCell><TableCell className="min-w-36 px-4 py-3">{asset.assigned_to_user?.name || asset.allocation_department || '—'}{asset.responsible_user && <p className="text-xs text-muted-foreground">Responsible: {asset.responsible_user.name}</p>}</TableCell><TableCell className="px-4 py-3">{asset.location || 'Not recorded'}</TableCell><TableCell className="px-4 py-3">{asset.condition_rating || 'Not assessed'}</TableCell></TableRow>)}</TableBody></Table>{!data.items.length && <div className="flex flex-col items-center gap-2 px-6 py-14 text-center"><Package className="size-8 text-muted-foreground" /><h2 className="font-semibold">{Object.keys(filters).length ? 'No assets match these filters' : 'Start your company asset register'}</h2><p className="text-sm text-muted-foreground">{Object.keys(filters).length ? 'Try another search or clear the filters.' : 'Add an asset or import existing records using the CSV template.'}</p></div>}</div>
    <div className="flex items-center justify-between text-sm"><span>Page {data.pagination.page} of {data.pagination.total_pages}</span><div className="flex gap-2"><Button variant="outline" disabled={pending || data.pagination.page <= 1} onClick={() => navigate({ ...filters, page: String(data.pagination.page - 1) })}>Previous</Button><Button variant="outline" disabled={pending || data.pagination.page >= data.pagination.total_pages} onClick={() => navigate({ ...filters, page: String(data.pagination.page + 1) })}>Next</Button></div></div>
    <Sheet open={editing || Boolean(selected)} onOpenChange={open => { if (!open && !busy) { setEditing(false); setSelected(null); } }}><SheetContent className="w-full overflow-y-auto sm:max-w-xl"><SheetHeader><SheetTitle>{editing ? selected ? 'Edit asset' : 'Register an asset' : selected?.name}</SheetTitle><SheetDescription>{editing ? 'Record identity, location, allocation, and condition.' : selected?.asset_tag}</SheetDescription></SheetHeader>
      {editing ? <form onSubmit={save} className="space-y-5 px-4 pb-8">{error && <p role="alert" className="text-sm text-destructive">{error}</p>}{field('name', 'Asset name', true)}<div className="space-y-2"><Label htmlFor="asset-kind">Asset type</Label><Input id="asset-kind" list="asset-kinds" required value={form.asset_kind || ''} onChange={e => setForm({ ...form, asset_kind: e.target.value })} /><datalist id="asset-kinds">{assetKinds.map(k => <option key={k} value={k} />)}</datalist></div><div className="grid gap-4 sm:grid-cols-2">{field('brand', 'Brand')}{field('model', 'Model')}</div>{field('serial_number', 'Serial number (optional)')}<AssetPhotoField existingUrl={selected?.photo_file_id ? `/api/company-inventory/${selected.id}/photo?v=${selected.photo_file_id}` : form.photo_url} disabled={busy} onChange={(nextPhoto, remove) => { setPhoto(nextPhoto); setRemovePhoto(remove); }} /><div className="grid gap-4 sm:grid-cols-2"><div className="space-y-2"><Label htmlFor="asset-state">Status</Label><select id="asset-state" className={selectClass} value={form.state} disabled={locked} onChange={e => setForm({ ...form, state: e.target.value as RegisterState })}>{Object.entries(assetStates).filter(([k]) => k !== 'Assigned' || selected?.assigned_to).map(([k, v]) => <option key={k} value={k}>{v}</option>)}</select></div><div className="space-y-2"><Label htmlFor="asset-condition">Condition</Label><select id="asset-condition" className={selectClass} value={form.condition_rating} onChange={e => setForm({ ...form, condition_rating: e.target.value })}>{['Excellent', 'Good', 'Fair', 'Poor', 'Broken'].map(c => <option key={c}>{c}</option>)}</select></div></div>{locked && <p className="text-sm text-muted-foreground">Allocation and status are controlled by the current assignment or clearance.</p>}{field('location', form.state === 'Storage' ? 'Storage location' : 'Location', form.state === 'Shared')}{form.state === 'Shared' && <>{field('allocation_department', 'Department', true)}<div className="space-y-2"><Label htmlFor="asset-responsible">Responsible person (optional)</Label><select id="asset-responsible" className={selectClass} value={form.responsible_user_id || ''} onChange={e => setForm({ ...form, responsible_user_id: e.target.value })}><option value="">No responsible person</option>{employees.map(e => <option key={e.id} value={e.id}>{e.name}</option>)}</select></div></>}{['Retired', 'Disposed'].includes(form.state) && <>{field('disposal_date', 'Recorded date', true, 'date')}{field('disposal_reason', 'Reason', true)}</>}<div className="space-y-2"><Label htmlFor="asset-observations">Condition observations</Label><Textarea id="asset-observations" value={form.condition_details || ''} onChange={e => setForm({ ...form, condition_details: e.target.value })} /></div>{field('notes', 'Change notes (optional)')}<Button type="submit" disabled={busy}>{busy ? 'Saving…' : 'Save asset'}</Button></form> : selected && <div className="space-y-6 px-4 pb-8">{(selected.photo_file_id || selected.photo_url) && <a href={selected.photo_file_id ? `/api/company-inventory/${selected.id}/photo?v=${selected.photo_file_id}` : selected.photo_url!} target="_blank" rel="noreferrer"><Image src={selected.photo_file_id ? `/api/company-inventory/${selected.id}/photo?v=${selected.photo_file_id}` : selected.photo_url!} alt={selected.name} width={480} height={240} unoptimized className="max-h-60 w-full rounded-md object-contain" /></a>}<dl className="grid grid-cols-2 gap-4 text-sm">{Object.entries({ Type: selected.asset_kind || selected.asset_type, Brand: selected.brand, Model: selected.model, 'Serial number': selected.serial_number, Status: assetStates[selected.register_state || selected.status], 'Allocated to': selected.assigned_to_user?.name || selected.allocation_department, Location: selected.location, 'Responsible person': selected.responsible_user?.name, Condition: selected.condition_rating, Observations: selected.condition_details, 'Retirement / disposal date': selected.disposal_date, Reason: selected.disposal_reason }).map(([label, value]) => <div key={label}><dt className="text-muted-foreground">{label}</dt><dd className="mt-1 break-words">{value || 'Not recorded'}</dd></div>)}</dl><div className="flex flex-wrap gap-2"><Button onClick={() => edit(selected)}>Edit / move asset</Button><Button variant="outline" asChild><Link href="/admin/inventory">Assignments & clearance</Link></Button></div><section><h3 className="mb-3 font-semibold">Recent history</h3>{historyError ? <p role="alert" className="text-sm text-destructive">{historyError}</p> : history === null ? <p className="text-sm text-muted-foreground">Loading history…</p> : !history.length ? <p className="text-sm text-muted-foreground">No history recorded.</p> : <ol className="space-y-4">{history.map(h => <li key={h.id} className="border-t pt-3 text-sm"><p className="font-medium">{h.changerName || 'Recorded change'} · {new Date(h.createdAt).toLocaleDateString()}</p><p className="mt-1 whitespace-pre-wrap break-words text-muted-foreground">{readableHistory(h.notes)}</p></li>)}</ol>}</section></div>}
    </SheetContent></Sheet>
  </div>;
}

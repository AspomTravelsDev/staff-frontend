'use client';

import { useState, type ReactNode } from 'react';
import { Search, X } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { assetKinds, assetStates } from '@/lib/types/company-inventory';

export function RegisterFilters({ filters, pending, onChange, children }: {
  filters: Record<string, string>; pending: boolean; onChange: (filters: Record<string, string>) => void; children: ReactNode;
}) {
  const [search, setSearch] = useState(filters.search || '');
  const [location, setLocation] = useState(filters.location || '');
  const [department, setDepartment] = useState(filters.allocation_department || '');
  function apply(key?: string, value?: string) {
    const next: Record<string, string> = { ...filters, search: search.trim(), location: location.trim(), allocation_department: department.trim() };
    delete next.page;
    if (key) next[key] = value === 'all' ? '' : value || '';
    onChange(Object.fromEntries(Object.entries(next).filter(([, v]) => v)));
  }
  const select = (key: string, label: string, options: Record<string, string>) => <div className="flex items-center gap-2">
    <label htmlFor={`filter-${key}`} className="text-sm font-medium">{label}</label>
    <Select value={filters[key] || 'all'} disabled={pending} onValueChange={value => apply(key, value)}>
      <SelectTrigger id={`filter-${key}`} className="w-40"><SelectValue /></SelectTrigger>
      <SelectContent><SelectItem value="all">All {label.toLowerCase() === 'status' ? 'statuses' : label.toLowerCase() === 'type' ? 'types' : 'conditions'}</SelectItem>{Object.entries(options).map(([value, text]) => <SelectItem key={value} value={value}>{text}</SelectItem>)}</SelectContent>
    </Select>
  </div>;
  return <form className="space-y-3 rounded-xl border bg-card p-3 sm:p-4" onSubmit={event => { event.preventDefault(); apply(); }}>
    <div className="flex flex-col gap-3 sm:flex-row sm:items-center"><div className="relative min-w-0 flex-1 sm:max-w-md">
      <Search className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
      <Input value={search} onChange={event => setSearch(event.target.value)} placeholder="Search assets, tags, people, or locations…" aria-label="Search inventory" className="h-10 pl-9" />
    </div><Button type="submit" variant="secondary" disabled={pending}>Search</Button><div className="flex flex-wrap items-center gap-2 sm:ml-auto">{children}</div></div>
    <div className="flex flex-wrap items-center gap-x-5 gap-y-3 border-t pt-3">
      {select('state', 'Status', assetStates)}
      {select('asset_kind', 'Type', Object.fromEntries(assetKinds.map(kind => [kind, kind])))}
      {select('condition_rating', 'Condition', Object.fromEntries(['Excellent', 'Good', 'Fair', 'Poor', 'Broken'].map(condition => [condition, condition])))}
      {Object.keys(filters).some(key => key !== 'page') && <Button type="button" variant="ghost" size="sm" disabled={pending} onClick={() => onChange({})}><X className="size-4" />Clear filters</Button>}
    </div>
    <div className="flex flex-wrap items-end gap-3"><div className="min-w-40 flex-1 space-y-1 sm:max-w-xs"><label htmlFor="filter-location" className="text-sm font-medium">Location</label><Input id="filter-location" value={location} onChange={event => setLocation(event.target.value)} placeholder="All locations" /></div><div className="min-w-40 flex-1 space-y-1 sm:max-w-xs"><label htmlFor="filter-department" className="text-sm font-medium">Department</label><Input id="filter-department" value={department} onChange={event => setDepartment(event.target.value)} placeholder="All departments" /></div><Button type="submit" variant="outline" disabled={pending}>Apply filters</Button></div>
  </form>;
}

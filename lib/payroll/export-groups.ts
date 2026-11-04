import { isTaxExempt } from './calculations';

export type PayrollExportGroup = 'full_staff' | 'fhon';

interface PayrollExportClassification {
  is_intern?: boolean | null;
  user?: { contract_type?: string | null; name?: string | null };
}

/** Use the saved payroll classification so later contract changes do not move old payments. */
export function splitPayrollExportEntries<T extends PayrollExportClassification>(entries: readonly T[]) {
  const groups: Record<PayrollExportGroup, T[]> = { full_staff: [], fhon: [] };
  for (const entry of entries) {
    const isFhon = typeof entry.is_intern === 'boolean' ? entry.is_intern : isTaxExempt(entry.user?.contract_type);
    groups[isFhon ? 'fhon' : 'full_staff'].push(entry);
  }
  return groups;
}

/** Full Staff first, then FHON, with alphabetical names inside each group. */
export function sortPayrollEntries<T extends PayrollExportClassification>(entries: readonly T[]): T[] {
  const groups = splitPayrollExportEntries(entries);
  const names = new Intl.Collator('en', { sensitivity: 'base', numeric: true });
  const byName = (left: T, right: T) => {
    const a = left.user?.name?.trim() || '';
    const b = right.user?.name?.trim() || '';
    if (!a || !b) return a ? -1 : b ? 1 : 0;
    return names.compare(a, b);
  };
  return [...groups.full_staff.sort(byName), ...groups.fhon.sort(byName)];
}

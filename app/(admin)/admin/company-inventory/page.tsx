import { redirect } from 'next/navigation';
import { getCurrentUser } from '@/lib/auth/session';
import { userHasAnyRole } from '@/types/user-types';
import { renderDataPage } from '@/lib/api/render-data-page';
import { callAction } from '@/lib/api/action-result';
import { loadCompanyInventory } from '@/lib/api/company-inventory.actions';
import { getAllEmployees } from '@/app/(admin)/hr/employees/queries';
import { CompanyInventory } from './register';

export default async function CompanyInventoryPage({ searchParams }: { searchParams: Promise<Record<string, string | string[] | undefined>> }) {
  const user = await getCurrentUser();
  if (!user) redirect('/login');
  if (!userHasAnyRole(user, ['admin', 'it', 'super', 'compliance', 'office-operations', 'mp', 'md'])) redirect('/dashboard');
  return renderDataPage(async () => {
    const params = await searchParams;
    const filters: Record<string, string> = {};
    for (const key of ['search', 'state', 'asset_kind', 'location', 'allocation_department', 'condition_rating', 'page']) {
      if (typeof params[key] === 'string' && params[key]) filters[key] = params[key];
    }
    const [data, employees] = await Promise.all([callAction(() => loadCompanyInventory(filters)), getAllEmployees()]);
    return <CompanyInventory data={data} filters={filters} employees={employees.map(e => ({ id: String(e.id), name: `${e.firstName} ${e.lastName}`.trim() }))} />;
  }, 'Unable to load company inventory');
}

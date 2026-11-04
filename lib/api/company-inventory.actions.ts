'use server';

import { api } from './client';
import { runAction } from './run-action';
import { ExpectedActionError } from './action-result';
import type { CompanyAsset, CompanyAssetInput, CompanyInventoryResult } from '@/lib/types/company-inventory';

export async function loadCompanyInventory(filters: Record<string, string> = {}) {
  return runAction(async () => {
    const response = await api.get<CompanyInventoryResult>(`/api/admin/company-inventory?${new URLSearchParams(filters)}`);
    if (!response.success) throw new ExpectedActionError(response.error.error, response.error.code);
    return response.data;
  }, 'loadCompanyInventory');
}

export async function saveCompanyAsset(input: CompanyAssetInput, id?: number, photoData?: FormData) {
  return runAction(async () => {
    if (photoData) {
      const body = new FormData();
      for (const [key, value] of Object.entries(input)) {
        if (value !== undefined) body.set(key, value === null ? '' : String(value));
      }
      const photo = photoData.get('photo');
      if (photo instanceof File && photo.size) body.set('photo', photo);
      if (photoData.get('remove_photo') === '1') body.set('remove_photo', '1');
      if (id) body.set('_method', 'PATCH');
      const response = await api.post<CompanyAsset>(id ? `/api/admin/company-inventory/${id}` : '/api/admin/company-inventory', body);
      if (!response.success) throw new ExpectedActionError(response.error.error, response.error.code);
      return response.data;
    }
    const response = id
      ? await api.patch<CompanyAsset>(`/api/admin/company-inventory/${id}`, input)
      : await api.post<CompanyAsset>('/api/admin/company-inventory', input);
    if (!response.success) throw new ExpectedActionError(response.error.error, response.error.code);
    return response.data;
  }, 'saveCompanyAsset');
}

export async function importCompanyAssets(items: CompanyAssetInput[]) {
  return runAction(async () => {
    const response = await api.post<{ count: number }>('/api/admin/company-inventory/import', { items });
    if (!response.success) throw new ExpectedActionError(response.error.error, response.error.code);
    return response.data;
  }, 'importCompanyAssets');
}

export type RegisterState = 'Storage' | 'Assigned' | 'Repairs' | 'Shared' | 'Missing' | 'Retired' | 'Disposed';
export interface CompanyAsset {
  id: number;
  name: string;
  asset_tag: string;
  asset_kind: string | null;
  asset_type: string;
  brand: string | null;
  model: string | null;
  photo_url: string | null;
  photo_file_id?: string | null;
  serial_number: string | null;
  status: 'Storage' | 'Assigned' | 'Repairs';
  register_state: RegisterState | null;
  condition_rating: string;
  condition_details: string | null;
  location: string | null;
  allocation_department: string | null;
  responsible_user_id: string | null;
  responsible_user?: { id: string; name: string } | null;
  assigned_to: string | null;
  assigned_to_user?: { id: string; name: string } | null;
  open_assignment?: { status: string; assignee?: { name: string } } | null;
  disposal_date: string | null;
  disposal_reason: string | null;
}
export type CompanyAssetInput = Pick<CompanyAsset, 'name' | 'asset_kind' | 'brand' | 'model' | 'photo_url' | 'serial_number' | 'condition_rating' | 'condition_details' | 'location' | 'allocation_department' | 'responsible_user_id' | 'disposal_date' | 'disposal_reason'> & { state: RegisterState; notes?: string };
export interface CompanyInventoryResult {
  items: CompanyAsset[];
  counts: Record<string, number>;
  pagination: { page: number; total_pages: number; total: number };
}
export const assetStates: Record<RegisterState, string> = { Storage: 'In storage', Assigned: 'In use · staff', Shared: 'In use · shared', Repairs: 'Under repair', Missing: 'Missing', Retired: 'Retired', Disposed: 'Disposed' };
export const assetKinds = ['Laptop', 'Laptop charger', 'Phone', 'Phone charger', 'SIM card', 'Desktop', 'Monitor', 'Fan', 'TV', 'Printer', 'Router', 'Other'];

export interface DepartmentKpiInput {
  category_id?: string | null;
  name: string;
  description: string;
  expectation: string;
  measurement_method: string;
  scoring_guide: Record<1 | 2 | 3 | 4 | 5, string>;
  applies_to: "all_staff" | "supervisors";
  is_active: boolean;
}

export interface DepartmentKpi extends DepartmentKpiInput {
  id: string;
  created_at: string;
  updated_at: string;
  category?: { id: string; name: string } | null;
}

export interface DepartmentKpiList {
  departments: string[];
  items: DepartmentKpi[];
}

export interface KpiCategory {
  id: string;
  name: string;
  description: string | null;
  is_active: boolean;
  departments: string[];
  kpis: DepartmentKpi[];
}

export interface KpiCategoryList {
  departments: string[];
  items: KpiCategory[];
}

export interface StaffInheritedKpiCategory {
  id: string;
  name: string;
  source: "general" | "department";
}

export interface StaffAssignedKpiCategory {
  id: string;
  name: string;
  is_active: boolean;
}

export interface StaffKpiCategoryOption {
  id: string;
  name: string;
  description: string | null;
  is_active: boolean;
  departments: string[];
  all_staff_kpi_count: number;
  supervisor_kpi_count: number;
}

export interface StaffKpiCategoryAssignment {
  id: string;
  name: string;
  staff_id: string | null;
  role: string;
  secondary_roles: string[];
  department: string | null;
  is_supervisor: boolean;
  inherited_categories: StaffInheritedKpiCategory[];
  assigned_category_ids: string[];
  assigned_categories: StaffAssignedKpiCategory[];
  effective_kpi_count: number;
}

export interface StaffKpiCategoryList {
  items: StaffKpiCategoryAssignment[];
  categories: StaffKpiCategoryOption[];
}

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

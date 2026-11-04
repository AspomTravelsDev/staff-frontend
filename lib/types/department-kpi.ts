export interface DepartmentKpiInput {
  department: string;
  name: string;
  description: string;
  expectation: string;
  applies_to: "all_staff" | "supervisors";
  is_active: boolean;
}

export interface DepartmentKpi extends DepartmentKpiInput {
  id: string;
  created_at: string;
  updated_at: string;
}

export interface DepartmentKpiList {
  departments: string[];
  items: DepartmentKpi[];
}

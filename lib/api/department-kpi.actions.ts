"use server";

import { api } from "./client";
import { ExpectedActionError } from "./action-result";
import { runAction } from "./run-action";
import type { DepartmentKpi, DepartmentKpiInput, DepartmentKpiList, KpiCategory, KpiCategoryList } from "@/lib/types/department-kpi";

export async function listDepartmentKpis() {
  return runAction(async () => {
    const result = await api.get<{ data: DepartmentKpiList }>("/api/performance/kpis");
    if (!result.success) throw new ExpectedActionError(result.error.error, result.error.code);
    return result.data.data;
  }, "listDepartmentKpis");
}

export async function saveDepartmentKpi(id: string | null, data: DepartmentKpiInput) {
  return runAction(async () => {
    const result = id
      ? await api.patch<{ data: DepartmentKpi }>(`/api/performance/kpis/${encodeURIComponent(id)}`, data)
      : await api.post<{ data: DepartmentKpi }>("/api/performance/kpis", data);
    if (!result.success) throw new ExpectedActionError(result.error.error, result.error.code);
    return result.data.data;
  }, "saveDepartmentKpi");
}

export async function deleteAllDepartmentKpis() {
  return runAction(async () => {
    const result = await api.delete<{ message: string }>("/api/performance/kpis");
    if (!result.success) throw new ExpectedActionError(result.error.error, result.error.code);
    return result.data;
  }, "deleteAllDepartmentKpis");
}

export async function saveDepartmentKpisBulk(items: DepartmentKpiInput[]) {
  return runAction(async () => {
    const result = await api.post<{ data: DepartmentKpi[] }>("/api/performance/kpis/bulk", { items });
    if (!result.success) throw new ExpectedActionError(result.error.error, result.error.code);
    return result.data.data;
  }, "saveDepartmentKpisBulk");
}

export async function listKpiCategories() {
  return runAction(async () => {
    const result = await api.get<{ data: KpiCategoryList }>("/api/performance/kpi-categories");
    if (!result.success) throw new ExpectedActionError(result.error.error, result.error.code);
    return result.data.data;
  }, "listKpiCategories");
}

export async function saveKpiCategory(id: string | null, data: Pick<KpiCategory, "name" | "description" | "is_active"> & { departments: string[] }) {
  return runAction(async () => {
    const result = id
      ? await api.patch<{ data: KpiCategory }>(`/api/performance/kpi-categories/${encodeURIComponent(id)}`, data)
      : await api.post<{ data: KpiCategory }>("/api/performance/kpi-categories", data);
    if (!result.success) throw new ExpectedActionError(result.error.error, result.error.code);
    return result.data.data;
  }, "saveKpiCategory");
}

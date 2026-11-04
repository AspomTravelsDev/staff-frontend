"use server";

import { api } from "./client";
import { ExpectedActionError } from "./action-result";
import { runAction } from "./run-action";
import type { DepartmentKpi, DepartmentKpiInput, DepartmentKpiList } from "@/lib/types/department-kpi";

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

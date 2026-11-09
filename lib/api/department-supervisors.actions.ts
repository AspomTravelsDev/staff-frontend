"use server";

import { api } from "./client";
import { ExpectedActionError } from "./action-result";
import { runAction } from "./run-action";

export interface DepartmentSupervisorCandidate {
  id: string;
  name: string;
  staff_id: string | null;
  email: string | null;
  department: string;
}

export interface DepartmentSupervisorRow {
  name: string;
  supervisor: DepartmentSupervisorCandidate | null;
  staff: DepartmentSupervisorCandidate[];
}

interface DepartmentSupervisorResponse {
  departments: DepartmentSupervisorRow[];
}

export async function listDepartmentSupervisors() {
  return runAction(async () => {
    const result = await api.get<{ data: DepartmentSupervisorResponse }>("/api/performance/department-supervisors");
    if (!result.success) throw new ExpectedActionError(result.error.error, result.error.code);
    return result.data.data;
  }, "listDepartmentSupervisors");
}

export async function assignDepartmentSupervisor(department: string, supervisorId: string) {
  return runAction(async () => {
    const result = await api.put<{ data: { department: string; supervisor: DepartmentSupervisorCandidate } }>(
      `/api/performance/department-supervisors/${encodeURIComponent(department)}`,
      { supervisor_id: supervisorId },
    );
    if (!result.success) throw new ExpectedActionError(result.error.error, result.error.code);
    return result.data.data;
  }, "assignDepartmentSupervisor");
}

export async function clearDepartmentSupervisor(department: string) {
  return runAction(async () => {
    const result = await api.delete<{ data: { department: string } }>(
      `/api/performance/department-supervisors/${encodeURIComponent(department)}`,
    );
    if (!result.success) throw new ExpectedActionError(result.error.error, result.error.code);
    return result.data.data;
  }, "clearDepartmentSupervisor");
}

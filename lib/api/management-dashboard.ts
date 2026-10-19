import "server-only";
import { api } from "./client";
import { ExpectedActionError } from "./action-result";
import type { ManagementDashboardSummary } from "@/lib/types/management-dashboard";

export async function getManagementDashboard(): Promise<ManagementDashboardSummary> {
  const response = await api.get<{ data: ManagementDashboardSummary }>(
    "/api/management/dashboard",
  );
  if (!response.success)
    throw new ExpectedActionError(response.error.error, response.error.code);
  return response.data.data;
}

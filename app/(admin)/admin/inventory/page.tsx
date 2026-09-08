import { getCurrentUser } from "@/lib/auth/session";
import { redirect } from "next/navigation";
import {
  getInventory,
  getInventoryStats,
  getInventoryOfficerQueue,
  getInventoryComplianceQueue,
  getClearanceOfficerQueue,
  getClearanceComplianceQueue,
  InventoryStatus,
  InventoryConditionRating,
} from "@/lib/api/inventory";
import { getAllEmployees } from "@/app/(admin)/hr/employees/queries";
import { getRoles, userHasAnyRole } from "@/types/user-types";
import { InventoryStatsCards } from "./components/inventory-stats";
import { InventoryAddButton } from "./components/inventory-add-button";
import { InventoryClientManager } from "./components/inventory-client-manager";

interface InventoryPageProps {
  searchParams: Promise<{
    category?: string;
    status?: string;
    condition_rating?: string;
    tab?: string;
  }>;
}

export default async function InventoryPage({
  searchParams,
}: InventoryPageProps) {
  const params = await searchParams;
  const user = await getCurrentUser();
  if (!user) {
    redirect("/login");
  }

  const activeRoles = getRoles(user);
  const isOfficer = userHasAnyRole(user, ["admin", "it", "super", "mp", "md"]);
  const isCompliance = userHasAnyRole(user, ["compliance", "super", "mp", "md"]);

  // Conditionally fetch queue data based on active permissions (including sub-roles/secondary roles)
  const officerQueuePromise = isOfficer
    ? getInventoryOfficerQueue()
    : Promise.resolve([]);

  const complianceQueuePromise = isCompliance
    ? getInventoryComplianceQueue()
    : Promise.resolve([]);

  const clearanceOfficerPromise = isOfficer
    ? getClearanceOfficerQueue()
    : Promise.resolve([]);

  const clearanceCompliancePromise = isCompliance
    ? getClearanceComplianceQueue()
    : Promise.resolve([]);

  // Fetch data in parallel (including employees & queues)
  const [
    inventoryData,
    stats,
    employees,
    officerAssignments,
    complianceAssignments,
    clearanceOfficerQueue,
    clearanceComplianceQueue,
  ] = await Promise.all([
    getInventory({
      limit: 500,
      category: params.category,
      status: params.status as InventoryStatus,
      conditionRating: params.condition_rating as InventoryConditionRating,
    }),
    getInventoryStats({
      category: params.category,
      status: params.status as InventoryStatus,
      conditionRating: params.condition_rating as InventoryConditionRating,
    }),
    getAllEmployees(),
    officerQueuePromise,
    complianceQueuePromise,
    clearanceOfficerPromise,
    clearanceCompliancePromise,
  ]);

  return (
    <div className="flex flex-1 flex-col gap-6 p-4 pt-0">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">Company Inventory & Approvals</h1>
          <p className="text-sm text-muted-foreground">
            Track company assets, process gadget assignments, and manage offboarding clearance
          </p>
        </div>
        <InventoryAddButton employees={employees} />
      </div>

      <InventoryStatsCards stats={stats} />

      <InventoryClientManager
        userRole={user.role}
        userRoles={activeRoles}
        initialItems={inventoryData.items}
        employees={employees}
        officerAssignments={officerAssignments}
        complianceAssignments={complianceAssignments}
        clearanceOfficerQueue={clearanceOfficerQueue}
        clearanceComplianceQueue={clearanceComplianceQueue}
        initialTab={params.tab || "inventory"}
        serverFilters={{
          category: params.category || "all",
          status: params.status || "all",
          condition: params.condition_rating || "all",
        }}
      />
    </div>
  );
}


import { renderDataPage } from "@/lib/api/render-data-page";
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
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { InventoryClientManager } from "./components/inventory-client-manager";

interface InventoryPageProps {
  searchParams: Promise<{
    category?: string;
    status?: string;
    condition_rating?: string;
    tab?: string;
    page?: string;
  }>;
}

export default async function InventoryPage({
  searchParams,
}: InventoryPageProps) {
  return renderDataPage(async () => {
  const params = await searchParams;
  const user = await getCurrentUser();
  if (!user) {
    redirect("/login");
  }

  const activeRoles = getRoles(user);
  const isOfficer = userHasAnyRole(user, ["admin", "it", "super", "mp", "md"]);
  const isCompliance = userHasAnyRole(user, ["compliance", "super", "mp", "md", "office-operations"]);

  // Conditionally fetch queue data based on active permissions (including sub-roles/secondary roles)
  const officerQueuePromise = isOfficer
    ? getInventoryOfficerQueue(true)
    : Promise.resolve([]);

  const complianceQueuePromise = isCompliance
    ? getInventoryComplianceQueue(true)
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
      page: Number(params.page) > 0 ? Number(params.page) : 1,
      limit: 50,
      category: params.category,
      status: params.status as InventoryStatus,
      conditionRating: params.condition_rating as InventoryConditionRating,
    }),
    getInventoryStats({
      category: params.category,
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
          <h1 className="text-2xl font-bold">Gadget Assignments</h1>
          <p className="text-sm text-muted-foreground">
            Issue equipment to staff, review acknowledgements, and manage returns and clearance
          </p>
        </div>
        <Button variant="outline" asChild><Link href="/admin/company-inventory">Company Inventory</Link></Button>
      </div>

      <InventoryStatsCards stats={stats} />

      <InventoryClientManager
        userRole={user.role}
        userRoles={activeRoles}
        initialItems={inventoryData.items}
        inventoryPagination={inventoryData.pagination}
        employees={employees}
        officerAssignments={officerAssignments}
        complianceAssignments={complianceAssignments}
        clearanceOfficerQueue={clearanceOfficerQueue}
        clearanceComplianceQueue={clearanceComplianceQueue}
        initialTab={params.tab || "equipment"}
        serverFilters={{
          category: params.category || "all",
          status: params.status || "all",
          condition: params.condition_rating || "all",
        }}
      />
    </div>
  );

  }, "Unable to load inventory and approvals");
}

import { getCurrentUser } from "@/lib/auth/session";
import { redirect } from "next/navigation";
import {
  getInventory,
  getInventoryStats,
  getInventoryOfficerQueue,
  getInventoryComplianceQueue,
  InventoryStatus,
  InventoryConditionRating,
} from "@/lib/api/inventory";
import { getAllEmployees } from "@/app/(admin)/hr/employees/queries";
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

  const role = user.role;

  // Conditionally fetch queue data based on permissions
  const officerQueuePromise = ["admin", "it", "super", "mp", "md"].includes(role)
    ? getInventoryOfficerQueue()
    : Promise.resolve([]);

  const complianceQueuePromise = ["compliance", "super", "mp", "md"].includes(role)
    ? getInventoryComplianceQueue()
    : Promise.resolve([]);

  // Fetch data in parallel (including employees & queues)
  const [inventoryData, stats, employees, officerAssignments, complianceAssignments] =
    await Promise.all([
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
    ]);

  return (
    <div className="flex flex-1 flex-col gap-6 p-4 pt-0">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">Company Inventory & Approvals</h1>
          <p className="text-sm text-muted-foreground">
            Track company assets and process gadget assignment approvals
          </p>
        </div>
        <InventoryAddButton employees={employees} />
      </div>

      <InventoryStatsCards stats={stats} />

      <InventoryClientManager
        userRole={role}
        initialItems={inventoryData.items}
        employees={employees}
        officerAssignments={officerAssignments}
        complianceAssignments={complianceAssignments}
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


import { getCurrentUser } from "@/lib/auth/session";
import { redirect } from "next/navigation";
import {
  getInventory,
  getInventoryStats,
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
  }>;
}

export default async function InventoryPage({
  searchParams,
}: InventoryPageProps) {
  const params = await searchParams;
  const user = await getCurrentUser();
  // Only allow super, admin, or it roles
  if (!user) {
    redirect("/login");
  }

  // Fetch data in parallel (including employees)
  // Server-side filtering for category, status, and condition
  const [inventoryData, stats, employees] = await Promise.all([
    getInventory({
      limit: 500,
      category: params.category,
      status: params.status as InventoryStatus,
      conditionRating: params.condition_rating as InventoryConditionRating,
    }),
    getInventoryStats(),
    getAllEmployees(),
  ]);

  return (
    <div className="flex flex-1 flex-col gap-6 p-4 pt-0">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">Company Inventory</h1>
          <p className="text-sm text-muted-foreground">
            Track assets, stock levels, and valuations
          </p>
        </div>
        <InventoryAddButton employees={employees} />
      </div>

      <InventoryStatsCards stats={stats} />

      <InventoryClientManager
        initialItems={inventoryData.items}
        employees={employees}
        serverFilters={{
          category: params.category || "all",
          status: params.status || "all",
          condition: params.condition_rating || "all",
        }}
      />
    </div>
  );
}

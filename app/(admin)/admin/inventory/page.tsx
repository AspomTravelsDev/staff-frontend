import { getCurrentUser } from "@/lib/auth/session";
import { redirect } from "next/navigation";
import { getInventory, getInventoryStats } from "@/lib/api/inventory";
import { InventoryStatsCards } from "./components/inventory-stats";
import { InventoryTable } from "./components/inventory-table";
import { InventoryAddButton } from "./components/inventory-add-button";

export default async function InventoryPage() {
  const user = await getCurrentUser();

  // Basic access control (Admin/Super/IT)
  if (!user) {
    redirect("/login");
  }

  // Fetch data in parallel
  const [inventoryData, stats] = await Promise.all([
    getInventory({ limit: 100 }),
    getInventoryStats(),
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
        <InventoryAddButton />
      </div>

      <InventoryStatsCards stats={stats} />

      <InventoryTable items={inventoryData.items} />
    </div>
  );
}

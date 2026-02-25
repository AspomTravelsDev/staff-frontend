import { getCurrentUser } from "@/lib/auth/session";
import { redirect } from "next/navigation";
import { getInventory, getInventoryStats } from "@/lib/api/inventory";
import { getAllEmployees } from "@/app/(admin)/hr/employees/queries";
import { InventoryStatsCards } from "./components/inventory-stats";
import { InventoryTable } from "./components/inventory-table";
import { InventoryAddButton } from "./components/inventory-add-button";
// import { USER_ROLES } from "@/types/user-types";

export default async function InventoryPage() {
  const user = await getCurrentUser();
  // Only allow super, admin, or it roles
  if (!user) {
    redirect("/login");
  }
  // const allowedRoles = [
  //   USER_ROLES.SUPER_ADMIN,
  //   USER_ROLES.ADMIN_OFFICER,
  //   USER_ROLES.IT_OFFICER,
  // ];
  // if (!allowedRoles.includes(user.role)) {
  //   redirect("/");
  // }

  // Fetch data in parallel (including employees)
  const [inventoryData, stats, employees] = await Promise.all([
    getInventory({ limit: 100 }),
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

      <InventoryTable items={inventoryData.items} employees={employees} />
    </div>
  );
}

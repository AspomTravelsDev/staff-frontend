import { getCurrentUser } from "@/lib/auth/session";
import { redirect } from "next/navigation";
import {
  getMyInventory,
  getMyInventoryAssignments,
} from "@/lib/api/inventory";
import { MyInventoryTable } from "./components/my-inventory-table";
import { PendingAssignmentsSection } from "./components/pending-assignments-section";
import { AssetFormPdfButton } from "@/components/inventory/asset-form-pdf-button";
import { ShieldCheck } from "lucide-react";

export default async function MyInventoryPage() {
  const user = await getCurrentUser();

  if (!user) {
    redirect("/login");
  }

  const [myItems, pendingAssignments, allAssignments] = await Promise.all([
    getMyInventory(),
    getMyInventoryAssignments(true),
    getMyInventoryAssignments(false),
  ]);

  return (
    <div className="flex flex-1 flex-col gap-6 p-4 pt-0">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">My IT Assets</h1>
          <p className="text-sm text-muted-foreground mt-1">
            Devices and equipment currently assigned to you
          </p>
        </div>
        {allAssignments.length > 0 && (
          <AssetFormPdfButton
            assignments={allAssignments}
            label="Download Staff Asset Form (PDF)"
          />
        )}
      </div>

      <PendingAssignmentsSection assignments={pendingAssignments} />

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4 mb-4">
        <div className="rounded-xl border bg-card text-card-foreground shadow-sm">
          <div className="p-6 flex flex-row items-center justify-between space-y-0 pb-2">
            <h3 className="tracking-tight text-sm font-medium">Total Assets</h3>
            <ShieldCheck className="w-4 h-4 text-muted-foreground" />
          </div>
          <div className="p-6 pt-0">
            <div className="text-2xl font-bold">{myItems.length}</div>
            <p className="text-xs text-muted-foreground">
              Currently registered to you
            </p>
          </div>
        </div>
      </div>

      <MyInventoryTable items={myItems} assignments={allAssignments} />
    </div>
  );
}

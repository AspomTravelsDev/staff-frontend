import { redirect } from "next/navigation";

export default function InventoryOfficerQueuePage() {
  redirect("/admin/inventory?tab=pending-approvals");
}


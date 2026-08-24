import { redirect } from "next/navigation";

export default function InventoryComplianceQueuePage() {
  redirect("/admin/inventory?tab=pending-approvals");
}


import { getCurrentUser } from "@/lib/auth/session";
import { redirect } from "next/navigation";
import { getClients, getCRMStats } from "@/lib/api/crm";
import { CRMStatsCards } from "./components/crm-stats";
import { CRMTable } from "./components/crm-table";
import { Button } from "@/components/ui/button";
import { Plus } from "lucide-react";

export default async function CRMPage() {
  const user = await getCurrentUser();

  // Basic access control
  if (!user) {
    redirect("/login");
  }

  // Fetch data in parallel
  const [clientsData, stats] = await Promise.all([
    getClients({ limit: 100 }),
    getCRMStats(),
  ]);

  return (
    <div className="flex flex-1 flex-col gap-6 p-4 pt-0">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">
            Customer Relationship Management
          </h1>
          <p className="text-sm text-muted-foreground">
            Manage leads, customers, and opportunities
          </p>
        </div>
        <Button>
          <Plus className="mr-2 h-4 w-4" />
          Add Client
        </Button>
      </div>

      <CRMStatsCards stats={stats} />

      <CRMTable clients={clientsData.items} />
    </div>
  );
}

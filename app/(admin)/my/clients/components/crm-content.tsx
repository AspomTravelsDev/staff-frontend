"use client";

import { useState } from "react";
import type { Client, CRMStats } from "@/lib/api/crm-constants";
import { CRMStatsCards } from "./crm-stats";
import { CRMTable } from "./crm-table";
import { AddClientDialog } from "./add-client-dialog";
import { Button } from "@/components/ui/button";
import { Plus } from "lucide-react";

interface CRMContentProps {
  clients: Client[];
  stats: CRMStats;
  currentUserId?: string;
}

export function CRMContent({ clients, stats, currentUserId }: CRMContentProps) {
  const [addOpen, setAddOpen] = useState(false);

  return (
    <div className="flex flex-1 flex-col gap-6 p-4 pt-0">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">My Customers</h1>
          <p className="text-sm text-muted-foreground">
            Track and manage your personal customer list
          </p>
        </div>
        <Button onClick={() => setAddOpen(true)}>
          <Plus className="mr-2 h-4 w-4" />
          Add Customer
        </Button>
      </div>

      <CRMStatsCards stats={stats} />

      <CRMTable clients={clients} />

      <AddClientDialog
        open={addOpen}
        onOpenChange={setAddOpen}
        currentUserId={currentUserId}
      />
    </div>
  );
}

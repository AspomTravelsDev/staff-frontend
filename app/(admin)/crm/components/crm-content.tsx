"use client";

import { useState } from "react";
import type { Client, CRMStats } from "@/lib/api/crm-constants";
import { CRMStatsCards } from "./crm-stats";
import { CRMTable } from "./crm-table";
import { AddClientDialog } from "./add-client-dialog";
import { ImportClientsDialog } from "./import-clients-dialog";
import { Button } from "@/components/ui/button";
import { Plus, FileUp } from "lucide-react";
import type { PaginationMeta } from "@/lib/api/types";

interface CRMContentProps {
  clients: Client[];
  pagination: PaginationMeta;
  stats: CRMStats;
  currentUserId?: string;
  currentUserRole?: string;
}

export function CRMContent({
  clients,
  pagination,
  stats,
  currentUserId,
  currentUserRole,
}: CRMContentProps) {
  const [addOpen, setAddOpen] = useState(false);
  const [importOpen, setImportOpen] = useState(false);

  return (
    <div className="flex flex-1 flex-col gap-6 p-4 pt-0">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">Customer Database (CRM)</h1>
          <p className="text-sm text-muted-foreground">
            Track and manage customers across all departments
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Button variant="outline" onClick={() => setImportOpen(true)}>
            <FileUp className="mr-2 h-4 w-4" />
            Import CSV
          </Button>
          <Button onClick={() => setAddOpen(true)}>
            <Plus className="mr-2 h-4 w-4" />
            Add Customer
          </Button>
        </div>
      </div>

      <CRMStatsCards stats={stats} />

      <CRMTable clients={clients} pagination={pagination} currentUserRole={currentUserRole} />

      <AddClientDialog
        open={addOpen}
        onOpenChange={setAddOpen}
        currentUserId={currentUserId}
      />

      <ImportClientsDialog open={importOpen} onOpenChange={setImportOpen} />
    </div>
  );
}

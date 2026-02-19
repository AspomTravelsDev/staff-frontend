"use client";

import { useState, useEffect } from "react";
import { getClients, getCRMStats } from "@/lib/api/crm";
import type { Client, CRMStats } from "@/lib/api/crm-constants";
import { CRMStatsCards } from "./components/crm-stats";
import { CRMTable } from "./components/crm-table";
import { AddClientDialog } from "./components/add-client-dialog";
import { Button } from "@/components/ui/button";
import { Plus } from "lucide-react";

export default function CRMPage() {
  const [clients, setClients] = useState<Client[]>([]);
  const [stats, setStats] = useState<CRMStats>({
    totalPaid: 0,
    newPotentials: 0,
    activeDeals: 0,
    conversionRate: "0%",
  });
  const [addOpen, setAddOpen] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    Promise.all([getClients({ limit: 100 }), getCRMStats()]).then(
      ([clientsData, statsData]) => {
        setClients(clientsData.items);
        setStats(statsData);
        setLoading(false);
      },
    );
  }, []);

  const handleClientAdded = (client: Client) => {
    setClients((prev) => [client, ...prev]);
    // Update stats optimistically
    setStats((prev) => ({
      ...prev,
      newPotentials:
        client.status === "potential"
          ? prev.newPotentials + 1
          : prev.newPotentials,
      totalPaid: client.status === "paid" ? prev.totalPaid + 1 : prev.totalPaid,
      activeDeals: ["follow_up", "negotiation"].includes(client.status)
        ? prev.activeDeals + 1
        : prev.activeDeals,
    }));
  };

  const handleClientUpdated = (updated: Client) => {
    setClients((prev) => prev.map((c) => (c.id === updated.id ? updated : c)));
  };

  const handleClientDeleted = (id: string) => {
    setClients((prev) => prev.filter((c) => c.id !== id));
  };

  return (
    <div className="flex flex-1 flex-col gap-6 p-4 pt-0">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">Customer Database (CRM)</h1>
          <p className="text-sm text-muted-foreground">
            Track and manage customers across all departments
          </p>
        </div>
        <Button onClick={() => setAddOpen(true)}>
          <Plus className="mr-2 h-4 w-4" />
          Add Customer
        </Button>
      </div>

      {loading ? (
        <div className="grid gap-4 md:grid-cols-4">
          {[...Array(4)].map((_, i) => (
            <div key={i} className="h-28 rounded-lg bg-muted animate-pulse" />
          ))}
        </div>
      ) : (
        <CRMStatsCards stats={stats} />
      )}

      <CRMTable
        clients={clients}
        onClientUpdated={handleClientUpdated}
        onClientDeleted={handleClientDeleted}
      />

      <AddClientDialog
        open={addOpen}
        onOpenChange={setAddOpen}
        onClientAdded={handleClientAdded}
      />
    </div>
  );
}

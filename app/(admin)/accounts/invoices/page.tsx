"use client";

import { useEffect, useState, useCallback } from "react";
import { Sheet, SheetContent, SheetHeader, SheetTitle } from "@/components/ui/sheet";
import { FileText, Users, CreditCard, Landmark, Plus } from "lucide-react";
import { Button } from "@/components/ui/button";
import { StatsCard } from "@/components/stats-card";
import { InvoiceWorkspace } from "@/components/accounts/invoice-workspace";
import { InvoiceHistory } from "@/components/accounts/invoice-history";
import { getInvoiceStats, type InvoiceStats, type Invoice } from "@/lib/api/invoices";
import { toast } from "sonner";

export default function InvoicesPage() {
  const [stats, setStats] = useState<InvoiceStats | null>(null);
  const [statsLoading, setStatsLoading] = useState(true);
  const [sheetOpen, setSheetOpen] = useState(false);
  const [selectedInvoice, setSelectedInvoice] = useState<Invoice | null>(null);
  const [refreshKey, setRefreshKey] = useState(0);

  const fetchStats = useCallback(async () => {
    setStatsLoading(true);
    try {
      const response = await getInvoiceStats();
      if (response.success && response.data) {
        setStats(response.data);
      } else {
        toast.error("Failed to load invoice dashboard statistics");
      }
    } catch (err) {
      console.error("Failed to fetch invoice stats:", err);
    } finally {
      setStatsLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchStats();
  }, [fetchStats, refreshKey]);

  const handleNewInvoiceClick = () => {
    setSelectedInvoice(null);
    setSheetOpen(true);
  };

  const handleLoadInvoice = (invoice: Invoice) => {
    setSelectedInvoice(invoice);
    setSheetOpen(true);
  };

  const handleSaveSuccess = (invoice?: Invoice) => {
    if (invoice) setSelectedInvoice(invoice);
    setRefreshKey((prev) => prev + 1);
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat("en-NG", {
      style: "currency",
      currency: "NGN",
      minimumFractionDigits: 2,
    }).format(amount);
  };

  return (
    <div className="w-full min-w-0 space-y-6">
      {/* Page Header */}
      <div className="border-b pb-4 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-foreground flex items-center gap-2">
            <FileText className="size-6 text-primary" />
            Invoice Center
          </h1>
          <p className="text-sm text-muted-foreground mt-1">
            Manage client billing, view financial summaries, and generate invoice documents.
          </p>
        </div>
        <Button 
          onClick={handleNewInvoiceClick}
          className="sm:w-auto font-semibold gap-1.5 cursor-pointer shadow-sm"
        >
          <Plus className="h-4.5 w-4.5" />
          New Invoice
        </Button>
      </div>

      {/* Aggregate Stats Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {statsLoading && !stats ? (
          Array.from({ length: 4 }).map((_, idx) => (
            <div key={idx} className="h-28 bg-card border rounded-xl animate-pulse" />
          ))
        ) : (
          <>
            <StatsCard
              title="Total Invoices"
              icon={FileText}
              value={stats?.total_count ?? 0}
              description="Total invoices generated"
              variant="dashboard"
              cardColor="blue"
            />
            <StatsCard
              title="Unique Customers"
              icon={Users}
              value={stats?.unique_customers_count ?? 0}
              description="Billed customer accounts"
              variant="dashboard"
              cardColor="purple"
            />
            <StatsCard
              title="Payments Received"
              icon={CreditCard}
              value={formatCurrency(stats?.total_paid ?? 0)}
              description="Total payments recorded"
              variant="dashboard"
              cardColor="green"
            />
            <StatsCard
              title="Outstanding Balances"
              icon={Landmark}
              value={formatCurrency(stats?.total_unpaid ?? 0)}
              description="Pending accounts receivable"
              variant="dashboard"
              cardColor="red"
            />
          </>
        )}
      </div>

      {/* Invoices List / Table History */}
      <div className="space-y-3 pt-2">
        <h3 className="text-xs font-black uppercase tracking-wider text-slate-500">
          Invoices Directory
        </h3>
        <InvoiceHistory 
          onLoadInvoice={handleLoadInvoice} 
          refreshKey={refreshKey}
          onDeleteSuccess={() => setRefreshKey(prev => prev + 1)}
        />
      </div>

      {/* Creation/Editing slide-out Sheet */}
      <Sheet open={sheetOpen} onOpenChange={(open) => {
        setSheetOpen(open);
        if (!open) setSelectedInvoice(null);
      }}>
        <SheetContent className="w-[95vw] sm:max-w-[850px] overflow-y-auto h-full pr-6 pl-6 pt-6">
          <SheetHeader className="pb-4 border-b">
            <SheetTitle className="text-xl font-black text-slate-800 uppercase flex items-center gap-2">
              <FileText className="h-5 w-5 text-primary" />
              {selectedInvoice ? `Edit Invoice: ${selectedInvoice.invoice_number}` : "Create New Invoice"}
            </SheetTitle>
          </SheetHeader>
          <div className="pt-6">
            <InvoiceWorkspace 
              initialInvoice={selectedInvoice}
              clearInvoice={() => setSelectedInvoice(null)}
              onSaveSuccess={handleSaveSuccess}
            />
          </div>
        </SheetContent>
      </Sheet>
    </div>
  );
}

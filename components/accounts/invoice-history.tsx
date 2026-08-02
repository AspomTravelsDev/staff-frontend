"use client";

import { useEffect, useState, useCallback } from "react";
import { 
  getInvoices, 
  deleteInvoice, 
  type Invoice 
} from "@/lib/api/invoices";
import { 
  Table, 
  TableBody, 
  TableCell, 
  TableHead, 
  TableHeader, 
  TableRow 
} from "@/components/ui/table";
import { Input } from "@/components/ui/input";
import { 
  Select, 
  SelectContent, 
  SelectItem, 
  SelectTrigger, 
  SelectValue 
} from "@/components/ui/select";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { 
  Search, 
  Trash2, 
  ExternalLink, 
  Loader2, 
  RefreshCw 
} from "lucide-react";
import { toast } from "sonner";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";

interface InvoiceHistoryProps {
  onLoadInvoice: (invoice: Invoice) => void;
  refreshKey?: number;
  onDeleteSuccess?: () => void;
}

export function InvoiceHistory({ onLoadInvoice, refreshKey, onDeleteSuccess }: InvoiceHistoryProps) {
  const [invoices, setInvoices] = useState<Invoice[]>([]);
  const [loading, setLoading] = useState(true);
  const [deletingId, setDeletingId] = useState<string | null>(null);

  // Filters
  const [search, setSearch] = useState("");
  const [subsidiary, setSubsidiary] = useState("all");
  const [status, setStatus] = useState("all");
  
  // Pagination
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [totalRecords, setTotalRecords] = useState(0);
  const limit = 10;

  const fetchHistory = useCallback(async () => {
    setLoading(true);
    try {
      const filters = {
        page,
        limit,
        search: search.trim() || undefined,
        subsidiary: subsidiary === "all" ? undefined : subsidiary,
        status: status === "all" ? undefined : status,
      };
      const response = await getInvoices(filters);
      setInvoices(response.data || []);
      setTotalRecords(response.pagination.total || 0);
      setTotalPages(response.pagination.total_pages || 1);
    } catch (err) {
      console.error("Failed to load invoices history:", err);
      toast.error("Failed to load invoice history");
    } finally {
      setLoading(false);
    }
  }, [page, search, subsidiary, status]);

  useEffect(() => {
    fetchHistory();
  }, [fetchHistory, refreshKey]);

  const handleDelete = async (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    setDeletingId(id);
    try {
      const response = await deleteInvoice(id);
      if (response.success) {
        toast.success("Invoice deleted successfully");
        fetchHistory();
        onDeleteSuccess?.();
      } else {
        toast.error(response.error || "Failed to delete invoice");
      }
    } catch (err) {
      console.error(err);
      toast.error("Failed to delete invoice");
    } finally {
      setDeletingId(null);
    }
  };

  const getSubsidiaryLabel = (key: string) => {
    switch (key) {
      case "travelatal":
        return "Travelatal Ltd";
      case "aspom":
        return "Aspom Travel Agency LTD";
      case "abs":
        return "ASPOM Birth Services";
      default:
        return key;
    }
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat("en-NG", {
      style: "currency",
      currency: "NGN",
    }).format(amount);
  };

  const getEmailStatusBadge = (status: string | undefined, lastSentAt: string | null | undefined) => {
    if (!status || status === "not_sent") {
      return <span className="text-muted-foreground text-[10px] font-medium italic">-</span>;
    }

    const formatDate = (dateStr: string) => {
      try {
        const d = new Date(dateStr);
        const day = d.getDate().toString().padStart(2, "0");
        const month = (d.getMonth() + 1).toString().padStart(2, "0");
        const year = d.getFullYear();
        return `${day}/${month}/${year}`;
      } catch {
        return dateStr;
      }
    };

    switch (status) {
      case "sending":
        return (
          <Badge variant="outline" className="text-sky-600 bg-sky-50 border-sky-200 gap-1 capitalize flex items-center w-fit py-0.5 text-[10px]">
            <Loader2 className="h-2.5 w-2.5 animate-spin" />
            Sending
          </Badge>
        );
      case "sent":
        return (
          <div className="flex flex-col gap-0.5 select-none align-start">
            <Badge variant="default" className="bg-emerald-600 hover:bg-emerald-600 text-white w-fit text-[9px] py-0 px-1.5 font-bold leading-normal uppercase">
              Sent
            </Badge>
            {lastSentAt && (
              <span className="text-[9px] text-muted-foreground tabular-nums">
                {formatDate(lastSentAt)}
              </span>
            )}
          </div>
        );
      case "failed":
        return (
          <Badge variant="destructive" className="bg-rose-100 hover:bg-rose-100 border border-rose-200 text-rose-700 w-fit text-[9px] py-0 px-1.5 font-bold leading-normal uppercase">
            Failed
          </Badge>
        );
      default:
        return null;
    }
  };

  return (
    <div className="space-y-4">
      {/* Filters Bar */}
      <div className="flex flex-col md:flex-row gap-3 items-center justify-between bg-card p-4 rounded-xl border">
        <div className="relative w-full md:w-80">
          <Search className="absolute left-3 top-2.5 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Search invoice # or client..."
            value={search}
            onChange={(e) => {
              setSearch(e.target.value);
              setPage(1);
            }}
            className="pl-9 bg-background"
          />
        </div>

        <div className="flex flex-wrap items-center gap-3 w-full md:w-auto">
          {/* Subsidiary Filter */}
          <div className="w-40">
            <Select
              value={subsidiary}
              onValueChange={(val) => {
                setSubsidiary(val);
                setPage(1);
              }}
            >
              <SelectTrigger className="bg-background">
                <SelectValue placeholder="Subsidiary" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Subsidiaries</SelectItem>
                <SelectItem value="aspom">Aspom Travel Agency LTD</SelectItem>
                <SelectItem value="travelatal">Travelatal Ltd</SelectItem>
                <SelectItem value="abs">ASPOM Birth Services</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {/* Status Filter */}
          <div className="w-36">
            <Select
              value={status}
              onValueChange={(val) => {
                setStatus(val);
                setPage(1);
              }}
            >
              <SelectTrigger className="bg-background">
                <SelectValue placeholder="Status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Statuses</SelectItem>
                <SelectItem value="paid">Paid</SelectItem>
                <SelectItem value="unpaid">Unpaid</SelectItem>
                <SelectItem value="partially_paid">Partially Paid</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <Button
            variant="outline"
            size="icon"
            onClick={fetchHistory}
            disabled={loading}
            className="cursor-pointer"
          >
            <RefreshCw className={`h-4 w-4 ${loading ? "animate-spin" : ""}`} />
          </Button>
        </div>
      </div>

      {/* History Table */}
      <div className="bg-card rounded-xl border overflow-hidden">
        {loading && invoices.length === 0 ? (
          <div className="p-12 flex flex-col items-center justify-center text-muted-foreground">
            <Loader2 className="h-8 w-8 animate-spin text-primary mb-2" />
            <p className="text-sm">Loading invoice history...</p>
          </div>
        ) : invoices.length === 0 ? (
          <div className="p-12 flex flex-col items-center justify-center text-muted-foreground text-center">
            <p className="text-sm font-medium">No invoices found</p>
            <p className="text-xs mt-1">Try resetting filters or create a new invoice.</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="font-bold">Invoice #</TableHead>
                  <TableHead className="font-bold">Subsidiary</TableHead>
                  <TableHead className="font-bold">Client</TableHead>
                  <TableHead className="font-bold">Issue Date</TableHead>
                  <TableHead className="font-bold">Due Date</TableHead>
                  <TableHead className="font-bold text-right">Total Amount</TableHead>
                  <TableHead className="font-bold text-right">Deposit</TableHead>
                  <TableHead className="font-bold">Payment</TableHead>
                  <TableHead className="font-bold">Sent Status</TableHead>
                  <TableHead className="text-center font-bold w-32">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {invoices.map((invoice) => {
                  const subtotal = Number(invoice.subtotal);
                  const balance = Number(invoice.balance_due);
                  const isPaid = invoice.status === "paid" || (subtotal > 0 && balance <= 0 && invoice.status !== "unpaid" && invoice.status !== "partially_paid");

                  return (
                    <TableRow key={invoice.id}>
                      <TableCell className="font-bold text-primary tabular-nums">
                        {invoice.invoice_number}
                      </TableCell>
                      <TableCell className="text-xs">
                        {getSubsidiaryLabel(invoice.subsidiary)}
                      </TableCell>
                      <TableCell>
                        <div className="font-semibold text-slate-800">{invoice.client_name}</div>
                        {invoice.client_email && (
                          <div className="text-[10px] text-muted-foreground">{invoice.client_email}</div>
                        )}
                      </TableCell>
                      <TableCell className="text-xs">
                        {invoice.issue_date}
                      </TableCell>
                      <TableCell className="text-xs">
                        {invoice.due_date}
                      </TableCell>
                      <TableCell className="text-right font-semibold tabular-nums">
                        {formatCurrency(Number(invoice.subtotal))}
                      </TableCell>
                      <TableCell className="text-right tabular-nums text-slate-500">
                        {formatCurrency(Number(invoice.deposit))}
                      </TableCell>
                      <TableCell>
                        <Badge
                          className="capitalize cursor-default select-none"
                          variant={
                            invoice.status === "paid"
                              ? "default"
                              : invoice.status === "partially_paid"
                              ? "outline"
                              : "secondary"
                          }
                        >
                          {invoice.status.replace("_", " ")}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        {getEmailStatusBadge(invoice.email_status, invoice.last_sent_at)}
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center justify-center gap-1.5">
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => onLoadInvoice(invoice)}
                            className="h-8 text-xs gap-1 cursor-pointer"
                          >
                            <ExternalLink className="h-3 w-3" />
                            Open
                          </Button>
                          <AlertDialog>
                            <AlertDialogTrigger asChild>
                              <Button
                                variant="ghost"
                                size="icon"
                                disabled={deletingId === invoice.id}
                                className="h-8 w-8 text-destructive hover:text-destructive/90 hover:bg-destructive/10 cursor-pointer animate-in fade-in"
                              >
                                {deletingId === invoice.id ? (
                                  <Loader2 className="h-3.5 w-3.5 animate-spin" />
                                ) : (
                                  <Trash2 className="h-3.5 w-3.5" />
                                )}
                              </Button>
                            </AlertDialogTrigger>
                            <AlertDialogContent>
                              <AlertDialogHeader>
                                <AlertDialogTitle>Delete Invoice</AlertDialogTitle>
                                <AlertDialogDescription>
                                  Are you sure you want to delete invoice{" "}
                                  <strong className="text-slate-800 font-bold">
                                    {invoice.invoice_number}
                                  </strong>
                                  ? This action cannot be undone and will update the aggregate summaries.
                                </AlertDialogDescription>
                              </AlertDialogHeader>
                              <AlertDialogFooter>
                                <AlertDialogCancel className="cursor-pointer">Cancel</AlertDialogCancel>
                                <AlertDialogAction
                                  onClick={(e) => handleDelete(invoice.id, e)}
                                  variant="destructive"
                                  className="cursor-pointer"
                                >
                                  Delete
                                </AlertDialogAction>
                              </AlertDialogFooter>
                            </AlertDialogContent>
                          </AlertDialog>
                        </div>
                      </TableCell>
                    </TableRow>
                  );
                })}
              </TableBody>
            </Table>
          </div>
        )}
      </div>

      {/* Pagination Controls */}
      {totalPages > 1 && (
        <div className="flex items-center justify-between px-2 pt-4">
          <p className="text-xs text-muted-foreground italic">
            Showing {(page - 1) * limit + 1} to {Math.min(page * limit, totalRecords)} of {totalRecords} records
          </p>
          <div className="flex items-center gap-1">
            <Button
              variant="outline"
              size="sm"
              disabled={page <= 1 || loading}
              onClick={() => setPage(p => Math.max(1, p - 1))}
              className="cursor-pointer"
            >
              Previous
            </Button>
            {Array.from({ length: totalPages }, (_, i) => i + 1).map((p) => (
              <Button
                key={p}
                variant={page === p ? "default" : "outline"}
                size="sm"
                onClick={() => setPage(p)}
                className="w-9 h-9 p-0 cursor-pointer"
              >
                {p}
              </Button>
            ))}
            <Button
              variant="outline"
              size="sm"
              disabled={page >= totalPages || loading}
              onClick={() => setPage(p => Math.min(totalPages, p + 1))}
              className="cursor-pointer"
            >
              Next
            </Button>
          </div>
        </div>
      )}
    </div>
  );
}

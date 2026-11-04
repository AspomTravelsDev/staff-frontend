"use client";

import { useEffect, useState } from "react";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Checkbox } from "@/components/ui/checkbox";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import {
  MoreHorizontal,
  Edit,
  Eye,
  Trash2,
  Search,
  X,
  Loader2,
} from "lucide-react";
import {
  Client,
  CRM_SERVICE_OPTIONS,
  CRM_SOURCE_OPTIONS,
  CRMStatus,
  CRM_STATUS_OPTIONS,
} from "@/lib/api/crm-constants";
import { deleteClientAction } from "../actions";
import { EditClientDialog } from "./edit-client-dialog";
import { ClientDetailSheet } from "./client-detail-sheet";
import { TableExportButton } from "@/components/ui/table-export-button";
import { DetailsTableRow } from "@/components/ui/details-table-row";
import { toast } from "sonner";
import type { ExportColumn } from "@/lib/utils/export";

interface CRMTableProps {
  clients: Client[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    total_pages: number;
  };
  filters: {
    search: string;
    status: CRMStatus | "all";
    service: string | "all";
    source: string | "all";
  };
}

const STATUS_STYLES: Record<CRMStatus, string> = {
  potential: "bg-blue-50 text-blue-700 border-blue-200 hover:bg-blue-100",
  follow_up: "bg-amber-50 text-amber-700 border-amber-200 hover:bg-amber-100",
  negotiation:
    "bg-orange-50 text-orange-700 border-orange-200 hover:bg-orange-100",
  paid: "bg-green-50 text-green-700 border-green-200 hover:bg-green-100",
  inactive: "bg-gray-50 text-gray-500 border-gray-200 hover:bg-gray-100",
};

const EXPORT_COLUMNS: ExportColumn<Client>[] = [
  { header: "Name", key: "name" },
  { header: "Contact Person", key: "contactPerson" },
  { header: "Email", key: "email" },
  { header: "Phone", key: "phone" },
  { header: "Status", key: "status" },
  { header: "Service", key: "service" },
  { header: "Source", key: "source" },
  {
    header: "Assigned To",
    key: (c) => c.assignedToName || c.assignedTo || "Unassigned",
  },
  { header: "Last Contact", key: "lastContact" },
  { header: "Date Added", key: "createdAt" },
  { header: "Notes", key: "notes" },
];

export function CRMTable({ clients, pagination, filters }: CRMTableProps) {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();

  // Local UI state
  const [searchInput, setSearchInput] = useState(filters.search);
  const [statusFilter, setStatusFilter] = useState<CRMStatus | "all">(
    filters.status,
  );
  const [serviceFilter, setServiceFilter] = useState<string | "all">(
    filters.service,
  );
  const [sourceFilter, setSourceFilter] = useState<string | "all">(
    filters.source,
  );

  // Table generic state
  const [selectedRows, setSelectedRows] = useState<Set<string>>(new Set());

  // Dialogs state
  const [editClient, setEditClient] = useState<Client | null>(null);
  const [editOpen, setEditOpen] = useState(false);
  const [detailClient, setDetailClient] = useState<Client | null>(null);
  const [detailOpen, setDetailOpen] = useState(false);
  const [toDelete, setToDelete] = useState<Client | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);

  useEffect(() => {
    setSearchInput(filters.search);
    setStatusFilter(filters.status);
    setServiceFilter(filters.service);
    setSourceFilter(filters.source);
    setSelectedRows(new Set());
  }, [
    clients,
    filters.search,
    filters.status,
    filters.service,
    filters.source,
  ]);

  const updateQueryParams = (mutator: (params: URLSearchParams) => void) => {
    const params = new URLSearchParams(searchParams.toString());
    mutator(params);
    const query = params.toString();
    router.push(query ? `${pathname}?${query}` : pathname);
  };

  const applySearchFilter = () => {
    updateQueryParams((params) => {
      const value = searchInput.trim();
      if (value) {
        params.set("search", value);
      } else {
        params.delete("search");
      }
      params.set("page", "1");
    });
  };

  const handleStatusChange = (value: CRMStatus | "all") => {
    setStatusFilter(value);
    updateQueryParams((params) => {
      if (value === "all") {
        params.delete("status");
      } else {
        params.set("status", value);
      }
      params.set("page", "1");
    });
  };

  const handleServiceChange = (value: string | "all") => {
    setServiceFilter(value);
    updateQueryParams((params) => {
      if (value === "all") {
        params.delete("service");
      } else {
        params.set("service", value);
      }
      params.set("page", "1");
    });
  };

  const handleSourceChange = (value: string | "all") => {
    setSourceFilter(value);
    updateQueryParams((params) => {
      if (value === "all") {
        params.delete("source");
      } else {
        params.set("source", value);
      }
      params.set("page", "1");
    });
  };

  const handleLimitChange = (value: string) => {
    updateQueryParams((params) => {
      params.set("limit", value);
      params.set("page", "1");
    });
  };

  const goToPage = (page: number) => {
    if (page < 1 || page > pagination.total_pages || page === pagination.page) {
      return;
    }

    updateQueryParams((params) => {
      params.set("page", String(page));
    });
  };

  const handleEdit = (client: Client) => {
    setEditClient(client);
    setEditOpen(true);
  };

  const handleView = (client: Client) => {
    setDetailClient(client);
    setDetailOpen(true);
  };

  const handleDelete = async () => {
    if (!toDelete) return;
    setIsDeleting(true);
    try {
      const result = await deleteClientAction(toDelete.id);
      if (result.success) {
        toast.success("Client deleted");
        setToDelete(null);
      } else {
        toast.error("Failed to delete client");
      }
    } catch (error) {
      toast.error("An error occurred while deleting");
    } finally {
      setIsDeleting(false);
    }
  };

  const clearFilters = () => {
    setSearchInput("");
    setStatusFilter("all");
    setServiceFilter("all");
    setSourceFilter("all");
    setSelectedRows(new Set());
    updateQueryParams((params) => {
      params.delete("search");
      params.delete("status");
      params.delete("service");
      params.delete("source");
      params.set("page", "1");
    });
  };

  const hasFilters =
    filters.search !== "" ||
    filters.status !== "all" ||
    filters.service !== "all" ||
    filters.source !== "all";

  // Selection logic
  const handleSelectAll = (checked: boolean) => {
    if (checked) {
      setSelectedRows(new Set(clients.map((c) => c.id)));
    } else {
      setSelectedRows(new Set());
    }
  };

  const handleSelectRow = (id: string, checked: boolean) => {
    const next = new Set(selectedRows);
    if (checked) {
      next.add(id);
    } else {
      next.delete(id);
    }
    setSelectedRows(next);
  };

  const isAllSelected =
    clients.length > 0 && selectedRows.size === clients.length;
  const isSomeSelected =
    selectedRows.size > 0 && selectedRows.size < clients.length;

  return (
    <>
      {/* Filters row */}
      <div className="flex flex-col sm:flex-row gap-3 items-start sm:items-center">
        <div className="relative flex-1 max-w-sm">
          <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Search name, email, phone, service..."
            value={searchInput}
            onChange={(e) => setSearchInput(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === "Enter") {
                e.preventDefault();
                applySearchFilter();
              }
            }}
            className="pl-8"
          />
        </div>

        <Button variant="secondary" size="sm" onClick={applySearchFilter}>
          Apply
        </Button>

        <Select
          value={statusFilter}
          onValueChange={(v) => handleStatusChange(v as CRMStatus | "all")}
        >
          <SelectTrigger className="w-40">
            <SelectValue placeholder="All statuses" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Statuses</SelectItem>
            {CRM_STATUS_OPTIONS.map((s) => (
              <SelectItem key={s.value} value={s.value}>
                {s.label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>

        <Select
          value={serviceFilter}
          onValueChange={(v) => handleServiceChange(v as string | "all")}
        >
          <SelectTrigger className="w-44">
            <SelectValue placeholder="All services" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Services</SelectItem>
            {CRM_SERVICE_OPTIONS.map((service) => (
              <SelectItem key={service} value={service}>
                {service}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>

        <Select
          value={sourceFilter}
          onValueChange={(v) => handleSourceChange(v as string | "all")}
        >
          <SelectTrigger className="w-40">
            <SelectValue placeholder="All sources" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Sources</SelectItem>
            {CRM_SOURCE_OPTIONS.map((source) => (
              <SelectItem key={source} value={source}>
                {source}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>

        {hasFilters && (
          <Button
            variant="ghost"
            size="sm"
            onClick={clearFilters}
            className="gap-1.5"
          >
            <X className="h-3.5 w-3.5" />
            Clear
          </Button>
        )}

        <div className="ml-auto flex items-center gap-3">
          <p className="text-sm text-muted-foreground mr-2">
            {clients.length} of {pagination.total} customers
            {selectedRows.size > 0 && ` (${selectedRows.size} selected)`}
          </p>
          <TableExportButton
            data={clients}
            columns={EXPORT_COLUMNS}
            filename="my_clients_export"
            selectedIndices={selectedRows}
            keyExtractor={(item) => item.id}
          />
        </div>
      </div>

      {/* Table */}
      <div className="rounded-md border">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead className="w-10">
                <Checkbox
                  checked={
                    isAllSelected || (isSomeSelected ? "indeterminate" : false)
                  }
                  onCheckedChange={(checked) => handleSelectAll(!!checked)}
                  aria-label="Select all"
                />
              </TableHead>
              <TableHead>Client / Company</TableHead>
              <TableHead className="hidden sm:table-cell">Phone</TableHead>
              <TableHead>Status</TableHead>
              <TableHead className="hidden md:table-cell">Service</TableHead>
              <TableHead className="hidden lg:table-cell">Source</TableHead>
              <TableHead className="hidden lg:table-cell">
                Assigned To
              </TableHead>
              <TableHead className="hidden md:table-cell">
                Last Contact
              </TableHead>
              <TableHead className="text-right">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {clients.length === 0 ? (
              <TableRow>
                <TableCell
                  colSpan={9}
                  className="h-24 text-center text-muted-foreground"
                >
                  {hasFilters
                    ? "No customers match your filters."
                    : "No customers yet. Add your first customer!"}
                </TableCell>
              </TableRow>
            ) : (
              clients.map((client) => {
                const isSelected = selectedRows.has(client.id);
                return (
                  <DetailsTableRow
                    key={client.id}
                    detailLabel={`Open details for ${client.name}`}
                    onOpenDetails={() => handleView(client)}
                    className={`cursor-pointer ${isSelected ? "bg-muted/50" : "hover:bg-muted/30"}`}
                  >
                    <TableCell onClick={(e) => e.stopPropagation()}>
                      <Checkbox
                        checked={isSelected}
                        onCheckedChange={(checked) =>
                          handleSelectRow(client.id, !!checked)
                        }
                        aria-label="Select row"
                      />
                    </TableCell>
                    <TableCell>
                      <div className="flex flex-col">
                        <span className="font-medium">{client.name}</span>
                        <span className="text-xs text-muted-foreground">
                          {client.contactPerson !== client.name
                            ? `${client.contactPerson} · `
                            : ""}
                          {client.email || ""}
                        </span>
                      </div>
                    </TableCell>
                    <TableCell className="hidden sm:table-cell text-sm">
                      {client.phone || "—"}
                    </TableCell>
                    <TableCell>
                      <Badge
                        variant="outline"
                        className={`text-xs border ${STATUS_STYLES[client.status]}`}
                      >
                        {client.status}
                      </Badge>
                    </TableCell>
                    <TableCell className="hidden md:table-cell text-sm">
                      {client.service || "—"}
                    </TableCell>
                    <TableCell className="hidden lg:table-cell text-sm text-muted-foreground">
                      {client.source || "—"}
                    </TableCell>
                    <TableCell className="hidden lg:table-cell text-sm">
                      {client.assignedToName || client.assignedTo || "—"}
                    </TableCell>
                    <TableCell className="hidden md:table-cell text-sm text-muted-foreground">
                      {client.lastContact}
                    </TableCell>
                    <TableCell className="text-right">
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button
                            variant="ghost"
                            size="icon"
                            className="h-8 w-8"
                          >
                            <MoreHorizontal className="h-4 w-4" />
                            <span className="sr-only">Open menu</span>
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                          <DropdownMenuLabel>Actions</DropdownMenuLabel>
                          <DropdownMenuItem onClick={() => handleView(client)}>
                            <Eye className="mr-2 h-4 w-4" /> View Details
                          </DropdownMenuItem>
                          <DropdownMenuItem onClick={() => handleEdit(client)}>
                            <Edit className="mr-2 h-4 w-4" /> Edit
                          </DropdownMenuItem>
                          <DropdownMenuSeparator />
                          <DropdownMenuItem
                            className="text-destructive focus:text-destructive"
                            onClick={() => setToDelete(client)}
                          >
                            <Trash2 className="mr-2 h-4 w-4" /> Remove
                          </DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </TableCell>
                  </DetailsTableRow>
                );
              })
            )}
          </TableBody>
        </Table>
      </div>

      {pagination.total > 0 && (
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <p className="text-sm text-muted-foreground">
            Page {pagination.page} of {Math.max(1, pagination.total_pages)}
          </p>

          <div className="flex items-center gap-2">
            <span className="text-sm text-muted-foreground">Rows:</span>
            <Select
              value={String(pagination.limit)}
              onValueChange={handleLimitChange}
            >
              <SelectTrigger className="h-8 w-24">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="20">20</SelectItem>
                <SelectItem value="50">50</SelectItem>
                <SelectItem value="100">100</SelectItem>
              </SelectContent>
            </Select>

            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={() => goToPage(pagination.page - 1)}
              disabled={pagination.page <= 1}
            >
              Previous
            </Button>
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={() => goToPage(pagination.page + 1)}
              disabled={pagination.page >= pagination.total_pages}
            >
              Next
            </Button>
          </div>
        </div>
      )}

      {/* Dialogs */}
      <EditClientDialog
        open={editOpen}
        onOpenChange={setEditOpen}
        client={editClient}
      />
      <ClientDetailSheet
        open={detailOpen}
        onOpenChange={setDetailOpen}
        client={detailClient}
      />

      {/* Delete Confirmation */}
      <AlertDialog
        open={!!toDelete}
        onOpenChange={(open) => !open && setToDelete(null)}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Are you absolutely sure?</AlertDialogTitle>
            <AlertDialogDescription>
              This action cannot be undone. This will permanently remove the
              customer &quot;{toDelete?.name}&quot; and all associated data.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={isDeleting}>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={(e) => {
                e.preventDefault();
                handleDelete();
              }}
              disabled={isDeleting}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              {isDeleting ? (
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              ) : (
                <Trash2 className="mr-2 h-4 w-4" />
              )}
              Remove
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}

"use client";

import { useState, useMemo } from "react";
import { useSort } from "@/lib/hooks/use-sort";
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
  MoreHorizontal,
  Edit,
  Eye,
  Trash2,
  Search,
  X,
  Loader2,
  ArrowUpDown,
  ArrowUp,
  ArrowDown,
} from "lucide-react";
import { Client, CRMStatus, CRM_STATUS_OPTIONS } from "@/lib/api/crm-constants";
import { deleteClientAction } from "../actions";
import { EditClientDialog } from "./edit-client-dialog";
import { ClientDetailSheet } from "./client-detail-sheet";
import { useEmployees } from "@/lib/api/hooks/use-employees";
import { TableExportButton } from "@/components/ui/table-export-button";
import { toast } from "sonner";
import type { ExportColumn } from "@/lib/utils/export";

interface CRMTableProps {
  clients: Client[];
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
  { header: "Date of Birth", key: "dateOfBirth" },
  { header: "Last Contact", key: "lastContact" },
  { header: "Date Added", key: "createdAt" },
  { header: "Notes", key: "notes" },
];

export function CRMTable({ clients }: CRMTableProps) {
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState<CRMStatus | "all">("all");
  const [assignedToFilter, setAssignedToFilter] = useState<string | "all">(
    "all",
  );

  const { data: employeesData } = useEmployees({ status: "Active" });
  const employees = employeesData?.items || [];

  const [selectedRows, setSelectedRows] = useState<Set<string>>(new Set());

  const [editClient, setEditClient] = useState<Client | null>(null);
  const [editOpen, setEditOpen] = useState(false);
  const [detailClient, setDetailClient] = useState<Client | null>(null);
  const [detailOpen, setDetailOpen] = useState(false);
  const [toDelete, setToDelete] = useState<Client | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);

  const sortOptions = useMemo(() => ({
    dateFields: ["dateOfBirth", "lastContact", "createdAt"] as (keyof Client)[],
    customSorts: {
      assignedToName: (a: Client, b: Client, direction: "asc" | "desc") => {
        const aVal = a.assignedToName || a.assignedTo || "";
        const bVal = b.assignedToName || b.assignedTo || "";
        if (aVal < bVal) return direction === "asc" ? -1 : 1;
        if (aVal > bVal) return direction === "asc" ? 1 : -1;
        return 0;
      }
    }
  }), []);

  const filtered = useMemo(() => {
    return clients.filter((c) => {
      const matchesSearch =
        !search ||
        c.name.toLowerCase().includes(search.toLowerCase()) ||
        c.contactPerson.toLowerCase().includes(search.toLowerCase()) ||
        c.email?.toLowerCase().includes(search.toLowerCase()) ||
        c.phone?.toLowerCase().includes(search.toLowerCase()) ||
        c.service?.toLowerCase().includes(search.toLowerCase());

      const matchesStatus = statusFilter === "all" || c.status === statusFilter;
      const matchesAssignedTo =
        assignedToFilter === "all" ||
        (assignedToFilter === "unassigned"
          ? !c.assignedTo
          : c.assignedTo === assignedToFilter ||
            c.createdById === assignedToFilter);

      return matchesSearch && matchesStatus && matchesAssignedTo;
    });
  }, [clients, search, statusFilter, assignedToFilter]);

  const { sortedData: sorted, sortConfig, handleSort } = useSort(filtered, sortOptions);

  const handleEdit = (client: Client) => {
    setEditClient(client);
    setEditOpen(true);
  };

  const handleView = (client: Client) => {
    setDetailClient(client);
    setDetailOpen(true);
  };

  const handleClientUpdated = () => {
    // revalidatePath in the server action handles refreshing the data
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
    setSearch("");
    setStatusFilter("all");
    setAssignedToFilter("all");
    setSelectedRows(new Set());
  };

  const hasFilters =
    search || statusFilter !== "all" || assignedToFilter !== "all";

  const handleSelectAll = (checked: boolean) => {
    if (checked) {
      setSelectedRows(new Set(sorted.map((c) => c.id)));
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
    sorted.length > 0 && selectedRows.size === sorted.length;
  const isSomeSelected =
    selectedRows.size > 0 && selectedRows.size < sorted.length;

  const SortIcon = ({ columnKey }: { columnKey: keyof Client }) => {
    if (sortConfig?.key !== columnKey)
      return <ArrowUpDown className="ml-2 h-4 w-4" />;
    return sortConfig.direction === "asc" ? (
      <ArrowUp className="ml-2 h-4 w-4" />
    ) : (
      <ArrowDown className="ml-2 h-4 w-4" />
    );
  };

  return (
    <>
      {/* Filters row */}
      <div className="flex flex-col sm:flex-row gap-3 items-start sm:items-center">
        <div className="relative flex-1 max-w-sm">
          <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Search name, email, phone, service..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="pl-8"
          />
        </div>

        <Select
          value={statusFilter}
          onValueChange={(v) => setStatusFilter(v as CRMStatus | "all")}
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
          value={assignedToFilter}
          onValueChange={(v) => setAssignedToFilter(v)}
        >
          <SelectTrigger className="w-40">
            <SelectValue placeholder="All Staff" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Staff</SelectItem>
            <SelectItem value="unassigned">Unassigned</SelectItem>
            {employees.map((e) => (
              <SelectItem key={e.id} value={e.id}>
                {e.firstName} {e.lastName}
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
            {filtered.length} of {clients.length} customers
            {selectedRows.size > 0 && ` (${selectedRows.size} selected)`}
          </p>
          <TableExportButton
            data={sorted}
            columns={EXPORT_COLUMNS}
            filename="crm_export"
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
                <TableHead
                  className="cursor-pointer hover:text-foreground transition-colors group"
                  onClick={() => handleSort("name")}
                >
                  <div className="flex items-center">
                    Client / Company
                    <SortIcon columnKey="name" />
                  </div>
                </TableHead>
                <TableHead
                  className="hidden sm:table-cell cursor-pointer hover:text-foreground transition-colors group"
                  onClick={() => handleSort("phone")}
                >
                  <div className="flex items-center">
                    Phone
                    <SortIcon columnKey="phone" />
                  </div>
                </TableHead>
                <TableHead
                  className="cursor-pointer hover:text-foreground transition-colors group"
                  onClick={() => handleSort("status")}
                >
                  <div className="flex items-center">
                    Status
                    <SortIcon columnKey="status" />
                  </div>
                </TableHead>
                <TableHead
                  className="hidden md:table-cell cursor-pointer hover:text-foreground transition-colors group"
                  onClick={() => handleSort("service")}
                >
                  <div className="flex items-center">
                    Service
                    <SortIcon columnKey="service" />
                  </div>
                </TableHead>
                <TableHead
                  className="hidden lg:table-cell cursor-pointer hover:text-foreground transition-colors group"
                  onClick={() => handleSort("source")}
                >
                  <div className="flex items-center">
                    Source
                    <SortIcon columnKey="source" />
                  </div>
                </TableHead>
                <TableHead
                  className="hidden lg:table-cell cursor-pointer hover:text-foreground transition-colors group"
                  onClick={() => handleSort("assignedToName")}
                >
                  <div className="flex items-center">
                    Assigned To
                    <SortIcon columnKey="assignedToName" />
                  </div>
                </TableHead>
                <TableHead
                  className="hidden md:table-cell cursor-pointer hover:text-foreground transition-colors group"
                  onClick={() => handleSort("lastContact")}
                >
                  <div className="flex items-center">
                    Last Contact
                    <SortIcon columnKey="lastContact" />
                  </div>
                </TableHead>
                <TableHead className="text-right">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {sorted.length === 0 ? (
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
              sorted.map((client) => {
                const isSelected = selectedRows.has(client.id);
                return (
                  <TableRow
                    key={client.id}
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
                  </TableRow>
                );
              })
            )}
          </TableBody>
        </Table>
      </div>

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

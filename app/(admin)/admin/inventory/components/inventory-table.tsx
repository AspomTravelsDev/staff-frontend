"use client";

import { useState, useMemo } from "react";
import { useSort } from "@/lib/hooks/use-sort";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import {
  updateInventoryItem,
  deleteInventoryItem,
  InventoryItemPayload,
} from "@/lib/api/inventory";
import { ManageInventoryDialog } from "./inventory-dialog";
import { InventoryHistoryDialog } from "./inventory-history-dialog";
import { LogInspectionDialog } from "./log-inspection-dialog";
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
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Button } from "@/components/ui/button";
import {
  MoreHorizontal,
  Trash2,
  Edit,
  Replace,
  MapPin,
  Phone,
  History,
  ClipboardCheck,
  ArrowUpDown,
  ArrowUp,
  ArrowDown,
} from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { InventoryItem } from "@/lib/api/inventory";

import type { Employee } from "@/lib/api/employees";

interface InventoryTableProps {
  items: InventoryItem[];
  employees: Employee[];
}

export function InventoryTable({ items, employees }: InventoryTableProps) {
  const router = useRouter();
  const [itemToEdit, setItemToEdit] = useState<InventoryItem | null>(null);
  const [itemToDelete, setItemToDelete] = useState<InventoryItem | null>(null);
  const [itemHistory, setItemHistory] = useState<InventoryItem | null>(null);
  const [itemToInspect, setItemToInspect] = useState<InventoryItem | null>(
    null,
  );
  const [isDeleting, setIsDeleting] = useState(false);

  const { sortedData: sorted, sortConfig, handleSort } = useSort(items);

  const SortIcon = ({ columnKey }: { columnKey: keyof InventoryItem }) => {
    if (sortConfig?.key !== columnKey)
      return <ArrowUpDown className="ml-1 h-3 w-3 opacity-50" />;
    return sortConfig.direction === "asc" ? (
      <ArrowUp className="ml-1 h-3 w-3" />
    ) : (
      <ArrowDown className="ml-1 h-3 w-3" />
    );
  };

  const getStatusVariant = (status: string) => {
    switch (status) {
      case "Storage":
        return "default";
      case "Assigned":
        return "secondary";
      case "Repairs":
        return "destructive";
      default:
        return "outline";
    }
  };

  const getConditionColor = (rating: string) => {
    switch (rating) {
      case "Excellent":
        return "bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400";
      case "Good":
        return "bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400";
      case "Fair":
        return "bg-yellow-100 text-yellow-700 dark:bg-yellow-900/30 dark:text-yellow-400";
      case "Poor":
        return "bg-orange-100 text-orange-700 dark:bg-orange-900/30 dark:text-orange-400";
      case "Broken":
        return "bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400";
      default:
        return "bg-slate-100 text-slate-700 dark:bg-slate-900/30 dark:text-slate-400";
    }
  };

  const handleUpdate = async (data: InventoryItemPayload) => {
    if (!itemToEdit) return;
    toast.promise(updateInventoryItem(itemToEdit.id, data), {
      loading: "Updating inventory item...",
      success: () => {
        router.refresh();
        setItemToEdit(null);
        return "Item updated successfully";
      },
      error: (err: any) => err.message || "Failed to update item",
    });
  };

  const handleDelete = async () => {
    if (!itemToDelete) return;
    setIsDeleting(true);

    toast.promise(deleteInventoryItem(itemToDelete.id), {
      loading: "Removing asset...",
      success: () => {
        setIsDeleting(false);
        setItemToDelete(null);
        router.refresh();
        return "Asset removed successfully";
      },
      error: (err: any) => {
        setIsDeleting(false);
        return err.message || "Failed to remove asset";
      },
    });
  };

  return (
    <div className="rounded-md border bg-card">
      <Table>
        <TableHeader>
            <TableRow>
              <TableHead 
                className="cursor-pointer hover:text-foreground transition-colors group"
                onClick={() => handleSort("name")}
              >
                <div className="flex items-center">Device Model <SortIcon columnKey="name" /></div>
              </TableHead>
              <TableHead 
                className="cursor-pointer hover:text-foreground transition-colors group"
                onClick={() => handleSort("serialNumber")}
              >
                <div className="flex items-center">Serial Number <SortIcon columnKey="serialNumber" /></div>
              </TableHead>
              <TableHead 
                className="cursor-pointer hover:text-foreground transition-colors group"
                onClick={() => handleSort("category")}
              >
                <div className="flex items-center">Category <SortIcon columnKey="category" /></div>
              </TableHead>
              <TableHead 
                className="cursor-pointer hover:text-foreground transition-colors group"
                onClick={() => handleSort("conditionRating")}
              >
                <div className="flex items-center">Condition <SortIcon columnKey="conditionRating" /></div>
              </TableHead>
              <TableHead 
                className="cursor-pointer hover:text-foreground transition-colors group"
                onClick={() => handleSort("status")}
              >
                <div className="flex items-center">Status <SortIcon columnKey="status" /></div>
              </TableHead>
              <TableHead>Tracking Details</TableHead>
              <TableHead className="text-right">Actions</TableHead>
            </TableRow>
        </TableHeader>
        <TableBody>
          {sorted.length === 0 ? (
            <TableRow>
              <TableCell colSpan={7} className="h-24 text-center">
                No tracking devices found.
              </TableCell>
            </TableRow>
          ) : (
            sorted.map((item) => (
              <TableRow key={item.id}>
                <TableCell className="font-medium">{item.name}</TableCell>
                <TableCell className="font-mono text-xs text-muted-foreground">
                  {item.serialNumber}
                </TableCell>
                <TableCell>{item.category}</TableCell>
                <TableCell>
                  <div
                    className={`inline-flex px-2 py-0.5 rounded text-xs font-medium ${getConditionColor(item.conditionRating)}`}
                  >
                    {item.conditionRating}
                  </div>
                </TableCell>
                <TableCell>
                  <Badge variant={getStatusVariant(item.status)}>
                    {item.status}
                  </Badge>
                </TableCell>
                <TableCell>
                  {item.status === "Assigned" && item.assignedTo && (
                    <div className="text-sm">
                      <span className="text-muted-foreground mr-1">Staff:</span>
                      <span className="font-medium text-foreground">
                        {(() => {
                          const emp = employees.find(
                            (e) => e.id === item.assignedTo,
                          );
                          return emp
                            ? `${emp.firstName} ${emp.lastName}`
                            : item.assignedTo;
                        })()}
                      </span>
                    </div>
                  )}
                  {item.status === "Repairs" && item.technicianDetails && (
                    <div className="text-sm flex flex-col gap-0.5">
                      <span className="font-medium text-destructive">
                        {item.technicianDetails.name}
                      </span>
                      <span className="text-xs text-muted-foreground flex items-center gap-1">
                        <Phone className="w-3 h-3" />{" "}
                        {item.technicianDetails.phone}
                      </span>
                      <span className="text-xs text-muted-foreground flex items-center gap-1">
                        <MapPin className="w-3 h-3" />{" "}
                        {item.technicianDetails.address}
                      </span>
                    </div>
                  )}
                  {item.status === "Storage" && (
                    <span className="text-xs text-muted-foreground italic">
                      In Storage
                    </span>
                  )}
                </TableCell>
                <TableCell className="text-right">
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button variant="ghost" size="icon" className="h-8 w-8">
                        <MoreHorizontal className="h-4 w-4" />
                        <span className="sr-only">Open menu</span>
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end">
                      <DropdownMenuLabel>Device Actions</DropdownMenuLabel>
                      <DropdownMenuItem onClick={() => setItemToEdit(item)}>
                        <Edit className="mr-2 h-4 w-4" /> Update Status
                      </DropdownMenuItem>
                      <DropdownMenuItem onClick={() => setItemToEdit(item)}>
                        <Replace className="mr-2 h-4 w-4" /> Reassign Device
                      </DropdownMenuItem>
                      <DropdownMenuSeparator />
                      <DropdownMenuItem onClick={() => setItemToInspect(item)}>
                        <ClipboardCheck className="mr-2 h-4 w-4" /> Log
                        Inspection
                      </DropdownMenuItem>
                      <DropdownMenuItem onClick={() => setItemHistory(item)}>
                        <History className="mr-2 h-4 w-4" /> View History
                      </DropdownMenuItem>
                      <DropdownMenuSeparator />
                      <DropdownMenuItem
                        className="text-destructive font-medium"
                        onClick={() => setItemToDelete(item)}
                      >
                        <Trash2 className="mr-2 h-4 w-4" /> Remove Asset
                      </DropdownMenuItem>
                    </DropdownMenuContent>
                  </DropdownMenu>
                </TableCell>
              </TableRow>
            ))
          )}
        </TableBody>
      </Table>

      <ManageInventoryDialog
        open={!!itemToEdit}
        onOpenChange={(open) => !open && setItemToEdit(null)}
        initialData={itemToEdit}
        onSubmit={handleUpdate}
        employees={employees}
      />

      <InventoryHistoryDialog
        open={!!itemHistory}
        onOpenChange={(open) => !open && setItemHistory(null)}
        item={itemHistory}
      />

      <LogInspectionDialog
        open={!!itemToInspect}
        onOpenChange={(open) => !open && setItemToInspect(null)}
        item={itemToInspect}
      />

      <AlertDialog
        open={!!itemToDelete}
        onOpenChange={(open) => !open && setItemToDelete(null)}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Remove IT Asset</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to permanently delete{" "}
              <strong>{itemToDelete?.name}</strong> (
              {itemToDelete?.serialNumber})? This action cannot be undone and
              will remove it from all inventory tracking reports.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={isDeleting}>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDelete}
              disabled={isDeleting}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              {isDeleting ? "Deleting..." : "Permanently Delete"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}

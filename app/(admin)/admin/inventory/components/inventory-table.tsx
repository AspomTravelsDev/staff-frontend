"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import {
  updateInventoryItem,
  deleteInventoryItem,
  InventoryItemPayload,
} from "@/lib/api/inventory";
import { ManageInventoryDialog } from "./inventory-dialog";
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
  const [isDeleting, setIsDeleting] = useState(false);

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

  const handleUpdate = async (data: InventoryItemPayload) => {
    if (!itemToEdit) return;
    await updateInventoryItem(itemToEdit.id, data);
    router.refresh();
  };

  const handleDelete = async () => {
    if (!itemToDelete) return;
    setIsDeleting(true);
    try {
      await deleteInventoryItem(itemToDelete.id);
      router.refresh();
    } finally {
      setIsDeleting(false);
      setItemToDelete(null);
    }
  };

  return (
    <div className="rounded-md border bg-card">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Device Model</TableHead>
            <TableHead>Serial Number</TableHead>
            <TableHead>Category</TableHead>
            <TableHead>Status</TableHead>
            <TableHead>Tracking Details</TableHead>
            <TableHead className="text-right">Actions</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {items.length === 0 ? (
            <TableRow>
              <TableCell colSpan={6} className="h-24 text-center">
                No tracking devices found.
              </TableCell>
            </TableRow>
          ) : (
            items.map((item) => (
              <TableRow key={item.id}>
                <TableCell className="font-medium">{item.name}</TableCell>
                <TableCell className="font-mono text-xs text-muted-foreground">
                  {item.serialNumber}
                </TableCell>
                <TableCell>{item.category}</TableCell>
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

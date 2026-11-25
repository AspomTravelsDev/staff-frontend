"use client";

import { equipmentIssueRecords } from "@/lib/equipment-form";
import { useState } from "react";
import { useSort } from "@/lib/hooks/use-sort";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import {
  updateInventoryItem,
  deleteInventoryItem,
  getInventoryItemAssignments,
  getEmployeeEquipment,
  InventoryItemPayload,
} from "@/lib/api/inventory";
import { downloadAssetFormPdf } from "@/components/inventory/asset-form-pdf-button";
import { formatAssignmentStatus } from "@/lib/utils";
import { ManageInventoryDialog } from "./inventory-dialog";
import { InventoryHistoryDialog } from "./inventory-history-dialog";
import { LogInspectionDialog } from "./log-inspection-dialog";
import { InitiateAssignmentDialog } from "./initiate-assignment-dialog";
import { InitiateDeviceClearanceDialog } from "./initiate-device-clearance-dialog";
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
  History,
  ClipboardCheck,
  FileText,
  RotateCcw,
  ArrowUpDown,
  ArrowUp,
  ArrowDown,
} from "lucide-react";
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetDescription } from "@/components/ui/sheet";
import { Badge } from "@/components/ui/badge";
import { InventoryItem } from "@/lib/api/inventory";
import { Checkbox } from "@/components/ui/checkbox";
import { BulkAssignmentDialog } from "./bulk-assignment-dialog";
import { DetailsTableRow } from "@/components/ui/details-table-row";

import type { Employee } from "@/lib/api/employees";

interface InventoryTableProps {
  items: InventoryItem[];
  employees: Employee[];
}

export function InventoryTable({ items, employees }: InventoryTableProps) {
  const router = useRouter();
  const [detailItem, setDetailItem] = useState<InventoryItem | null>(null);
  const [itemToEdit, setItemToEdit] = useState<InventoryItem | null>(null);
  const [itemToDelete, setItemToDelete] = useState<InventoryItem | null>(null);
  const [itemHistory, setItemHistory] = useState<InventoryItem | null>(null);
  const [itemToInspect, setItemToInspect] = useState<InventoryItem | null>(
    null,
  );
  const [itemToAssign, setItemToAssign] = useState<InventoryItem | null>(null);
  const [itemToClear, setItemToClear] = useState<InventoryItem | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);
  const [selectedIds, setSelectedIds] = useState<string[]>([]);
  const [bulkAssignOpen, setBulkAssignOpen] = useState(false);

  const { sortedData: sorted, sortConfig, handleSort } = useSort(items);
  const eligible = sorted.filter((item) => item.status === "Storage" && !item.openAssignment);
  const selectedItems = eligible.filter((item) => selectedIds.includes(item.id));
  const allEligibleSelected = eligible.length > 0 && eligible.every((item) => selectedIds.includes(item.id));
  const someEligibleSelected = eligible.some((item) => selectedIds.includes(item.id));

  const handleDownloadAssetForm = async (item: InventoryItem) => {
    try {
      toast.loading(`Fetching asset form for ${item.name}...`, { id: "pdf-download" });
      const assignments = (await getInventoryItemAssignments(item.id)).filter((assignment) => !assignment.type || assignment.type === "assignment");
      toast.dismiss("pdf-download");

      if (assignments.length === 0) {
        toast.error(`No assignment records found for ${item.name} yet.`);
        return;
      }

      await downloadAssetFormPdf(assignments[0]);
    } catch (error: unknown) {
      toast.dismiss("pdf-download");
      toast.error((error instanceof Error ? error.message : undefined) || "Failed to fetch assignment details for PDF.");
    }
  };

  const handleDownloadStaffAssetsForm = async (item: InventoryItem) => {
    if (!item.assignedTo) return;
    const emp = employees.find((e) => e.id === item.assignedTo);
    const staffName = emp ? `${emp.firstName} ${emp.lastName}` : item.assignedTo;

    toast.loading(`Gathering current equipment for ${staffName}...`, { id: "staff-all-pdf" });
    try {
      const current = await getEmployeeEquipment(item.assignedTo);
      const validAssignments = equipmentIssueRecords(current, { id: item.assignedTo!, name: staffName, phone: emp?.phone, mobile_phone: emp?.mobile_phone, department: emp?.department, role: emp?.role });
      toast.dismiss("staff-all-pdf");

      if (validAssignments.length === 0) {
        toast.error(`No active assignment records found for ${staffName}.`);
        return;
      }

      const filename = `Asset_Declaration_${staffName.replace(/\s+/g, "_")}.pdf`;
      await downloadAssetFormPdf(undefined, validAssignments, filename, { current: true });
    } catch (error: unknown) {
      toast.dismiss("staff-all-pdf");
      toast.error((error instanceof Error ? error.message : undefined) || "Failed to download staff asset declaration PDF.");
    }
  };

  const sortIcon = (columnKey: keyof InventoryItem) => {
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

  const holder = (item: InventoryItem) => {
    if (item.status === "Repairs") return item.technicianDetails?.name || "Repair provider";
    if (item.assignedTo) {
      const employee = employees.find((employee) => employee.id === item.assignedTo);
      return employee ? `${employee.firstName} ${employee.lastName}` : "Staff member";
    }
    return "In storage";
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
      error: (err: Error) => err.message || "Failed to update item",
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
      error: (err: Error) => {
        setIsDeleting(false);
        return err.message || "Failed to remove asset";
      },
    });
  };

  return (
    <div className="space-y-3">
      {selectedItems.length > 0 && <div className="flex flex-wrap items-center justify-between gap-3 rounded-md border bg-muted/30 p-3">
        <p className="text-sm font-medium">{selectedItems.length} available {selectedItems.length === 1 ? "device" : "devices"} selected</p>
        <div className="flex gap-2"><Button size="sm" onClick={() => setBulkAssignOpen(true)} disabled={selectedItems.length > 50}>Assign selected</Button><Button size="sm" variant="ghost" onClick={() => setSelectedIds([])}>Clear selection</Button></div>
        {selectedItems.length > 50 && <p className="w-full text-xs text-destructive">A single batch can include up to 50 devices.</p>}
      </div>}
      <div className="rounded-md border bg-card">
      <Table>
        <TableHeader className="max-sm:hidden"><TableRow>
          <TableHead><Checkbox aria-label="Select all available devices" checked={allEligibleSelected ? true : someEligibleSelected ? "indeterminate" : false} onCheckedChange={(checked) => setSelectedIds(checked === true ? eligible.map((item) => item.id) : [])} /></TableHead>
          <TableHead aria-sort={sortConfig?.key === "name" ? (sortConfig.direction === "asc" ? "ascending" : "descending") : "none"}><button className="inline-flex items-center" onClick={() => handleSort("name")}>Device {sortIcon("name")}</button></TableHead>
          <TableHead>Held by</TableHead>
          <TableHead aria-sort={sortConfig?.key === "status" ? (sortConfig.direction === "asc" ? "ascending" : "descending") : "none"}><button className="inline-flex items-center" onClick={() => handleSort("status")}>Status {sortIcon("status")}</button></TableHead>
          <TableHead className="hidden md:table-cell">Condition</TableHead>
          <TableHead className="text-right">Actions</TableHead>
        </TableRow></TableHeader>
        <TableBody>
          {sorted.length === 0 ? (
            <TableRow><TableCell colSpan={6} className="h-24 text-center text-muted-foreground">No assets match your search or filters.</TableCell></TableRow>
          ) : sorted.map((item) => (
            <DetailsTableRow key={item.id} detailLabel={`Open details for ${item.name}`} onOpenDetails={() => setDetailItem(item)} className="max-sm:grid max-sm:grid-cols-[1fr_auto] max-sm:gap-x-3 max-sm:p-3 [&>td]:max-sm:p-1">
              <TableCell className="max-sm:col-start-2 max-sm:row-start-2"><Checkbox aria-label={`Select ${item.name}`} checked={selectedIds.includes(item.id)} disabled={item.status !== "Storage" || !!item.openAssignment} onCheckedChange={(checked) => setSelectedIds((current) => checked === true ? [...new Set([...current, item.id])] : current.filter((id) => id !== item.id))} /></TableCell>
              <TableCell><button onClick={() => setDetailItem(item)} className="text-left font-medium underline-offset-4 hover:underline focus-visible:underline">{item.name}</button><div className="mt-1 text-xs text-muted-foreground break-all">{item.serialNumber || item.assetTag}</div></TableCell>
              <TableCell className="max-sm:col-start-1 max-sm:row-start-2 max-sm:text-muted-foreground">{holder(item)}</TableCell>
              <TableCell className="max-sm:col-start-1 max-sm:row-start-3"><Badge variant={getStatusVariant(item.status)}>{item.status}</Badge>{item.openAssignment && <p className="mt-1 max-w-56 text-xs text-muted-foreground">{formatAssignmentStatus(item.openAssignment.status)}{item.openAssignment.assignee?.name ? ` :  ${item.openAssignment.assignee.name}` : ""}</p>}</TableCell>
              <TableCell className="hidden md:table-cell">
                <span className={["Poor", "Broken"].includes(item.conditionRating) ? "font-medium text-destructive" : "text-muted-foreground"}>{item.conditionRating}</span>
                {item.pendingConditionUpdate?.status === "pending_staff" && (
                  <div className="mt-1">
                    <Badge variant="outline" className="text-[10px] font-normal">
                      Pending: {item.pendingConditionUpdate.newConditionRating} (awaiting staff)
                    </Badge>
                  </div>
                )}
              </TableCell>
              <TableCell className="text-right max-sm:col-start-2 max-sm:row-start-1"><div className="flex items-center justify-end gap-1">
                <Button size="sm" variant="outline" className="hidden sm:inline-flex" onClick={() => {
                  if (item.openAssignment) setDetailItem(item);
                  else if (item.status === "Storage") setItemToAssign(item);
                  else if (item.status === "Assigned") setItemToClear(item);
                  else setDetailItem(item);
                }}>{item.openAssignment ? "View progress" : item.status === "Storage" ? "Assign" : item.status === "Assigned" ? "Request return" : "View details"}</Button>
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button variant="ghost" size="icon" className="h-8 w-8">
                        <MoreHorizontal className="h-4 w-4" />
                        <span className="sr-only">Actions for {item.name} ({item.serialNumber})</span>
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end">
                      <DropdownMenuLabel>Device actions</DropdownMenuLabel>
                      <DropdownMenuItem onClick={() => setDetailItem(item)}>View details</DropdownMenuItem>
                      <DropdownMenuItem onClick={() => setItemToEdit(item)}>
                        <Edit className="mr-2 h-4 w-4" /> Edit asset
                      </DropdownMenuItem>
                      {item.status === "Storage" && !item.openAssignment && (
                        <DropdownMenuItem onClick={() => setItemToAssign(item)}>
                          <Replace className="mr-2 h-4 w-4" /> Assign to Staff
                        </DropdownMenuItem>
                      )}
                      {item.status === "Assigned" && !item.openAssignment && (
                        <>
                          <DropdownMenuItem onClick={() => setItemToClear(item)}>
                            <RotateCcw className="mr-2 h-4 w-4 text-blue-500" /> Request return
                          </DropdownMenuItem>

                        </>
                      )}
                      <DropdownMenuSeparator />
                      <DropdownMenuItem
                        disabled={item.pendingConditionUpdate?.status === "pending_staff"}
                        onClick={() => setItemToInspect(item)}
                      >
                        <ClipboardCheck className="mr-2 h-4 w-4" />{" "}
                        {item.status === "Assigned" ? "Update Condition" : "Log Inspection"}
                        {item.pendingConditionUpdate?.status === "pending_staff" && " (Pending staff)"}
                      </DropdownMenuItem>
                      <DropdownMenuItem onClick={() => setItemHistory(item)}>
                        <History className="mr-2 h-4 w-4" /> View History
                      </DropdownMenuItem>
                      {(item.status === "Assigned" || item.openAssignment) && (
                        <DropdownMenuItem onClick={() => handleDownloadAssetForm(item)}>
                          <FileText className="mr-2 h-4 w-4 text-rose-600 dark:text-rose-400" /> Download Single Device Form
                        </DropdownMenuItem>
                      )}
                      {item.status === "Assigned" && item.assignedTo && (
                        <DropdownMenuItem onClick={() => handleDownloadStaffAssetsForm(item)}>
                          <FileText className="mr-2 h-4 w-4 text-rose-600 dark:text-rose-400 font-semibold" /> Download All Assets for Staff
                        </DropdownMenuItem>
                      )}
                      <DropdownMenuSeparator />
                      <DropdownMenuItem
                        className="text-destructive font-medium"
                        onClick={() => setItemToDelete(item)}
                      >
                        <Trash2 className="mr-2 h-4 w-4" /> Remove Asset
                      </DropdownMenuItem>
                    </DropdownMenuContent>
                  </DropdownMenu>
                </div></TableCell>
            </DetailsTableRow>
            ))}</TableBody>
      </Table>
      </div>

      <BulkAssignmentDialog open={bulkAssignOpen} onOpenChange={setBulkAssignOpen} items={selectedItems} employees={employees} />

      <Sheet open={!!detailItem} onOpenChange={(open) => !open && setDetailItem(null)}>
        <SheetContent className="w-full overflow-y-auto sm:max-w-lg">
          <SheetHeader><SheetTitle>{detailItem?.name}</SheetTitle><SheetDescription>Asset details and supporting records.</SheetDescription></SheetHeader>
          {detailItem && <div className="space-y-6 px-4 pb-6">
            <dl className="grid grid-cols-2 gap-4 text-sm">
              {[["Serial number", detailItem.serialNumber || "Not applicable"], ["Asset reference", detailItem.assetTag || "Legacy item"], ["Asset type", detailItem.assetType || detailItem.category], ["Category", detailItem.category], ["Held by", holder(detailItem)], ["Status", detailItem.status], ["Condition", detailItem.conditionRating]].map(([label, value]) => <div key={label}><dt className="text-muted-foreground">{label}</dt><dd className="mt-1 font-medium break-words">{value}</dd></div>)}
            </dl>
            {detailItem.openAssignment && <section><h3 className="font-medium">Current progress</h3><p className="mt-2 text-sm">{formatAssignmentStatus(detailItem.openAssignment.status)} : {detailItem.openAssignment.assignee?.name}</p><p className="mt-2 text-sm text-muted-foreground">Review this process in the approvals or clearance tab.</p></section>}
            {detailItem.pendingConditionUpdate?.status === "pending_staff" && (
              <section className="rounded-md border border-sky-200 bg-sky-50/60 dark:border-sky-900/50 dark:bg-sky-950/20 p-3 space-y-1.5 text-sm">
                <h3 className="font-medium text-sky-900 dark:text-sky-200">
                  Condition update awaiting staff confirmation
                </h3>
                <p>
                  Proposed:{" "}
                  <strong>{detailItem.pendingConditionUpdate.previousConditionRating}</strong>
                  {" → "}
                  <strong>{detailItem.pendingConditionUpdate.newConditionRating}</strong>
                </p>
                {detailItem.pendingConditionUpdate.newConditionDetails && (
                  <p className="text-muted-foreground">
                    {detailItem.pendingConditionUpdate.newConditionDetails}
                  </p>
                )}
                {detailItem.pendingConditionUpdate.notes && (
                  <p className="text-muted-foreground">
                    Note: {detailItem.pendingConditionUpdate.notes}
                  </p>
                )}
                <p className="text-xs text-muted-foreground">
                  Live device condition and stats will update once the assigned staff confirms.
                </p>
              </section>
            )}
            {detailItem.conditionDetails && <section><h3 className="font-medium">Condition notes</h3><p className="mt-2 whitespace-pre-wrap text-sm text-muted-foreground">{detailItem.conditionDetails}</p></section>}
            {detailItem.defaultChecklist && <details><summary className="cursor-pointer font-medium">Recorded device checklist</summary><dl className="mt-3 space-y-3 text-sm">{Object.entries(detailItem.defaultChecklist).map(([key, value]) => <div key={key}><dt className="text-muted-foreground">{({ screen: "Screen & display", charger: "Charger & cables", buttons: "Buttons & keyboard", battery: "Battery & charging", ports: "Ports & connectivity", cameraMic: "Camera, mic & speaker", overall: "Body & casing" } as Record<string, string>)[key] || key}</dt><dd>{value || "Not recorded"}</dd></div>)}</dl></details>}
            {detailItem.status === "Repairs" && detailItem.technicianDetails && <section><h3 className="font-medium">Repair contact</h3><p className="mt-2 text-sm">{detailItem.technicianDetails.name}</p><p className="text-sm text-muted-foreground">{detailItem.technicianDetails.phone}</p><p className="text-sm text-muted-foreground">{detailItem.technicianDetails.address}</p></section>}
            <div className="flex flex-wrap gap-2">
              <Button variant="outline" onClick={() => { setDetailItem(null); setItemHistory(detailItem); }}>View history</Button>
              <Button
                variant="outline"
                disabled={detailItem.pendingConditionUpdate?.status === "pending_staff"}
                onClick={() => { setDetailItem(null); setItemToInspect(detailItem); }}
              >
                {detailItem.status === "Assigned" ? "Update condition" : "Log inspection"}
              </Button>
              {(detailItem.status === "Assigned" || detailItem.openAssignment) && <Button variant="outline" onClick={() => handleDownloadAssetForm(detailItem)}>Download device form</Button>}
            </div>
          </div>}
        </SheetContent>
      </Sheet>

      <ManageInventoryDialog
        open={!!itemToEdit}
        onOpenChange={(open) => !open && setItemToEdit(null)}
        initialData={itemToEdit}
        items={items}
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

      <InitiateAssignmentDialog
        open={!!itemToAssign}
        onOpenChange={(open) => !open && setItemToAssign(null)}
        item={itemToAssign}
        employees={employees}
      />

      <InitiateDeviceClearanceDialog
        open={!!itemToClear}
        onOpenChange={(open) => !open && setItemToClear(null)}
        item={itemToClear}
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

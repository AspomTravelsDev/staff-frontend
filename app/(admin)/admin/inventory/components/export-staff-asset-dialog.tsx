"use client";

import { useState } from "react";
import { toast } from "sonner";
import type { Employee } from "@/lib/api/employees";
import {
  InventoryItem,
  InventoryAssignment,
  getInventoryItemAssignments,
} from "@/lib/api/inventory";
import { downloadAssetFormPdf } from "@/components/inventory/asset-form-pdf-button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { FileText, Loader2, UserCheck } from "lucide-react";
import { Badge } from "@/components/ui/badge";

interface ExportStaffAssetDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  employees: Employee[];
  items: InventoryItem[];
}

export function ExportStaffAssetDialog({
  open,
  onOpenChange,
  employees,
  items,
}: ExportStaffAssetDialogProps) {
  const [selectedEmployeeId, setSelectedEmployeeId] = useState<string>("");
  const [isExporting, setIsExporting] = useState(false);

  const selectedEmployee = employees.find((e) => e.id === selectedEmployeeId);

  // Find all items assigned to the selected employee in current inventory
  const assignedItems = items.filter(
    (item) => item.status === "Assigned" && item.assignedTo === selectedEmployeeId
  );

  const handleExport = async () => {
    if (!selectedEmployeeId || !selectedEmployee) {
      toast.error("Please select a staff member first.");
      return;
    }

    if (assignedItems.length === 0) {
      toast.error(
        `No assigned inventory items found for ${selectedEmployee.firstName} ${selectedEmployee.lastName}.`
      );
      return;
    }

    setIsExporting(true);
    toast.loading(
      `Generating Asset Declaration Undertaking for ${selectedEmployee.firstName}...`,
      { id: "staff-pdf-export" }
    );

    try {
      // Gather assignments for each assigned item
      const assignmentPromises = assignedItems.map(async (item) => {
        if (item.openAssignment) {
          return item.openAssignment;
        }
        const itemAssignments = await getInventoryItemAssignments(item.id);
        return itemAssignments[0] || null;
      });

      const fetchedAssignments = await Promise.all(assignmentPromises);
      const validAssignments = fetchedAssignments.filter(
        (a): a is InventoryAssignment => a !== null
      );

      toast.dismiss("staff-pdf-export");

      if (validAssignments.length === 0) {
        toast.error("No valid assignment records found for export.");
        return;
      }

      const filename = `Asset_Declaration_${selectedEmployee.firstName}_${selectedEmployee.lastName}.pdf`;
      await downloadAssetFormPdf(undefined, validAssignments, filename);
    } catch (error: any) {
      toast.dismiss("staff-pdf-export");
      toast.error(error?.message || "Failed to generate staff asset form.");
    } finally {
      setIsExporting(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <FileText className="h-5 w-5 text-rose-600 dark:text-rose-400" />
            Export Staff Asset Declaration Form
          </DialogTitle>
          <DialogDescription>
            Select a staff member to generate their official multi-item Asset Declaration Undertaking PDF.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-2">
          <div className="space-y-2">
            <label className="text-xs font-semibold text-muted-foreground">
              Select Staff Member
            </label>
            <Select
              value={selectedEmployeeId}
              onValueChange={setSelectedEmployeeId}
            >
              <SelectTrigger className="w-full">
                <SelectValue placeholder="Search or select staff..." />
              </SelectTrigger>
              <SelectContent className="max-h-60">
                {employees.map((emp) => {
                  const empAssignedCount = items.filter(
                    (i) => i.status === "Assigned" && i.assignedTo === emp.id
                  ).length;

                  return (
                    <SelectItem key={emp.id} value={emp.id}>
                      <div className="flex items-center justify-between w-full gap-2">
                        <span>
                          {emp.firstName} {emp.lastName} ({emp.department})
                        </span>
                        {empAssignedCount > 0 && (
                          <Badge variant="secondary" className="text-[10px] px-1.5 py-0">
                            {empAssignedCount} asset{empAssignedCount > 1 ? "s" : ""}
                          </Badge>
                        )}
                      </div>
                    </SelectItem>
                  );
                })}
              </SelectContent>
            </Select>
          </div>

          {selectedEmployee && (
            <div className="rounded-md border bg-muted/40 p-3 space-y-2 text-xs">
              <div className="flex items-center justify-between">
                <span className="font-semibold text-foreground flex items-center gap-1.5">
                  <UserCheck className="h-4 w-4 text-primary" />
                  {selectedEmployee.firstName} {selectedEmployee.lastName}
                </span>
                <Badge variant={assignedItems.length > 0 ? "default" : "outline"}>
                  {assignedItems.length} active asset{assignedItems.length === 1 ? "" : "s"}
                </Badge>
              </div>

              {assignedItems.length > 0 ? (
                <ul className="divide-y divide-border/60 rounded border bg-background px-2 py-1">
                  {assignedItems.map((item) => (
                    <li key={item.id} className="py-1 flex justify-between">
                      <span className="font-medium text-foreground">{item.name}</span>
                      <span className="font-mono text-muted-foreground">{item.serialNumber}</span>
                    </li>
                  ))}
                </ul>
              ) : (
                <p className="text-muted-foreground italic">
                  This employee currently has no active assigned inventory items.
                </p>
              )}
            </div>
          )}
        </div>

        <div className="flex justify-end gap-3 pt-2">
          <Button
            type="button"
            variant="outline"
            onClick={() => onOpenChange(false)}
          >
            Cancel
          </Button>
          <Button
            onClick={handleExport}
            disabled={!selectedEmployeeId || assignedItems.length === 0 || isExporting}
            className="gap-2"
          >
            {isExporting ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              <FileText className="h-4 w-4" />
            )}
            Download Consolidated PDF
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}

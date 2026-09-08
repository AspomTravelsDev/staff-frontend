"use client";

import { useState } from "react";
import { InventoryAssignment } from "@/lib/api/inventory";
import { ClearanceHandoverDialog } from "./clearance-handover-dialog";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { ShieldAlert, ArrowRight, Laptop, Smartphone, Server, MonitorPlay } from "lucide-react";

interface PendingClearanceHandoverSectionProps {
  assignments: InventoryAssignment[];
}

export function PendingClearanceHandoverSection({
  assignments,
}: PendingClearanceHandoverSectionProps) {
  const [openDialog, setOpenDialog] = useState(false);

  if (assignments.length === 0) return null;

  const getCategoryIcon = (category?: string) => {
    switch (category) {
      case "Laptop":
        return <Laptop className="w-4 h-4 text-blue-500 mr-1.5 shrink-0" />;
      case "Phone":
        return <Smartphone className="w-4 h-4 text-green-500 mr-1.5 shrink-0" />;
      case "Gadget":
        return <Server className="w-4 h-4 text-purple-500 mr-1.5 shrink-0" />;
      default:
        return <MonitorPlay className="w-4 h-4 text-slate-500 mr-1.5 shrink-0" />;
    }
  };

  return (
    <div className="rounded-xl border border-amber-300 bg-amber-50/80 dark:border-amber-800/60 dark:bg-amber-950/30 p-5 space-y-4 shadow-sm">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="flex items-start gap-3">
          <div className="p-2 rounded-lg bg-amber-100 dark:bg-amber-900/50 text-amber-700 dark:text-amber-400 mt-0.5">
            <ShieldAlert className="h-6 w-6" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h2 className="font-semibold text-lg text-amber-950 dark:text-amber-100">
                Gadget Clearance Handover Required
              </h2>
              <Badge className="bg-amber-600 hover:bg-amber-700 text-white font-mono text-xs">
                {assignments.length} {assignments.length === 1 ? "device" : "devices"}
              </Badge>
            </div>
            <p className="text-sm text-amber-800/90 dark:text-amber-300/90 mt-0.5 max-w-2xl">
              Asset clearance has been initiated for your assigned equipment. Please inspect each device, report its physical &amp; functional condition, and submit your official handover report before returning items to IT.
            </p>
          </div>
        </div>

        <Button
          onClick={() => setOpenDialog(true)}
          className="bg-amber-600 hover:bg-amber-700 text-white shrink-0 shadow-sm"
        >
          Complete Handover Form
          <ArrowRight className="ml-2 h-4 w-4" />
        </Button>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2.5 pt-1">
        {assignments.map((assignment) => (
          <div
            key={assignment.id}
            className="flex items-center justify-between p-3 rounded-lg border bg-card/90 shadow-2xs"
          >
            <div className="min-w-0 pr-2">
              <div className="flex items-center font-medium text-sm truncate">
                {getCategoryIcon(assignment.inventoryItem?.category)}
                <span className="truncate">{assignment.inventoryItem?.name || "Device"}</span>
              </div>
              <p className="text-xs text-muted-foreground font-mono mt-0.5 truncate">
                {assignment.inventoryItem?.serialNumber || "No serial number"}
              </p>
            </div>
            <Badge variant="secondary" className="text-2xs uppercase tracking-wider shrink-0">
              {assignment.inventoryItem?.category || "Device"}
            </Badge>
          </div>
        ))}
      </div>

      <ClearanceHandoverDialog
        open={openDialog}
        onOpenChange={setOpenDialog}
        assignments={assignments}
      />
    </div>
  );
}

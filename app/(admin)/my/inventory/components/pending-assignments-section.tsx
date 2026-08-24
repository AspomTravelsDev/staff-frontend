"use client";

import { useState } from "react";
import { InventoryAssignment } from "@/lib/api/inventory";
import { formatAssignmentStatus } from "@/lib/utils";
import { AcknowledgeAssignmentDialog } from "./acknowledge-assignment-dialog";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { ClipboardCheck } from "lucide-react";

interface PendingAssignmentsSectionProps {
  assignments: InventoryAssignment[];
}

export function PendingAssignmentsSection({
  assignments,
}: PendingAssignmentsSectionProps) {
  const [selected, setSelected] = useState<InventoryAssignment | null>(null);

  if (assignments.length === 0) return null;

  return (
    <div className="rounded-xl border border-amber-200 bg-amber-50/60 dark:border-amber-900/50 dark:bg-amber-950/20 p-4 space-y-3">
      <div className="flex items-start gap-3">
        <ClipboardCheck className="h-5 w-5 text-amber-700 dark:text-amber-400 mt-0.5" />
        <div>
          <h2 className="font-semibold text-amber-900 dark:text-amber-200">
            Pending acknowledgements
          </h2>
          <p className="text-sm text-amber-800/80 dark:text-amber-300/80">
            Inspect each device and approve or reject before custody is
            transferred to you.
          </p>
        </div>
      </div>

      <div className="space-y-2">
        {assignments.map((assignment) => (
          <div
            key={assignment.id}
            className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 rounded-lg border bg-card p-3"
          >
            <div>
              <p className="font-medium">
                {assignment.inventoryItem?.name || "Device"}
              </p>
              <p className="text-xs text-muted-foreground font-mono">
                {assignment.inventoryItem?.serialNumber}
              </p>
              <div className="mt-1 flex flex-wrap gap-2">
                <Badge variant="secondary">
                  {formatAssignmentStatus(assignment.status)}
                </Badge>
                {assignment.initiator?.name && (
                  <span className="text-xs text-muted-foreground">
                    Assigned by {assignment.initiator.name}
                  </span>
                )}
              </div>
            </div>
            <Button size="sm" onClick={() => setSelected(assignment)}>
              Inspect & decide
            </Button>
          </div>
        ))}
      </div>

      <AcknowledgeAssignmentDialog
        open={!!selected}
        onOpenChange={(open) => !open && setSelected(null)}
        assignment={selected}
      />
    </div>
  );
}

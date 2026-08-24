"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import {
  InventoryAssignment,
  InventoryAssignmentDecision,
  submitInventoryComplianceDecision,
  submitInventoryOfficerDecision,
} from "@/lib/api/inventory";
import { formatAssignmentStatus } from "@/lib/utils";
import { AssetFormPdfButton } from "@/components/inventory/asset-form-pdf-button";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";

type QueueMode = "officer" | "compliance";

export function AssignmentQueueTable({
  assignments,
  mode,
}: {
  assignments: InventoryAssignment[];
  mode: QueueMode;
}) {
  const router = useRouter();
  const [selected, setSelected] = useState<InventoryAssignment | null>(null);
  const [notes, setNotes] = useState("");
  const [loading, setLoading] = useState(false);

  async function decide(decision: InventoryAssignmentDecision) {
    if (!selected) return;
    if (decision === "rejected" && notes.trim().length < 3) {
      toast.error("A note is required when rejecting.");
      return;
    }

    setLoading(true);
    try {
      if (mode === "officer") {
        await submitInventoryOfficerDecision(selected.id, {
          decision,
          notes: notes.trim() || undefined,
        });
      } else {
        await submitInventoryComplianceDecision(selected.id, {
          decision,
          notes: notes.trim() || undefined,
        });
      }
      toast.success(
        decision === "approved"
          ? mode === "officer"
            ? "Sent to compliance."
            : "Assignment completed."
          : "Sent back to staff.",
      );
      setSelected(null);
      setNotes("");
      router.refresh();
    } catch (error: any) {
      toast.error(error?.message || "Failed to submit decision");
    } finally {
      setLoading(false);
    }
  }

  return (
    <>
      <div className="rounded-md border bg-card">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Device</TableHead>
              <TableHead>Assignee</TableHead>
              <TableHead>Staff condition</TableHead>
              <TableHead>Staff notes</TableHead>
              <TableHead>Status</TableHead>
              <TableHead className="text-right">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {assignments.length === 0 ? (
              <TableRow>
                <TableCell
                  colSpan={6}
                  className="h-24 text-center text-muted-foreground"
                >
                  No assignments waiting in this queue.
                </TableCell>
              </TableRow>
            ) : (
              assignments.map((assignment) => (
                <TableRow key={assignment.id}>
                  <TableCell>
                    <div className="font-medium">
                      {assignment.inventoryItem?.name}
                    </div>
                    <div className="text-xs font-mono text-muted-foreground">
                      {assignment.inventoryItem?.serialNumber}
                    </div>
                  </TableCell>
                  <TableCell>{assignment.assignee?.name || "—"}</TableCell>
                  <TableCell>
                    {assignment.staffConditionRating || "—"}
                  </TableCell>
                  <TableCell className="max-w-xs truncate text-sm">
                    {assignment.staffNotes || "—"}
                  </TableCell>
                  <TableCell>
                    <Badge variant="secondary">
                      {formatAssignmentStatus(assignment.status)}
                    </Badge>
                  </TableCell>
                  <TableCell className="text-right">
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => {
                        setSelected(assignment);
                        setNotes("");
                      }}
                    >
                      Review
                    </Button>
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </div>

      <Dialog
        open={!!selected}
        onOpenChange={(open) => {
          if (!open) {
            setSelected(null);
            setNotes("");
          }
        }}
      >
        <DialogContent className="sm:max-w-lg">
          <DialogHeader>
            <DialogTitle>
              {mode === "officer" ? "Officer review" : "Compliance review"}
            </DialogTitle>
            <DialogDescription>
              {selected?.inventoryItem?.name} —{" "}
              {selected?.inventoryItem?.serialNumber}
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-3 text-sm">
            <p>
              <span className="font-medium">Assignee: </span>
              {selected?.assignee?.name}
            </p>
            <p>
              <span className="font-medium">Condition: </span>
              {selected?.staffConditionRating} —{" "}
              {selected?.staffConditionDetails}
            </p>
            <p>
              <span className="font-medium">Staff notes: </span>
              {selected?.staffNotes}
            </p>
            {mode === "compliance" && selected?.officerNotes && (
              <p>
                <span className="font-medium">Officer notes: </span>
                {selected.officerNotes}
              </p>
            )}
            {selected && (
              <div className="pt-1">
                <AssetFormPdfButton
                  assignment={selected}
                  label="Preview / Download Asset Form (PDF)"
                  variant="outline"
                  size="sm"
                  className="w-full"
                />
              </div>
            )}

            <div className="space-y-2">
              <Label htmlFor="review-notes">Review notes</Label>
              <Textarea
                id="review-notes"
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                placeholder="Optional when approving; required when rejecting"
                rows={3}
              />
            </div>
          </div>

          <div className="flex justify-end gap-2 pt-2">
            <Button
              variant="destructive"
              disabled={loading}
              onClick={() => decide("rejected")}
            >
              Send back to staff
            </Button>
            <Button disabled={loading} onClick={() => decide("approved")}>
              Approve
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
}

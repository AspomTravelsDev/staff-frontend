"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import {
  InventoryAssignment,
  InventoryAssignmentDecision,
  GadgetChecklist,
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
import { Input } from "@/components/ui/input";
import { DetailsTableRow } from "@/components/ui/details-table-row";

type QueueMode = "officer" | "compliance";

export function AssignmentQueueTable({
  assignments,
  mode,
  initialAssignment,
  reviewOnly = false,
  onReviewClose,
}: {
  assignments: InventoryAssignment[];
  mode: QueueMode;
  initialAssignment?: InventoryAssignment;
  reviewOnly?: boolean;
  onReviewClose?: () => void;
}) {
  const router = useRouter();
  const [selected, setSelected] = useState<InventoryAssignment | null>(initialAssignment ?? null);
  const [notes, setNotes] = useState("");
  const [loading, setLoading] = useState(false);
  const [adminChecklist, setAdminChecklist] = useState<GadgetChecklist | undefined>(initialAssignment?.adminChecklist ? { ...initialAssignment.adminChecklist } : undefined);

  const checklistFields: Array<[keyof GadgetChecklist, string]> = [
    ["screen", "Screen & Display"],
    ["charger", "Charger & Cables"],
    ["buttons", "Buttons & Keyboard"],
    ["battery", "Battery & Charging"],
    ["ports", "Ports & Connectivity"],
    ["cameraMic", "Camera, Mic & Speaker"],
    ["overall", "Overall Body & Casing"],
  ];

  async function decide(
    decision: InventoryAssignmentDecision,
    sendBackTo?: "staff" | "admin_it",
  ) {
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
          adminChecklist: isReturnedToOfficer ? adminChecklist : undefined,
        });
      } else {
        await submitInventoryComplianceDecision(selected.id, {
          decision,
          notes: notes.trim() || undefined,
          sendBackTo,
        });
      }
      toast.success(
        decision === "approved"
          ? mode === "officer"
            ? "Sent to compliance."
            : "Assignment completed."
          : mode === "officer" || sendBackTo === "staff"
            ? "Sent back to staff."
            : "Sent back to Admin / IT.",
      );
      setSelected(null); onReviewClose?.();
      setNotes("");
      setAdminChecklist(undefined);
      router.refresh();
    } catch (error: unknown) {
      toast.error(error instanceof Error ? error.message : "Failed to submit decision");
    } finally {
      setLoading(false);
    }
  }

  const isReturnedToOfficer = mode === "officer" && selected?.complianceDecision === "rejected";

  return (
    <>
      {!reviewOnly && <div className="rounded-md border bg-card">
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
                <DetailsTableRow
                  key={assignment.id}
                  detailLabel={`Review assignment for ${assignment.inventoryItem?.name || "device"}`}
                  onOpenDetails={() => {
                    setSelected(assignment);
                    setNotes("");
                    setAdminChecklist(assignment.adminChecklist ? { ...assignment.adminChecklist } : undefined);
                  }}
                >
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
                        setAdminChecklist(assignment.adminChecklist ? { ...assignment.adminChecklist } : undefined);
                      }}
                    >
                      Review
                    </Button>
                  </TableCell>
                </DetailsTableRow>
              ))
            )}
          </TableBody>
        </Table>
      </div>}

      <Dialog
        open={!!selected}
        onOpenChange={(open) => {
          if (!open) {
            setSelected(null); onReviewClose?.();
            setNotes("");
          }
        }}
      >
        <DialogContent className="flex max-h-[90dvh] flex-col overflow-hidden sm:max-w-lg">
          <DialogHeader>
            <DialogTitle>
              {mode === "officer" ? "Officer review" : "Compliance review"}
            </DialogTitle>
            <DialogDescription>
              {selected?.inventoryItem?.name} —{" "}
              {selected?.inventoryItem?.serialNumber}
            </DialogDescription>
          </DialogHeader>

          <div className="min-h-0 flex-1 space-y-3 overflow-y-auto pr-2 text-sm">
            <p>
              <span className="font-medium">Assignee: </span>
              {selected?.assignee?.name}
            </p>
            <p>
              <span className="font-medium">Condition: </span>
              {selected?.staffConditionRating} —{" "}
              {selected?.staffConditionDetails}
            </p>
            {selected?.staffNotes && (
              <p>
                <span className="font-medium">Staff notes: </span>
                {selected.staffNotes}
              </p>
            )}
            {([['Admin / IT assignment checklist', selected?.adminChecklist], ['Staff final checklist', selected?.staffChecklist]] as const).map(([title, checklist]) => checklist && !(isReturnedToOfficer && title.startsWith("Admin / IT")) && (
              <div key={title} className="rounded-md border p-3 bg-muted/20 text-xs space-y-1.5">
                <span className="font-semibold block text-foreground mb-1">{title}</span>
                <div className="grid grid-cols-2 gap-1.5 text-muted-foreground">
                  {Object.entries(checklist).map(([key, value]) => value?.trim() ? (
                    <div key={key} className={key === "overall" ? "col-span-2" : undefined}>
                      <strong className="text-foreground">{key === "cameraMic" ? "Camera/Mic" : key}:</strong> {value}
                    </div>
                  ) : null)}
                </div>
              </div>
            ))}
            {isReturnedToOfficer && adminChecklist && (
              <section className="space-y-3 rounded-md border border-primary/30 bg-primary/5 p-3">
                <div>
                  <p className="font-semibold">Edit Admin / IT checklist</p>
                  <p className="text-xs text-muted-foreground">Changes are saved when you approve this review. The staff checklist remains unchanged.</p>
                </div>
                <div className="grid grid-cols-2 gap-2">
                  {checklistFields.map(([key, label]) => (
                    <label key={key} className={key === "overall" ? "col-span-2 space-y-1" : "space-y-1"}>
                      <span className="text-xs font-medium">{label}</span>
                      <Input
                        value={adminChecklist[key]}
                        onChange={(event) => setAdminChecklist((current) => current ? { ...current, [key]: event.target.value } : current)}
                      />
                    </label>
                  ))}
                </div>
              </section>
            )}
            {mode === "compliance" && selected?.officerNotes && (
              <p>
                <span className="font-medium">Officer notes: </span>
                {selected.officerNotes}
              </p>
            )}
            {mode === "officer" && selected?.complianceDecision === "rejected" && selected?.complianceNotes && (
              <p className="rounded-md border border-amber-300 bg-amber-50 p-2 text-amber-950">
                <span className="font-medium">Compliance sent this back: </span>
                {selected.complianceNotes}
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

          <div className="flex shrink-0 justify-end gap-2 border-t bg-background pt-3">
            {mode === "compliance" ? (
              <>
                <Button variant="destructive" disabled={loading} onClick={() => decide("rejected", "staff")}>
                  Send back to staff
                </Button>
                <Button variant="outline" disabled={loading} onClick={() => decide("rejected", "admin_it")}>
                  Send back to Admin / IT
                </Button>
              </>
            ) : (
              <Button variant="destructive" disabled={loading} onClick={() => decide("rejected")}>
                Send back to staff
              </Button>
            )}
            <Button disabled={loading} onClick={() => decide("approved")}>
              Approve
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
}

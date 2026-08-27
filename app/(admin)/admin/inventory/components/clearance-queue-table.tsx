"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import {
  InventoryAssignment,
  InventoryAssignmentDecision,
  inspectClearanceReturn,
  approveClearanceCompliance,
} from "@/lib/api/inventory";
import { AssetClearancePdfButton } from "@/components/inventory/asset-clearance-pdf-button";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
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
import { ShieldCheck, UserCheck, RotateCcw, AlertTriangle } from "lucide-react";

type ClearanceQueueMode = "officer" | "compliance";

export function ClearanceQueueTable({
  assignments,
  mode,
}: {
  assignments: InventoryAssignment[];
  mode: ClearanceQueueMode;
}) {
  const router = useRouter();
  const [selected, setSelected] = useState<InventoryAssignment | null>(null);
  const [returnCondition, setReturnCondition] = useState<string>("Good");
  const [conditionDetails, setConditionDetails] = useState<string>("");
  const [damageFee, setDamageFee] = useState<string>("0");
  const [notes, setNotes] = useState("");
  const [loading, setLoading] = useState(false);

  const openInspectionModal = (item: InventoryAssignment) => {
    setSelected(item);
    setReturnCondition(item.returnConditionRating || item.inventoryItem?.conditionRating || "Good");
    setConditionDetails(item.returnConditionDetails || "");
    setDamageFee(item.damageAssessmentFee ? String(item.damageAssessmentFee) : "0");
    setNotes("");
  };

  async function handleDecision(decision: InventoryAssignmentDecision) {
    if (!selected) return;
    if (decision === "rejected" && notes.trim().length < 3) {
      toast.error("A note is required when rejecting clearance.");
      return;
    }

    setLoading(true);
    try {
      if (mode === "officer") {
        await inspectClearanceReturn(selected.id, {
          decision,
          returnConditionRating: returnCondition,
          returnConditionDetails: conditionDetails.trim() || undefined,
          damageAssessmentFee: parseFloat(damageFee) || 0,
          notes: notes.trim() || undefined,
        });
        toast.success(
          decision === "approved"
            ? "IT inspection complete. Sent to Compliance for final audit."
            : "Return inspection rejected/cancelled."
        );
      } else {
        await approveClearanceCompliance(selected.id, {
          decision,
          notes: notes.trim() || undefined,
        });
        toast.success(
          decision === "approved"
            ? "Gadget clearance completed. Asset returned to storage."
            : "Clearance sent back to IT inspection."
        );
      }
      setSelected(null);
      router.refresh();
    } catch (error: any) {
      toast.error(error?.message || "Failed to process clearance decision");
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
              <TableHead>Clearance Type</TableHead>
              <TableHead>Return Condition</TableHead>
              <TableHead>Damage Fee</TableHead>
              <TableHead>Status</TableHead>
              <TableHead className="text-right">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {assignments.length === 0 ? (
              <TableRow>
                <TableCell colSpan={7} className="h-32 text-center text-muted-foreground">
                  No gadget clearance items pending in this queue.
                </TableCell>
              </TableRow>
            ) : (
              assignments.map((item) => (
                <TableRow key={item.id}>
                  <TableCell className="font-medium">
                    <div className="font-semibold text-foreground">
                      {item.inventoryItem?.name || "Device"}
                    </div>
                    <div className="font-mono text-xs text-muted-foreground">
                      {item.inventoryItem?.serialNumber}
                    </div>
                  </TableCell>
                  <TableCell>
                    <div className="font-medium">{item.assignee?.name}</div>
                    <div className="text-xs text-muted-foreground">
                      {item.assignee?.department || "General"}
                    </div>
                  </TableCell>
                  <TableCell>
                    <Badge variant={item.type === "full_clearance" ? "destructive" : "secondary"}>
                      {item.type === "full_clearance" ? "Offboarding Clearance" : "Single Return"}
                    </Badge>
                  </TableCell>
                  <TableCell>
                    <Badge variant="outline">
                      {item.returnConditionRating || item.inventoryItem?.conditionRating || "Pending Inspection"}
                    </Badge>
                  </TableCell>
                  <TableCell className="font-mono font-medium text-slate-800 dark:text-slate-200">
                    {item.damageAssessmentFee && item.damageAssessmentFee > 0
                      ? `₦${item.damageAssessmentFee.toLocaleString()}`
                      : "₦0"}
                  </TableCell>
                  <TableCell>
                    <Badge variant="outline" className="capitalize">
                      {item.status.replace(/_/g, " ")}
                    </Badge>
                  </TableCell>
                  <TableCell className="text-right">
                    <div className="flex justify-end gap-2">
                      {item.status !== "cleared" && (
                        <Button
                          size="sm"
                          variant={mode === "officer" ? "default" : "secondary"}
                          onClick={() => openInspectionModal(item)}
                        >
                          {mode === "officer" ? (
                            <>
                              <UserCheck className="mr-1 h-3.5 w-3.5" /> Inspect Return
                            </>
                          ) : (
                            <>
                              <ShieldCheck className="mr-1 h-3.5 w-3.5 text-blue-600" /> Audit Clearance
                            </>
                          )}
                        </Button>
                      )}

                      {item.status === "cleared" && (
                        <AssetClearancePdfButton assignment={item} size="sm" />
                      )}
                    </div>
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </div>

      <Dialog open={!!selected} onOpenChange={(open) => !open && setSelected(null)}>
        <DialogContent className="sm:max-w-lg">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <RotateCcw className="h-5 w-5 text-blue-600" />
              {mode === "officer" ? "IT Physical Return Inspection" : "Compliance Gadget Clearance Audit"}
            </DialogTitle>
            <DialogDescription>
              {selected?.inventoryItem?.name} ({selected?.inventoryItem?.serialNumber}) — Assigned to{" "}
              <span className="font-semibold text-foreground">{selected?.assignee?.name}</span>
            </DialogDescription>
          </DialogHeader>

          {selected && (
            <div className="space-y-4 py-2">
              {mode === "officer" ? (
                <>
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="returnCondition">Return Physical Condition</Label>
                      <Select value={returnCondition} onValueChange={setReturnCondition}>
                        <SelectTrigger id="returnCondition">
                          <SelectValue placeholder="Select condition" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="Excellent">Excellent</SelectItem>
                          <SelectItem value="Good">Good</SelectItem>
                          <SelectItem value="Fair">Fair</SelectItem>
                          <SelectItem value="Poor">Poor</SelectItem>
                          <SelectItem value="Broken">Broken</SelectItem>
                          <SelectItem value="Lost">Lost</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="damageFee">Damage / Penalty Fee (₦)</Label>
                      <Input
                        id="damageFee"
                        type="number"
                        min="0"
                        placeholder="0"
                        value={damageFee}
                        onChange={(e) => setDamageFee(e.target.value)}
                      />
                    </div>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="conditionDetails">Condition Assessment Details</Label>
                    <Textarea
                      id="conditionDetails"
                      placeholder="e.g. Scratched screen, charger missing, or device intact..."
                      value={conditionDetails}
                      onChange={(e) => setConditionDetails(e.target.value)}
                      rows={2}
                    />
                  </div>
                </>
              ) : (
                <div className="rounded-lg border bg-muted/40 p-4 space-y-2 text-sm">
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">IT Return Condition:</span>
                    <span className="font-semibold">{selected.returnConditionRating || "Good"}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Damage Assessment Fee:</span>
                    <span className="font-semibold text-amber-600">
                      ₦{(selected.damageAssessmentFee || 0).toLocaleString()}
                    </span>
                  </div>
                  {selected.returnConditionDetails && (
                    <div className="pt-2 border-t text-xs text-muted-foreground">
                      <span className="font-semibold text-foreground">IT Inspection Notes: </span>
                      {selected.returnConditionDetails}
                    </div>
                  )}
                </div>
              )}

              <div className="space-y-2">
                <Label htmlFor="notes">
                  {mode === "officer" ? "IT Officer Inspection Notes" : "Compliance Audit Notes"}
                </Label>
                <Textarea
                  id="notes"
                  placeholder="Optional review notes..."
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  rows={2}
                />
              </div>

              <div className="flex justify-end gap-2 pt-2">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => setSelected(null)}
                  disabled={loading}
                >
                  Cancel
                </Button>

                <Button
                  type="button"
                  variant="destructive"
                  onClick={() => handleDecision("rejected")}
                  disabled={loading}
                >
                  {mode === "officer" ? "Cancel Return" : "Send Back to IT"}
                </Button>

                <Button
                  type="button"
                  onClick={() => handleDecision("approved")}
                  disabled={loading}
                  className="bg-emerald-600 hover:bg-emerald-700 text-white"
                >
                  {mode === "officer" ? "Pass Inspection" : "Approve Clearance"}
                </Button>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </>
  );
}

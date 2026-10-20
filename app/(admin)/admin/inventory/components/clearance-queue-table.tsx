"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import {
  InventoryAssignment,
  InventoryAssignmentDecision,
  GadgetChecklist,
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
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { RotateCcw } from "lucide-react";

import { clearanceStage, clearanceStages, groupClearances } from "@/lib/inventory-clearance";

type ClearanceQueueMode = "officer" | "compliance";

const returnChecklistFields: Array<[keyof GadgetChecklist, string]> = [
  ["screen", "Screen & Display"],
  ["charger", "Charger & Cables"],
  ["buttons", "Buttons & Keyboard"],
  ["battery", "Battery & Charging"],
  ["ports", "Ports & Connectivity"],
  ["cameraMic", "Camera, Mic & Speaker"],
  ["overall", "Overall Body & Casing"],
];

export function ClearanceQueueTable({
  assignments,
  mode,
  initialAssignment,
  reviewOnly = false,
  onReviewClose,
}: {
  assignments: InventoryAssignment[];
  mode: ClearanceQueueMode;
  initialAssignment?: InventoryAssignment;
  reviewOnly?: boolean;
  onReviewClose?: () => void;
}) {
  const router = useRouter();
  const [view, setView] = useState("active");
  const allGroups = groupClearances(assignments);
  const groups = allGroups.filter((group) => view === "all" || (view === "active" ? group.stage >= 0 && !group.complete : group.complete || group.stage < 0));
  const [selected, setSelected] = useState<InventoryAssignment | null>(initialAssignment ?? null);
  const [returnCondition, setReturnCondition] = useState<string>(initialAssignment?.returnConditionRating || initialAssignment?.inventoryItem?.conditionRating || "Good");
  const [conditionDetails, setConditionDetails] = useState<string>(initialAssignment?.returnConditionDetails || "");
  const [damageFee, setDamageFee] = useState<string>(String(initialAssignment?.damageAssessmentFee ?? 0));
  const [notes, setNotes] = useState("");
  const [returnChecklist, setReturnChecklist] = useState<GadgetChecklist | undefined>(initialAssignment ? { ...(initialAssignment.returnChecklist ?? initialAssignment.staffChecklist ?? initialAssignment.adminChecklist ?? initialAssignment.inventoryItem?.defaultChecklist ?? { screen: "", charger: "", buttons: "", battery: "", ports: "", cameraMic: "", overall: "" }) } : undefined);
  const [loading, setLoading] = useState(false);

  const closeReview = () => { setSelected(null); onReviewClose?.(); };

  const openInspectionModal = (item: InventoryAssignment) => {
    setSelected(item);
    setReturnCondition(item.returnConditionRating || item.inventoryItem?.conditionRating || "Good");
    setConditionDetails(item.returnConditionDetails || "");
    setDamageFee(item.damageAssessmentFee ? String(item.damageAssessmentFee) : "0");
    setNotes("");
    setReturnChecklist({ ...(item.returnChecklist ?? item.staffChecklist ?? item.adminChecklist ?? item.inventoryItem?.defaultChecklist ?? {
      screen: "", charger: "", buttons: "", battery: "", ports: "", cameraMic: "", overall: "",
    }) });
  };

  async function handleDecision(
    decision: InventoryAssignmentDecision,
    sendBackTo?: "staff" | "it",
  ) {
    if (!selected) return;
    if (decision === "rejected" && notes.trim().length < 3) {
      toast.error("A note is required when rejecting clearance.");
      return;
    }
    if (mode === "officer" && decision === "approved" && (!returnChecklist || Object.values(returnChecklist).some((value) => !value.trim()))) {
      toast.error("Complete every Admin / IT final checklist field. Enter N/A for items that do not apply.");
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
          returnChecklist,
        });
        toast.success(
          decision === "approved"
            ? (selected.status === "return_pending_inspection"
                ? "IT inspection complete. Sent to Compliance for final audit."
                : "Return inspection updated successfully.")
            : "Return inspection rejected/cancelled."
        );
      } else {
        await approveClearanceCompliance(selected.id, {
          decision,
          sendBackTo,
          notes: notes.trim() || undefined,
        });
        toast.success(
          decision === "approved"
            ? "Gadget clearance completed. Asset returned to storage."
            : sendBackTo === "staff"
              ? "Clearance sent back to staff for a revised handover."
              : "Clearance sent back to Admin/IT for another inspection."
        );
      }
      setSelected(null); onReviewClose?.();
      setReturnChecklist(undefined);
      router.refresh();
    } catch (error: unknown) {
      toast.error(error instanceof Error ? error.message : "Failed to process clearance decision");
    } finally {
      setLoading(false);
    }
  }

  return (
    <>
      {!reviewOnly && <div className="space-y-3">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <p className="text-sm text-muted-foreground">{groups.length} clearance requests · Expand a request to review devices.</p>
          <Select value={view} onValueChange={setView}><SelectTrigger className="w-44" aria-label="Filter clearance requests"><SelectValue /></SelectTrigger><SelectContent><SelectItem value="active">In progress</SelectItem><SelectItem value="closed">Completed or cancelled</SelectItem><SelectItem value="all">All requests</SelectItem></SelectContent></Select>
        </div>
        {!groups.length && <div className="rounded-lg border py-12 text-center text-sm text-muted-foreground">No clearances or device returns yet.</div>}
        {groups.map((group) => {
          const first = group.devices[0];
          return <details key={group.id} className="rounded-lg border bg-card">
            <summary className="cursor-pointer p-4 marker:text-muted-foreground">
              <span className="ml-2 inline-flex max-w-full flex-wrap items-center gap-x-4 gap-y-2 align-middle">
                <span><span className="block font-semibold">{first.assignee?.name || "Staff member"}</span><span className="text-xs text-muted-foreground">{first.type === "full_clearance" ? "Equipment clearance" : "Device return"} · {new Date(first.createdAt).toLocaleDateString()}</span></span>
                <Badge variant={group.complete ? "secondary" : "outline"}>{group.complete ? "Complete" : group.stage >= 0 ? `Awaiting ${group.stage === 0 ? "staff handover" : group.stage === 1 ? "IT inspection" : "compliance review"}` : "Cancelled"}</Badge>
                <span className="text-sm text-muted-foreground">{group.cleared} of {group.devices.length} devices cleared{group.cancelled ? ` · ${group.cancelled} cancelled` : ""}</span>
              </span>
            </summary>
            <div className="space-y-5 border-t p-4">
              <ol aria-label="Clearance progress" className="grid grid-cols-2 gap-3 text-sm sm:grid-cols-4">
                {clearanceStages.map((label, index) => <li key={label} aria-current={group.stage === index ? "step" : undefined} className={`border-t-2 pt-2 ${group.stage >= index ? "border-primary font-medium text-foreground" : "border-muted text-muted-foreground"}`}>{index + 1}. {label}</li>)}
              </ol>
              <div className="divide-y">
                {group.devices.map((item) => {
                  const stage = clearanceStage(item.status);
                  const actionable = mode === "officer" ? stage === 1 || stage === 2 : stage === 2;
                  return <div key={item.id} className="flex flex-col justify-between gap-3 py-4 sm:flex-row sm:items-center">
                    <div className="min-w-0 space-y-1">
                      <p className="font-medium">{item.inventoryItem?.name || "Device"}</p>
                      <p className="break-all text-xs text-muted-foreground">{item.inventoryItem?.serialNumber}</p>
                      <p className="text-sm text-muted-foreground">{stage >= 0 ? clearanceStages[stage] : "Cancelled"}{stage < 3 && stage >= 0 ? " pending" : ""}</p>
                      {item.complianceDecision === "rejected" && item.complianceNotes && <p className="text-sm">Changes requested: {item.complianceNotes}</p>}
                      {item.returnConditionRating && <p className="text-xs text-muted-foreground">Reported condition: {item.returnConditionRating}{item.officerDecision === "approved" ? ` · Damage fee: NGN ${(item.damageAssessmentFee ?? 0).toLocaleString()}` : " · Fee not yet assessed"}</p>}
                    </div>
                    <div className="flex shrink-0 flex-wrap gap-2">
                      {actionable && <Button size="sm" variant={mode === "officer" && stage === 2 ? "outline" : "default"} onClick={() => openInspectionModal(item)}>{mode === "compliance" ? "Review clearance" : stage === 1 ? "Inspect return" : "Edit inspection"}</Button>}
                      {item.status === "cleared" && <AssetClearancePdfButton assignment={item} label="Device clearance form" allAssignments={[item]} size="sm" />}
                    </div>
                  </div>;
                })}
              </div>
              {group.complete && group.devices.length > 1 && <AssetClearancePdfButton assignment={first} label="Download full clearance form" allAssignments={group.devices} size="sm" />}
            </div>
          </details>;
        })}
      </div>}

      <Dialog open={!!selected} onOpenChange={(open) => !open && closeReview()}>
        <DialogContent className="max-h-[90dvh] overflow-y-auto sm:max-w-lg">
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

                  {selected.staffChecklist && (
                    <section className="space-y-2 rounded-md border bg-muted/30 p-3">
                      <p className="text-sm font-semibold">Staff final checklist</p>
                      <div className="grid grid-cols-2 gap-1.5 text-xs text-muted-foreground">
                        {returnChecklistFields.map(([key, label]) => (
                          <p key={key} className={key === "overall" ? "col-span-2" : undefined}>
                            <span className="font-medium text-foreground">{label}:</span> {selected.staffChecklist?.[key] || "—"}
                          </p>
                        ))}
                      </div>
                    </section>
                  )}

                  <section className="space-y-3 rounded-md border border-primary/30 bg-primary/5 p-3">
                    <div>
                      <p className="text-sm font-semibold">Admin / IT final inspection checklist</p>
                      <p className="text-xs text-muted-foreground">This is saved as the device’s storage baseline after clearance is approved.</p>
                    </div>
                    <div className="grid grid-cols-1 gap-2 sm:grid-cols-2">
                      {returnChecklistFields.map(([key, label]) => (
                        <label key={key} className={key === "overall" ? "space-y-1 sm:col-span-2" : "space-y-1"}>
                          <span className="text-xs font-medium">{label}</span>
                          <Input
                            value={returnChecklist?.[key] ?? ""}
                            onChange={(event) => setReturnChecklist((current) => current ? { ...current, [key]: event.target.value } : current)}
                          />
                        </label>
                      ))}
                    </div>
                  </section>
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
                  {selected.returnChecklist && (
                    <div className="border-t pt-2">
                      <p className="mb-2 font-semibold">Admin / IT final inspection checklist</p>
                      <div className="grid grid-cols-2 gap-1.5 text-xs text-muted-foreground">
                        {returnChecklistFields.map(([key, label]) => (
                          <p key={key} className={key === "overall" ? "col-span-2" : undefined}>
                            <span className="font-medium text-foreground">{label}:</span> {selected.returnChecklist?.[key] || "—"}
                          </p>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              )}

              {mode === "officer" && selected.complianceDecision === "rejected" && selected.complianceNotes && (
                <div className="rounded-lg border border-amber-300 bg-amber-50 p-3 text-sm text-amber-950">
                  <span className="font-semibold">Compliance requested another inspection: </span>
                  {selected.complianceNotes}
                </div>
              )}

              <div className="space-y-2">
                <Label htmlFor="notes">
                  {mode === "officer" ? "IT Officer Inspection Notes" : "Compliance Audit Notes (required when sending back)"}
                </Label>
                <Textarea
                  id="notes"
                  placeholder="Optional review notes..."
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  rows={2}
                />
              </div>

              <div className="flex flex-wrap justify-end gap-2 pt-2">
                <Button
                  type="button"
                  variant="outline"
                  onClick={closeReview}
                  disabled={loading}
                >
                  Cancel
                </Button>

                {mode === "officer" ? (
                  <Button
                    type="button"
                    variant="destructive"
                    onClick={() => handleDecision("rejected")}
                    disabled={loading}
                  >
                    Cancel Return
                  </Button>
                ) : (
                  <>
                    <Button
                      type="button"
                      variant="outline"
                      onClick={() => handleDecision("rejected", "staff")}
                      disabled={loading}
                    >
                      Send Back to Staff
                    </Button>
                    <Button
                      type="button"
                      variant="destructive"
                      onClick={() => handleDecision("rejected", "it")}
                      disabled={loading}
                    >
                      Send Back to Admin / IT
                    </Button>
                  </>
                )}

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

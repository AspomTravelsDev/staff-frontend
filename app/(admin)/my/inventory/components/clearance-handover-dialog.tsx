"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import {
  InventoryAssignment,
  submitClearanceHandover,
  InventoryConditionRating,
  GadgetChecklist,
} from "@/lib/api/inventory";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Checkbox } from "@/components/ui/checkbox";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { ShieldAlert, Loader2, Laptop, Smartphone, Server, MonitorPlay } from "lucide-react";

interface ClearanceHandoverDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  assignments: InventoryAssignment[];
}

interface ItemReport {
  assignmentId: string;
  conditionRating: InventoryConditionRating | "Broken";
  conditionDetails: string;
  notes: string;
  staffChecklist: GadgetChecklist;
}

const emptyChecklist: GadgetChecklist = {
  screen: "", charger: "", buttons: "", battery: "", ports: "", cameraMic: "", overall: "",
};

const checklistFields: Array<[keyof GadgetChecklist, string]> = [
  ["screen", "Screen & Display"],
  ["charger", "Charger & Cables"],
  ["buttons", "Buttons & Keyboard"],
  ["battery", "Battery & Charging"],
  ["ports", "Ports & Connectivity"],
  ["cameraMic", "Camera, Mic & Speaker"],
  ["overall", "Overall Body & Casing"],
];

export function ClearanceHandoverDialog({
  open,
  onOpenChange,
  assignments,
}: ClearanceHandoverDialogProps) {
  const router = useRouter();
  const [reports, setReports] = useState<Record<string, ItemReport>>({});
  const [handoverNotes, setHandoverNotes] = useState("");
  const [certified, setCertified] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    if (open && assignments.length > 0) {
      const initial: Record<string, ItemReport> = {};
      assignments.forEach((a) => {
        initial[a.id] = {
          assignmentId: a.id,
          conditionRating: "Good",
          conditionDetails: "",
          notes: "",
          staffChecklist: { ...(a.staffChecklist ?? a.adminChecklist ?? a.inventoryItem?.defaultChecklist ?? emptyChecklist) },
        };
      });
      setReports(initial);
      setHandoverNotes("");
      setCertified(false);
    }
  }, [open, assignments]);

  if (assignments.length === 0) return null;

  const updateReport = (
    id: string,
    field: keyof ItemReport,
    value: string
  ) => {
    setReports((prev) => ({
      ...prev,
      [id]: {
        ...prev[id],
        [field]: value,
      },
    }));
  };

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

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!certified) {
      toast.error("Please confirm the digital certification checkbox before submitting.");
      return;
    }

    // Check that at least some notes or details are entered if rating is fair/poor/broken
    for (const a of assignments) {
      const rep = reports[a.id];
      if (rep && ["Poor", "Broken"].includes(rep.conditionRating) && (!rep.conditionDetails || rep.conditionDetails.trim().length < 4)) {
        toast.error(`Please provide details of issues for ${a.inventoryItem?.name || "device"} (rated ${rep.conditionRating}).`);
        return;
      }
      if (rep && checklistFields.some(([key]) => !rep.staffChecklist[key]?.trim())) {
        toast.error(`Complete every staff checklist field for ${a.inventoryItem?.name || "device"}. Enter N/A for items that do not apply.`);
        return;
      }
    }

    setIsSubmitting(true);
    try {
      const declarations = Object.values(reports).map((r) => ({
        assignmentId: r.assignmentId,
        conditionRating: r.conditionRating,
        conditionDetails: r.conditionDetails.trim() || undefined,
        notes: r.notes.trim() || undefined,
        staffChecklist: r.staffChecklist,
      }));

      await submitClearanceHandover({
        assignmentIds: assignments.map((a) => a.id),
        declarations,
        handoverNotes: handoverNotes.trim() || undefined,
      });

      toast.success("Clearance handover submitted successfully! IT will inspect the physical devices.");
      onOpenChange(false);
      router.refresh();
    } catch (error: any) {
      toast.error(error?.message || "Failed to submit clearance handover.");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-2xl max-h-[90vh] flex flex-col p-0">
        <DialogHeader className="p-6 pb-2 border-b">
          <DialogTitle className="flex items-center gap-2 text-xl">
            <ShieldAlert className="h-5 w-5 text-amber-600" />
            Offboarding Gadget Clearance Handover
          </DialogTitle>
          <DialogDescription>
            Review all assigned equipment being returned. Self-report their condition and handover notes before handing over to IT.
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="flex flex-col flex-1 overflow-hidden">
          <div className="flex-1 overflow-y-auto p-6 space-y-6">
            {/* Devices to Return */}
            <div className="space-y-4">
              <h3 className="text-sm font-semibold uppercase tracking-wider text-muted-foreground">
                Devices Being Handed Over ({assignments.length})
              </h3>

              {assignments.map((assignment) => {
                const rep = reports[assignment.id] || {
                  assignmentId: assignment.id,
                  conditionRating: "Good",
                  conditionDetails: "",
                  notes: "",
                  staffChecklist: assignment.staffChecklist ?? assignment.adminChecklist ?? assignment.inventoryItem?.defaultChecklist ?? emptyChecklist,
                };

                return (
                  <div
                    key={assignment.id}
                    className="rounded-lg border bg-card p-4 space-y-4 shadow-sm"
                  >
                    <div className="flex items-start justify-between gap-2">
                      <div>
                        <div className="flex items-center font-medium text-base">
                          {getCategoryIcon(assignment.inventoryItem?.category)}
                          {assignment.inventoryItem?.name || "Company Device"}
                        </div>
                        <div className="text-xs text-muted-foreground font-mono mt-0.5">
                          S/N: {assignment.inventoryItem?.serialNumber || "N/A"}
                        </div>
                      </div>
                      <Badge variant="outline" className="capitalize text-xs">
                        {assignment.inventoryItem?.category || "Equipment"}
                      </Badge>
                    </div>

                    {assignment.initiateNotes && (
                      <div className="text-xs bg-muted/60 p-2 rounded text-muted-foreground">
                        <span className="font-semibold text-foreground">Admin/Exit Context: </span>
                        {assignment.initiateNotes}
                      </div>
                    )}

                    {assignment.adminChecklist && (
                      <div className="rounded-md border bg-muted/30 p-3 text-xs">
                        <p className="mb-2 font-semibold">Admin / IT assignment checklist</p>
                        <div className="grid grid-cols-2 gap-1.5 text-muted-foreground">
                          {checklistFields.map(([key, label]) => (
                            <p key={key} className={key === "overall" ? "col-span-2" : undefined}>
                              <span className="font-medium text-foreground">{label}:</span> {assignment.adminChecklist?.[key] || "—"}
                            </p>
                          ))}
                        </div>
                      </div>
                    )}

                    <div className="space-y-2 rounded-md border border-primary/30 bg-primary/5 p-3">
                      <div>
                        <p className="text-sm font-semibold">Staff final device checklist</p>
                        <p className="text-xs text-muted-foreground">Update the checklist to reflect the device’s condition at handover.</p>
                      </div>
                      <div className="grid grid-cols-1 gap-2 sm:grid-cols-2">
                        {checklistFields.map(([key, label]) => (
                          <label key={key} className={key === "overall" ? "space-y-1 sm:col-span-2" : "space-y-1"}>
                            <span className="text-xs font-medium">{label}</span>
                            <Input
                              value={rep.staffChecklist[key]}
                              onChange={(e) => setReports((current) => ({
                                ...current,
                                [assignment.id]: {
                                  ...rep,
                                  staffChecklist: { ...rep.staffChecklist, [key]: e.target.value },
                                },
                              }))}
                            />
                          </label>
                        ))}
                      </div>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                      <div className="space-y-1.5">
                        <Label className="text-xs">Physical Condition</Label>
                        <Select
                          value={rep.conditionRating}
                          onValueChange={(val) =>
                            updateReport(assignment.id, "conditionRating", val)
                          }
                        >
                          <SelectTrigger className="h-9 text-xs">
                            <SelectValue placeholder="Select condition" />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="Excellent">Excellent (Like new)</SelectItem>
                            <SelectItem value="Good">Good (Working normally)</SelectItem>
                            <SelectItem value="Fair">Fair (Minor cosmetic wear)</SelectItem>
                            <SelectItem value="Poor">Poor (Hardware/screen issue)</SelectItem>
                            <SelectItem value="Broken">Broken / Not working</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>

                      <div className="space-y-1.5 sm:col-span-2">
                        <Label className="text-xs">Condition Details / Observations</Label>
                        <Textarea
                          placeholder="e.g. Screen clean, charger and cables included, no battery issues..."
                          value={rep.conditionDetails}
                          onChange={(e) =>
                            updateReport(assignment.id, "conditionDetails", e.target.value)
                          }
                          rows={2}
                          className="text-xs min-h-[36px]"
                        />
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>

            {/* General Handover Notes */}
            <div className="space-y-2">
              <Label htmlFor="handoverNotes" className="text-sm font-medium">
                Overall Clearance Handover Comments (Optional)
              </Label>
              <Textarea
                id="handoverNotes"
                placeholder="Any additional remarks regarding returned accessories, charger condition, or handoff timing..."
                value={handoverNotes}
                onChange={(e) => setHandoverNotes(e.target.value)}
                rows={2}
                className="text-sm"
              />
            </div>

            {/* Employee Declaration */}
            <div className="rounded-lg border border-amber-200 bg-amber-50/70 dark:border-amber-900/60 dark:bg-amber-950/30 p-4">
              <div className="flex items-start gap-3">
                <Checkbox
                  id="certify"
                  checked={certified}
                  onCheckedChange={(checked) => setCertified(!!checked)}
                  className="mt-0.5"
                />
                <label
                  htmlFor="certify"
                  className="text-xs leading-relaxed text-amber-900 dark:text-amber-200 font-medium cursor-pointer select-none"
                >
                  I hereby certify that I am returning all listed company devices and accessories, and the reported condition details are accurate. I acknowledge that IT will physically inspect these items and compliance will perform final clearance audit.
                </label>
              </div>
            </div>
          </div>

          <DialogFooter className="p-4 border-t bg-muted/20 gap-2">
            <Button
              type="button"
              variant="outline"
              onClick={() => onOpenChange(false)}
              disabled={isSubmitting}
            >
              Cancel
            </Button>
            <Button
              type="submit"
              disabled={!certified || isSubmitting}
              className="bg-amber-600 hover:bg-amber-700 text-white"
            >
              {isSubmitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              Submit Handover to IT
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}

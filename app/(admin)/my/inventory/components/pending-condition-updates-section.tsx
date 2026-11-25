"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { format } from "date-fns";
import {
  InventoryConditionUpdate,
  respondToConditionUpdate,
} from "@/lib/api/inventory";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Textarea } from "@/components/ui/textarea";
import { ArrowRight, CheckCircle2, Flag } from "lucide-react";

interface PendingConditionUpdatesSectionProps {
  updates: InventoryConditionUpdate[];
}

const checklistLabels: Record<string, string> = {
  screen: "Screen & Display",
  charger: "Charger & Cables",
  buttons: "Buttons & Keyboard",
  battery: "Battery & Charging",
  ports: "Ports & Connectivity",
  cameraMic: "Camera, Mic & Speaker",
  overall: "Overall Body & Casing",
};

export function PendingConditionUpdatesSection({
  updates,
}: PendingConditionUpdatesSectionProps) {
  const router = useRouter();
  const queryClient = useQueryClient();
  const [submittingId, setSubmittingId] = useState<string | null>(null);
  const [disputingId, setDisputingId] = useState<string | null>(null);
  const [disputeNotes, setDisputeNotes] = useState("");

  if (updates.length === 0) return null;

  const handleAcknowledge = async (update: InventoryConditionUpdate) => {
    setSubmittingId(update.id);
    try {
      await respondToConditionUpdate(update.id, { decision: "acknowledged" });
      toast.success(
        "Condition update acknowledged. Device stats have been updated."
      );
      await queryClient.invalidateQueries({ queryKey: ["notifications"] });
      router.refresh();
    } catch (error) {
      toast.error(
        error instanceof Error
          ? error.message
          : "Failed to acknowledge condition update."
      );
    } finally {
      setSubmittingId(null);
    }
  };

  const handleDispute = async (update: InventoryConditionUpdate) => {
    const trimmed = disputeNotes.trim();
    if (trimmed.length < 5) {
      toast.error("Please enter at least 5 characters explaining the issue.");
      return;
    }
    setSubmittingId(update.id);
    try {
      await respondToConditionUpdate(update.id, {
        decision: "disputed",
        notes: trimmed,
      });
      toast.success("Feedback sent to Admin/IT.");
      setDisputingId(null);
      setDisputeNotes("");
      await queryClient.invalidateQueries({ queryKey: ["notifications"] });
      router.refresh();
    } catch (error) {
      toast.error(
        error instanceof Error
          ? error.message
          : "Failed to submit feedback."
      );
    } finally {
      setSubmittingId(null);
    }
  };

  return (
    <div className="rounded-xl border border-sky-200 bg-sky-50/60 dark:border-sky-900/50 dark:bg-sky-950/20 p-4 space-y-3">
      <div className="flex items-start gap-3">
        <CheckCircle2 className="h-5 w-5 text-sky-700 dark:text-sky-400 mt-0.5 shrink-0" />
        <div>
          <h2 className="font-semibold text-sky-900 dark:text-sky-200">
            Device condition updates
          </h2>
          <p className="text-sm text-sky-800/80 dark:text-sky-300/80">
            Review updates logged by Admin/IT on your assigned devices. Confirm
            with 1 click to update the device record.
          </p>
        </div>
      </div>

      <div className="space-y-3">
        {updates.map((update) => {
          const isBusy = submittingId === update.id;
          const isDisputing = disputingId === update.id;
          const checklistEntries = update.checklist
            ? Object.entries(update.checklist).filter(
                ([, value]) => typeof value === "string" && value.trim() !== ""
              )
            : [];

          return (
            <div
              key={update.id}
              className="rounded-lg border bg-card p-3.5 space-y-3"
            >
              <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-3">
                <div className="space-y-1">
                  <div className="flex flex-wrap items-center gap-2">
                    <p className="font-medium">
                      {update.inventoryItem?.name || "Device"}
                    </p>
                    {(update.inventoryItem?.serialNumber ||
                      update.inventoryItem?.assetTag) && (
                      <span className="text-xs text-muted-foreground font-mono">
                        {update.inventoryItem.serialNumber ||
                          update.inventoryItem.assetTag}
                      </span>
                    )}
                  </div>

                  <div className="flex flex-wrap items-center gap-1.5 text-xs">
                    <Badge variant="outline">
                      {update.previousConditionRating}
                    </Badge>
                    <ArrowRight className="h-3.5 w-3.5 text-muted-foreground" />
                    <Badge variant="secondary">
                      {update.newConditionRating}
                    </Badge>
                    {update.initiator?.name && (
                      <span className="text-muted-foreground ml-1">
                        Updated by {update.initiator.name}
                      </span>
                    )}
                    {update.createdAt && (
                      <span className="text-muted-foreground">
                        · {format(new Date(update.createdAt), "dd MMM yyyy HH:mm")}
                      </span>
                    )}
                  </div>

                  {update.newConditionDetails && (
                    <p className="text-xs text-muted-foreground pt-0.5">
                      Details: {update.newConditionDetails}
                    </p>
                  )}

                  {update.notes && (
                    <p className="text-sm pt-0.5">{update.notes}</p>
                  )}

                  {checklistEntries.length > 0 && (
                    <details className="pt-1">
                      <summary className="cursor-pointer text-xs font-medium text-muted-foreground">
                        View updated component checklist ({checklistEntries.length})
                      </summary>
                      <dl className="mt-2 grid grid-cols-1 sm:grid-cols-2 gap-2 rounded-md border bg-muted/30 p-2.5 text-xs">
                        {checklistEntries.map(([key, value]) => (
                          <div key={key}>
                            <dt className="text-muted-foreground">
                              {checklistLabels[key] || key}
                            </dt>
                            <dd className="font-medium">{value}</dd>
                          </div>
                        ))}
                      </dl>
                    </details>
                  )}
                </div>

                <div className="flex flex-wrap items-center gap-2 shrink-0">
                  <Button
                    size="sm"
                    disabled={isBusy}
                    onClick={() => handleAcknowledge(update)}
                  >
                    <CheckCircle2 className="mr-1.5 h-4 w-4" />
                    {isBusy && !isDisputing ? "Confirming..." : "Acknowledge"}
                  </Button>
                  <Button
                    size="sm"
                    variant="outline"
                    disabled={isBusy}
                    onClick={() => {
                      if (isDisputing) {
                        setDisputingId(null);
                        setDisputeNotes("");
                      } else {
                        setDisputingId(update.id);
                        setDisputeNotes("");
                      }
                    }}
                  >
                    <Flag className="mr-1.5 h-3.5 w-3.5" />
                    {isDisputing ? "Cancel" : "Not fixed / Flag issue"}
                  </Button>
                </div>
              </div>

              {isDisputing && (
                <div className="space-y-2 border-t pt-3">
                  <Textarea
                    placeholder="Briefly describe what is still not working..."
                    value={disputeNotes}
                    onChange={(e) => setDisputeNotes(e.target.value)}
                    className="min-h-[72px] resize-none text-sm"
                    disabled={isBusy}
                  />
                  <div className="flex justify-end">
                    <Button
                      size="sm"
                      variant="destructive"
                      disabled={isBusy}
                      onClick={() => handleDispute(update)}
                    >
                      {isBusy ? "Sending..." : "Submit feedback"}
                    </Button>
                  </div>
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}

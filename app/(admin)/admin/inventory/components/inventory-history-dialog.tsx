"use client";

import { useEffect, useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { getInventoryHistory } from "@/lib/api/inventory";
import type { InventoryItem, InventoryHistory } from "@/lib/api/inventory";
import type { PaginatedResponse } from "@/lib/api/types";
import { Badge } from "@/components/ui/badge";
import { format } from "date-fns";
import {
  History,
  User,
  Wrench,
  Archive,
  ClipboardCheck,
  ChevronRight,
  UserCircle,
  Quote,
} from "lucide-react";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Separator } from "@/components/ui/separator";

interface InventoryHistoryDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  item: InventoryItem | null;
  fetchHistoryFn?: (id: string) => Promise<PaginatedResponse<InventoryHistory>>;
}

export function InventoryHistoryDialog({
  open,
  onOpenChange,
  item,
  fetchHistoryFn = getInventoryHistory,
}: InventoryHistoryDialogProps) {
  const [history, setHistory] = useState<InventoryHistory[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [loadError, setLoadError] = useState<string | null>(null);

  useEffect(() => {
    if (open && item) {
      loadHistory();
    }
  }, [open, item]);

  const loadHistory = async () => {
    if (!item) return;
    setIsLoading(true);
    setLoadError(null);
    setHistory([]);
    try {
      const response = await fetchHistoryFn(item.id);
      setHistory(response.items);
    } catch (error) {
      console.error("Failed to load history", error);
      setLoadError(error instanceof Error ? error.message : "Unable to load asset history. Please try again.");
    } finally {
      setIsLoading(false);
    }
  };

  const getEventSummary = (entry: InventoryHistory, nextOlderEntry?: InventoryHistory) => {
    if (!nextOlderEntry) {
      if (entry.status === "Storage") {
        return {
          title: "Added to Inventory (Storage)",
          description: "Item was initialized and placed in storage.",
        };
      }
      if (entry.status === "Assigned") {
        return {
          title: `Added & Assigned to ${entry.assignedToName || "Staff"}`,
          description: `Item was initialized and immediately assigned to ${entry.assignedToName || "Staff"}.`,
        };
      }
      return {
        title: "Added to Inventory",
        description: "Item was initialized.",
      };
    }

    const statusChanged = entry.status !== nextOlderEntry.status;
    const assignmentChanged = entry.assignedTo !== nextOlderEntry.assignedTo;

    if (statusChanged) {
      if (entry.status === "Assigned") {
        const fromSource = nextOlderEntry.status === "Storage" ? "storage" : "repairs";
        return {
          title: `Assigned to ${entry.assignedToName || "Staff"}`,
          description: `Dispatched from ${fromSource} and assigned to ${entry.assignedToName || "Staff"}.`,
        };
      }
      if (entry.status === "Storage") {
        if (nextOlderEntry.status === "Assigned") {
          return {
            title: "Returned to Storage",
            description: `Returned from ${nextOlderEntry.assignedToName || "Staff"} and checked back into storage.`,
          };
        }
        if (nextOlderEntry.status === "Repairs") {
          return {
            title: "Returned to Storage",
            description: "Repaired and returned to storage.",
          };
        }
        return {
          title: "Moved to Storage",
          description: `Status changed from ${nextOlderEntry.status} to Storage.`,
        };
      }
      if (entry.status === "Repairs") {
        const fromSource = nextOlderEntry.status === "Assigned"
          ? `from ${nextOlderEntry.assignedToName || "Staff"}`
          : "from storage";
        return {
          title: "Sent for Repairs",
          description: `Sent for repairs ${fromSource}.`,
        };
      }
    }

    if (assignmentChanged) {
      if (entry.assignedTo && nextOlderEntry.assignedTo) {
        return {
          title: "Device Reassigned",
          description: `Transferred from ${nextOlderEntry.assignedToName || "previous staff"} to ${entry.assignedToName || "new staff"}.`,
        };
      }
      if (entry.assignedTo && !nextOlderEntry.assignedTo) {
        return {
          title: `Assigned to ${entry.assignedToName || "Staff"}`,
          description: `Assigned to ${entry.assignedToName || "Staff"}.`,
        };
      }
      if (!entry.assignedTo && nextOlderEntry.assignedTo) {
        return {
          title: "Unassigned Device",
          description: `Returned from ${nextOlderEntry.assignedToName || "Staff"}.`,
        };
      }
    }

    const conditionChanged = entry.conditionRating !== nextOlderEntry.conditionRating;
    if (conditionChanged) {
      return {
        title: "Condition Updated",
        description: `Condition rating changed from ${nextOlderEntry.conditionRating} to ${entry.conditionRating}.`,
      };
    }

    if (entry.notes && entry.notes !== nextOlderEntry.notes && !entry.notes.includes("initialized") && !entry.notes.includes("details updated")) {
      return {
        title: "Device Details Updated",
        description: entry.notes,
      };
    }

    return {
      title: "Device Details Updated",
      description: "Details or notes revised.",
    };
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case "Storage":
        return <Archive className="w-4 h-4 text-blue-500" />;
      case "Assigned":
        return <User className="w-4 h-4 text-green-500" />;
      case "Repairs":
        return <Wrench className="w-4 h-4 text-red-500" />;
      default:
        return <ClipboardCheck className="w-4 h-4 text-muted-foreground" />;
    }
  };

  const getEventIcon = (title: string, status: string) => {
    if (title.includes("Reassigned") || title.includes("Transferred")) {
      return <UserCircle className="w-4 h-4 text-orange-500" />;
    }
    if (title.includes("Added") || title.includes("initialized")) {
      return <ClipboardCheck className="w-4 h-4 text-emerald-500" />;
    }
    if (title.includes("Assigned")) {
      return <User className="w-4 h-4 text-green-500" />;
    }
    if (title.includes("Returned") || title.includes("Storage")) {
      return <Archive className="w-4 h-4 text-blue-500" />;
    }
    if (title.includes("Repairs") || title.includes("Repair")) {
      return <Wrench className="w-4 h-4 text-red-500" />;
    }
    return getStatusIcon(status);
  };

  const getConditionColor = (rating: string) => {
    switch (rating) {
      case "Excellent":
        return "bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400";
      case "Good":
        return "bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400";
      case "Fair":
        return "bg-yellow-100 text-yellow-700 dark:bg-yellow-900/30 dark:text-yellow-400";
      case "Poor":
        return "bg-orange-100 text-orange-700 dark:bg-orange-900/30 dark:text-orange-400";
      case "Broken":
        return "bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400";
      default:
        return "bg-slate-100 text-slate-700 dark:bg-slate-900/30 dark:text-slate-400";
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-2xl max-h-[80vh] flex flex-col p-0 overflow-y-scroll">
        <DialogHeader className="p-6 pb-0">
          <div className="flex items-center gap-2">
            <History className="w-5 h-5 text-primary" />
            <DialogTitle>Asset History Timeline</DialogTitle>
          </div>
          <DialogDescription>
            Chronological log for <strong>{item?.name}</strong> (
            {item?.serialNumber})
          </DialogDescription>
        </DialogHeader>

        <Separator className="mt-4" />

        <ScrollArea className="flex-1 p-6">
          {isLoading ? (
            <div className="flex flex-col items-center justify-center py-12 text-muted-foreground">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mb-4"></div>
              <p>Loading timeline...</p>
            </div>
          ) : loadError ? (
            <div role="alert" className="space-y-3 py-8 text-center">
              <p className="text-sm text-destructive">{loadError}</p>
              <button type="button" onClick={loadHistory} className="text-sm font-medium underline">Try again</button>
            </div>
          ) : history.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-12 text-muted-foreground">
              <Archive className="w-12 h-12 mb-4 opacity-20" />
              <p>No history records found for this asset.</p>
            </div>
          ) : (
            <div className="relative space-y-8 before:absolute before:inset-0 before:ml-5 before:h-full before:w-0.5 before:bg-linear-to-b before:from-transparent before:via-slate-200 before:to-transparent dark:before:via-slate-800">
              {history.map((entry, index) => {
                const nextOlderEntry = history[index + 1];
                const eventSummary = getEventSummary(entry, nextOlderEntry);
                const eventIcon = getEventIcon(eventSummary.title, entry.status);

                return (
                  <div key={entry.id} className="relative flex items-start gap-6">
                    {/* Timeline Dot/Icon */}
                    <div className="absolute left-0 mt-1.5 flex h-10 w-10 items-center justify-center rounded-full border bg-background shadow-sm z-10">
                      {eventIcon}
                    </div>

                    {/* Content */}
                    <div className="flex-1 ml-12 rounded-lg border bg-card p-4 shadow-sm transition-all hover:shadow-md">
                      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 mb-2">
                        <div className="flex items-center gap-2">
                          <Badge
                            variant="outline"
                            className="font-semibold uppercase tracking-wider text-[10px]"
                          >
                            {entry.status}
                          </Badge>
                          <ChevronRight className="w-3 h-3 text-muted-foreground" />
                          <div
                            className={`px-2 py-0.5 rounded text-[11px] font-bold ${getConditionColor(entry.conditionRating)}`}
                          >
                            {entry.conditionRating}
                          </div>
                        </div>
                        <time className="text-xs font-medium text-muted-foreground">
                          {format(new Date(entry.createdAt), "PPP p")}
                        </time>
                      </div>

                      {/* Descriptive Event Header */}
                      <div className="mb-2">
                        <h4 className="text-sm font-semibold text-slate-800">
                          {eventSummary.title}
                        </h4>
                        <p className="text-xs text-muted-foreground mt-0.5">
                          {eventSummary.description}
                        </p>
                      </div>

                      {/* Custom Action Notes (if entered and different from generic title) */}
                      {entry.notes &&
                        entry.notes !== eventSummary.title &&
                        entry.notes !== eventSummary.description &&
                        !entry.notes.includes("initialized") &&
                        !entry.notes.includes("details updated") && (
                          <div className="mt-3 text-xs italic text-slate-500 bg-slate-50 p-2.5 rounded border border-slate-100 relative pl-7">
                            <Quote className="absolute top-2 left-2 h-4 w-4 text-slate-300" />
                            <span>{entry.notes}</span>
                          </div>
                        )}

                      {(entry.conditionDetails ||
                        entry.assignedTo ||
                        entry.technicianDetails) && (
                        <div className="mt-3 grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs bg-muted/30 p-3 rounded-md border border-muted">
                          {entry.conditionDetails && (
                            <div className="space-y-1">
                              <span className="text-muted-foreground block font-medium">
                                Physical Condition Details
                              </span>
                              <span className="font-semibold text-slate-700">
                                {entry.conditionDetails}
                              </span>
                            </div>
                          )}
                          {entry.status === "Assigned" && entry.assignedTo && (
                            <div className="space-y-1">
                              <span className="text-muted-foreground block font-medium">
                                Assigned User
                              </span>
                              <span className="font-semibold flex items-center gap-1 text-slate-700">
                                <User className="w-3.5 h-3.5 text-muted-foreground" />{" "}
                                {entry.assignedToName || entry.assignedTo}
                              </span>
                            </div>
                          )}
                          {entry.status === "Repairs" &&
                            entry.technicianDetails && (
                              <div className="space-y-1">
                                <span className="text-muted-foreground block font-medium">
                                  Repair Technician
                                </span>
                                <span className="font-semibold text-red-600 dark:text-red-400">
                                  {entry.technicianDetails.name} ({entry.technicianDetails.phone})
                                </span>
                              </div>
                            )}
                        </div>
                      )}

                      <Separator className="my-3 opacity-50" />

                      <div className="flex items-center justify-between text-[11px] text-muted-foreground">
                        <div className="flex items-center gap-1.5">
                          <UserCircle className="w-3 h-3" />
                          <span>
                            Recorded by:{" "}
                            <strong>{entry.changerName || "System"}</strong>
                          </span>
                        </div>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </ScrollArea>
      </DialogContent>
    </Dialog>
  );
}

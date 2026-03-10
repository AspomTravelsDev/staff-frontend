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

  useEffect(() => {
    if (open && item) {
      loadHistory();
    }
  }, [open, item]);

  const loadHistory = async () => {
    if (!item) return;
    setIsLoading(true);
    try {
      const response = await fetchHistoryFn(item.id);
      setHistory(response.items);
    } catch (error) {
      console.error("Failed to load history", error);
    } finally {
      setIsLoading(false);
    }
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
          ) : history.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-12 text-muted-foreground">
              <Archive className="w-12 h-12 mb-4 opacity-20" />
              <p>No history records found for this asset.</p>
            </div>
          ) : (
            <div className="relative space-y-8 before:absolute before:inset-0 before:ml-5 before:h-full before:w-0.5 before:bg-linear-to-b before:from-transparent before:via-slate-200 before:to-transparent dark:before:via-slate-800">
              {history.map((entry, index) => (
                <div key={entry.id} className="relative flex items-start gap-6">
                  {/* Timeline Dot/Icon */}
                  <div className="absolute left-0 mt-1.5 flex h-10 w-10 items-center justify-center rounded-full border bg-background shadow-sm z-10">
                    {getStatusIcon(entry.status)}
                  </div>

                  {/* Content */}
                  <div className="flex-1 ml-12 rounded-lg border bg-card p-4 shadow-sm transition-all hover:shadow-md">
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 mb-3">
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

                    <p className="text-sm font-medium mb-2 leading-relaxed">
                      {entry.notes || "No details provided for this event."}
                    </p>

                    {(entry.conditionDetails ||
                      entry.assignedTo ||
                      entry.technicianDetails) && (
                      <div className="mt-3 grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs bg-muted/30 p-3 rounded-md border border-muted">
                        {entry.conditionDetails && (
                          <div className="space-y-1">
                            <span className="text-muted-foreground block">
                              Physical Details
                            </span>
                            <span className="font-medium">
                              {entry.conditionDetails}
                            </span>
                          </div>
                        )}
                        {entry.status === "Assigned" && entry.assignedTo && (
                          <div className="space-y-1">
                            <span className="text-muted-foreground block">
                              Assigned To
                            </span>
                            <span className="font-medium flex items-center gap-1">
                              <User className="w-3 h-3" />{" "}
                              {entry.assignedToName || entry.assignedTo}
                            </span>
                          </div>
                        )}
                        {entry.status === "Repairs" &&
                          entry.technicianDetails && (
                            <div className="space-y-1">
                              <span className="text-muted-foreground block">
                                Technician
                              </span>
                              <span className="font-medium text-red-600 dark:text-red-400">
                                {entry.technicianDetails.name}
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
              ))}
            </div>
          )}
        </ScrollArea>
      </DialogContent>
    </Dialog>
  );
}

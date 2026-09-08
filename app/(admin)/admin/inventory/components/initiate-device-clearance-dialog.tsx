"use client";

import { useState } from "react";
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
import { InventoryItem, initiateSingleReturn } from "@/lib/api/inventory";
import { Employee } from "@/lib/api/employees";
import { toast } from "sonner";
import { Loader2, RotateCcw, ShieldAlert, User, Laptop } from "lucide-react";
import { useRouter } from "next/navigation";
import { Alert, AlertDescription } from "@/components/ui/alert";

interface InitiateDeviceClearanceDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  item: InventoryItem | null;
  employees?: Employee[];
}

export function InitiateDeviceClearanceDialog({
  open,
  onOpenChange,
  item,
  employees = [],
}: InitiateDeviceClearanceDialogProps) {
  const [notes, setNotes] = useState("");
  const [loading, setLoading] = useState(false);
  const router = useRouter();

  if (!item) return null;

  const assignedEmp = employees.find((e) => e.id === item.assignedTo);
  const staffName = assignedEmp
    ? `${assignedEmp.firstName} ${assignedEmp.lastName}`
    : item.openAssignment?.assignee?.name || "Assigned Staff";

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      await initiateSingleReturn(item.id, notes || undefined);
      toast.success(
        `Clearance initiated for ${item.name}. ${staffName} has been notified to report device condition in My IT Assets.`
      );
      onOpenChange(false);
      setNotes("");
      router.refresh();
    } catch (error: any) {
      toast.error(error.message || "Failed to initiate device clearance.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 text-slate-900">
            <RotateCcw className="h-5 w-5 text-amber-600" /> Initiate Gadget Clearance
          </DialogTitle>
          <DialogDescription>
            Begin the return and clearance process for this assigned device.
          </DialogDescription>
        </DialogHeader>

        {/* Device & Assignee Summary Card */}
        <div className="rounded-xl border border-slate-200/90 bg-slate-50/70 p-3.5 space-y-2.5 text-xs">
          <div className="flex items-start gap-2.5">
            <div className="p-2 rounded-lg bg-sky-100 text-sky-700 shrink-0">
              <Laptop className="h-4 w-4" />
            </div>
            <div className="min-w-0 flex-1">
              <p className="text-[10px] font-semibold text-muted-foreground uppercase tracking-wider">
                Gadget
              </p>
              <p className="text-sm font-semibold text-slate-900 truncate">
                {item.name}
              </p>
              <p className="text-[11px] text-muted-foreground font-mono mt-0.5">
                SN: {item.serialNumber || "N/A"}
              </p>
            </div>
          </div>

          <div className="pt-2 border-t border-slate-200/70 flex items-center gap-2">
            <User className="h-3.5 w-3.5 text-slate-500 shrink-0" />
            <span className="text-muted-foreground">Assigned to:</span>
            <span className="font-semibold text-slate-900 truncate">
              {staffName}
            </span>
          </div>
        </div>

        {/* Important Notice Callout */}
        <Alert className="bg-amber-50 border-amber-200/80 text-amber-900 py-2.5 px-3">
          <ShieldAlert className="h-4 w-4 text-amber-600 shrink-0 mt-0.5" />
          <AlertDescription className="text-xs leading-relaxed text-amber-800">
            A notification will be dispatched to <strong>{staffName}</strong> in their <strong>My IT Assets</strong> portal. They will be required to inspect and self-declare the condition of the gadget before handing it over to IT.
          </AlertDescription>
        </Alert>

        <form onSubmit={handleSubmit} className="space-y-4 pt-1">
          <div className="space-y-2">
            <Label htmlFor="notes" className="text-xs font-semibold">
              Clearance Context / Reason (Optional)
            </Label>
            <Textarea
              id="notes"
              placeholder="e.g. Device recall, upgrade to newer model, role transition..."
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              rows={3}
              className="text-xs"
            />
          </div>

          <DialogFooter className="pt-2">
            <Button
              type="button"
              variant="outline"
              onClick={() => onOpenChange(false)}
              disabled={loading}
              className="text-xs"
            >
              Cancel
            </Button>
            <Button
              type="submit"
              variant="destructive"
              disabled={loading}
              className="text-xs bg-amber-600 hover:bg-amber-700 text-white"
            >
              {loading && <Loader2 className="mr-1.5 h-3.5 w-3.5 animate-spin" />}
              Initiate Clearance
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}

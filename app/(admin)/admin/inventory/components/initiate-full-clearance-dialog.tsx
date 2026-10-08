"use client";

import { useState, useEffect } from "react";
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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Employee } from "@/lib/api/employees";
import { initiateFullClearance } from "@/lib/api/inventory";
import { toast } from "sonner";
import { Loader2, ShieldAlert } from "lucide-react";
import { useRouter } from "next/navigation";

interface InitiateFullClearanceDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  employees: Employee[];
  initialStaffId?: string;
}

export function InitiateFullClearanceDialog({
  open,
  onOpenChange,
  employees,
  initialStaffId,
}: InitiateFullClearanceDialogProps) {
  const [selectedStaffId, setSelectedStaffId] = useState<string>(initialStaffId || "");
  const [notes, setNotes] = useState("");
  const [loading, setLoading] = useState(false);
  const router = useRouter();

  useEffect(() => {
    if (open) {
      if (initialStaffId) {
        setSelectedStaffId(initialStaffId);
      }
    } else {
      setSelectedStaffId("");
      setNotes("");
    }
  }, [open, initialStaffId]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedStaffId) {
      toast.error("Please select a staff member for offboarding clearance.");
      return;
    }

    setLoading(true);

    try {
      const res = await initiateFullClearance(selectedStaffId, notes);
      if (!res.success) {
        if (res.error.code === "NO_ASSIGNED_DEVICES") toast.info("No assigned company devices to clear for this staff member.");
        else toast.error(res.error.error || "Failed to initiate full clearance.");
        return;
      }
      if (res.data.length === 0) toast.info("No assigned company devices to clear for this staff member.");
      else toast.success(`Full offboarding clearance initiated for ${res.data.length} assigned device(s).`);
      onOpenChange(false);
      setSelectedStaffId("");
      setNotes("");
      router.refresh();
    } catch {
      toast.error("Could not confirm device clearance. Please refresh Inventory before retrying.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <ShieldAlert className="h-5 w-5 text-amber-600" /> Initiate Full Offboarding Gadget Clearance
          </DialogTitle>
          <DialogDescription>
            Collect and initiate clearance for all company devices currently assigned to an exiting staff member.
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4 py-2">
          <div className="space-y-2">
            <Label htmlFor="staff">Select Staff Member</Label>
            <Select value={selectedStaffId} onValueChange={setSelectedStaffId}>
              <SelectTrigger id="staff">
                <SelectValue placeholder="Select employee to clear..." />
              </SelectTrigger>
              <SelectContent>
                {employees.map((emp) => (
                  <SelectItem key={emp.id} value={emp.id}>
                    {emp.firstName} {emp.lastName} — ({emp.department || "General"})
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label htmlFor="notes">Offboarding Notes / Exit Context</Label>
            <Textarea
              id="notes"
              placeholder="e.g. Staff resignation effective end of month..."
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              rows={3}
            />
          </div>

          <DialogFooter className="pt-2">
            <Button
              type="button"
              variant="outline"
              onClick={() => onOpenChange(false)}
              disabled={loading}
            >
              Cancel
            </Button>
            <Button type="submit" variant="destructive" disabled={loading}>
              {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              Initiate Full Clearance
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}

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
import { toast } from "sonner";
import { Loader2, RotateCcw } from "lucide-react";
import { useRouter } from "next/navigation";

interface ReturnDeviceDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  item: InventoryItem | null;
}

export function ReturnDeviceDialog({
  open,
  onOpenChange,
  item,
}: ReturnDeviceDialogProps) {
  const [notes, setNotes] = useState("");
  const [loading, setLoading] = useState(false);
  const router = useRouter();

  if (!item) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      await initiateSingleReturn(item.id, notes);
      toast.success(`Return initiated for ${item.name}. IT will inspect the device.`);
      onOpenChange(false);
      setNotes("");
      router.refresh();
    } catch (error: any) {
      toast.error(error.message || "Failed to initiate device return.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <RotateCcw className="h-5 w-5 text-blue-600" /> Return Device / Initiate Clearance
          </DialogTitle>
          <DialogDescription>
            Request to return <span className="font-semibold text-foreground">{item.name}</span> ({item.serialNumber}) for device swap or offboarding clearance.
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4 py-2">
          <div className="space-y-2">
            <Label htmlFor="notes">Reason / Return Notes</Label>
            <Textarea
              id="notes"
              placeholder="e.g. Device upgrade requested, unneeded secondary laptop, or exiting company..."
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
            <Button type="submit" disabled={loading}>
              {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              Initiate Return
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}

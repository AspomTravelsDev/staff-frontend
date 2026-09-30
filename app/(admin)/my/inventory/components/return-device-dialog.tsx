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
import { InventoryConditionRating, InventoryItem, initiateSingleReturn } from "@/lib/api/inventory";
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
  const [conditionRating, setConditionRating] = useState<InventoryConditionRating>("Good");
  const [notes, setNotes] = useState("");
  const [loading, setLoading] = useState(false);
  const router = useRouter();

  if (!item) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (["Poor", "Broken"].includes(conditionRating) && notes.trim().length < 4) {
      toast.error("Please describe the issue for a device rated Poor or Broken.");
      return;
    }
    setLoading(true);

    try {
      await initiateSingleReturn(item.id, notes, conditionRating, notes);
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
            <Label htmlFor="conditionRating">Device Condition Rating</Label>
            <select
              id="conditionRating"
              className="w-full h-10 px-3 py-2 border rounded-md text-sm bg-background"
              value={conditionRating}
              onChange={(e) => setConditionRating(e.target.value as InventoryConditionRating)}
            >
              <option value="Excellent">Excellent</option>
              <option value="Good">Good (Working fine)</option>
              <option value="Fair">Fair (Minor wear/scratches)</option>
              <option value="Poor">Poor (Battery/hardware issue)</option>
              <option value="Broken">Broken / Damaged</option>
            </select>
          </div>

          <div className="space-y-2">
            <Label htmlFor="notes">Staff Condition Notes / Comments</Label>
            <Textarea
              id="notes"
              placeholder="Provide specific notes on the physical/functional state of the device..."
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

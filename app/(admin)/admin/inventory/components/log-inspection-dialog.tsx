"use client";

import { useEffect, useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import {
  createInventoryConditionUpdate,
  InventoryItem,
  logInventoryInspection,
} from "@/lib/api/inventory";
import {
  EMPTY_GADGET_CHECKLIST,
  GadgetChecklistFields,
} from "@/components/inventory/gadget-checklist-fields";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { ClipboardCheck } from "lucide-react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";

const checklistSchema = z.object({
  screen: z.string(),
  charger: z.string(),
  buttons: z.string(),
  battery: z.string(),
  ports: z.string(),
  cameraMic: z.string(),
  overall: z.string(),
});

const formSchema = z.object({
  conditionRating: z.enum(["Excellent", "Good", "Fair", "Poor", "Broken"]),
  conditionDetails: z.string().optional(),
  notes: z.string().min(1, "Notes are required"),
  checklist: checklistSchema,
});

type FormValues = z.infer<typeof formSchema>;

interface LogInspectionDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  item: InventoryItem | null;
}

export function LogInspectionDialog({
  open,
  onOpenChange,
  item,
}: LogInspectionDialogProps) {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const router = useRouter();
  const isAssigned = item?.status === "Assigned";

  const form = useForm<FormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      conditionRating: item?.conditionRating || "Good",
      conditionDetails: item?.conditionDetails || "",
      notes: isAssigned ? "" : "Routine inspection completed and verified.",
      checklist: { ...EMPTY_GADGET_CHECKLIST, ...item?.defaultChecklist },
    },
  });

  useEffect(() => {
    if (!open || !item) return;
    form.reset({
      conditionRating: item.conditionRating || "Good",
      conditionDetails: item.conditionDetails || "",
      notes:
        item.status === "Assigned"
          ? ""
          : "Routine inspection completed and verified.",
      checklist: { ...EMPTY_GADGET_CHECKLIST, ...item.defaultChecklist },
    });
  }, [open, item, form]);

  const handleSubmit = async (values: FormValues) => {
    if (!item) return;
    setIsSubmitting(true);
    try {
      if (isAssigned) {
        const hasChecklistValues = Object.values(values.checklist).some(
          (v) => v.trim() !== ""
        );
        await createInventoryConditionUpdate(item.id, {
          conditionRating: values.conditionRating,
          conditionDetails: values.conditionDetails,
          checklist: hasChecklistValues ? values.checklist : undefined,
          notes: values.notes,
        });
        toast.success(
          "Condition update sent to staff for 1-click acknowledgement."
        );
      } else {
        await logInventoryInspection(item.id, {
          conditionRating: values.conditionRating,
          conditionDetails: values.conditionDetails,
          notes: values.notes,
        });
        toast.success("Inspection recorded.");
      }
      onOpenChange(false);
      router.refresh();
      form.reset();
    } catch (error) {
      toast.error(
        error instanceof Error
          ? error.message
          : isAssigned
            ? "Failed to send condition update."
            : "Failed to record inspection."
      );
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[540px] max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <div className="flex items-center gap-2">
            <ClipboardCheck className="w-5 h-5 text-green-600" />
            <DialogTitle>
              {isAssigned ? "Update Assigned Condition" : "Log Asset Inspection"}
            </DialogTitle>
          </div>
          <DialogDescription>
            {isAssigned ? (
              <>
                Update the condition of <strong>{item?.name}</strong>. The
                assigned staff member will be notified to confirm with 1 click
                before the live condition and stats update.
              </>
            ) : (
              <>
                Quickly update the condition of <strong>{item?.name}</strong>.
              </>
            )}
          </DialogDescription>
        </DialogHeader>

        <Form {...form}>
          <form
            onSubmit={form.handleSubmit(handleSubmit)}
            className="space-y-4 pt-2"
          >
            <FormField
              control={form.control}
              name="conditionRating"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>
                    {isAssigned ? "Updated Condition Rating" : "Current Condition Rating"}
                  </FormLabel>
                  <Select onValueChange={field.onChange} value={field.value}>
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue placeholder="Select Rating" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      <SelectItem value="Excellent">Excellent</SelectItem>
                      <SelectItem value="Good">Good</SelectItem>
                      <SelectItem value="Fair">Fair</SelectItem>
                      <SelectItem value="Poor">Poor</SelectItem>
                      <SelectItem value="Broken">Broken</SelectItem>
                    </SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="conditionDetails"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Physical Details (Optional)</FormLabel>
                  <FormControl>
                    <Input
                      placeholder={
                        isAssigned
                          ? "e.g. Screen replaced, no scuffs"
                          : "e.g. No new damage, cleaned vents"
                      }
                      {...field}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="notes"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>
                    {isAssigned ? "Reason / Repair Notes" : "Inspection Summary / Notes"}
                  </FormLabel>
                  <FormControl>
                    <Input
                      placeholder={
                        isAssigned
                          ? "e.g. Cracked screen replaced and tested"
                          : "e.g. Regular Monday checkup"
                      }
                      {...field}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            {isAssigned && (
              <details className="rounded-md border p-3">
                <summary className="cursor-pointer text-sm font-medium">
                  Update component checklist (optional)
                </summary>
                <div className="mt-3">
                  <GadgetChecklistFields
                    name="checklist"
                    title="Updated Device Checklist"
                    description="Adjust any repaired or verified components so the device baseline stays accurate once confirmed."
                  />
                </div>
              </details>
            )}

            <div className="flex justify-end gap-3 pt-4">
              <Button
                type="button"
                variant="outline"
                onClick={() => onOpenChange(false)}
              >
                Cancel
              </Button>
              <Button
                type="submit"
                disabled={isSubmitting}
                className="bg-green-600 hover:bg-green-700"
              >
                {isSubmitting
                  ? "Saving..."
                  : isAssigned
                    ? "Send for Staff Confirmation"
                    : "Record Inspection"}
              </Button>
            </div>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}

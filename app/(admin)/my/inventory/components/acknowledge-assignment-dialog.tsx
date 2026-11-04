"use client";

import { useCallback, useEffect, useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import {
  InventoryAssignment,
  submitInventoryAssignmentDecision,
} from "@/lib/api/inventory";
import { EMPTY_GADGET_CHECKLIST, GadgetChecklistFields } from "@/components/inventory/gadget-checklist-fields";
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
  FormDescription,
} from "@/components/ui/form";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { AssetUndertakingFields } from "@/components/inventory/asset-undertaking-fields";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

const formSchema = z
  .object({
    decision: z.enum(["approved", "rejected"]),
    conditionRating: z
      .enum(["Excellent", "Good", "Fair", "Poor", "Broken"])
      .optional(),
    conditionDetails: z.string().optional(),
    agreedToTerms: z.boolean(),
    notes: z.string().optional(),
    staffChecklist: z
      .object({
        screen: z.string().min(1, "Enter a value or N/A"),
        charger: z.string().min(1, "Enter a value or N/A"),
        buttons: z.string().min(1, "Enter a value or N/A"),
        battery: z.string().min(1, "Enter a value or N/A"),
        ports: z.string().min(1, "Enter a value or N/A"),
        cameraMic: z.string().min(1, "Enter a value or N/A"),
        overall: z.string().min(1, "Enter a value or N/A"),
      }),
  })
  .superRefine((data, ctx) => {
    if (data.decision === "rejected" && (!data.notes || data.notes.trim().length < 5)) {
      ctx.addIssue({ code: z.ZodIssueCode.custom, message: "Provide a rejection reason (at least 5 characters).", path: ["notes"] });
    }
    if (data.decision === "approved") {
      if (!data.conditionRating) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          message: "Condition rating is required when approving",
          path: ["conditionRating"],
        });
      }
      if (!data.conditionDetails || data.conditionDetails.trim().length < 5) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          message: "Describe the device condition (at least 5 characters)",
          path: ["conditionDetails"],
        });
      }
      if (!data.agreedToTerms) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          message:
            "You must read and agree to the asset declaration rules to accept this device",
          path: ["agreedToTerms"],
        });
      }
    }
  });

type FormValues = z.infer<typeof formSchema>;

interface AcknowledgeAssignmentDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  assignment: InventoryAssignment | null;
}

export function AcknowledgeAssignmentDialog({
  open,
  onOpenChange,
  assignment,
}: AcknowledgeAssignmentDialogProps) {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const router = useRouter();

  const getChecklistValues = useCallback(() => ({
    ...EMPTY_GADGET_CHECKLIST,
    ...(assignment?.staffChecklist ?? assignment?.adminChecklist),
  }), [assignment]);

  const form = useForm<FormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      decision: "approved",
      conditionRating: "Good",
      conditionDetails: "",
      agreedToTerms: false,
      notes: "",
      staffChecklist: getChecklistValues(),
    },
  });

  useEffect(() => {
    if (open) {
      form.reset({
        decision: "approved",
        conditionRating: "Good",
        conditionDetails: "",
        agreedToTerms: false,
        notes: "",
        staffChecklist: getChecklistValues(),
      });
    }
  }, [open, form, getChecklistValues]);

  const decision = form.watch("decision");

  const handleSubmit = async (values: FormValues) => {
    if (!assignment) return;
    setIsSubmitting(true);
    try {
      await submitInventoryAssignmentDecision(assignment.id, {
        decision: values.decision,
        conditionRating:
          values.decision === "approved" ? values.conditionRating : undefined,
        conditionDetails:
          values.decision === "approved" ? values.conditionDetails : undefined,
        notes: values.decision === "rejected" ? values.notes?.trim() : undefined,
        staffChecklist: values.staffChecklist,
      });
      toast.success(
        values.decision === "approved"
          ? "Device acknowledged. Custody transferred."
          : "Assignment rejected.",
      );
      onOpenChange(false);
      router.refresh();
    } catch (error: unknown) {
      toast.error(error instanceof Error ? error.message : "Failed to submit decision");
    } finally {
      setIsSubmitting(false);
    }
  };

  const item = assignment?.inventoryItem;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Acknowledge device assignment</DialogTitle>
          <DialogDescription>
            Inspect {item?.name || "this device"} ({item?.serialNumber}) and
            approve or reject the assignment.
          </DialogDescription>
        </DialogHeader>

        {(assignment?.officerNotes ||
          assignment?.complianceNotes ||
          assignment?.initiateNotes) && (
          <Alert>
            <AlertDescription className="space-y-1 text-sm">
              {assignment.initiateNotes && (
                <p>
                    <span className="font-medium">Admin/IT assignment notes: </span>
                  {assignment.initiateNotes}
                </p>
              )}
              {assignment.officerNotes &&
                assignment.officerDecision === "rejected" && (
                  <p>
                    <span className="font-medium">Officer feedback: </span>
                    {assignment.officerNotes}
                  </p>
                )}
              {assignment.complianceNotes &&
                assignment.complianceDecision === "rejected" && (
                  <p>
                    <span className="font-medium">Compliance feedback: </span>
                    {assignment.complianceNotes}
                  </p>
                )}
            </AlertDescription>
          </Alert>
        )}

        <Form {...form}>
          <form
            onSubmit={form.handleSubmit(handleSubmit)}
            className="space-y-4"
          >
            <FormField
              control={form.control}
              name="decision"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Decision</FormLabel>
                  <Select
                    onValueChange={field.onChange}
                    value={field.value}
                  >
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      <SelectItem value="approved">Approve & accept</SelectItem>
                      <SelectItem value="rejected">Reject assignment</SelectItem>
                    </SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )}
            />

            {decision === "approved" && (
              <>
                <FormField
                  control={form.control}
                  name="conditionRating"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Condition rating</FormLabel>
                      <Select
                        onValueChange={field.onChange}
                        value={field.value}
                      >
                        <FormControl>
                          <SelectTrigger>
                            <SelectValue placeholder="Select condition" />
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
                      <FormLabel>Condition description</FormLabel>
                      <FormControl>
                        <Textarea
                          placeholder="Describe scratches, battery health, missing accessories..."
                          rows={3}
                          {...field}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                {(!item?.category || ["laptop", "phone", "gadget", "other"].includes(item.category.toLowerCase())) && (
                  <>
                  {assignment?.adminChecklist && Object.values(assignment.adminChecklist).some(Boolean) && (
                    <div className="rounded-md border p-4 text-xs space-y-2">
                      <h4 className="font-semibold text-sm">Admin / IT assignment checklist{assignment.initiator?.name ? ` — recorded by ${assignment.initiator.name}` : ""}</h4>
                      <p className="text-muted-foreground">Review the assignment baseline below, then confirm or update your own inspection in the staff checklist.</p>
                      <div className="grid grid-cols-1 gap-1 sm:grid-cols-2">
                        {Object.entries(assignment.adminChecklist).map(([key, value]) => value ? (
                          <p key={key}><span className="font-medium capitalize">{key === "cameraMic" ? "Camera / Mic" : key}:</span> {value}</p>
                        ) : null)}
                      </div>
                    </div>
                  )}
                  <GadgetChecklistFields
                    name="staffChecklist"
                    title="Your Final Device Checklist"
                    description="Inspect each feature and confirm or update the Admin/IT observation. This staff checklist is the final checklist shown on the asset form PDF."
                  />

                  </>
                )}

                <AssetUndertakingFields />
              </>
            )}

            {decision === "rejected" && (
              <FormField
                control={form.control}
                name="notes"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Rejection reason</FormLabel>
                    <FormControl><Textarea placeholder="Why are you rejecting this assignment?" rows={3} {...field} /></FormControl>
                    <FormDescription>Required. The device will remain in Storage.</FormDescription>
                    <FormMessage />
                  </FormItem>
                )}
              />
            )}

            <div className="flex justify-end gap-3 pt-2">
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
                variant={decision === "rejected" ? "destructive" : "default"}
              >
                {isSubmitting
                  ? "Submitting..."
                  : decision === "approved"
                    ? "Approve"
                    : "Reject"}
              </Button>
            </div>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}

"use client";

import { useEffect, useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import {
  InventoryAssignment,
  submitInventoryAssignmentDecision,
} from "@/lib/api/inventory";
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
    notes: z.string().min(5, "Please provide at least 5 characters."),
  })
  .superRefine((data, ctx) => {
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

  const form = useForm<FormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      decision: "approved",
      conditionRating: "Good",
      conditionDetails: "",
      notes: "",
    },
  });

  useEffect(() => {
    if (open) {
      form.reset({
        decision: "approved",
        conditionRating: "Good",
        conditionDetails: "",
        notes: "",
      });
    }
  }, [open, form]);

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
        notes: values.notes,
      });
      toast.success(
        values.decision === "approved"
          ? "Device acknowledged. Custody transferred."
          : "Assignment rejected.",
      );
      onOpenChange(false);
      router.refresh();
    } catch (error: any) {
      toast.error(error?.message || "Failed to submit decision");
    } finally {
      setIsSubmitting(false);
    }
  };

  const item = assignment?.inventoryItem;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-lg">
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
                  <span className="font-medium">Initiator notes: </span>
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
              </>
            )}

            <FormField
              control={form.control}
              name="notes"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>
                    {decision === "approved"
                      ? "Acknowledgement notes"
                      : "Rejection reason"}
                  </FormLabel>
                  <FormControl>
                    <Textarea
                      placeholder={
                        decision === "approved"
                          ? "Any additional comments about receiving this device..."
                          : "Why are you rejecting this assignment?"
                      }
                      rows={3}
                      {...field}
                    />
                  </FormControl>
                  <FormDescription>
                    {decision === "rejected"
                      ? "Required. The device will remain in Storage."
                      : "Required. Officers and compliance will review your comments."}
                  </FormDescription>
                  <FormMessage />
                </FormItem>
              )}
            />

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

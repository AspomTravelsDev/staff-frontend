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
import { Checkbox } from "@/components/ui/checkbox";
import { ScrollText } from "lucide-react";
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

                {/* Asset Declaration Undertaking & Rules from Form PDF */}
                <div className="rounded-lg border bg-muted/40 p-4 space-y-3">
                  <div className="flex items-center gap-2 text-primary font-semibold text-sm">
                    <ScrollText className="h-4 w-4 shrink-0 text-primary" />
                    <span>Asset Declaration Undertaking &amp; Rules</span>
                  </div>
                  <p className="text-xs text-muted-foreground">
                    By accepting custody of this asset, you confirm you have inspected it and declare to abide by the company&apos;s asset undertaking regulations:
                  </p>

                  <ol className="space-y-2 text-xs text-muted-foreground list-none pl-0">
                    <li className="flex items-start gap-2">
                      <span className="font-bold text-foreground shrink-0 w-4">1.</span>
                      <span>
                        <strong className="text-foreground">Official Purpose:</strong> The asset issue is solely for official purposes and will continue to remain ASPOM TRAVELS property.
                      </span>
                    </li>
                    <li className="flex items-start gap-2">
                      <span className="font-bold text-foreground shrink-0 w-4">2.</span>
                      <span>
                        <strong className="text-foreground">Financial Accountability:</strong> The employee will be fully accountable for theft, damage, or loss of the property and if such event occurs will be liable to pay equivalent amount or company retains right to deduct it from salary.
                      </span>
                    </li>
                    <li className="flex items-start gap-2">
                      <span className="font-bold text-foreground shrink-0 w-4">3.</span>
                      <span>
                        <strong className="text-foreground">Inspection &amp; Defect Notice:</strong> Employee has performed the necessary check before owning possession of this asset. In case of future malfunctioning, employee must inform the company by email to <strong className="text-foreground">hr@aspomtravels.com</strong> within 24 hours of the issue arising. Failure to do so will result in a daily penalty charge (Company’s Discretion) until asset is returned.
                      </span>
                    </li>
                    <li className="flex items-start gap-2">
                      <span className="font-bold text-foreground shrink-0 w-4">4.</span>
                      <span>
                        <strong className="text-foreground">Outside Repairs Prohibited:</strong> Unless permitted in writing, employee will not take asset for repair to any outside vendor.
                      </span>
                    </li>
                    <li className="flex items-start gap-2">
                      <span className="font-bold text-foreground shrink-0 w-4">5.</span>
                      <span>
                        <strong className="text-foreground">24-Hour Return Window:</strong> Staff have 24 hours to confirm gadget assigned and return filled asset form.
                      </span>
                    </li>
                    <li className="flex items-start gap-2">
                      <span className="font-bold text-foreground shrink-0 w-4">6.</span>
                      <span>
                        <strong className="text-foreground">Tenure Requirement:</strong> New staff not up to 1 month cannot take gadget except approval is given.
                      </span>
                    </li>
                  </ol>

                  <div className="pt-2 border-t border-border/60 text-[11px] text-muted-foreground bg-background/60 p-2.5 rounded">
                    <strong className="text-foreground">Exit / Final Paycheck Clause:</strong> In addition, you acknowledge that you will not receive your last paycheck unless you return the allotted assets. Should the final paycheck not cover expenses, ASPOM Travels retains the right to file for reimbursement through court proceedings.
                  </div>

                  <FormField
                    control={form.control}
                    name="agreedToTerms"
                    render={({ field }) => (
                      <FormItem className="flex flex-row items-start space-x-3 space-y-0 pt-2">
                        <FormControl>
                          <Checkbox
                            checked={field.value}
                            onCheckedChange={field.onChange}
                          />
                        </FormControl>
                        <div className="space-y-1 leading-none">
                          <FormLabel className="text-xs font-medium cursor-pointer">
                            I have read, understood, and declare to abide by the terms and conditions laid above.
                          </FormLabel>
                          <FormMessage />
                        </div>
                      </FormItem>
                    )}
                  />
                </div>
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

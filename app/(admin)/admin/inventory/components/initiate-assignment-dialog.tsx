"use client";

import { useEffect, useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import {
  InventoryItem,
  initiateInventoryAssignment,
} from "@/lib/api/inventory";
import type { Employee } from "@/lib/api/employees";
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
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

const formSchema = z.object({
  assigneeId: z.string().min(1, "Select a staff member"),
  notes: z.string().optional(),
});

type FormValues = z.infer<typeof formSchema>;

interface InitiateAssignmentDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  item: InventoryItem | null;
  employees: Employee[];
}

export function InitiateAssignmentDialog({
  open,
  onOpenChange,
  item,
  employees,
}: InitiateAssignmentDialogProps) {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const router = useRouter();

  const form = useForm<FormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: { assigneeId: "", notes: "" },
  });

  useEffect(() => {
    if (open) {
      form.reset({ assigneeId: "", notes: "" });
    }
  }, [open, form]);

  const handleSubmit = async (values: FormValues) => {
    if (!item) return;
    setIsSubmitting(true);
    try {
      await initiateInventoryAssignment(item.id, {
        assigneeId: values.assigneeId,
        notes: values.notes,
      });
      toast.success(
        "Assignment initiated. Staff must acknowledge before custody transfers.",
      );
      onOpenChange(false);
      router.refresh();
    } catch (error: any) {
      toast.error(error?.message || "Failed to initiate assignment");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Assign to staff</DialogTitle>
          <DialogDescription>
            Start acknowledgement for {item?.name} ({item?.serialNumber}). The
            device stays in Storage until the staff member inspects and
            approves.
          </DialogDescription>
        </DialogHeader>

        <Form {...form}>
          <form
            onSubmit={form.handleSubmit(handleSubmit)}
            className="space-y-4"
          >
            <FormField
              control={form.control}
              name="assigneeId"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Staff member</FormLabel>
                  <Select onValueChange={field.onChange} value={field.value}>
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue placeholder="Select staff" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      {employees.map((employee) => (
                        <SelectItem key={employee.id} value={employee.id}>
                          {employee.firstName} {employee.lastName} (
                          {employee.department})
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="notes"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Notes (optional)</FormLabel>
                  <FormControl>
                    <Input
                      placeholder="Any instructions for the staff member..."
                      {...field}
                    />
                  </FormControl>
                  <FormDescription>
                    Visible to the assignee on the acknowledgement form.
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
              <Button type="submit" disabled={isSubmitting}>
                {isSubmitting ? "Starting..." : "Initiate assignment"}
              </Button>
            </div>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}

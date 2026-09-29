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
  checklist: z
    .object({
      screen: z.string().optional(),
      charger: z.string().optional(),
      buttons: z.string().optional(),
      battery: z.string().optional(),
      ports: z.string().optional(),
      cameraMic: z.string().optional(),
      overall: z.string().optional(),
    })
    .optional(),
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

  const emptyChecklist = {
    screen: "",
    charger: "",
    buttons: "",
    battery: "",
    ports: "",
    cameraMic: "",
    overall: "",
  };

  const form = useForm<FormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: { assigneeId: "", notes: "", checklist: emptyChecklist },
  });

  useEffect(() => {
    if (open) {
      form.reset({ assigneeId: "", notes: "", checklist: emptyChecklist });
    }
  }, [open, form]);

  const handleSubmit = async (values: FormValues) => {
    if (!item) return;
    setIsSubmitting(true);
    try {
      await initiateInventoryAssignment(item.id, {
        assigneeId: values.assigneeId,
        notes: values.notes,
        checklist: values.checklist,
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

            {(!item?.category || ["laptop", "phone", "gadget", "other"].includes(item.category.toLowerCase())) && (
              <div className="space-y-4 rounded-md border p-4 bg-muted/20">
                <div className="flex items-center justify-between">
                  <h4 className="text-sm font-semibold">Gadget Checklist Comments</h4>
                  <span className="text-xs text-muted-foreground">Fill N/A where not applicable</span>
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <FormField
                    control={form.control}
                    name="checklist.screen"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel className="text-xs">Screen & Display</FormLabel>
                        <FormControl>
                          <Input placeholder="e.g. No scratches or N/A" {...field} />
                        </FormControl>
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={form.control}
                    name="checklist.charger"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel className="text-xs">Charger & Cables</FormLabel>
                        <FormControl>
                          <Input placeholder="e.g. Original included or N/A" {...field} />
                        </FormControl>
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={form.control}
                    name="checklist.buttons"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel className="text-xs">Buttons & Keyboard</FormLabel>
                        <FormControl>
                          <Input placeholder="e.g. All functional or N/A" {...field} />
                        </FormControl>
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={form.control}
                    name="checklist.battery"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel className="text-xs">Battery & Charging</FormLabel>
                        <FormControl>
                          <Input placeholder="e.g. Holds charge (90%+) or N/A" {...field} />
                        </FormControl>
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={form.control}
                    name="checklist.ports"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel className="text-xs">Ports & Connectivity</FormLabel>
                        <FormControl>
                          <Input placeholder="e.g. USB/Wi-Fi working or N/A" {...field} />
                        </FormControl>
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={form.control}
                    name="checklist.cameraMic"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel className="text-xs">Camera, Mic & Speaker</FormLabel>
                        <FormControl>
                          <Input placeholder="e.g. Tested fine or N/A" {...field} />
                        </FormControl>
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={form.control}
                    name="checklist.overall"
                    render={({ field }) => (
                      <FormItem className="sm:col-span-2">
                        <FormLabel className="text-xs">Overall Body & Casing</FormLabel>
                        <FormControl>
                          <Input placeholder="e.g. Minor scuff on corner or N/A" {...field} />
                        </FormControl>
                      </FormItem>
                    )}
                  />
                </div>
              </div>
            )}

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

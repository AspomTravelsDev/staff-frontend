"use client";

import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import {
  InventoryItem,
  InventoryItemPayload,
  InventoryStatus,
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

const formSchema = z
  .object({
    name: z.string().min(1, "Device name is required"),
    category: z.enum(["Laptop", "Phone", "Gadget", "Other"]),
    serialNumber: z.string().min(1, "Serial number is required"),
    status: z.enum(["Storage", "Assigned", "Repairs"]),
    assignedTo: z.string().optional(),
    technicianDetails: z
      .object({
        name: z.string().optional(),
        phone: z.string().optional(),
        address: z.string().optional(),
      })
      .optional(),
  })
  .superRefine((data, ctx) => {
    if (
      data.status === "Assigned" &&
      (!data.assignedTo || data.assignedTo.trim() === "")
    ) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: "Staff assignee name is required when Assigned",
        path: ["assignedTo"],
      });
    }

    if (data.status === "Repairs") {
      if (
        !data.technicianDetails?.name ||
        data.technicianDetails.name.trim() === ""
      ) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          message: "Technician name is required",
          path: ["technicianDetails", "name"],
        });
      }
    }
  });

type FormValues = z.infer<typeof formSchema>;

interface ManageInventoryDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  initialData?: InventoryItem | null;
  onSubmit: (data: InventoryItemPayload) => Promise<void>;
}

export function ManageInventoryDialog({
  open,
  onOpenChange,
  initialData,
  onSubmit,
}: ManageInventoryDialogProps) {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const isEditing = !!initialData;

  const form = useForm<FormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      name: initialData?.name || "",
      category: initialData?.category || "Laptop",
      serialNumber: initialData?.serialNumber || "",
      status: initialData?.status || "Storage",
      assignedTo: initialData?.assignedTo || "",
      technicianDetails: {
        name: initialData?.technicianDetails?.name || "",
        phone: initialData?.technicianDetails?.phone || "",
        address: initialData?.technicianDetails?.address || "",
      },
    },
  });

  const selectedStatus = form.watch("status");

  const handleSubmit = async (values: FormValues) => {
    setIsSubmitting(true);
    try {
      // Clean up fields based on status logic (similar to backend scrubbing, to ensure clean payload)
      let cleanPayload: InventoryItemPayload = {
        name: values.name,
        category: values.category,
        serialNumber: values.serialNumber,
        status: values.status,
      };

      if (values.status === "Assigned") {
        cleanPayload.assignedTo = values.assignedTo;
      } else if (values.status === "Repairs") {
        cleanPayload.technicianDetails = {
          name: values.technicianDetails?.name || "",
          phone: values.technicianDetails?.phone || "",
          address: values.technicianDetails?.address || "",
        };
      }

      await onSubmit(cleanPayload);
      onOpenChange(false);
      form.reset();
    } catch (error) {
      console.error(error);
      // Usually you'd show a toast here
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle>
            {isEditing ? "Edit Asset" : "Add New Asset"}
          </DialogTitle>
          <DialogDescription>
            {isEditing
              ? "Update device tracking details."
              : "Register a new device into the IT inventory."}
          </DialogDescription>
        </DialogHeader>

        <Form {...form}>
          <form
            onSubmit={form.handleSubmit(handleSubmit)}
            className="space-y-4"
          >
            <FormField
              control={form.control}
              name="name"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Device Model</FormLabel>
                  <FormControl>
                    <Input placeholder="e.g. MacBook Pro M3" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <div className="grid grid-cols-2 gap-4">
              <FormField
                control={form.control}
                name="category"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Category</FormLabel>
                    <Select
                      onValueChange={field.onChange}
                      defaultValue={field.value}
                    >
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="Select Category" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        <SelectItem value="Laptop">Laptop</SelectItem>
                        <SelectItem value="Phone">Phone</SelectItem>
                        <SelectItem value="Gadget">Gadget</SelectItem>
                        <SelectItem value="Other">Other</SelectItem>
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="serialNumber"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Serial Number</FormLabel>
                    <FormControl>
                      <Input placeholder="SN-12345" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            <FormField
              control={form.control}
              name="status"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Status</FormLabel>
                  <Select
                    onValueChange={field.onChange}
                    defaultValue={field.value}
                  >
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue placeholder="Select Status" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      <SelectItem value="Storage">In Storage</SelectItem>
                      <SelectItem value="Assigned">
                        Assigned to Staff
                      </SelectItem>
                      <SelectItem value="Repairs">Out for Repairs</SelectItem>
                    </SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )}
            />

            {selectedStatus === "Assigned" && (
              <FormField
                control={form.control}
                name="assignedTo"
                render={({ field }) => (
                  <FormItem className="bg-muted/30 border border-muted p-3 rounded-md">
                    <FormLabel>Staff Assignee Name</FormLabel>
                    <FormControl>
                      <Input placeholder="John Doe" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            )}

            {selectedStatus === "Repairs" && (
              <div className="space-y-3 bg-red-50/50 dark:bg-red-950/20 border border-red-100 dark:border-red-900/40 p-3 rounded-md">
                <h4 className="font-semibold text-sm text-red-800 dark:text-red-400">
                  Technician Details
                </h4>
                <FormField
                  control={form.control}
                  name="technicianDetails.name"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Workshop Name / Provider</FormLabel>
                      <FormControl>
                        <Input placeholder="Tech Fix Lab" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <div className="grid grid-cols-2 gap-3">
                  <FormField
                    control={form.control}
                    name="technicianDetails.phone"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Contact Phase</FormLabel>
                        <FormControl>
                          <Input placeholder="0801234..." {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={form.control}
                    name="technicianDetails.address"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Address</FormLabel>
                        <FormControl>
                          <Input placeholder="12 Repair Rd..." {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>
              </div>
            )}

            <div className="flex justify-end gap-3 pt-4">
              <Button
                type="button"
                variant="outline"
                onClick={() => onOpenChange(false)}
              >
                Cancel
              </Button>
              <Button type="submit" disabled={isSubmitting}>
                {isSubmitting
                  ? "Saving..."
                  : isEditing
                    ? "Save Changes"
                    : "Create Asset"}
              </Button>
            </div>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}

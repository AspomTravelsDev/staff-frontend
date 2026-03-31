"use client";

import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Loader2 } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import {
  requestSchema,
  type RequestFormValues,
} from "@/lib/validations/requests";
import type { RequestItem } from "@/lib/api/requests";
import { createRequestAction, updateRequestAction } from "../actions";
import { toast } from "sonner";
import { useEffect, useState } from "react";

interface RequestDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  request?: RequestItem | null; // If provided, we are in edit mode
}

const REQUEST_CATEGORIES = [
  "Toiletries",
  "Repairs",
  "Gadget",
  "Access",
  "Other",
];

const REQUEST_PRIORITIES = ["low", "medium", "high", "critical"];

export function RequestDialog({
  open,
  onOpenChange,
  request,
}: RequestDialogProps) {
  const isEditing = !!request;
  const [isLoading, setIsLoading] = useState(false);

  const form = useForm<RequestFormValues>({
    resolver: zodResolver(requestSchema),
    defaultValues: {
      category: "Other",
      priority: "medium",
      reason: "",
      details: "",
    },
  });

  // Reset form when opening/closing or changing request
  useEffect(() => {
    if (open) {
      if (request) {
        form.reset({
          category: request.category,
          priority: request.priority,
          reason: request.reason,
          details: request.details,
        });
      } else {
        form.reset({
          category: "Other",
          priority: "medium",
          reason: "",
          details: "",
        });
      }
    }
  }, [open, request, form]);

  const onSubmit = async (values: RequestFormValues) => {
    setIsLoading(true);
    try {
      if (isEditing && request) {
        const result = await updateRequestAction(request.id, values);
        if (!result.success) {
          toast.error(result.error || "Failed to update request");
          return;
        }
        toast.success("Request updated successfully");
      } else {
        const result = await createRequestAction(values);
        if (!result.success) {
          toast.error(result.error || "Failed to submit request");
          return;
        }
        toast.success("Request submitted successfully");
      }
      onOpenChange(false);
    } catch (error) {
      console.error("Failed to submit request", error);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle>
            {isEditing ? "Edit Request" : "Create New Request"}
          </DialogTitle>
          <DialogDescription>
            {isEditing
              ? "Update the details of your request below."
              : "Submit a new request for general items or issues."}
          </DialogDescription>
        </DialogHeader>

        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
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
                          <SelectValue placeholder="Select category" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        {REQUEST_CATEGORIES.map((category) => (
                          <SelectItem key={category} value={category}>
                            {category}
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
                name="priority"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Priority</FormLabel>
                    <Select
                      onValueChange={field.onChange}
                      defaultValue={field.value}
                    >
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="Select priority" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        {REQUEST_PRIORITIES.map((priority) => (
                          <SelectItem
                            key={priority}
                            value={priority}
                            className="capitalize"
                          >
                            {priority}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            <FormField
              control={form.control}
              name="reason"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Subject / Reason</FormLabel>
                  <FormControl>
                    <Input placeholder="e.g., Office Chair Repair" {...field} />
                  </FormControl>
                  <FormDescription>
                    Brief summaries are easier to process.
                  </FormDescription>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="details"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Details</FormLabel>
                  <FormControl>
                    <Textarea
                      placeholder="Please describe your request in detail..."
                      className="min-h-[100px]"
                      {...field}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            {isEditing && request?.logs && request.logs.length > 0 && (
              <div className="space-y-3 pt-4 border-t mt-4">
                <h4 className="text-sm font-medium text-foreground">Activity Log</h4>
                <div className="space-y-3 max-h-40 overflow-y-auto pr-2 rounded-md bg-muted/20 p-3">
                  {request.logs.map((log) => (
                    <div key={log.id} className="text-xs text-muted-foreground flex gap-2">
                       <span className="shrink-0 text-primary/70">{new Date(log.created_at).toLocaleString(undefined, { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' })}</span>
                       <span>
                         <strong>{log.user_name}</strong> changed status from <span className="capitalize">{log.old_value?.replace("_", " ")}</span> to <span className="capitalize font-medium text-foreground">{log.new_value?.replace("_", " ")}</span>
                       </span>
                    </div>
                  ))}
                </div>
              </div>
            )}

            <DialogFooter className="pt-2">
              <Button
                type="button"
                variant="outline"
                onClick={() => onOpenChange(false)}
                disabled={isLoading}
              >
                Cancel
              </Button>
              <Button type="submit" disabled={isLoading}>
                {isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                {isEditing ? "Save Changes" : "Submit Request"}
              </Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}

"use client";

import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { InventoryItem, updateMyInventory } from "@/lib/api/inventory";
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
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { AlertTriangle, Wrench } from "lucide-react";
import { useRouter } from "next/navigation";
import { Alert, AlertDescription } from "@/components/ui/alert";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

const formSchema = z.object({
  conditionRating: z.enum(["Excellent", "Good", "Fair", "Poor", "Broken"]),
  conditionDetails: z.string().optional(),
  notes: z
    .string()
    .min(10, "Please provide at least 10 characters describing the issue."),
});

type FormValues = z.infer<typeof formSchema>;

interface ReportIssueDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  item: InventoryItem | null;
}

export function ReportIssueDialog({
  open,
  onOpenChange,
  item,
}: ReportIssueDialogProps) {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const router = useRouter();

  const form = useForm<FormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      conditionRating: item?.conditionRating || "Good",
      conditionDetails: item?.conditionDetails || "",
      notes: "",
    },
  });

  const handleSubmit = async (values: FormValues) => {
    if (!item) return;
    setIsSubmitting(true);
    try {
      await updateMyInventory(item.id, {
        status: item.status, // Keep current status
        conditionRating: values.conditionRating,
        conditionDetails: values.conditionDetails,
        notes: values.notes,
      });
      onOpenChange(false);
      router.refresh();
      form.reset();
    } catch (error) {
      console.error(error);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[450px]">
        <DialogHeader>
          <div className="flex items-center gap-2">
            <Wrench className="w-5 h-5 text-amber-600" />
            <DialogTitle>Log Observation / Issue</DialogTitle>
          </div>
          <DialogDescription>
            Report an issue or log an observation for{" "}
            <strong>{item?.name}</strong>. IT will be notified of your log.
          </DialogDescription>
        </DialogHeader>

        <Form {...form}>
          <form
            onSubmit={form.handleSubmit(handleSubmit)}
            className="space-y-4 pt-4"
          >
            <FormField
              control={form.control}
              name="conditionRating"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Condition Rating</FormLabel>
                  <Select
                    onValueChange={field.onChange}
                    defaultValue={field.value}
                  >
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
                  <FormLabel>Condition Details (Optional)</FormLabel>
                  <FormControl>
                    <Input
                      placeholder="e.g. Minor scratches on the screen"
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
                  <FormLabel>Issue Description</FormLabel>
                  <FormControl>
                    <Textarea
                      placeholder="Please describe what is broken or malfunctioning..."
                      className="resize-none min-h-[120px]"
                      {...field}
                    />
                  </FormControl>
                  <FormDescription>
                    Provide as much detail as possible to help IT diagnose the
                    problem.
                  </FormDescription>
                  <FormMessage />
                </FormItem>
              )}
            />

            <div className="flex justify-end gap-3 pt-4">
              <Button
                type="button"
                variant="ghost"
                onClick={() => onOpenChange(false)}
              >
                Cancel
              </Button>
              <Button
                type="submit"
                disabled={isSubmitting}
                className="bg-amber-600 hover:bg-amber-700 text-white"
              >
                {isSubmitting ? "Logging..." : "Log Note"}
              </Button>
            </div>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}

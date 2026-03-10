"use client";

import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import {
  InventoryConditionRating,
  InventoryItem,
  logInventoryInspection,
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
import { ClipboardCheck } from "lucide-react";
import { useRouter } from "next/navigation";

const formSchema = z.object({
  conditionRating: z.enum(["Excellent", "Good", "Fair", "Poor", "Broken"]),
  conditionDetails: z.string().optional(),
  notes: z.string().min(1, "Inspection notes are required"),
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

  const form = useForm<FormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      conditionRating: item?.conditionRating || "Good",
      conditionDetails: item?.conditionDetails || "",
      notes: "Routine inspection completed and verified.",
    },
  });

  const handleSubmit = async (values: FormValues) => {
    if (!item) return;
    setIsSubmitting(true);
    try {
      await logInventoryInspection(item.id, values);
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
            <ClipboardCheck className="w-5 h-5 text-green-600" />
            <DialogTitle>Log Asset Inspection</DialogTitle>
          </div>
          <DialogDescription>
            Quickly update the condition of <strong>{item?.name}</strong>.
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
                  <FormLabel>Current Condition Rating</FormLabel>
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
                  <FormLabel>Physical Details (Optional)</FormLabel>
                  <FormControl>
                    <Input
                      placeholder="e.g. No new damage, cleaned vents"
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
                  <FormLabel>Inspection Summary / Notes</FormLabel>
                  <FormControl>
                    <Input
                      placeholder="e.g. Regular Monday checkup"
                      {...field}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

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
                {isSubmitting ? "Saving..." : "Record Inspection"}
              </Button>
            </div>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}

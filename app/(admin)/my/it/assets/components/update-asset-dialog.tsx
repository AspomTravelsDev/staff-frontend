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
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { AlertTriangle, ClipboardCheck } from "lucide-react";
import { useRouter } from "next/navigation";

const formSchema = z.object({
  status: z.enum(["Assigned", "Repairs"]),
  conditionRating: z.enum(["Excellent", "Good", "Fair", "Poor", "Broken"]),
  conditionDetails: z.string().optional(),
  notes: z
    .string()
    .min(5, "Please provide a brief reason for this update (min 5 characters)"),
});

type FormValues = z.infer<typeof formSchema>;

interface UpdateAssetDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  asset: InventoryItem | null;
  onSuccess: (asset: any) => void;
}

export function UpdateAssetDialog({
  open,
  onOpenChange,
  asset,
  onSuccess,
}: UpdateAssetDialogProps) {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const router = useRouter();

  const form = useForm<FormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      status: asset?.status === "Repairs" ? "Repairs" : "Assigned",
      conditionRating: asset?.conditionRating || "Good",
      conditionDetails: asset?.conditionDetails || "",
      notes: "",
    },
  });

  const selectedStatus = form.watch("status");

  const handleSubmit = async (values: FormValues) => {
    if (!asset) return;
    setIsSubmitting(true);
    try {
      await updateMyInventory(asset.id, values);
      onSuccess({
        ...asset,
        status: values.status,
        conditionRating: values.conditionRating,
        conditionDetails: values.conditionDetails,
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
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <div className="flex items-center gap-2">
            <ClipboardCheck className="w-5 h-5 text-primary" />
            <DialogTitle>Update Device Condition</DialogTitle>
          </div>
          <DialogDescription>
            Record the current state of <strong>{asset?.name}</strong>.
          </DialogDescription>
        </DialogHeader>

        <Form {...form}>
          <form
            onSubmit={form.handleSubmit(handleSubmit)}
            className="space-y-4 pt-2"
          >
            <FormField
              control={form.control}
              name="status"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Usage Status</FormLabel>
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
                      <SelectItem value="Assigned">
                        I am currently using this
                      </SelectItem>
                      <SelectItem value="Repairs">
                        Needs Repair / Faulty
                      </SelectItem>
                    </SelectContent>
                  </Select>
                  <FormDescription>
                    Select "Needs Repair" if the device is unusable.
                  </FormDescription>
                  <FormMessage />
                </FormItem>
              )}
            />

            <div className="grid grid-cols-1 gap-4">
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
                    <FormLabel>Specific Details</FormLabel>
                    <FormControl>
                      <Input
                        placeholder="e.g. Scratched screen, keyboard sticky"
                        {...field}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            <FormField
              control={form.control}
              name="notes"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Update Note / Reason</FormLabel>
                  <FormControl>
                    <Textarea
                      placeholder="Please explain why you are updating the status or condition..."
                      className="resize-none"
                      {...field}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            {selectedStatus === "Repairs" && (
              <div className="p-3 bg-red-50 dark:bg-red-950/20 border border-red-100 dark:border-red-900/40 rounded-md flex items-start gap-3">
                <AlertTriangle className="w-5 h-5 text-red-600 mt-0.5" />
                <div className="text-xs text-red-800 dark:text-red-400">
                  <p className="font-bold">Important Information:</p>
                  <p className="mt-1">
                    Reporting a device for repair will flag it for IT. Please
                    ensure you have backed up any sensitive data if possible
                    before handing it over.
                  </p>
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
                {isSubmitting ? "Updating..." : "Confirm Update"}
              </Button>
            </div>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}

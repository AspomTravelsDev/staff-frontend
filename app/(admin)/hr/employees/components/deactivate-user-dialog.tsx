"use client";

import { useState, useEffect } from "react";
import { useForm } from "react-hook-form";
import { format } from "date-fns";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Employee } from "@/lib/api/employees";
import { updateUserStatusAction } from "../actions";
import { initiateFullClearance } from "@/lib/api/inventory";
import { toast } from "sonner";
import { Loader2, ShieldAlert, UserX } from "lucide-react";
import { USER_EXIT_TYPE_LABELS, UserExitType } from "@/types/user-types";
import { useRouter } from "next/navigation";
import { CompanyEmailNotice, notifyEmailRestriction } from "@/components/company-email-notice";

interface DeactivateUserDialogProps {
  employee: Employee | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSuccess?: () => void;
}

interface DeactivateFormData {
  exit_type: UserExitType;
  exit_date: string;
  exit_reason: string;
}

export function DeactivateUserDialog({
  employee,
  open,
  onOpenChange,
  onSuccess,
}: DeactivateUserDialogProps) {
  const [isPending, setIsPending] = useState(false);
  const [initiateClearance, setInitiateClearance] = useState(true);
  const router = useRouter();

  const {
    register,
    handleSubmit,
    setValue,
    watch,
    reset,
    formState: { errors },
  } = useForm<DeactivateFormData>({
    defaultValues: {
      exit_type: "resignation",
      exit_date: format(new Date(), "yyyy-MM-dd"),
      exit_reason: "",
    },
  });

  useEffect(() => {
    if (employee) {
      reset({
        exit_type: (employee.exit_type as UserExitType) || "resignation",
        exit_date:
          employee.exit_date ||
          employee.exitDate ||
          format(new Date(), "yyyy-MM-dd"),
        exit_reason: employee.exit_reason || "",
      });
      setInitiateClearance(true);
    }
  }, [employee, reset]);

  const selectedExitType = watch("exit_type");

  const onSubmit = async (data: DeactivateFormData) => {
    if (!employee) return;

    try {
      setIsPending(true);
      const result = await updateUserStatusAction(employee.id, {
        is_active: false,
        exit_type: data.exit_type,
        exit_date: data.exit_date,
        exit_reason: data.exit_reason.trim() || null,
      });

      if (result.success) {
        notifyEmailRestriction(result.emailRestriction);
        if (initiateClearance) {
          try {
            const clearanceNotes = `Offboarding (${USER_EXIT_TYPE_LABELS[data.exit_type] || "Separated"} effective ${data.exit_date}): ${data.exit_reason.trim() || "Staff exit"}`;
            const clearanceRes = await initiateFullClearance(employee.id, clearanceNotes);
            toast.success(
              `${employee.firstName} marked inactive. Initiated gadget clearance for ${clearanceRes.length} device(s).`,
              {
                action: {
                  label: "View Inventory",
                  onClick: () => router.push("/admin/inventory"),
                },
              }
            );
          } catch (clearanceErr) {
            const msg = clearanceErr instanceof Error ? clearanceErr.message : "";
            if (msg.toLowerCase().includes("no assigned devices")) {
              toast.success(
                `${employee.firstName} marked as inactive. (No assigned company devices found in Inventory).`
              );
            } else {
              toast.success(
                `${employee.firstName} marked as inactive. Note: Clearance not started (${msg}).`
              );
            }
          }
        } else {
          toast.success(
            `${employee.firstName} ${employee.lastName} has been marked as inactive (${USER_EXIT_TYPE_LABELS[data.exit_type] || "Separated"}).`
          );
        }

        onOpenChange(false);
        onSuccess?.();
      } else {
        toast.error(result.error || "Failed to update employee status");
      }
    } catch (error) {
      console.error(error);
      toast.error("An unexpected error occurred while deactivating staff");
    } finally {
      setIsPending(false);
    }
  };

  if (!employee) return null;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[480px] max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <div className="flex items-center gap-2 text-destructive">
            <div className="p-2 rounded-full bg-destructive/10">
              <UserX className="h-5 w-5" />
            </div>
            <DialogTitle>Mark Staff as Inactive</DialogTitle>
          </div>
          <DialogDescription>
            Record staff resignation or separation details for{" "}
            <strong className="text-foreground">
              {employee.firstName} {employee.lastName}
            </strong>{" "}
            ({employee.staff_id || "No ID"}).
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4 pt-2">
          <CompanyEmailNotice />
          {/* Separation Type */}
          <div className="grid gap-2">
            <Label htmlFor="exit_type">
              Separation Type <span className="text-destructive">*</span>
            </Label>
            <Select
              value={selectedExitType}
              onValueChange={(val: UserExitType) => setValue("exit_type", val)}
            >
              <SelectTrigger id="exit_type">
                <SelectValue placeholder="Select separation type" />
              </SelectTrigger>
              <SelectContent>
                {Object.entries(USER_EXIT_TYPE_LABELS).map(([key, label]) => (
                  <SelectItem key={key} value={key}>
                    {label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Separation Date */}
          <div className="grid gap-2">
            <Label htmlFor="exit_date">
              Effective Date of Resignation / Separation{" "}
              <span className="text-destructive">*</span>
            </Label>
            <Input
              id="exit_date"
              type="date"
              {...register("exit_date", { required: "Exit date is required" })}
            />
            {errors.exit_date && (
              <p className="text-xs text-destructive">
                {errors.exit_date.message}
              </p>
            )}
          </div>

          {/* Reason / Notes */}
          <div className="grid gap-2">
            <Label htmlFor="exit_reason">
              Reason / Remarks{" "}
              <span className="text-xs text-muted-foreground font-normal">
                (optional)
              </span>
            </Label>
            <Textarea
              id="exit_reason"
              rows={3}
              placeholder="e.g. Submitted formal resignation letter with 30 days notice..."
              {...register("exit_reason", {
                maxLength: {
                  value: 1000,
                  message: "Reason cannot exceed 1000 characters",
                },
              })}
            />
            {errors.exit_reason && (
              <p className="text-xs text-destructive">
                {errors.exit_reason.message}
              </p>
            )}
          </div>

          {/* IT Device & Asset Clearance Trigger */}
          <div className="p-3 rounded-lg border bg-amber-50/60 dark:bg-amber-950/20 border-amber-200/80 dark:border-amber-900/40">
            <label className="flex items-start gap-2.5 cursor-pointer text-xs">
              <input
                type="checkbox"
                className="mt-0.5 h-4 w-4 rounded border-gray-300 text-amber-600 focus:ring-amber-500 cursor-pointer"
                checked={initiateClearance}
                onChange={(e) => setInitiateClearance(e.target.checked)}
              />
              <div className="space-y-0.5">
                <span className="font-semibold text-foreground flex items-center gap-1.5">
                  <ShieldAlert className="h-3.5 w-3.5 text-amber-600" />
                  Initiate IT Gadget & Laptop Clearance in Inventory
                </span>
                <p className="text-muted-foreground text-[11px] leading-relaxed">
                  Automatically launches offboarding return inspection for company devices assigned to this staff member. If no devices are assigned, deactivation proceeds smoothly.
                </p>
              </div>
            </label>
          </div>

          <DialogFooter className="pt-2">
            <Button
              type="button"
              variant="outline"
              onClick={() => onOpenChange(false)}
              disabled={isPending}
            >
              Cancel
            </Button>
            <Button
              type="submit"
              variant="destructive"
              disabled={isPending}
              className="gap-1.5"
            >
              {isPending && <Loader2 className="h-4 w-4 animate-spin" />}
              Confirm Inactive
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}

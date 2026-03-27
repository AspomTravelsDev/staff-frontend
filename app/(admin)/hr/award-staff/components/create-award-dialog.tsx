"use client";

import { useState } from "react";
import { useForm, Controller } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { format } from "date-fns";
import { Calendar as CalendarIcon, Loader2, Trophy } from "lucide-react";

import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { Calendar } from "@/components/ui/calendar";
import { cn } from "@/lib/utils";
import { useEmployees } from "@/lib/api/hooks/use-employees";
import { useCreateAward, useAwardTypes } from "@/lib/api/hooks/use-awards";
import { toast } from "sonner";
const formSchema = z
  .object({
    employeeId: z.string().min(1, "Please select an employee"),
    awardType: z.string().min(1, "Please select an award type"),
    customName: z.string().optional(),
    date: z.date({
      message: "A month is required",
    }),
    reason: z.string().optional(),
  })
  .refine(
    (data) => {
      if (
        data.awardType === "custom" &&
        (!data.customName || data.customName.length < 3)
      ) {
        return false;
      }
      return true;
    },
    {
      message: "Custom name is required (min 3 chars)",
      path: ["customName"],
    },
  );

export function CreateAwardDialog() {
  const [open, setOpen] = useState(false);
  const { data: employeesData, isLoading: isLoadingEmployees } = useEmployees({
    limit: 1000,
    status: "Active",
  });

  const { data: awardTypes, isLoading: isLoadingTypes } = useAwardTypes();
  const createAward = useCreateAward();

  const {
    control,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      reason: "",
      customName: "",
    },
  });

  // Remove watch usage to avoid React Compiler issues

  async function onSubmit(values: z.infer<typeof formSchema>) {
    try {
      // Format date to YYYY-MM-01
      const month = format(values.date, "yyyy-MM-01");

      await createAward.mutateAsync({
        user_id: values.employeeId,
        type: values.awardType,
        custom_name:
          values.awardType === "custom" ? values.customName : undefined,
        month: month,
        description: values.reason,
      });
      toast.success("Award assigned successfully");
      setOpen(false);
      reset();
    } catch (error: unknown) {
      const message =
        error instanceof Error ? error.message : "Failed to assign award";
      toast.error(message);
    }
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button>
          <Trophy className="mr-2 h-4 w-4" />
          Give Award
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-125">
        <DialogHeader>
          <DialogTitle>Award Staff Member</DialogTitle>
          <DialogDescription>
            Recognize an employee for their outstanding performance.
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
          {/* Employee Select */}
          <div className="space-y-2">
            <Label htmlFor="employeeId">Employee</Label>
            <Controller
              control={control}
              name="employeeId"
              render={({ field }) => (
                <Select
                  onValueChange={field.onChange}
                  defaultValue={field.value}
                  disabled={isLoadingEmployees}
                >
                  <SelectTrigger id="employeeId">
                    <SelectValue placeholder="Select employee" />
                  </SelectTrigger>
                  <SelectContent>
                    {isLoadingEmployees ? (
                      <div className="flex items-center justify-center p-2">
                        <Loader2 className="h-4 w-4 animate-spin mr-2" />{" "}
                        Loading...
                      </div>
                    ) : (
                      employeesData?.items.map((employee) => (
                        <SelectItem key={employee.id} value={employee.id}>
                          {employee.firstName} {employee.lastName} (
                          {employee.department})
                        </SelectItem>
                      ))
                    )}
                  </SelectContent>
                </Select>
              )}
            />
            {errors.employeeId && (
              <p className="text-sm font-medium text-destructive">
                {errors.employeeId.message}
              </p>
            )}
          </div>

          {/* Award Type Select */}
          <div className="space-y-2">
            <Label htmlFor="awardType">Award Type</Label>
            <Controller
              control={control}
              name="awardType"
              render={({ field }) => (
                <>
                  <Select
                    onValueChange={field.onChange}
                    defaultValue={field.value}
                    disabled={isLoadingTypes}
                  >
                    <SelectTrigger id="awardType">
                      <SelectValue placeholder="Select award type" />
                    </SelectTrigger>
                    <SelectContent>
                      {isLoadingTypes ? (
                        <div className="flex items-center justify-center p-2">
                          <Loader2 className="h-4 w-4 animate-spin mr-2" />
                        </div>
                      ) : (
                        awardTypes?.map((type) => (
                          <SelectItem key={type.value} value={type.value}>
                            {type.label}
                          </SelectItem>
                        ))
                      )}
                    </SelectContent>
                  </Select>
                  {field.value === "custom" && (
                    <div className="space-y-2 mt-4">
                      <Label htmlFor="customName">Custom Award Name</Label>
                      <Controller
                        control={control}
                        name="customName"
                        render={({ field: customField }) => (
                          <Input
                            {...customField}
                            placeholder="e.g. Best Coder"
                          />
                        )}
                      />
                      {errors.customName && (
                        <p className="text-sm font-medium text-destructive">
                          {errors.customName.message}
                        </p>
                      )}
                    </div>
                  )}
                </>
              )}
            />
            {errors.awardType && (
              <p className="text-sm font-medium text-destructive">
                {errors.awardType.message}
              </p>
            )}
          </div>

          {/* Month Select */}
          <div className="space-y-2">
            <Label>Month of Award</Label>
            <Controller
              control={control}
              name="date"
              render={({ field }) => (
                <Popover>
                  <PopoverTrigger asChild>
                    <Button
                      variant={"outline"}
                      className={cn(
                        "w-full pl-3 text-left font-normal",
                        !field.value && "text-muted-foreground",
                      )}
                    >
                      {field.value ? (
                        format(field.value, "MMMM yyyy")
                      ) : (
                        <span>Pick a month</span>
                      )}
                      <CalendarIcon className="ml-auto h-4 w-4 opacity-50" />
                    </Button>
                  </PopoverTrigger>
                  <PopoverContent className="w-auto p-0" align="start">
                    <Calendar
                      mode="single"
                      selected={field.value}
                      onSelect={field.onChange}
                      disabled={(date) =>
                        date > new Date() || date < new Date("1900-01-01")
                      }
                      initialFocus
                    />
                  </PopoverContent>
                </Popover>
              )}
            />
            <p className="text-[0.8rem] text-muted-foreground">
              Select any day in the month. The award will be assigned to that
              month.
            </p>
            {errors.date && (
              <p className="text-sm font-medium text-destructive">
                {errors.date.message}
              </p>
            )}
          </div>

          {/* Description */}
          <div className="space-y-2">
            <Label htmlFor="reason">Description / Note</Label>
            <Controller
              control={control}
              name="reason"
              render={({ field }) => (
                <Textarea
                  id="reason"
                  placeholder="Describe why this employee is receiving this award..."
                  className="resize-none"
                  {...field}
                />
              )}
            />
            {errors.reason && (
              <p className="text-sm font-medium text-destructive">
                {errors.reason.message}
              </p>
            )}
          </div>

          <DialogFooter>
            <Button type="submit" disabled={createAward.isPending}>
              {createAward.isPending && (
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              )}
              Award Employee
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}

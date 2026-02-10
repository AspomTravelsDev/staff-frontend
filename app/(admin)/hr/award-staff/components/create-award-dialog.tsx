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
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
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
import { useCreateAward } from "@/lib/api/hooks/use-awards";
import { toast } from "sonner";

const formSchema = z.object({
  employeeId: z.string().min(1, "Please select an employee"),
  awardType: z.string().min(1, "Please select an award type"),
  date: z.date({
    message: "A date is required",
  }),
  reason: z.string().min(10, "Please provide a reason (min 10 characters)"),
});

const AWARD_TYPES = [
  "Employee of the Month",
  "Customer Hero",
  "Most Punctual",
  "Team Player",
  "Innovation Award",
  "Leadership Award",
  "Best Sales Performance",
  "Safety First",
];

export function CreateAwardDialog() {
  const [open, setOpen] = useState(false);
  const { data: employeesData, isLoading: isLoadingEmployees } = useEmployees({
    limit: 100,
    status: "Active",
  });
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
    },
  });

  async function onSubmit(values: z.infer<typeof formSchema>) {
    try {
      await createAward.mutateAsync({
        employeeId: values.employeeId,
        awardType: values.awardType,
        date: values.date.toISOString(),
        reason: values.reason,
      });
      toast.success("Award created successfully");
      setOpen(false);
      reset();
    } catch (error) {
      toast.error("Failed to create award");
      console.error(error);
    }
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button>
          <Trophy className="mr-2 h-4 w-4" />
          Award Staff
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle>Award Staff Member</DialogTitle>
          <DialogDescription>
            Recognize an employee for their outstanding performance or
            contribution.
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
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

          <div className="space-y-2">
            <Label htmlFor="awardType">Award Type</Label>
            <Controller
              control={control}
              name="awardType"
              render={({ field }) => (
                <Select
                  onValueChange={field.onChange}
                  defaultValue={field.value}
                >
                  <SelectTrigger id="awardType">
                    <SelectValue placeholder="Select award type" />
                  </SelectTrigger>
                  <SelectContent>
                    {AWARD_TYPES.map((type) => (
                      <SelectItem key={type} value={type}>
                        {type}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              )}
            />
            {errors.awardType && (
              <p className="text-sm font-medium text-destructive">
                {errors.awardType.message}
              </p>
            )}
          </div>

          <div className="space-y-2">
            <Label>Date of Award</Label>
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
                        format(field.value, "PPP")
                      ) : (
                        <span>Pick a date</span>
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
            {errors.date && (
              <p className="text-sm font-medium text-destructive">
                {errors.date.message}
              </p>
            )}
          </div>

          <div className="space-y-2">
            <Label htmlFor="reason">Reason / Note</Label>
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

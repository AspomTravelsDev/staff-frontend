"use client";

import { useEffect, useState } from "react";
import { useForm } from "react-hook-form";
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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Checkbox } from "@/components/ui/checkbox";
import { Employee } from "@/lib/api/employees";
import { updateUserAction } from "../actions";
import { toast } from "sonner";
import { Loader2 } from "lucide-react";
import { type RoleOption, USER_EXIT_TYPE_LABELS, type UserExitType } from "@/types/user-types";
import { formatLagosDateForInput } from "@/lib/utils/attendance";
import { Textarea } from "@/components/ui/textarea";

interface EditUserDialogProps {
  employee: Employee | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  roleOptions: RoleOption[];
  departments: string[];
  roleToDepartment: Record<string, string>;
}

interface EditUserFormData {
  staff_id: string;
  tax_id: string;
  name: string;
  email: string;
  phone: string;
  mobile_phone: string;
  role: string;
  secondary_roles: string[];
  department: string;
  is_supervisor: boolean;
  gross_pay: string;
  date_joined: string;
  dob: string;
  contract_type: string;
  is_active: boolean;
  exit_type: UserExitType;
  exit_date: string;
  exit_reason: string;
}

export function EditUserDialog({
  employee,
  open,
  onOpenChange,
  roleOptions,
  departments,
  roleToDepartment,
}: EditUserDialogProps) {
  const [isPending, setIsPending] = useState(false);

  const {
    register,
    handleSubmit,
    formState: { errors },
    setValue,
    watch,
    reset,
  } = useForm<EditUserFormData>({
    defaultValues: {
      staff_id: "",
      tax_id: "",
      name: "",
      email: "",
      phone: "",
      mobile_phone: "",
      role: "",
      secondary_roles: [],
      department: "",
      is_supervisor: false,
      gross_pay: "",
      date_joined: "",
      dob: "",
      contract_type: "",
      is_active: true,
      exit_type: "resignation",
      exit_date: "",
      exit_reason: "",
    },
  });

  // Reset form when employee changes
  useEffect(() => {
    if (employee) {
      reset({
        staff_id: employee.staff_id || "",
        tax_id: employee.tax_id || "",
        name: `${employee.firstName} ${employee.lastName}`,
        email: employee.email,
        phone: employee.phone || "",
        mobile_phone: employee.mobile_phone || "",
        role: employee.role,
        secondary_roles: employee.secondary_roles || [],
        department: employee.department || "",
        is_supervisor: employee.is_supervisor,
        gross_pay: employee.gross_pay || "",
        date_joined: formatLagosDateForInput(employee.joinDate),
        dob: formatLagosDateForInput(employee.dob),
        contract_type: employee.contract_type || "",
        is_active: employee.status === "Active",
        exit_type: (employee.exit_type as UserExitType) || "resignation",
        exit_date: employee.exit_date || employee.exitDate || "",
        exit_reason: employee.exit_reason || "",
      });
    }
  }, [employee, reset]);

  // Auto-suggest department when role changes (only if department is empty or was previously auto-suggested)
  const watchedRole = watch("role");
  const watchedDepartment = watch("department");
  useEffect(() => {
    const suggested = roleToDepartment[watchedRole];
    if (suggested && !watchedDepartment) {
      setValue("department", suggested);
    }
  }, [roleToDepartment, watchedDepartment, watchedRole, setValue]);

  const onSubmit = async (data: EditUserFormData) => {
    if (!employee) return;

    setIsPending(true);
    const result = await updateUserAction(employee.id, {
      staff_id: data.staff_id || null,
      tax_id: data.tax_id || null,
      name: data.name,
      email: data.email,
      phone: data.phone || null,
      mobile_phone: data.mobile_phone || null,
      role: data.role,
      secondary_roles: data.secondary_roles,
      department: data.department || null,
      is_supervisor: data.is_supervisor,
      gross_pay: data.gross_pay ? parseFloat(data.gross_pay) : null,
      date_joined: data.date_joined || null,
      dob: data.dob || null,
      contract_type: data.contract_type || null,
      is_active: data.is_active,
      exit_type: !data.is_active ? data.exit_type : null,
      exit_date: !data.is_active ? data.exit_date || null : null,
      exit_reason: !data.is_active ? data.exit_reason || null : null,
    });

    setIsPending(false);

    if (result.success) {
      toast.success(`${data.name} has been updated successfully.`);
      onOpenChange(false);
    } else {
      toast.error(result.error || "Failed to update user");
    }
  };

  if (!employee) return null;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-131.25 max-h-[85vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Edit User Details</DialogTitle>
          <DialogDescription>
            Update user information. Click save when you&apos;re done.
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
          <div className="grid gap-4">
            {/* Name */}
            <div className="grid gap-2">
              <Label htmlFor="name">Full Name</Label>
              <Input
                id="name"
                {...register("name", { required: "Name is required" })}
                placeholder="John Doe"
              />
              {errors.name && (
                <p className="text-sm text-destructive">
                  {errors.name.message}
                </p>
              )}
            </div>

            {/* Staff ID + Tax ID side by side */}
            <div className="grid grid-cols-2 gap-4">
              <div className="grid gap-2">
                <Label htmlFor="staff_id">Staff ID</Label>
                <Input
                  id="staff_id"
                  {...register("staff_id")}
                  placeholder="e.g. ASP-001"
                />
              </div>
              <div className="grid gap-2">
                <Label htmlFor="tax_id">Tax ID</Label>
                <Input
                  id="tax_id"
                  {...register("tax_id")}
                  placeholder="e.g. TIN-12345"
                />
              </div>
            </div>

            {/* Email */}
            <div className="grid gap-2">
              <Label htmlFor="email">Email</Label>
              <Input
                id="email"
                type="email"
                {...register("email", {
                  required: "Email is required",
                  pattern: {
                    value: /^[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}$/i,
                    message: "Invalid email address",
                  },
                })}
                placeholder="john@example.com"
              />
              {errors.email && (
                <p className="text-sm text-destructive">
                  {errors.email.message}
                </p>
              )}
            </div>

            {/* Work Phone + Mobile Phone side by side */}
            <div className="grid grid-cols-2 gap-4">
              <div className="grid gap-2">
                <Label htmlFor="phone">Work Phone</Label>
                <Input
                  id="phone"
                  {...register("phone")}
                  placeholder="+1234567890"
                />
              </div>
              <div className="grid gap-2">
                <Label htmlFor="mobile_phone">Mobile Phone</Label>
                <Input
                  id="mobile_phone"
                  {...register("mobile_phone")}
                  placeholder="+1234567890"
                />
              </div>
            </div>

            {/* Role + Department side by side */}
            <div className="grid grid-cols-2 gap-4">
              {/* Role */}
              <div className="grid gap-2">
                <Label htmlFor="role">Role</Label>
                <Select
                  value={watchedRole}
                  onValueChange={(value) => {
                    setValue("role", value);
                    // Auto-fill department if empty or previously auto-filled
                    const suggested = roleToDepartment[value];
                    if (suggested) {
                      const wasSuggested =
                        Object.values(roleToDepartment).includes(
                          watchedDepartment,
                        );
                      if (!watchedDepartment || wasSuggested) {
                        setValue("department", suggested);
                      }
                    }
                  }}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select role" />
                  </SelectTrigger>
                  <SelectContent>
                    {roleOptions.map((role) => (
                      <SelectItem key={role.value} value={role.value}>
                        {role.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              {/* Department */}
              <div className="grid gap-2">
                <Label htmlFor="department">Department</Label>
                <Select
                  value={watchedDepartment}
                  onValueChange={(value) => setValue("department", value)}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select department" />
                  </SelectTrigger>
                  <SelectContent>
                    {departments.map((dept) => (
                      <SelectItem key={dept} value={dept}>
                        {dept}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>

            {/* Secondary Roles (Additional Access) */}
            <div className="grid gap-2 rounded-lg border p-3 bg-muted/30">
              <Label className="text-sm font-semibold">Secondary Roles (Additional Access)</Label>
              <p className="text-xs text-muted-foreground">
                Grant extra role permissions (e.g. give an HR Officer additional Admin access).
              </p>
              <div className="grid grid-cols-2 gap-2 pt-1">
                {roleOptions
                  .filter((opt) => opt.value !== watchedRole)
                  .map((opt) => {
                    const currentSecondary = watch("secondary_roles") || [];
                    const isChecked = currentSecondary.includes(opt.value);
                    return (
                      <div key={opt.value} className="flex items-center space-x-2">
                        <Checkbox
                          id={`sec-role-${opt.value}`}
                          checked={isChecked}
                          onCheckedChange={(checked) => {
                            if (checked) {
                              setValue("secondary_roles", [...currentSecondary, opt.value]);
                            } else {
                              setValue(
                                "secondary_roles",
                                currentSecondary.filter((r) => r !== opt.value)
                              );
                            }
                          }}
                        />
                        <Label
                          htmlFor={`sec-role-${opt.value}`}
                          className="text-xs cursor-pointer font-normal"
                        >
                          {opt.label}
                        </Label>
                      </div>
                    );
                  })}
              </div>
            </div>

            {/* Contract Type */}
            <div className="grid gap-2">
              <Label htmlFor="contract_type">Contract Type</Label>
              <Select
                value={watch("contract_type")}
                onValueChange={(value) => setValue("contract_type", value)}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select contract type" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="full_time">Full Time</SelectItem>
                  <SelectItem value="part_time">Part Time</SelectItem>
                  <SelectItem value="contract">Contract</SelectItem>
                  <SelectItem value="nysc">NYSC</SelectItem>
                  <SelectItem value="intern">Intern</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {/* Gross Pay */}
            <div className="grid gap-2">
              <Label htmlFor="gross_pay">Gross Pay</Label>
              <Input
                id="gross_pay"
                type="number"
                step="0.01"
                {...register("gross_pay")}
                placeholder="5000.00"
              />
            </div>

            {/* Date Joined */}
            <div className="grid gap-2">
              <Label htmlFor="date_joined">Date Joined</Label>
              <Input
                id="date_joined"
                type="date"
                {...register("date_joined")}
              />
            </div>

            {/* Date of Birth */}
            <div className="grid gap-2">
              <Label htmlFor="dob">Date of Birth</Label>
              <Input id="dob" type="date" {...register("dob")} />
            </div>

            {/* Checkboxes */}
            <div className="flex items-center space-x-2">
              <Checkbox
                id="is_supervisor"
                checked={watch("is_supervisor")}
                onCheckedChange={(checked: boolean) =>
                  setValue("is_supervisor", checked)
                }
              />
              <Label htmlFor="is_supervisor">Supervisor</Label>
            </div>

            <div className="flex items-center space-x-2">
              <Checkbox
                id="is_active"
                checked={watch("is_active")}
                onCheckedChange={(checked: boolean) =>
                  setValue("is_active", checked)
                }
              />
              <Label htmlFor="is_active">Active</Label>
            </div>

            {!watch("is_active") && (
              <div className="rounded-lg border border-destructive/20 bg-destructive/5 p-3.5 space-y-3">
                <div className="text-xs font-semibold uppercase tracking-wider text-destructive">
                  Separation / Exit Details
                </div>

                <div className="grid gap-2">
                  <Label htmlFor="edit_exit_type">Separation Type</Label>
                  <Select
                    value={watch("exit_type")}
                    onValueChange={(val: UserExitType) =>
                      setValue("exit_type", val)
                    }
                  >
                    <SelectTrigger id="edit_exit_type" className="bg-background">
                      <SelectValue placeholder="Select separation type" />
                    </SelectTrigger>
                    <SelectContent>
                      {Object.entries(USER_EXIT_TYPE_LABELS).map(
                        ([key, label]) => (
                          <SelectItem key={key} value={key}>
                            {label}
                          </SelectItem>
                        )
                      )}
                    </SelectContent>
                  </Select>
                </div>

                <div className="grid gap-2">
                  <Label htmlFor="edit_exit_date">
                    Effective Date of Resignation / Separation
                  </Label>
                  <Input
                    id="edit_exit_date"
                    type="date"
                    className="bg-background"
                    {...register("exit_date")}
                  />
                </div>

                <div className="grid gap-2">
                  <Label htmlFor="edit_exit_reason">Reason / Remarks</Label>
                  <Textarea
                    id="edit_exit_reason"
                    rows={2}
                    className="bg-background"
                    placeholder="e.g. Formal resignation letter submitted with 30 days notice..."
                    {...register("exit_reason")}
                  />
                </div>
              </div>
            )}
          </div>

          <DialogFooter>
            <Button
              type="button"
              variant="outline"
              onClick={() => onOpenChange(false)}
              disabled={isPending}
            >
              Cancel
            </Button>
            <Button type="submit" disabled={isPending}>
              {isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              Save Changes
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}

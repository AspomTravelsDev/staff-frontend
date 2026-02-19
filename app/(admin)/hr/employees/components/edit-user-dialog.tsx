"use client";

import { useEffect } from "react";
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
import { useUpdateUser } from "@/lib/api/hooks/use-employees";
import { toast } from "sonner";
import { Loader2 } from "lucide-react";
import { getRolesForSelect } from "@/types/user-types";
import { ROLE_TO_DEPARTMENT } from "@/lib/utils/role-department";

interface EditUserDialogProps {
  employee: Employee | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

interface EditUserFormData {
  name: string;
  email: string;
  phone: string;
  role: string;
  department: string;
  is_supervisor: boolean;
  net_pay: string;
  date_joined: string;
  dob: string;
  contract_type: string;
  is_active: boolean;
}

const DEPARTMENTS = [
  "Management",
  "Administration",
  "IT",
  "Accounts",
  "Visa",
  "HR",
  "Social Media",
  "Compliance",
  "Birth Services",
  "Holidays",
  "Operations",
  "Customer Service",
  "Other",
];

export function EditUserDialog({
  employee,
  open,
  onOpenChange,
}: EditUserDialogProps) {
  const { mutate: updateUser, isPending } = useUpdateUser();
  const roles = getRolesForSelect();

  const {
    register,
    handleSubmit,
    formState: { errors },
    setValue,
    watch,
    reset,
  } = useForm<EditUserFormData>({
    defaultValues: {
      name: "",
      email: "",
      phone: "",
      role: "",
      department: "",
      is_supervisor: false,
      net_pay: "",
      date_joined: "",
      dob: "",
      contract_type: "",
      is_active: true,
    },
  });

  // Reset form when employee changes
  useEffect(() => {
    if (employee) {
      reset({
        name: `${employee.firstName} ${employee.lastName}`,
        email: employee.email,
        phone: employee.phone || "",
        role: employee.role,
        department: employee.department || "",
        is_supervisor: employee.is_supervisor,
        net_pay: "",
        date_joined: employee.joinDate ? employee.joinDate.split("T")[0] : "",
        dob: employee.dob ? employee.dob.split("T")[0] : "",
        contract_type: employee.contract_type || "",
        is_active: employee.status === "Active",
      });
    }
  }, [employee, reset]);

  // Auto-suggest department when role changes (only if department is empty or was previously auto-suggested)
  const watchedRole = watch("role");
  const watchedDepartment = watch("department");
  useEffect(() => {
    const suggested = ROLE_TO_DEPARTMENT[watchedRole];
    if (suggested && !watchedDepartment) {
      setValue("department", suggested);
    }
  }, [watchedRole]); // eslint-disable-line react-hooks/exhaustive-deps

  const onSubmit = (data: EditUserFormData) => {
    if (!employee) return;

    updateUser(
      {
        userId: employee.id,
        data: {
          name: data.name,
          email: data.email,
          phone: data.phone || null,
          role: data.role,
          department: data.department || null,
          is_supervisor: data.is_supervisor,
          net_pay: data.net_pay ? parseFloat(data.net_pay) : null,
          date_joined: data.date_joined || null,
          dob: data.dob || null,
          contract_type: data.contract_type || null,
          is_active: data.is_active,
        },
      },
      {
        onSuccess: () => {
          toast.success(`${data.name} has been updated successfully.`);
          onOpenChange(false);
        },
        onError: (error) => {
          toast.error(error.message || "Failed to update user");
        },
      },
    );
  };

  if (!employee) return null;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[525px] max-h-[85vh] overflow-y-auto">
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

            {/* Phone */}
            <div className="grid gap-2">
              <Label htmlFor="phone">Phone</Label>
              <Input
                id="phone"
                {...register("phone")}
                placeholder="+1234567890"
              />
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
                    const suggested = ROLE_TO_DEPARTMENT[value];
                    if (suggested) {
                      const currentDept = watch("department");
                      const wasSuggested =
                        Object.values(ROLE_TO_DEPARTMENT).includes(currentDept);
                      if (!currentDept || wasSuggested) {
                        setValue("department", suggested);
                      }
                    }
                  }}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select role" />
                  </SelectTrigger>
                  <SelectContent>
                    {roles.map((role) => (
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
                    {DEPARTMENTS.map((dept) => (
                      <SelectItem key={dept} value={dept}>
                        {dept}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
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

            {/* Net Pay */}
            <div className="grid gap-2">
              <Label htmlFor="net_pay">Net Pay</Label>
              <Input
                id="net_pay"
                type="number"
                step="0.01"
                {...register("net_pay")}
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

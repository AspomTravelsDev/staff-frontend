"use client";

import { useActionState, useRef, useEffect, useState } from "react";
import { inviteAction, type InviteState } from "../actions";
import { type RoleOption } from "@/types/user-types";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { IconCheck, IconSend, IconUserPlus } from "@tabler/icons-react";
import { Separator } from "@/components/ui/separator";
import { Switch } from "@/components/ui/switch";
import { DatePicker } from "@/components/ui/date-picker";
import { format } from "date-fns";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";

interface InviteFormProps {
  roleOptions: RoleOption[];
  roleToDepartment: Record<string, string>;
}

export function InviteForm({ roleOptions, roleToDepartment }: InviteFormProps) {
  const formRef = useRef<HTMLFormElement>(null);
  const [state, formAction, isPending] = useActionState<InviteState, FormData>(
    inviteAction,
    null,
  );

  const [selectedRole, setSelectedRole] = useState<string>("");
  const [department, setDepartment] = useState<string>("");
  const [dateJoined, setDateJoined] = useState<Date | undefined>();

  useEffect(() => {
    if (state?.success) {
      formRef.current?.reset();
      setSelectedRole("");
      setDepartment("");
      setDateJoined(undefined);
    }
  }, [state?.success]);

  // Auto-fill department based on role
  const handleRoleChange = (role: string) => {
    setSelectedRole(role);
    const autoDept = roleToDepartment[role];
    if (autoDept) {
      setDepartment(autoDept);
    }
  };

  return (
    <Card className="w-full">
      <CardHeader className="bg-muted/30 pb-6 rounded-t-xl mb-2">
        <div className="flex items-center gap-3">
          <div className="p-2.5 bg-primary/10 rounded-lg shrink-0">
            <IconUserPlus className="h-6 w-6 text-primary" />
          </div>
          <div>
            <CardTitle className="text-xl">Invite Staff Member</CardTitle>
            <CardDescription className="mt-1">
              Send an invitation email to a new team member. They will receive a
              secure link to complete their account setup.
            </CardDescription>
          </div>
        </div>
      </CardHeader>

      <form ref={formRef} action={formAction}>
        <CardContent className="space-y-8 pt-4">
          {state?.error && (
            <Alert
              variant="destructive"
              className="animate-in fade-in slide-in-from-top-2"
            >
              <AlertTitle>Invitation Failed</AlertTitle>
              <AlertDescription>{state.error}</AlertDescription>
            </Alert>
          )}

          {state?.success && (
            <Alert className="border-primary/50 bg-primary/10 text-primary animate-in fade-in slide-in-from-top-2">
              <IconCheck className="h-4 w-4" />
              <AlertTitle>Success</AlertTitle>
              <AlertDescription>{state.message}</AlertDescription>
            </Alert>
          )}

          {/* SECTION 1: Account Details */}
          <div className="space-y-4">
            <div className="flex items-center gap-2">
              <h3 className="text-sm font-semibold text-foreground/80 tracking-tight uppercase">
                Account Details
              </h3>
            </div>

            <div className="grid gap-6 md:grid-cols-2">
              <div className="space-y-2.5">
                <Label htmlFor="email" className="font-semibold">
                  Email Address <span className="text-destructive">*</span>
                </Label>
                <Input
                  id="email"
                  name="email"
                  type="email"
                  className="h-10"
                  placeholder="colleague@example.com"
                  required
                />
              </div>
              <div className="space-y-2.5">
                <Label htmlFor="staff_id" className="font-semibold">
                  Staff ID{" "}
                  <span className="text-muted-foreground font-normal ml-1">
                    (Optional)
                  </span>
                </Label>
                <Input
                  id="staff_id"
                  name="staff_id"
                  className="h-10"
                  placeholder="EMP-001"
                />
              </div>
            </div>
          </div>

          <Separator className="bg-border/60" />

          {/* SECTION 2: Role & Department */}
          <div className="space-y-4">
            <div className="flex items-center gap-2">
              <h3 className="text-sm font-semibold text-foreground/80 tracking-tight uppercase">
                Role & Assignment
              </h3>
            </div>

            <div className="grid gap-6 md:grid-cols-2">
              <div className="space-y-2.5">
                <Label htmlFor="role" className="font-semibold">
                  System Role <span className="text-destructive">*</span>
                </Label>
                <Select
                  name="role"
                  required
                  onValueChange={handleRoleChange}
                  value={selectedRole}
                >
                  <SelectTrigger className="h-10">
                    <SelectValue placeholder="Select a designation" />
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

              <div className="space-y-2.5">
                <Label htmlFor="department" className="font-semibold">
                  Department
                </Label>
                <Input
                  id="department"
                  name="department"
                  className="h-10"
                  value={department}
                  onChange={(e) => setDepartment(e.target.value)}
                  placeholder="e.g. Sales, HR, Engineering"
                />
              </div>
            </div>

            <div className="grid gap-6 md:grid-cols-2 items-start mt-2">
              <div className="space-y-2.5">
                <Label htmlFor="date_joined" className="font-semibold">
                  Date Joined{" "}
                  <span className="text-muted-foreground font-normal ml-1">
                    (Optional)
                  </span>
                </Label>
                {/* Hidden input to pass the date state to the server action form data */}
                <input
                  type="hidden"
                  name="date_joined"
                  value={dateJoined ? format(dateJoined, "yyyy-MM-dd") : ""}
                />
                <DatePicker
                  value={dateJoined}
                  onChange={setDateJoined}
                  placeholder="Pick their start date"
                  className="h-10 w-full text-sm py-2"
                />
              </div>

              <div className="flex flex-col space-y-3 pt-8 pb-2">
                <div className="flex items-center justify-between rounded-lg border p-4 shadow-sm bg-background/50">
                  <div className="space-y-0.5">
                    <Label
                      htmlFor="is_supervisor"
                      className="text-base cursor-pointer"
                    >
                      Supervisor Privileges
                    </Label>
                    <p className="text-xs text-muted-foreground">
                      Enable to grant oversight and approval capabilities.
                    </p>
                  </div>
                  <Switch id="is_supervisor" name="is_supervisor" />
                </div>

                <div className="flex items-center justify-between rounded-lg border p-4 shadow-sm bg-background/50">
                  <div className="space-y-0.5">
                    <Label
                      htmlFor="is_department_account"
                      className="text-base cursor-pointer"
                    >
                      Department Account
                    </Label>
                    <p className="text-xs text-muted-foreground">
                      Enable for purely functional accounts (e.g. visa@...).
                    </p>
                  </div>
                  <Switch
                    id="is_department_account"
                    name="is_department_account"
                  />
                </div>
              </div>
            </div>
          </div>
        </CardContent>

        <CardFooter className="bg-muted/10 border-t pt-6 pb-6 mt-6 rounded-b-xl flex justify-end">
          <Button
            type="submit"
            disabled={isPending}
            size="lg"
            className="w-full md:w-auto px-8"
          >
            <IconSend className="mr-2 h-4 w-4" />
            {isPending ? "Sending Invitation..." : "Send Invitation Emails"}
          </Button>
        </CardFooter>
      </form>
    </Card>
  );
}

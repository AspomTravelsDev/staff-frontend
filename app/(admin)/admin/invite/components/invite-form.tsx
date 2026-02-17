"use client";

import { useActionState, useRef, useEffect, useState } from "react";
import { Checkbox } from "@/components/ui/checkbox";
import { inviteAction, type InviteState } from "../actions";
import { getRolesForSelect } from "@/types/user-types";
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
import { IconCheck, IconSend } from "@tabler/icons-react";

const ROLES = getRolesForSelect();

export function InviteForm() {
  const formRef = useRef<HTMLFormElement>(null);
  const [state, formAction, isPending] = useActionState<InviteState, FormData>(
    inviteAction,
    null,
  );

  const [selectedRole, setSelectedRole] = useState<string>("");
  const [department, setDepartment] = useState<string>("");

  useEffect(() => {
    if (state?.success) {
      formRef.current?.reset();
      setSelectedRole("");
      setDepartment("");
    }
  }, [state?.success]);

  // Auto-fill department based on role
  const handleRoleChange = (role: string) => {
    setSelectedRole(role);
    const roleDetails = ROLES.find((r) => r.value === role);
    if (roleDetails) {
      // Simple mapping: remove "Officer" from label
      const autoDept = roleDetails.label
        .replace(" Officer", "")
        .replace("Super ", "");
      setDepartment(autoDept);
    }
  };

  return (
    <Card className="w-full max-w-lg mx-auto">
      <CardHeader>
        <CardTitle>Invite Staff Member</CardTitle>
        <CardDescription>
          Send an invitation email to a new staff member. They will receive a
          link to set up their account.
        </CardDescription>
      </CardHeader>
      <form ref={formRef} action={formAction}>
        <CardContent className="space-y-4">
          {state?.error && (
            <div className="rounded-md bg-destructive/15 p-3 text-sm text-destructive">
              {state.error}
            </div>
          )}
          {state?.success && (
            <div className="rounded-md bg-primary/15 p-3 text-sm text-primary space-y-2">
              <div className="flex items-center gap-2">
                <IconCheck className="h-4 w-4" />
                {state.message}
              </div>
            </div>
          )}

          <div className="grid gap-4 md:grid-cols-2">
            <div className="space-y-2">
              <Label htmlFor="email">Email address</Label>
              <Input
                id="email"
                name="email"
                type="email"
                placeholder="colleague@example.com"
                required
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="staff_id">Staff ID (Optional)</Label>
              <Input id="staff_id" name="staff_id" placeholder="EMP-001" />
            </div>
          </div>

          <div className="grid gap-4 md:grid-cols-2">
            <div className="space-y-2">
              <Label htmlFor="role">Role</Label>
              <Select
                name="role"
                required
                onValueChange={handleRoleChange}
                value={selectedRole}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select a role" />
                </SelectTrigger>
                <SelectContent>
                  {ROLES.map((role) => (
                    <SelectItem key={role.value} value={role.value}>
                      {role.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="department">Department</Label>
              <Input
                id="department"
                name="department"
                value={department}
                onChange={(e) => setDepartment(e.target.value)}
                placeholder="Department"
              />
            </div>
          </div>

          <div className="grid gap-4 md:grid-cols-2">
            <div className="space-y-2">
              <Label htmlFor="date_joined">Date Joined (Optional)</Label>
              <Input id="date_joined" name="date_joined" type="date" />
            </div>
            <div className="flex items-end pb-2">
              <div className="flex items-center space-x-2">
                <Checkbox id="is_supervisor" name="is_supervisor" />
                <Label htmlFor="is_supervisor" className="cursor-pointer">
                  Is Supervisor?
                </Label>
              </div>
            </div>
          </div>
        </CardContent>
        <CardFooter>
          <Button type="submit" disabled={isPending} className="w-full">
            <IconSend className="mr-2 h-4 w-4" />
            {isPending ? "Sending..." : "Send invitation"}
          </Button>
        </CardFooter>
      </form>
    </Card>
  );
}

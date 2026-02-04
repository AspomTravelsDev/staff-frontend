"use client";

import { useActionState, useRef, useEffect } from "react";
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

  useEffect(() => {
    if (state?.success) {
      formRef.current?.reset();
    }
  }, [state?.success]);

  return (
    <Card>
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
            <Label htmlFor="role">Role</Label>
            <Select name="role" required>
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
        </CardContent>
        <CardFooter>
          <Button type="submit" disabled={isPending}>
            <IconSend className="mr-2 h-4 w-4" />
            {isPending ? "Sending..." : "Send invitation"}
          </Button>
        </CardFooter>
      </form>
    </Card>
  );
}

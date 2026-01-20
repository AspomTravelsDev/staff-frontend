"use client";

import { useActionState } from "react";
import Link from "next/link";
import { acceptInviteAction, type AcceptInviteState } from "../actions";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

interface AcceptInviteFormProps {
  token: string;
}

export function AcceptInviteForm({ token }: AcceptInviteFormProps) {
  const [state, formAction, isPending] = useActionState<
    AcceptInviteState,
    FormData
  >(acceptInviteAction, null);

  if (!token) {
    return (
      <div>
        <h2 className="text-2xl font-bold tracking-tight text-destructive">
          Invalid invitation
        </h2>
        <p className="mt-2 text-sm text-muted-foreground">
          This invitation link is invalid or has expired. Please contact your
          administrator for a new invitation.
        </p>
        <div className="mt-8">
          <Link href="/login">
            <Button variant="outline" className="h-11 w-full">
              Go to login
            </Button>
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div>
      <h2 className="text-2xl font-bold tracking-tight">Welcome to ASPOM</h2>
      <p className="mt-2 text-sm text-muted-foreground">
        You&apos;ve been invited to join. Set your password to get started.
      </p>

      <form action={formAction} className="mt-8 space-y-6">
        <input type="hidden" name="token" value={token} />

        {state?.error && (
          <div className="rounded-md bg-destructive/15 p-3 text-sm text-destructive">
            {state.error}
          </div>
        )}

        <div className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="password">Password</Label>
            <Input
              id="password"
              name="password"
              type="password"
              required
              autoComplete="new-password"
              minLength={8}
              className="h-11"
            />
            <p className="text-xs text-muted-foreground">
              Must be at least 8 characters
            </p>
          </div>

          <div className="space-y-2">
            <Label htmlFor="password_confirmation">Confirm password</Label>
            <Input
              id="password_confirmation"
              name="password_confirmation"
              type="password"
              required
              autoComplete="new-password"
              className="h-11"
            />
          </div>
        </div>

        <Button type="submit" className="h-11 w-full" disabled={isPending}>
          {isPending ? "Creating account..." : "Create account"}
        </Button>
      </form>
    </div>
  );
}

"use client";

import { useActionState } from "react";
import Link from "next/link";
import { updatePasswordAction, type UpdatePasswordState } from "../actions";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { IconArrowLeft, IconCheck } from "@tabler/icons-react";

interface UpdatePasswordFormProps {
  token: string;
}

export function UpdatePasswordForm({ token }: UpdatePasswordFormProps) {
  const [state, formAction, isPending] = useActionState<
    UpdatePasswordState,
    FormData
  >(updatePasswordAction, null);

  if (state?.success) {
    return (
      <div className="text-center">
        <div className="mx-auto mb-6 flex h-14 w-14 items-center justify-center rounded-full bg-primary/10">
          <IconCheck className="h-7 w-7 text-primary" />
        </div>
        <h2 className="text-2xl font-bold tracking-tight">Password updated</h2>
        <p className="mt-2 text-sm text-muted-foreground">{state.message}</p>
        <div className="mt-8">
          <Link href="/login">
            <Button className="h-11 w-full">Sign in</Button>
          </Link>
        </div>
      </div>
    );
  }

  if (!token) {
    return (
      <div>
        <h2 className="text-2xl font-bold tracking-tight text-destructive">
          Invalid link
        </h2>
        <p className="mt-2 text-sm text-muted-foreground">
          This password reset link is invalid or has expired. Please request a
          new one.
        </p>
        <div className="mt-8">
          <Link href="/reset-password">
            <Button variant="outline" className="h-11 w-full">
              Request new link
            </Button>
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div>
      <h2 className="text-2xl font-bold tracking-tight">Set new password</h2>
      <p className="mt-2 text-sm text-muted-foreground">
        Enter your new password below.
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
            <Label htmlFor="password">New password</Label>
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
          {isPending ? "Updating..." : "Update password"}
        </Button>

        <div className="text-center">
          <Link
            href="/login"
            className="inline-flex items-center text-sm text-muted-foreground hover:text-primary"
          >
            <IconArrowLeft className="mr-1 h-4 w-4" />
            Back to login
          </Link>
        </div>
      </form>
    </div>
  );
}

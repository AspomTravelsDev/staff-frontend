"use client";

import { useActionState } from "react";
import Link from "next/link";
import { resetPasswordAction, type ResetPasswordState } from "../actions";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { IconArrowLeft, IconCheck } from "@tabler/icons-react";

export function ResetPasswordForm() {
  const [state, formAction, isPending] = useActionState<
    ResetPasswordState,
    FormData
  >(resetPasswordAction, null);

  if (state?.success) {
    return (
      <div className="text-center">
        <div className="mx-auto mb-6 flex h-14 w-14 items-center justify-center rounded-full bg-primary/10">
          <IconCheck className="h-7 w-7 text-primary" />
        </div>
        <h2 className="text-2xl font-bold tracking-tight">Check your email</h2>
        <p className="mt-2 text-sm text-muted-foreground">{state.message}</p>
        {state.reset_url && (
          <div className="mt-4 text-xs break-all bg-muted p-2 rounded border mx-auto max-w-sm">
            <p className="font-semibold mb-1 text-left">
              Reset Link (Test Mode):
            </p>
            <a href={state.reset_url} className="underline text-primary">
              {state.reset_url}
            </a>
          </div>
        )}
        <div className="mt-8">
          <Link href="/login">
            <Button variant="outline" className="h-11 w-full">
              <IconArrowLeft className="mr-2 h-4 w-4" />
              Back to login
            </Button>
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div>
      <h2 className="text-2xl font-bold tracking-tight">Reset password</h2>
      <p className="mt-2 text-sm text-muted-foreground">
        Enter your email address and we&apos;ll send you a link to reset your
        password.
      </p>

      <form action={formAction} className="mt-8 space-y-6">
        {state?.error && (
          <div className="rounded-md bg-destructive/15 p-3 text-sm text-destructive">
            {state.error}
          </div>
        )}

        <div className="space-y-2">
          <Label htmlFor="email">Email address</Label>
          <Input
            id="email"
            name="email"
            type="email"
            placeholder="you@example.com"
            required
            autoComplete="email"
            className="h-11"
          />
        </div>

        <Button type="submit" className="h-11 w-full" disabled={isPending}>
          {isPending ? "Sending..." : "Send reset link"}
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

"use client";

import { useActionState } from "react";
import Link from "next/link";
import { updatePasswordAction, type UpdatePasswordState } from "../actions";
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
      <Card>
        <CardHeader className="space-y-1">
          <div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-full bg-primary/10">
            <IconCheck className="h-6 w-6 text-primary" />
          </div>
          <CardTitle className="text-center text-2xl">
            Password updated
          </CardTitle>
          <CardDescription className="text-center">
            {state.message}
          </CardDescription>
        </CardHeader>
        <CardFooter>
          <Link href="/login" className="w-full">
            <Button className="w-full">Sign in</Button>
          </Link>
        </CardFooter>
      </Card>
    );
  }

  if (!token) {
    return (
      <Card>
        <CardHeader className="space-y-1">
          <CardTitle className="text-2xl text-destructive">
            Invalid link
          </CardTitle>
          <CardDescription>
            This password reset link is invalid or has expired. Please request a
            new one.
          </CardDescription>
        </CardHeader>
        <CardFooter>
          <Link href="/reset-password" className="w-full">
            <Button variant="outline" className="w-full">
              Request new link
            </Button>
          </Link>
        </CardFooter>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader className="space-y-1">
        <CardTitle className="text-2xl">Set new password</CardTitle>
        <CardDescription>Enter your new password below</CardDescription>
      </CardHeader>
      <form action={formAction}>
        <input type="hidden" name="token" value={token} />
        <CardContent className="space-y-4">
          {state?.error && (
            <div className="rounded-md bg-destructive/15 p-3 text-sm text-destructive">
              {state.error}
            </div>
          )}
          <div className="space-y-2">
            <Label htmlFor="password">New password</Label>
            <Input
              id="password"
              name="password"
              type="password"
              required
              autoComplete="new-password"
              minLength={8}
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
            />
          </div>
        </CardContent>
        <CardFooter className="flex flex-col gap-4">
          <Button type="submit" className="w-full" disabled={isPending}>
            {isPending ? "Updating..." : "Update password"}
          </Button>
          <Link
            href="/login"
            className="text-sm text-muted-foreground hover:text-primary"
          >
            <IconArrowLeft className="mr-1 inline h-4 w-4" />
            Back to login
          </Link>
        </CardFooter>
      </form>
    </Card>
  );
}

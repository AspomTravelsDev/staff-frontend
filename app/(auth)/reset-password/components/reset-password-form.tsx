"use client";

import { useActionState } from "react";
import Link from "next/link";
import { resetPasswordAction, type ResetPasswordState } from "../actions";
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

export function ResetPasswordForm() {
  const [state, formAction, isPending] = useActionState<
    ResetPasswordState,
    FormData
  >(resetPasswordAction, null);

  if (state?.success) {
    return (
      <Card>
        <CardHeader className="space-y-1">
          <div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-full bg-primary/10">
            <IconCheck className="h-6 w-6 text-primary" />
          </div>
          <CardTitle className="text-center text-2xl">
            Check your email
          </CardTitle>
          <CardDescription className="text-center">
            {state.message}
          </CardDescription>
        </CardHeader>
        <CardFooter>
          <Link href="/login" className="w-full">
            <Button variant="outline" className="w-full">
              <IconArrowLeft className="mr-2 h-4 w-4" />
              Back to login
            </Button>
          </Link>
        </CardFooter>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader className="space-y-1">
        <CardTitle className="text-2xl">Reset password</CardTitle>
        <CardDescription>
          Enter your email address and we&apos;ll send you a link to reset your
          password
        </CardDescription>
      </CardHeader>
      <form action={formAction}>
        <CardContent className="space-y-4">
          {state?.error && (
            <div className="rounded-md bg-destructive/15 p-3 text-sm text-destructive">
              {state.error}
            </div>
          )}
          <div className="space-y-2">
            <Label htmlFor="email">Email</Label>
            <Input
              id="email"
              name="email"
              type="email"
              placeholder="you@example.com"
              required
              autoComplete="email"
            />
          </div>
        </CardContent>
        <CardFooter className="flex flex-col gap-4">
          <Button type="submit" className="w-full" disabled={isPending}>
            {isPending ? "Sending..." : "Send reset link"}
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

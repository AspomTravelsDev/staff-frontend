"use client";

import { useActionState, useEffect } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { acceptInviteAction, type AcceptInviteState } from "../actions";
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

interface AcceptInviteFormProps {
  token: string;
}

export function AcceptInviteForm({ token }: AcceptInviteFormProps) {
  const router = useRouter();
  const [state, formAction, isPending] = useActionState<
    AcceptInviteState,
    FormData
  >(acceptInviteAction, null);

  useEffect(() => {
    if (state?.success) {
      router.push("/dashboard");
    }
  }, [state?.success, router]);

  if (!token) {
    return (
      <Card>
        <CardHeader className="space-y-1">
          <CardTitle className="text-2xl text-destructive">
            Invalid invitation
          </CardTitle>
          <CardDescription>
            This invitation link is invalid or has expired. Please contact your
            administrator for a new invitation.
          </CardDescription>
        </CardHeader>
        <CardFooter>
          <Link href="/login" className="w-full">
            <Button variant="outline" className="w-full">
              Go to login
            </Button>
          </Link>
        </CardFooter>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader className="space-y-1">
        <CardTitle className="text-2xl">Welcome to ASPOM</CardTitle>
        <CardDescription>
          You&apos;ve been invited to join. Set your password to get started.
        </CardDescription>
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
            <Label htmlFor="password">Password</Label>
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
        <CardFooter>
          <Button type="submit" className="w-full" disabled={isPending}>
            {isPending ? "Creating account..." : "Create account"}
          </Button>
        </CardFooter>
      </form>
    </Card>
  );
}

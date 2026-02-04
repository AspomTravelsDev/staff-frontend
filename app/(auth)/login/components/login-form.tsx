"use client";

import { useEffect, useRef } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { useActionState } from "react";
import Link from "next/link";
import { loginAction, type LoginState } from "../actions";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";

export function LoginForm({ redirect }: { redirect?: string }) {
  const [state, formAction, isPending] = useActionState<LoginState, FormData>(
    loginAction,
    null,
  );
  const router = useRouter();
  // Using a ref to store location to avoid hydration issues with hidden input
  const locationRef = useRef<string>("");

  useEffect(() => {
    // Attempt to get location immediately on mount
    if ("geolocation" in navigator) {
      navigator.geolocation.getCurrentPosition(
        (position) => {
          const data = JSON.stringify({
            latitude: position.coords.latitude,
            longitude: position.coords.longitude,
            accuracy: position.coords.accuracy,
          });
          locationRef.current = data;
        },
        (error) => {
          console.log("Location access denied or failed:", error.message);
          // We just continue without location
        },
        { timeout: 4000, maximumAge: 60000 }, // 4s timeout, accept cached for 1min
      );
    }
  }, []);

  useEffect(() => {
    if (state?.error) {
      toast.error(state.error);
    }
    if (state?.success) {
      toast.success("Login successful");
      if (state.destination) {
        router.push(state.destination);
      }
    }
  }, [state, router]);

  return (
    <div>
      <h2 className="text-2xl font-bold tracking-tight">
        Sign in to your account
      </h2>
      <p className="mt-2 text-sm text-muted-foreground">
        Welcome back! Please enter your credentials.
      </p>

      <form
        action={(formData) => {
          // Append location data before submitting
          if (locationRef.current) {
            formData.set("location", locationRef.current);
          }
          formAction(formData);
        }}
        className="mt-8 space-y-6"
      >
        <input type="hidden" name="redirect" value={redirect || "/dashboard"} />
        {state?.error && (
          <div className="rounded-md bg-destructive/15 p-3 text-sm text-destructive">
            {state.error}
          </div>
        )}

        <div className="space-y-4">
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

          <div className="space-y-2">
            <Label htmlFor="password">Password</Label>
            <Input
              id="password"
              name="password"
              type="password"
              required
              autoComplete="current-password"
              className="h-11"
            />
          </div>
        </div>

        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-2">
            <Checkbox id="remember" name="remember" />
            <Label
              htmlFor="remember"
              className="text-sm font-normal text-muted-foreground"
            >
              Remember me
            </Label>
          </div>
          <Link
            href="/reset-password"
            className="text-sm font-medium text-primary hover:text-primary/80"
          >
            Forgot password?
          </Link>
        </div>

        <Button type="submit" className="h-11 w-full" disabled={isPending}>
          {isPending ? "Signing in..." : "Sign in"}
        </Button>
      </form>
    </div>
  );
}

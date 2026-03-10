"use client";

import { useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { useActionState } from "react";
import Link from "next/link";
import { loginAction, type LoginState } from "../actions";
import { Loader2, AlertCircle } from "lucide-react";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
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
  const clientIpRef = useRef<string>("");
  const [isLocating, setIsLocating] = useState(true);
  const [locationError, setLocationError] = useState<string | null>(null);

  useEffect(() => {
    // Fetch client IP
    fetch("https://api.ipify.org?format=json")
      .then((res) => res.json())
      .then((data) => {
        if (data.ip) clientIpRef.current = data.ip;
      })
      .catch((err) => console.error("Failed to fetch IP:", err));

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
          setIsLocating(false);
        },
        (error) => {
          setLocationError(
            "Location access denied. Some features may be restricted.",
          );
          setIsLocating(false);
        },
        { timeout: 10000, maximumAge: 60000 },
      );
    } else {
      setIsLocating(false);
    }
  }, []);

  useEffect(() => {
    if (state?.error) {
      toast.error(state.error);
    }
    if (state?.success) {
      toast.success("Login successful");

      if (state.clock_in_message) {
        if (state.clocked_in) {
          toast.success(state.clock_in_message);
        } else {
          toast.warning(state.clock_in_message, {
            duration: 6000,
          });
        }
      }

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
          if (clientIpRef.current) {
            formData.set("client_ip", clientIpRef.current);
          }
          formAction(formData);
        }}
        className="mt-8 space-y-6"
      >
        <input type="hidden" name="redirect" value={redirect || "/dashboard"} />

        {state?.error && (
          <Alert variant="destructive">
            <AlertCircle className="h-4 w-4" />
            <AlertTitle>Login Failed</AlertTitle>
            <AlertDescription>{state.error}</AlertDescription>
          </Alert>
        )}

        {isLocating && (
          <div className="flex items-center space-x-2 text-sm text-muted-foreground bg-muted/50 p-2 rounded">
            <Loader2 className="h-4 w-4 animate-spin" />
            <span>Checking secure location...</span>
          </div>
        )}

        {locationError && !state?.error && (
          <div className="text-xs text-amber-600 flex items-center gap-1.5 mt-2">
            <AlertCircle className="h-3 w-3" />
            <span>{locationError}</span>
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

        <Button
          type="submit"
          className="h-11 w-full"
          disabled={isPending || isLocating}
        >
          {isPending
            ? "Signing in..."
            : isLocating
              ? "Checking location..."
              : "Sign in"}
        </Button>
      </form>
    </div>
  );
}

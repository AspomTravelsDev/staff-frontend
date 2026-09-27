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
import { getDeviceSignature } from "@/lib/utils/device-fingerprint";
import { ATTENDANCE_CONFIG } from "@/lib/config/attendance";

export function LoginForm({ redirect }: { redirect?: string }) {
  const isAutoClockInEnabled = ATTENDANCE_CONFIG.isLoginAutoClockInEnabled();
  const [state, formAction, isPending] = useActionState<LoginState, FormData>(
    loginAction,
    null,
  );
  const router = useRouter();
  // Using a ref to store location to avoid hydration issues with hidden input
  const locationRef = useRef<string>("");
  const clientIpRef = useRef<string>("");
  const [isLocating, setIsLocating] = useState(isAutoClockInEnabled);
  const [locationError, setLocationError] = useState<string | null>(null);
  const [cooldown, setCooldown] = useState(0);

  useEffect(() => {
    let timer: NodeJS.Timeout;
    if (cooldown > 0) {
      timer = setInterval(() => {
        setCooldown((prev) => prev - 1);
      }, 1000);
    }
    return () => clearInterval(timer);
  }, [cooldown]);

  useEffect(() => {
    if (!isAutoClockInEnabled) {
      setIsLocating(false);
      return;
    }

    const initLocationData = async () => {
      const { getGPSLocation, getPublicIP } = await import("@/lib/utils/location");
      
      // Fetch client IP
      getPublicIP()
        .then((ip) => {
          clientIpRef.current = ip;
        })
        .catch((err) => console.error("Failed to fetch IP:", err));

      // Attempt to get location
      getGPSLocation()
        .then((location) => {
          locationRef.current = JSON.stringify(location);
          setIsLocating(false);
        })
        .catch((err) => {
          setLocationError(
            "Location access denied. Some features may be restricted.",
          );
          setIsLocating(false);
        });
    };

    initLocationData();
  }, [isAutoClockInEnabled]);

  useEffect(() => {
    if (state?.error) {
      toast.error(state.error);
      if (state.error.includes("Too many login attempts")) {
        setCooldown(60);
      }
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
          if (isAutoClockInEnabled) {
            if (locationRef.current) {
              formData.set("location", locationRef.current);
            }
            if (clientIpRef.current) {
              formData.set("client_ip", clientIpRef.current);
            }
          }
          
          try {
            const deviceData = getDeviceSignature();
            formData.set("device_uuid", deviceData.device_uuid);
            formData.set("device_fingerprint", deviceData.device_fingerprint);
            formData.set("device_name", deviceData.device_name);
          } catch (e) {
            console.error("Failed to append device signature to login request:", e);
          }

          formData.set("skip_clock_in", isAutoClockInEnabled ? "false" : "true");

          formAction(formData);
        }}
        className="mt-8 space-y-6"
      >
        <input type="hidden" name="redirect" value={redirect || "/dashboard"} />
        <input
          type="hidden"
          name="skip_clock_in"
          value={isAutoClockInEnabled ? "false" : "true"}
        />

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
          disabled={isPending || isLocating || cooldown > 0}
        >
          {isPending
            ? "Signing in..."
            : isLocating
              ? "Checking location..."
              : cooldown > 0
                ? `Please wait (${cooldown}s)`
                : "Sign in"}
        </Button>
      </form>
    </div>
  );
}

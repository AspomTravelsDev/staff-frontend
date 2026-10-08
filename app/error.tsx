"use client";

import { useEffect } from "react";
import { Button } from "@/components/ui/button";
import { AlertCircle, ArrowRight, RotateCcw } from "lucide-react";
import Link from "next/link";


export default function Error({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error("Application error:", error);
  }, [error]);

  return (
    <div className="flex min-h-[80vh] w-full flex-col items-center justify-center p-4">
      <div className="mx-auto w-full max-w-md space-y-6 text-center text-pretty">
        <div className="mx-auto flex size-20 items-center justify-center rounded-full bg-destructive/10">
          <AlertCircle className="size-10 text-destructive" />
        </div>

        <div className="space-y-2">
          <h1 className="text-3xl font-bold tracking-tight">
            Something went wrong
          </h1>
          <p className="text-muted-foreground">
            We couldn&apos;t load this page. Please try again.
          </p>
        </div>

        <div className="flex flex-col gap-2 sm:flex-row sm:justify-center">
          <Button asChild size="lg" className="gap-2">
            <Link href="/login">
              Sign in again
              <ArrowRight className="size-4" />
            </Link>
          </Button>

          <Button
            variant="outline"
            size="lg"
            onClick={() => reset()}
            className="gap-2"
          >
            <RotateCcw className="size-4" />
            Try again
          </Button>
        </div>

        {process.env.NODE_ENV === "development" && (
          <div className="mt-8 rounded-lg bg-muted p-4 text-left text-xs font-mono">
            <p className="font-bold text-destructive">
              Error details (Dev only):
            </p>
            <p className="mt-2 break-all">{error.message}</p>
            {error.digest && (
              <p className="mt-1 text-muted-foreground">
                Digest: {error.digest}
              </p>
            )}
          </div>
        )}
      </div>
    </div>
  );
}

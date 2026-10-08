"use client";

import { useRouter } from "next/navigation";
import { useTransition } from "react";

export function DataLoadError({ title = "Unable to load this page", message = "The records are temporarily unavailable. Please try again." }: { title?: string; message?: string }) {
  const router = useRouter();
  const [retrying, startTransition] = useTransition();
  return (
    <div role="alert" className="m-4 rounded-xl border border-destructive/30 bg-card p-6 space-y-3">
      <h2 className="text-lg font-semibold">{title}</h2>
      <p className="text-sm text-muted-foreground">{message}</p>
      <button type="button" disabled={retrying} onClick={() => startTransition(() => router.refresh())}
        className="rounded-md bg-primary px-4 py-2 text-sm text-primary-foreground disabled:opacity-50">
        {retrying ? "Retrying…" : "Try again"}
      </button>
    </div>
  );
}

import "server-only";
import { getCurrentUser } from "@/lib/auth/session";
import { redirectToSessionLogin } from "@/lib/auth/recover-session";
import { createElement, type ReactNode } from "react";
import { unstable_rethrow } from "next/navigation";
import { DataLoadError } from "@/components/data-load-error";
import { ExpectedActionError } from "./action-result";

/** Keep failed loads distinct from empty data, while preserving redirects and not-found responses. */
export async function renderDataPage(operation: () => Promise<ReactNode>, title: string) {
  try {
    return await operation();
  } catch (error) {
    unstable_rethrow(error);
    // Re-check before offering a retry: a retained layout can outlive its session.
    if (!await getCurrentUser()) await redirectToSessionLogin();
    console.error(`[Page: ${title}]`, error);
    return createElement(DataLoadError, {
      title,
      message: error instanceof ExpectedActionError ? error.message : undefined,
    });
  }
}

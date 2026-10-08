import "server-only";
import { unstable_rethrow } from "next/navigation";
import { ExpectedActionError, type ActionResult } from "./action-result";

/** Expected API failures are data; unexpected exceptions remain private in the server log. */
export async function runAction<T>(operation: () => Promise<T>, name: string): Promise<ActionResult<T>> {
  try {
    return { success: true, data: await operation() };
  } catch (error) {
    unstable_rethrow(error);
    if (error instanceof ExpectedActionError) {
      return { success: false, error: { message: error.message, code: error.code } };
    }
    console.error(`[Server action: ${name}]`, error);
    return {
      success: false,
      error: { message: "Unable to complete this request. Please try again.", code: "ACTION_FAILED" },
    };
  }
}

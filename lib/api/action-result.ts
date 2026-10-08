import { unstable_rethrow } from "next/navigation";

/** Serializable failures cross the server-action boundary without production redaction. */
export type ActionResult<T> =
  | { success: true; data: T }
  | { success: false; error: { message: string; code: string } };

export type ActionData<T> = T extends { success: true; data: infer Data } ? Data : never;

export class ExpectedActionError extends Error {
  constructor(message: string, public readonly code = "ACTION_FAILED") {
    super(message);
    this.name = "ExpectedActionError";
  }
}

/** Unwrap only after the action has returned; existing UI and query handlers keep their contract. */
export async function callAction<T>(action: () => Promise<ActionResult<T>>): Promise<T> {
  let result: ActionResult<T>;
  try {
    result = await action();
  } catch (error) {
    unstable_rethrow(error);
    throw new ExpectedActionError("Unable to reach the service. Please try again.", "ACTION_UNAVAILABLE");
  }
  if (!result.success) {
    throw new ExpectedActionError(result.error.message, result.error.code);
  }
  return result.data;
}

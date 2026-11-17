import * as actions from "./secrets.actions";
import { callAction, type ActionData } from "./action-result";
export type * from "./secrets.actions";

export async function createSecret(
  ...args: Parameters<typeof actions.createSecret>
): Promise<ActionData<Awaited<ReturnType<typeof actions.createSecret>>>> {
  return callAction(() => actions.createSecret(...args));
}

export async function getSecretMetadata(
  ...args: Parameters<typeof actions.getSecretMetadata>
): Promise<ActionData<Awaited<ReturnType<typeof actions.getSecretMetadata>>>> {
  return callAction(() => actions.getSecretMetadata(...args));
}

export async function revealSecret(
  ...args: Parameters<typeof actions.revealSecret>
): Promise<ActionData<Awaited<ReturnType<typeof actions.revealSecret>>>> {
  return callAction(() => actions.revealSecret(...args));
}

export async function revokeSecret(
  ...args: Parameters<typeof actions.revokeSecret>
): Promise<ActionData<Awaited<ReturnType<typeof actions.revokeSecret>>>> {
  return callAction(() => actions.revokeSecret(...args));
}

export async function getSecretAuditLogs(
  ...args: Parameters<typeof actions.getSecretAuditLogs>
): Promise<ActionData<Awaited<ReturnType<typeof actions.getSecretAuditLogs>>>> {
  return callAction(() => actions.getSecretAuditLogs(...args));
}

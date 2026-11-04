// The server returns serializable results; errors are reconstructed in the caller.
import * as actions from "./actions.server";
import { callAction, type ActionData } from "@/lib/api/action-result";
export type * from "./actions.server";

export async function deleteApplicationAction(...args: Parameters<typeof actions.deleteApplicationAction>): Promise<ActionData<Awaited<ReturnType<typeof actions.deleteApplicationAction>>>> {
  return callAction(() => actions.deleteApplicationAction(...args));
}

export async function updateApplicationEmploymentStatusAction(...args: Parameters<typeof actions.updateApplicationEmploymentStatusAction>): Promise<ActionData<Awaited<ReturnType<typeof actions.updateApplicationEmploymentStatusAction>>>> {
  return callAction(() => actions.updateApplicationEmploymentStatusAction(...args));
}

export async function generateDocumentsAction(...args: Parameters<typeof actions.generateDocumentsAction>): Promise<ActionData<Awaited<ReturnType<typeof actions.generateDocumentsAction>>>> {
  return callAction(() => actions.generateDocumentsAction(...args));
}

export async function requestCorrectionAction(...args: Parameters<typeof actions.requestCorrectionAction>): Promise<ActionData<Awaited<ReturnType<typeof actions.requestCorrectionAction>>>> {
  return callAction(() => actions.requestCorrectionAction(...args));
}

export async function sendReminderAction(...args: Parameters<typeof actions.sendReminderAction>): Promise<ActionData<Awaited<ReturnType<typeof actions.sendReminderAction>>>> {
  return callAction(() => actions.sendReminderAction(...args));
}

export async function toggleAddressVerificationAction(...args: Parameters<typeof actions.toggleAddressVerificationAction>): Promise<ActionData<Awaited<ReturnType<typeof actions.toggleAddressVerificationAction>>>> {
  return callAction(() => actions.toggleAddressVerificationAction(...args));
}

export async function updateContactVerificationAction(...args: Parameters<typeof actions.updateContactVerificationAction>): Promise<ActionData<Awaited<ReturnType<typeof actions.updateContactVerificationAction>>>> {
  return callAction(() => actions.updateContactVerificationAction(...args));
}

export async function provisionCorporateEmailAction(...args: Parameters<typeof actions.provisionCorporateEmailAction>): Promise<ActionData<Awaited<ReturnType<typeof actions.provisionCorporateEmailAction>>>> {
  return callAction(() => actions.provisionCorporateEmailAction(...args));
}

export async function resendPortalInviteAction(...args: Parameters<typeof actions.resendPortalInviteAction>): Promise<ActionData<Awaited<ReturnType<typeof actions.resendPortalInviteAction>>>> {
  return callAction(() => actions.resendPortalInviteAction(...args));
}

export async function checkCpanelEmailAction(...args: Parameters<typeof actions.checkCpanelEmailAction>): Promise<ActionData<Awaited<ReturnType<typeof actions.checkCpanelEmailAction>>>> {
  return callAction(() => actions.checkCpanelEmailAction(...args));
}

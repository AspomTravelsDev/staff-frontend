// The server returns serializable results; errors are reconstructed in the caller.
import * as actions from "./hr.actions";
import { callAction, type ActionData } from "./action-result";
export type * from "./hr.actions";

export async function getApplications(...args: Parameters<typeof actions.getApplications>): Promise<ActionData<Awaited<ReturnType<typeof actions.getApplications>>>> {
  return callAction(() => actions.getApplications(...args));
}

export async function markOnboardingNotificationsViewed(...args: Parameters<typeof actions.markOnboardingNotificationsViewed>): Promise<ActionData<Awaited<ReturnType<typeof actions.markOnboardingNotificationsViewed>>>> {
  return callAction(() => actions.markOnboardingNotificationsViewed(...args));
}

export async function getApplication(...args: Parameters<typeof actions.getApplication>): Promise<ActionData<Awaited<ReturnType<typeof actions.getApplication>>>> {
  return callAction(() => actions.getApplication(...args));
}

export async function createApplication(...args: Parameters<typeof actions.createApplication>): Promise<ActionData<Awaited<ReturnType<typeof actions.createApplication>>>> {
  return callAction(() => actions.createApplication(...args));
}

export async function deleteApplication(...args: Parameters<typeof actions.deleteApplication>): Promise<ActionData<Awaited<ReturnType<typeof actions.deleteApplication>>>> {
  return callAction(() => actions.deleteApplication(...args));
}

export async function sendInvite(...args: Parameters<typeof actions.sendInvite>): Promise<ActionData<Awaited<ReturnType<typeof actions.sendInvite>>>> {
  return callAction(() => actions.sendInvite(...args));
}

export async function sendOnboardingReminder(...args: Parameters<typeof actions.sendOnboardingReminder>): Promise<ActionData<Awaited<ReturnType<typeof actions.sendOnboardingReminder>>>> {
  return callAction(() => actions.sendOnboardingReminder(...args));
}

export async function requestOnboardingCorrection(...args: Parameters<typeof actions.requestOnboardingCorrection>): Promise<ActionData<Awaited<ReturnType<typeof actions.requestOnboardingCorrection>>>> {
  return callAction(() => actions.requestOnboardingCorrection(...args));
}

export async function toggleAddressVerification(...args: Parameters<typeof actions.toggleAddressVerification>): Promise<ActionData<Awaited<ReturnType<typeof actions.toggleAddressVerification>>>> {
  return callAction(() => actions.toggleAddressVerification(...args));
}

export async function updateContactVerification(...args: Parameters<typeof actions.updateContactVerification>): Promise<ActionData<Awaited<ReturnType<typeof actions.updateContactVerification>>>> {
  return callAction(() => actions.updateContactVerification(...args));
}

export async function provisionCorporateEmail(...args: Parameters<typeof actions.provisionCorporateEmail>): Promise<ActionData<Awaited<ReturnType<typeof actions.provisionCorporateEmail>>>> {
  return callAction(() => actions.provisionCorporateEmail(...args));
}

export async function resendPortalInvite(...args: Parameters<typeof actions.resendPortalInvite>): Promise<ActionData<Awaited<ReturnType<typeof actions.resendPortalInvite>>>> {
  return callAction(() => actions.resendPortalInvite(...args));
}

export async function checkCpanelEmail(...args: Parameters<typeof actions.checkCpanelEmail>): Promise<ActionData<Awaited<ReturnType<typeof actions.checkCpanelEmail>>>> {
  return callAction(() => actions.checkCpanelEmail(...args));
}

export async function getPublicApplication(...args: Parameters<typeof actions.getPublicApplication>): Promise<ActionData<Awaited<ReturnType<typeof actions.getPublicApplication>>>> {
  return callAction(() => actions.getPublicApplication(...args));
}

export async function savePublicFormStep(...args: Parameters<typeof actions.savePublicFormStep>): Promise<ActionData<Awaited<ReturnType<typeof actions.savePublicFormStep>>>> {
  return callAction(() => actions.savePublicFormStep(...args));
}

export async function submitPublicApplication(...args: Parameters<typeof actions.submitPublicApplication>): Promise<ActionData<Awaited<ReturnType<typeof actions.submitPublicApplication>>>> {
  return callAction(() => actions.submitPublicApplication(...args));
}

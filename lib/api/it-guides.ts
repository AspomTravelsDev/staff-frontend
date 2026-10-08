// The server returns serializable results; errors are reconstructed in the caller.
import * as actions from "./it-guides.actions";
import { callAction, type ActionData } from "./action-result";
export type * from "./it-guides.actions";

export async function getITGuides(...args: Parameters<typeof actions.getITGuides>): Promise<ActionData<Awaited<ReturnType<typeof actions.getITGuides>>>> {
  return callAction(() => actions.getITGuides(...args));
}

export async function getITGuide(...args: Parameters<typeof actions.getITGuide>): Promise<ActionData<Awaited<ReturnType<typeof actions.getITGuide>>>> {
  return callAction(() => actions.getITGuide(...args));
}

export async function createITGuide(...args: Parameters<typeof actions.createITGuide>): Promise<ActionData<Awaited<ReturnType<typeof actions.createITGuide>>>> {
  return callAction(() => actions.createITGuide(...args));
}

export async function updateITGuide(...args: Parameters<typeof actions.updateITGuide>): Promise<ActionData<Awaited<ReturnType<typeof actions.updateITGuide>>>> {
  return callAction(() => actions.updateITGuide(...args));
}

export async function deleteITGuide(...args: Parameters<typeof actions.deleteITGuide>): Promise<ActionData<Awaited<ReturnType<typeof actions.deleteITGuide>>>> {
  return callAction(() => actions.deleteITGuide(...args));
}

export async function markITGuideAsRead(...args: Parameters<typeof actions.markITGuideAsRead>): Promise<ActionData<Awaited<ReturnType<typeof actions.markITGuideAsRead>>>> {
  return callAction(() => actions.markITGuideAsRead(...args));
}

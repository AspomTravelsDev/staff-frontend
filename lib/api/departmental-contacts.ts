// The server returns serializable results; errors are reconstructed in the caller.
import * as actions from "./departmental-contacts.actions";
import { callAction, type ActionData } from "./action-result";
export type * from "./departmental-contacts.actions";

export async function getDepartmentalContacts(...args: Parameters<typeof actions.getDepartmentalContacts>): Promise<ActionData<Awaited<ReturnType<typeof actions.getDepartmentalContacts>>>> {
  return callAction(() => actions.getDepartmentalContacts(...args));
}

export async function createDepartmentalContact(...args: Parameters<typeof actions.createDepartmentalContact>): Promise<ActionData<Awaited<ReturnType<typeof actions.createDepartmentalContact>>>> {
  return callAction(() => actions.createDepartmentalContact(...args));
}

export async function updateDepartmentalContact(...args: Parameters<typeof actions.updateDepartmentalContact>): Promise<ActionData<Awaited<ReturnType<typeof actions.updateDepartmentalContact>>>> {
  return callAction(() => actions.updateDepartmentalContact(...args));
}

export async function deleteDepartmentalContact(...args: Parameters<typeof actions.deleteDepartmentalContact>): Promise<ActionData<Awaited<ReturnType<typeof actions.deleteDepartmentalContact>>>> {
  return callAction(() => actions.deleteDepartmentalContact(...args));
}

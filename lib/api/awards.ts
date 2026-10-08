// The server returns serializable results; errors are reconstructed in the caller.
import * as actions from "./awards.actions";
import { callAction, type ActionData } from "./action-result";
export type * from "./awards.actions";

export async function getAwardTypes(...args: Parameters<typeof actions.getAwardTypes>): Promise<ActionData<Awaited<ReturnType<typeof actions.getAwardTypes>>>> {
  return callAction(() => actions.getAwardTypes(...args));
}

export async function getMyAwards(...args: Parameters<typeof actions.getMyAwards>): Promise<ActionData<Awaited<ReturnType<typeof actions.getMyAwards>>>> {
  return callAction(() => actions.getMyAwards(...args));
}

export async function getUserAwards(...args: Parameters<typeof actions.getUserAwards>): Promise<ActionData<Awaited<ReturnType<typeof actions.getUserAwards>>>> {
  return callAction(() => actions.getUserAwards(...args));
}

export async function assignAward(...args: Parameters<typeof actions.assignAward>): Promise<ActionData<Awaited<ReturnType<typeof actions.assignAward>>>> {
  return callAction(() => actions.assignAward(...args));
}

export async function updateAward(...args: Parameters<typeof actions.updateAward>): Promise<ActionData<Awaited<ReturnType<typeof actions.updateAward>>>> {
  return callAction(() => actions.updateAward(...args));
}

export async function deleteAward(...args: Parameters<typeof actions.deleteAward>): Promise<ActionData<Awaited<ReturnType<typeof actions.deleteAward>>>> {
  return callAction(() => actions.deleteAward(...args));
}

export async function getAllAwards(...args: Parameters<typeof actions.getAllAwards>): Promise<ActionData<Awaited<ReturnType<typeof actions.getAllAwards>>>> {
  return callAction(() => actions.getAllAwards(...args));
}

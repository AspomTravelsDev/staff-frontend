// The server returns serializable results; errors are reconstructed in the caller.
import * as actions from "./content-collections.actions";
import { callAction, type ActionData } from "./action-result";
export type * from "./content-collections.actions";

export async function getContentCollections(...args: Parameters<typeof actions.getContentCollections>): Promise<ActionData<Awaited<ReturnType<typeof actions.getContentCollections>>>> {
  return callAction(() => actions.getContentCollections(...args));
}

export async function getContentStaff(...args: Parameters<typeof actions.getContentStaff>): Promise<ActionData<Awaited<ReturnType<typeof actions.getContentStaff>>>> {
  return callAction(() => actions.getContentStaff(...args));
}

export async function saveContentCollection(...args: Parameters<typeof actions.saveContentCollection>): Promise<ActionData<Awaited<ReturnType<typeof actions.saveContentCollection>>>> {
  return callAction(() => actions.saveContentCollection(...args));
}

export async function publishContentCollection(...args: Parameters<typeof actions.publishContentCollection>): Promise<ActionData<Awaited<ReturnType<typeof actions.publishContentCollection>>>> {
  return callAction(() => actions.publishContentCollection(...args));
}

export async function changeContentDeadline(...args: Parameters<typeof actions.changeContentDeadline>): Promise<ActionData<Awaited<ReturnType<typeof actions.changeContentDeadline>>>> {
  return callAction(() => actions.changeContentDeadline(...args));
}

export async function addContentAssignment(...args: Parameters<typeof actions.addContentAssignment>): Promise<ActionData<Awaited<ReturnType<typeof actions.addContentAssignment>>>> {
  return callAction(() => actions.addContentAssignment(...args));
}

export async function updateContentAssignment(...args: Parameters<typeof actions.updateContentAssignment>): Promise<ActionData<Awaited<ReturnType<typeof actions.updateContentAssignment>>>> {
  return callAction(() => actions.updateContentAssignment(...args));
}

export async function getMyContentAssignments(...args: Parameters<typeof actions.getMyContentAssignments>): Promise<ActionData<Awaited<ReturnType<typeof actions.getMyContentAssignments>>>> {
  return callAction(() => actions.getMyContentAssignments(...args));
}

export async function saveContentIdea(...args: Parameters<typeof actions.saveContentIdea>): Promise<ActionData<Awaited<ReturnType<typeof actions.saveContentIdea>>>> {
  return callAction(() => actions.saveContentIdea(...args));
}

// The server returns serializable results; errors are reconstructed in the caller.
import * as actions from "./anonymous-comments.actions";
import { callAction, type ActionData } from "./action-result";
export type * from "./anonymous-comments.actions";

export async function submitAnonymousComment(...args: Parameters<typeof actions.submitAnonymousComment>): Promise<ActionData<Awaited<ReturnType<typeof actions.submitAnonymousComment>>>> {
  return callAction(() => actions.submitAnonymousComment(...args));
}

export async function getAnonymousComments(...args: Parameters<typeof actions.getAnonymousComments>): Promise<ActionData<Awaited<ReturnType<typeof actions.getAnonymousComments>>>> {
  return callAction(() => actions.getAnonymousComments(...args));
}

export async function markAnonymousCommentsViewed(...args: Parameters<typeof actions.markAnonymousCommentsViewed>): Promise<ActionData<Awaited<ReturnType<typeof actions.markAnonymousCommentsViewed>>>> {
  return callAction(() => actions.markAnonymousCommentsViewed(...args));
}

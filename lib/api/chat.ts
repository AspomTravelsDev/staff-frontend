// The server returns serializable results; errors are reconstructed in the caller.
import * as actions from "./chat.actions";
import { callAction, type ActionData } from "./action-result";
export type * from "./chat.actions";

export async function fetchAuthToken(...args: Parameters<typeof actions.fetchAuthToken>): Promise<ActionData<Awaited<ReturnType<typeof actions.fetchAuthToken>>>> {
  return callAction(() => actions.fetchAuthToken(...args));
}

export async function getConversations(...args: Parameters<typeof actions.getConversations>): Promise<ActionData<Awaited<ReturnType<typeof actions.getConversations>>>> {
  return callAction(() => actions.getConversations(...args));
}

export async function createConversation(...args: Parameters<typeof actions.createConversation>): Promise<ActionData<Awaited<ReturnType<typeof actions.createConversation>>>> {
  return callAction(() => actions.createConversation(...args));
}

export async function getMessages(...args: Parameters<typeof actions.getMessages>): Promise<ActionData<Awaited<ReturnType<typeof actions.getMessages>>>> {
  return callAction(() => actions.getMessages(...args));
}

export async function sendMessage(...args: Parameters<typeof actions.sendMessage>): Promise<ActionData<Awaited<ReturnType<typeof actions.sendMessage>>>> {
  return callAction(() => actions.sendMessage(...args));
}

export async function markAsRead(...args: Parameters<typeof actions.markAsRead>): Promise<ActionData<Awaited<ReturnType<typeof actions.markAsRead>>>> {
  return callAction(() => actions.markAsRead(...args));
}

export async function updateMessage(...args: Parameters<typeof actions.updateMessage>): Promise<ActionData<Awaited<ReturnType<typeof actions.updateMessage>>>> {
  return callAction(() => actions.updateMessage(...args));
}

export async function deleteMessage(...args: Parameters<typeof actions.deleteMessage>): Promise<ActionData<Awaited<ReturnType<typeof actions.deleteMessage>>>> {
  return callAction(() => actions.deleteMessage(...args));
}

export async function deleteMessagesBatch(...args: Parameters<typeof actions.deleteMessagesBatch>): Promise<ActionData<Awaited<ReturnType<typeof actions.deleteMessagesBatch>>>> {
  return callAction(() => actions.deleteMessagesBatch(...args));
}

export async function getAttachmentDownloadUrl(...args: Parameters<typeof actions.getAttachmentDownloadUrl>): Promise<ActionData<Awaited<ReturnType<typeof actions.getAttachmentDownloadUrl>>>> {
  return callAction(() => actions.getAttachmentDownloadUrl(...args));
}

"use server";

import { runAction } from "./run-action";
import { ExpectedActionError, type ActionResult } from "./action-result";

import { api } from "./client";
import type {
    Conversation,
    Message,
    PaginatedMessagesResponse,
    AttachmentDownloadResponse,
} from "@/types/chat";

export async function fetchAuthToken(): Promise<ActionResult<string | null>> {
    return runAction(async (): Promise<string | null> => {
        const { getAuthToken } = await import("@/lib/auth/session");
        return getAuthToken();
    }, "fetchAuthToken");
}

export async function getConversations(): Promise<ActionResult<Conversation[]>> {
    return runAction(async (): Promise<Conversation[]> => {
        const result = await api.get<{ data: Conversation[] }>("/api/conversations");
        if (!result.success) {
            throw new ExpectedActionError(result.error.error || "Failed to fetch conversations", result.error.code);
        }
        return result.data.data;
    }, "getConversations");
}

export async function createConversation(participantId: string): Promise<ActionResult<Conversation>> {
    return runAction(async (): Promise<Conversation> => {
        const result = await api.post<{ message: string; data: Conversation }>("/api/conversations", {
            participant_id: participantId,
        });
        if (!result.success) {
            throw new ExpectedActionError(result.error.error || "Failed to create conversation", result.error.code);
        }
        return result.data.data;
    }, "createConversation");
}

export async function getMessages(
    conversationId: string,
    page = 1
): Promise<ActionResult<PaginatedMessagesResponse>> {
    return runAction(async (): Promise<PaginatedMessagesResponse> => {
        const result = await api.get<PaginatedMessagesResponse>(
            `/api/conversations/${conversationId}/messages?page=${page}`
        );
        if (!result.success) {
            throw new ExpectedActionError(result.error.error || "Failed to fetch messages", result.error.code);
        }
        return result.data;
    }, "getMessages");
}

export async function sendMessage(formData: FormData): Promise<ActionResult<Message>> {
    return runAction(async (): Promise<Message> => {
        const conversationId = formData.get("conversation_id") as string;
        if (!conversationId) {
            throw new ExpectedActionError("Conversation ID is required");
        }
        formData.delete("conversation_id");

        const result = await api.post<{ message: string; data: Message }>(
            `/api/conversations/${conversationId}/messages`,
            formData
        );

        if (!result.success) {
            throw new ExpectedActionError(result.error.error || "Failed to send message", result.error.code);
        }
        return result.data.data;
    }, "sendMessage");
}

export async function markAsRead(conversationId: string, throughMessageId?: string): Promise<ActionResult<void>> {
    return runAction(async (): Promise<void> => {
        const result = await api.post<{ message: string }>(
            `/api/conversations/${conversationId}/read`,
            throughMessageId ? { through_message_id: throughMessageId } : {}
        );
        if (!result.success) {
            throw new ExpectedActionError(result.error.error, result.error.code);
        }
    }, "markAsRead");
}

export async function updateMessage(messageId: string, body: string): Promise<ActionResult<Message>> {
    return runAction(async (): Promise<Message> => {
        const result = await api.patch<{ message: string; data: Message }>(
            `/api/messages/${messageId}`,
            { body }
        );
        if (!result.success) {
            throw new ExpectedActionError(result.error.error || "Failed to update message", result.error.code);
        }
        return result.data.data;
    }, "updateMessage");
}

export async function deleteMessage(messageId: string): Promise<ActionResult<Message>> {
    return runAction(async (): Promise<Message> => {
        const result = await api.delete<{ message: string; data: Message }>(
            `/api/messages/${messageId}`
        );
        if (!result.success) {
            throw new ExpectedActionError(result.error.error || "Failed to delete message", result.error.code);
        }
        return result.data.data;
    }, "deleteMessage");
}

export async function deleteMessagesBatch(messageIds: string[]): Promise<ActionResult<{ count: number; data: Message[] }>> {
    return runAction(async (): Promise<{ count: number; data: Message[] }> => {
        const result = await api.post<{ message: string; data: Message[]; count: number }>(
            "/api/messages/batch-delete",
            { message_ids: messageIds }
        );
        if (!result.success) {
            throw new ExpectedActionError(result.error.error || "Failed to delete messages in batch", result.error.code);
        }
        return { count: result.data.count, data: result.data.data };
    }, "deleteMessagesBatch");
}

export async function getAttachmentDownloadUrl(attachmentId: string): Promise<ActionResult<string>> {
    return runAction(async (): Promise<string> => {
        const result = await api.get<AttachmentDownloadResponse>(
            `/api/conversations/attachments/${attachmentId}/download`
        );
        if (!result.success) {
            throw new ExpectedActionError(result.error.error || "Failed to get attachment download link", result.error.code);
        }

        const downloadUrl = result.data.data.download_url;
        return `/api/proxy-file?url=${encodeURIComponent(downloadUrl)}`;
    }, "getAttachmentDownloadUrl");
}

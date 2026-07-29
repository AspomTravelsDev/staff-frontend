"use server";

import { api } from "./client";
import type {
    Conversation,
    Message,
    PaginatedMessagesResponse,
    AttachmentDownloadResponse,
} from "@/types/chat";

export async function fetchAuthToken(): Promise<string | null> {
    const { getAuthToken } = await import("@/lib/auth/session");
    return getAuthToken();
}

export async function getConversations(): Promise<Conversation[]> {
    const result = await api.get<{ data: Conversation[] }>("/api/conversations");
    if (!result.success) {
        throw new Error(result.error.error || "Failed to fetch conversations");
    }
    return result.data.data;
}

export async function createConversation(participantId: string): Promise<Conversation> {
    const result = await api.post<{ message: string; data: Conversation }>("/api/conversations", {
        participant_id: participantId,
    });
    if (!result.success) {
        throw new Error(result.error.error || "Failed to create conversation");
    }
    return result.data.data;
}

export async function getMessages(
    conversationId: string,
    page = 1
): Promise<PaginatedMessagesResponse> {
    const result = await api.get<PaginatedMessagesResponse>(
        `/api/conversations/${conversationId}/messages?page=${page}`
    );
    if (!result.success) {
        throw new Error(result.error.error || "Failed to fetch messages");
    }
    return result.data;
}

export async function sendMessage(
    conversationId: string,
    formData: FormData
): Promise<Message> {
    const result = await api.post<{ message: string; data: Message }>(
        `/api/conversations/${conversationId}/messages`,
        formData
    );

    if (!result.success) {
        throw new Error(result.error.error || "Failed to send message");
    }
    return result.data.data;
}

export async function markAsRead(conversationId: string): Promise<void> {
    const result = await api.post<{ message: string }>(
        `/api/conversations/${conversationId}/read`
    );
    if (!result.success) {
        console.warn("Failed to mark conversation as read:", result.error.error);
    }
}

export async function updateMessage(messageId: string, body: string): Promise<Message> {
    const result = await api.patch<{ message: string; data: Message }>(
        `/api/messages/${messageId}`,
        { body }
    );
    if (!result.success) {
        throw new Error(result.error.error || "Failed to update message");
    }
    return result.data.data;
}

export async function deleteMessage(messageId: string): Promise<Message> {
    const result = await api.delete<{ message: string; data: Message }>(
        `/api/messages/${messageId}`
    );
    if (!result.success) {
        throw new Error(result.error.error || "Failed to delete message");
    }
    return result.data.data;
}

export async function getAttachmentDownloadUrl(attachmentId: string): Promise<string> {
    const result = await api.get<AttachmentDownloadResponse>(
        `/api/conversations/attachments/${attachmentId}/download`
    );
    if (!result.success) {
        throw new Error(result.error.error || "Failed to get attachment download link");
    }
    return result.data.data.download_url;
}

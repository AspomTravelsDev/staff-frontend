export interface ChatUser {
    id: string;
    name: string;
    email: string;
    avatar_url?: string | null;
}

export interface LastMessage {
    id: string;
    body: string | null;
    created_at: string | null;
    sender_id: string;
    is_deleted?: boolean;
}

export interface Conversation {
    id: string;
    type: 'direct' | 'group';
    name: string | null;
    created_by: string;
    other_user: ChatUser | null;
    last_message: LastMessage | null;
    unread_count: number;
}

export interface MessageAttachment {
    id: string;
    original_name: string;
    mime_type: string;
    size: number;
}

export interface Message {
    reply_to?: {
        id: string;
        body: string | null;
        is_deleted: boolean;
        sender: { id: string; name: string } | null;
        attachment_name?: string | null;
    } | null;
    id: string;
    conversation_id: string;
    body: string | null;
    created_at: string;
    edited_at: string | null;
    deleted_at: string | null;
    is_edited: boolean;
    is_deleted: boolean;
    is_forwarded?: boolean;
    sender: ChatUser | null;
    attachments: MessageAttachment[];
}

export interface PaginatedMessagesResponse {
    data: Message[];
    meta: {
        first_unread_message_id?: string | null;
        unread_count?: number;
        read_through_message_id?: string | null;
        current_page: number;
        has_more_pages: boolean;
      other_last_read_at?: string | null;
    };
}

export interface AttachmentDownloadResponse {
    data: {
        id: string;
        download_url: string;
        expires_at: string;
    };
}

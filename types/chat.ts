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
    id: string;
    conversation_id: string;
    body: string | null;
    created_at: string;
    edited_at: string | null;
    deleted_at: string | null;
    is_edited: boolean;
    is_deleted: boolean;
    sender: ChatUser | null;
    attachments: MessageAttachment[];
}

export interface PaginatedMessagesResponse {
    data: Message[];
    meta: {
        current_page: number;
        has_more_pages: boolean;
    };
}

export interface AttachmentDownloadResponse {
    data: {
        id: string;
        download_url: string;
        expires_at: string;
    };
}

import type { Conversation, LastMessage, Message } from '@/types/chat';

export function conversationPreview(message: LastMessage | null): string {
  if (!message) return 'No messages yet';
  if (message.is_deleted) return 'This message was deleted';
  return message.body || 'Attachment';
}

export function updateConversationPreview(conversations: Conversation[], message: Message): Conversation[] {
  return conversations.map(conversation => {
    if (conversation.id !== message.conversation_id || conversation.last_message?.id !== message.id) return conversation;
    return { ...conversation, last_message: {
      ...conversation.last_message,
      body: message.is_deleted ? null : message.body,
      is_deleted: message.is_deleted,
    } };
  });
}

export function messageReceiptState(message: Message, currentUserId?: string, lastReadAt?: string | null): 'sending' | 'sent' | 'read' | null {
  if (!currentUserId || message.sender?.id !== currentUserId || message.is_deleted) return null;
  if (message.id.startsWith('temp-')) return 'sending';
  const readTime = lastReadAt ? Date.parse(lastReadAt) : NaN;
  return Date.parse(message.created_at) <= readTime ? 'read' : 'sent';
}

import type { Conversation, LastMessage, Message } from '@/types/chat';

export const FORWARDED_REGEX = /^[\u200B\s]*\[forwarded\][\u200B\s]*/i;
export const FORWARDED_PREFIX = '\u200B[forwarded]\u200B';

export function isForwardedMessage(message: { is_forwarded?: boolean; body?: string | null } | null | undefined): boolean {
  if (!message) return false;
  if (message.is_forwarded) return true;
  return typeof message.body === 'string' && FORWARDED_REGEX.test(message.body);
}

export function getDisplayMessageBody(body?: string | null): string {
  if (!body) return '';
  return body.replace(FORWARDED_REGEX, '');
}

export function formatForwardedBody(body?: string | null): string {
  const clean = getDisplayMessageBody(body);
  return `${FORWARDED_PREFIX}${clean}`;
}

export function conversationPreview(message: LastMessage | null): string {
  if (!message) return 'No messages yet';
  if (message.is_deleted) return 'This message was deleted';
  const secretMatch = message.body?.match(/\[secret:[^:]+(?::([^\]]+))?\]/);
  if (secretMatch) {
    return `🔒 Secure Credential: ${secretMatch[1] || 'Drop'}`;
  }
  return getDisplayMessageBody(message.body) || 'Attachment';
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

export function formatWhatsAppTimestamp(isoString: string): string {
  const date = new Date(isoString);
  if (Number.isNaN(date.getTime())) return '';
  const day = String(date.getDate()).padStart(2, '0');
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const year = date.getFullYear();
  const hours = String(date.getHours()).padStart(2, '0');
  const minutes = String(date.getMinutes()).padStart(2, '0');
  return `${day}/${month}/${year}, ${hours}:${minutes}`;
}

export function formatWhatsAppMessages(messages: Message[], currentUserId?: string): string {
  const sorted = [...messages].sort(
    (a, b) => new Date(a.created_at).getTime() - new Date(b.created_at).getTime()
  );

  return sorted
    .map(msg => {
      const senderName = msg.sender?.id === currentUserId ? 'You' : (msg.sender?.name || 'Staff');
      const cleanBody = getDisplayMessageBody(msg.body);
      const attachmentText = msg.attachments?.length
        ? msg.attachments.map(att => `[Attachment: ${att.original_name}]`).join(' ')
        : '';
      const content = cleanBody && attachmentText
        ? `${cleanBody} ${attachmentText}`
        : cleanBody || attachmentText || (msg.is_deleted ? 'This message was deleted' : '');
      const timestamp = formatWhatsAppTimestamp(msg.created_at);
      return `[${timestamp}] ${senderName}: ${content}`;
    })
    .join('\n');
}

export function searchMessagesInChat(messages: Message[], query: string): string[] {
  const trimmed = query.trim().toLowerCase();
  if (!trimmed) return [];

  return messages
    .filter(msg => {
      if (msg.is_deleted) return false;
      const cleanBody = getDisplayMessageBody(msg.body).toLowerCase();
      if (cleanBody.includes(trimmed)) return true;
      if (msg.sender?.name?.toLowerCase().includes(trimmed)) return true;
      if (msg.attachments?.some(att => att.original_name.toLowerCase().includes(trimmed))) return true;
      return false;
    })
    .map(msg => msg.id);
}

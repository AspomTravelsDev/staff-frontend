import type { PaginatedMessagesResponse } from "@/types/chat";

/** Capture the opening boundary once, loading older pages if unread messages span pages. */
export async function loadOpeningChat(load: (page: number) => Promise<PaginatedMessagesResponse>, isCurrent: () => boolean = () => true) {
  const first = await load(1);
  if (!isCurrent()) return null;
  const marker = first.meta.first_unread_message_id && first.meta.unread_count
    ? { messageId: first.meta.first_unread_message_id, count: first.meta.unread_count }
    : null;
  const messages = new Map(first.data.map(message => [message.id, message]));
  let page = 1;
  let hasMore = first.meta.has_more_pages;
  while (marker && !messages.has(marker.messageId) && hasMore) {
    const older = await load(++page);
    if (!isCurrent()) return null;
    older.data.forEach(message => messages.set(message.id, message));
    hasMore = older.meta.has_more_pages;
  }
  return {
    messages: [...messages.values()].sort((a, b) => Date.parse(a.created_at) - Date.parse(b.created_at) || a.id.localeCompare(b.id)),
    marker: marker && messages.has(marker.messageId) ? marker : null,
    page,
    hasMore,
    otherLastReadAt: first.meta.other_last_read_at ?? null,
    readThroughId: first.meta.read_through_message_id ?? first.data[0]?.id,
  };
}

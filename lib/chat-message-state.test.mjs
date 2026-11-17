import test from 'node:test';
import assert from 'node:assert/strict';
import React from 'react';
import { renderToStaticMarkup } from 'react-dom/server';
import * as icons from 'lucide-react';
import { actionLoader } from './api/action-test-utils.mjs';

const { load } = actionLoader(() => {}, { 'react/jsx-runtime': await import('react/jsx-runtime'), 'lucide-react': icons });
const {
  conversationPreview,
  updateConversationPreview,
  messageReceiptState,
  isForwardedMessage,
  getDisplayMessageBody,
  formatForwardedBody,
  formatWhatsAppMessages,
  searchMessagesInChat,
} = load('lib/chat-message-state.ts');
const { MessageReceipt } = load('components/chat/message-receipt.tsx');
const sent = { id: 'message-1', conversation_id: 'chat-1', body: 'Latest text', sender: { id: 'me' }, created_at: '2026-10-24T10:00:00Z', is_deleted: false };

test('deleting the latest message immediately removes its text from the sidebar without mutating source records', () => {
  const original = [{ id: 'chat-1', last_message: { id: sent.id, body: sent.body, sender_id: 'me' } }];
  const updated = updateConversationPreview(original, { ...sent, is_deleted: true });
  assert.equal(updated[0].last_message.body, null);
  assert.equal(conversationPreview(updated[0].last_message), 'This message was deleted');
  assert.equal(original[0].last_message.body, 'Latest text');
});

test('edits update the latest preview but changes to older messages cannot replace a newer preview', () => {
  const chats = [{ id: 'chat-1', last_message: { id: sent.id, body: 'Latest text', sender_id: 'me' } }];
  assert.equal(updateConversationPreview(chats, { ...sent, body: 'Edited text' })[0].last_message.body, 'Edited text');
  assert.equal(updateConversationPreview(chats, { ...sent, id: 'older-message', is_deleted: true })[0], chats[0]);
  assert.equal(conversationPreview(null), 'No messages yet');
  assert.equal(conversationPreview({ body: null }), 'Attachment');
});

test('each own message becomes read only when covered by the recipient read timestamp', () => {
  assert.equal(messageReceiptState(sent, 'me', null), 'sent');
  assert.equal(messageReceiptState(sent, 'me', 'invalid'), 'sent');
  assert.equal(messageReceiptState(sent, 'me', '2026-10-24T09:59:59Z'), 'sent');
  assert.equal(messageReceiptState(sent, 'me', sent.created_at), 'read');
  assert.equal(messageReceiptState({ ...sent, id: 'temp-123' }, 'me', '2026-10-24T11:00:00Z'), 'sending');
  assert.equal(messageReceiptState({ ...sent, is_deleted: true }, 'me', sent.created_at), null);
  assert.equal(messageReceiptState(sent, 'someone-else', sent.created_at), null);
});

test('receipts render grey sent double checks and blue read double checks with accessible labels', () => {
  const grey = renderToStaticMarkup(React.createElement(MessageReceipt, { message: sent, currentUserId: 'me' }));
  const blue = renderToStaticMarkup(React.createElement(MessageReceipt, { message: sent, currentUserId: 'me', lastReadAt: sent.created_at }));
  assert.match(grey, /aria-label="Sent"/);
  assert.match(grey, /text-slate-500/);
  assert.match(grey, /lucide-check-check/);
  assert.match(blue, /aria-label="Read"/);
  assert.match(blue, /text-sky-600/);
  assert.match(blue, /lucide-check-check/);
  assert.doesNotMatch(blue, />Seen</);
});

test('forwarded message detection, body stripping, and formatting', () => {
  const normal = { id: '1', body: 'Normal text', is_forwarded: false };
  assert.equal(isForwardedMessage(normal), false);
  assert.equal(getDisplayMessageBody(normal.body), 'Normal text');

  const tagged = { id: '2', body: 'Tagged text', is_forwarded: true };
  assert.equal(isForwardedMessage(tagged), true);
  assert.equal(getDisplayMessageBody(tagged.body), 'Tagged text');

  const prefixedBody = formatForwardedBody('Original message');
  assert.match(prefixedBody, /\[forwarded\]/);
  assert.equal(isForwardedMessage({ body: prefixedBody }), true);
  assert.equal(getDisplayMessageBody(prefixedBody), 'Original message');
});

test('WhatsApp style copy formats sender, date, time and attachments correctly', () => {
  const m1 = {
    id: 'm1',
    conversation_id: 'chat-1',
    body: 'Hello team',
    sender: { id: 'user-1', name: 'Alice Smith' },
    created_at: '2026-11-17T10:15:00Z',
    is_deleted: false,
    attachments: [],
  };
  const m2 = {
    id: 'm2',
    conversation_id: 'chat-1',
    body: 'Please see attached contract',
    sender: { id: 'me', name: 'Me' },
    created_at: '2026-11-17T10:16:00Z',
    is_deleted: false,
    attachments: [{ id: 'a1', original_name: 'contract.pdf', size: 1024, mime_type: 'application/pdf' }],
  };
  const m3 = {
    id: 'm3',
    conversation_id: 'chat-1',
    body: null,
    sender: { id: 'user-2', name: 'Bob Jones' },
    created_at: '2026-11-17T10:17:00Z',
    is_deleted: false,
    attachments: [{ id: 'a2', original_name: 'receipt.png', size: 2048, mime_type: 'image/png' }],
  };

  const output = formatWhatsAppMessages([m2, m1, m3], 'me');
  const lines = output.split('\n');
  assert.equal(lines.length, 3);
  // Chronological order: m1 first, then m2, then m3
  assert.match(lines[0], /Alice Smith: Hello team/);
  assert.match(lines[0], /\[\d{2}\/\d{2}\/\d{4}, \d{2}:\d{2}\]/);
  assert.match(lines[1], /You: Please see attached contract \[Attachment: contract.pdf\]/);
  assert.match(lines[2], /Bob Jones: \[Attachment: receipt.png\]/);
});

test('per-chat search filters by message body, sender name, and attachment filename', () => {
  const list = [
    { id: '1', body: 'The budget report is ready', sender: { name: 'Alice' }, is_deleted: false, attachments: [] },
    { id: '2', body: 'Thanks Alice', sender: { name: 'Bob' }, is_deleted: false, attachments: [] },
    { id: '3', body: 'Deleted budget notes', sender: { name: 'Alice' }, is_deleted: true, attachments: [] },
    { id: '4', body: null, sender: { name: 'Charlie' }, is_deleted: false, attachments: [{ original_name: 'budget_2026.xlsx' }] },
  ];

  assert.deepEqual(searchMessagesInChat(list, 'budget'), ['1', '4']);
  assert.deepEqual(searchMessagesInChat(list, 'alice'), ['1', '2']);
  assert.deepEqual(searchMessagesInChat(list, 'xlsx'), ['4']);
  assert.deepEqual(searchMessagesInChat(list, ''), []);
  assert.deepEqual(searchMessagesInChat(list, 'nonexistent'), []);
});

import test from 'node:test';
import assert from 'node:assert/strict';
import React from 'react';
import { renderToStaticMarkup } from 'react-dom/server';
import * as icons from 'lucide-react';
import { actionLoader } from './api/action-test-utils.mjs';

const { load } = actionLoader(() => {}, { 'react/jsx-runtime': await import('react/jsx-runtime'), 'lucide-react': icons });
const { conversationPreview, updateConversationPreview, messageReceiptState } = load('lib/chat-message-state.ts');
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

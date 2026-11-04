import test from 'node:test';
import assert from 'node:assert/strict';
import { actionLoader } from './api/action-test-utils.mjs';

const { load } = actionLoader(() => {});
const { loadOpeningChat } = load('lib/chat-opening.ts');
const message = (id, minute) => ({ id, created_at: `2026-10-27T10:${String(minute).padStart(2, '0')}:00Z` });

test('opening captures the unread boundary before read receipts can clear it', async () => {
  const opening = await loadOpeningChat(async () => ({ data: [message('latest', 4), message('first', 1)], meta: { has_more_pages: true, first_unread_message_id: 'first', unread_count: 4, read_through_message_id: 'latest' } }));
  assert.equal(opening.marker.messageId, 'first');
  assert.equal(opening.marker.count, 4);
  assert.equal(opening.readThroughId, 'latest');
  assert.deepEqual(Array.from(opening.messages, item => item.id), ['first', 'latest']);
});

test('an unread backlog loads older pages to the boundary and deduplicates messages', async () => {
  const pages = [];
  const opening = await loadOpeningChat(async page => {
    pages.push(page);
    return page === 1
      ? { data: [message('latest', 4), message('middle', 3)], meta: { has_more_pages: true, first_unread_message_id: 'first', unread_count: 25 } }
      : { data: [message('middle', 3), message('first', 1)], meta: { has_more_pages: true, unread_count: 0 } };
  });
  assert.deepEqual(pages, [1, 2]);
  assert.equal(opening.page, 2);
  assert.equal(opening.marker.count, 25);
  assert.equal(opening.messages.length, 3);
});

test('reopening a read chat has no marker and does not fetch unnecessary pages', async () => {
  let calls = 0;
  const opening = await loadOpeningChat(async () => { calls++; return { data: [message('read', 1)], meta: { has_more_pages: true, unread_count: 0, first_unread_message_id: null } }; });
  assert.equal(opening.marker, null);
  assert.equal(calls, 1);
});

test('switching conversations discards an outstanding opening request', async () => {
  const opening = await loadOpeningChat(async () => ({ data: [message('old-chat', 1)], meta: { has_more_pages: false } }), () => false);
  assert.equal(opening, null);
});

test('failure while loading unread history rejects instead of returning a read boundary', async () => {
  await assert.rejects(loadOpeningChat(async page => {
    if (page === 2) throw new Error('Offline');
    return { data: [message('newest', 4)], meta: { has_more_pages: true, first_unread_message_id: 'older', unread_count: 25 } };
  }), /Offline/);
});

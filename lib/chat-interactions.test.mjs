import test from 'node:test';
import assert from 'node:assert/strict';
import * as React from 'react';
import * as icons from 'lucide-react';
import { actionLoader } from './api/action-test-utils.mjs';

const own = { id: 'own', conversation_id: 'chat', sender: { id: 'me', name: 'Me' }, body: 'My message', created_at: '2026-10-24T10:00:00Z', is_deleted: false, attachments: [] };
const incoming = { ...own, id: 'incoming', sender: { id: 'other', name: 'Other' }, body: 'Received text' };
function harness(initialMessages = [own, incoming]) {
  const state = [initialMessages];
  let index = 0;
  const calls = { deleted: [], sent: [], replyIds: [], changed: [] };
  const stubs = {};
  const component = name => stubs[name] ||= function Stub() { return null; };
  const ui = names => Object.fromEntries(names.map(name => [name, component(name)]));
  const { load } = actionLoader(() => {}, {
    react: { ...React, useCallback: callback => callback, useEffect() {}, useRef: () => ({ current: null }), useState(initial) {
      const slot = index++;
      if (!(slot in state)) state[slot] = initial;
      return [state[slot], value => { state[slot] = typeof value === 'function' ? value(state[slot]) : value; }];
    } },
    'react/jsx-runtime': awaitJsx,
    'lucide-react': icons,
    '@/components/ui/avatar': ui(['Avatar', 'AvatarFallback', 'AvatarImage']),
    '@/components/ui/button': ui(['Button']),
    '@/components/ui/textarea': ui(['Textarea']),
    '@/components/ui/dropdown-menu': ui(['DropdownMenu', 'DropdownMenuContent', 'DropdownMenuItem', 'DropdownMenuTrigger']),
    '@/components/ui/alert-dialog': ui(['AlertDialog', 'AlertDialogAction', 'AlertDialogCancel', 'AlertDialogContent', 'AlertDialogDescription', 'AlertDialogFooter', 'AlertDialogHeader', 'AlertDialogTitle']),
    './chat-image-attachment': ui(['ChatImageAttachment']),
    './emoji-picker': ui(['EmojiPicker']), './message-receipt': ui(['MessageReceipt']),
    '@/lib/utils/image-url': { toProxiedImageUrl: () => undefined },
    '@/lib/api/chat': {
      async deleteMessage(id) { calls.deleted.push(id); return { ...own, body: null, is_deleted: true }; },
      async sendMessage(body) { calls.sent.push(body.get('body')); calls.replyIds.push(body.get('reply_to_message_id')); return { ...own, id: 'new', body: body.get('body') }; },
    },
    '@/lib/echo': { getEchoInstance: () => null },
    sonner: { toast: { success() {}, error() {} } },
    '@tanstack/react-query': { useQueryClient: () => ({ invalidateQueries: async () => {} }) },
  });
  const { ChatWindow } = load('components/chat/chat-window.tsx');
  const render = () => { index = 0; return ChatWindow({ conversation: { id: 'chat', other_user: { id: 'other', name: 'Other' } }, currentUserId: 'me', onMessageChanged: message => calls.changed.push(message) }); };
  const all = (tree, name) => {
    const found = [];
    function walk(node) { if (!node || typeof node !== 'object') return; if (node.type === stubs[name]) found.push(node); React.Children.forEach(node.props?.children, walk); }
    walk(tree); return found;
  };
  const text = node => typeof node === 'string' ? node : Array.isArray(node) ? node.map(text).join('') : node?.props ? text(node.props.children) : '';
  return { calls, render, all, text };
}
const awaitJsx = await import('react/jsx-runtime');

test('delete requires confirmation, cancel preserves the message, and only confirmation calls the API', async () => {
  const h = harness();
  const selectDelete = () => h.all(h.render(), 'DropdownMenuItem').find(item => h.text(item).includes('Delete')).props.onSelect();
  selectDelete();
  assert.equal(h.calls.deleted.length, 0);
  let dialog = h.all(h.render(), 'AlertDialog')[0];
  assert.equal(dialog.props.open, true);
  dialog.props.onOpenChange(false);
  assert.equal(h.all(h.render(), 'AlertDialog')[0].props.open, false);
  assert.equal(h.calls.deleted.length, 0);
  selectDelete();
  h.all(h.render(), 'AlertDialogAction')[0].props.onClick({ preventDefault() {} });
  await new Promise(setImmediate);
  assert.deepEqual(h.calls.deleted, ['own']);
  assert.equal(h.calls.changed[0].is_deleted, true);
  assert.equal(h.all(h.render(), 'AlertDialog')[0].props.open, false);
});

test('Shift+Enter and composition do not send; Enter sends the multiline text', async () => {
  const h = harness();
  h.all(h.render(), 'Textarea')[0].props.onChange({ target: { value: 'First line\nSecond line' } });
  const input = h.all(h.render(), 'Textarea')[0];
  assert.equal(input.props.rows, 1);
  let prevented = false;
  input.props.onKeyDown({ key: 'Enter', shiftKey: true, nativeEvent: { isComposing: false }, preventDefault() { prevented = true; } });
  assert.equal(prevented, false);
  assert.equal(h.calls.sent.length, 0);
  input.props.onKeyDown({ key: 'Enter', shiftKey: false, nativeEvent: { isComposing: true }, preventDefault() {} });
  assert.equal(h.calls.sent.length, 0);
  input.props.onKeyDown({ key: 'Enter', shiftKey: false, nativeEvent: { isComposing: false }, preventDefault() { prevented = true; } });
  await new Promise(setImmediate);
  assert.equal(prevented, true);
  assert.deepEqual(h.calls.sent, ['First line\nSecond line']);
});

test('copy is available for received messages as well as sent messages', async t => {
  const descriptor = Object.getOwnPropertyDescriptor(globalThis, 'navigator');
  const copied = [];
  Object.defineProperty(globalThis, 'navigator', { configurable: true, value: { clipboard: { async writeText(value) { copied.push(value); } } } });
  t.after(() => { if (descriptor) Object.defineProperty(globalThis, 'navigator', descriptor); else delete globalThis.navigator; });
  const h = harness();
  const copies = h.all(h.render(), 'DropdownMenuItem').filter(item => h.text(item).includes('Copy'));
  assert.equal(copies.length, 2);
  copies[1].props.onSelect();
  await new Promise(setImmediate);
  assert.deepEqual(copied, ['Received text']);
});


test('reply sends the selected parent and cancelling removes the quote', async () => {
  const h = harness();
  h.all(h.render(), 'DropdownMenuItem').filter(item => h.text(item).trim() === 'Reply')[1].props.onSelect();
  assert.ok(h.text(h.render()).includes('Replying to Other'));
  h.all(h.render(), 'Textarea')[0].props.onChange({ target: { value: 'My reply' } });
  await h.all(h.render(), 'Button').find(button => button.props['aria-label'] === 'Send message').props.onClick();
  assert.deepEqual(h.calls.replyIds, ['incoming']);
  assert.ok(!h.text(h.render()).includes('Replying to Other'));
  h.all(h.render(), 'DropdownMenuItem').filter(item => h.text(item).trim() === 'Reply')[1].props.onSelect();
  h.all(h.render(), 'Button').find(button => button.props['aria-label'] === 'Cancel reply').props.onClick();
  assert.ok(!h.text(h.render()).includes('Replying to Other'));
});

test('attachment-only messages offer reply and show the attachment in the composer', () => {
  const h = harness([{ ...incoming, body: null, attachments: [{ id: 'file', original_name: 'report.pdf', mime_type: 'application/pdf', size: 100 }] }]);
  h.all(h.render(), 'DropdownMenuItem').find(item => h.text(item).trim() === 'Reply').props.onSelect();
  assert.ok(h.text(h.render()).includes('Replying to Other'));
  assert.ok(h.text(h.render()).includes('report.pdf'));
});

test('a deleted original hides the old text in an existing reply quote', () => {
  const h = harness([{ ...incoming, body: null, is_deleted: true }, { ...own, reply_to: { id: incoming.id, body: 'SECRET OLD TEXT', is_deleted: false, sender: incoming.sender } }]);
  assert.ok(!h.text(h.render()).includes('SECRET OLD TEXT'));
  assert.ok(h.text(h.render()).includes('This message was deleted'));
});


test('image attachments render a preview while ordinary files keep their download row', () => {
  const image = { id: 'image', original_name: 'photo.png', mime_type: 'image/png', size: 100 };
  const document = { id: 'document', original_name: 'report.pdf', mime_type: 'application/pdf', size: 100 };
  const h = harness([{ ...incoming, body: null, attachments: [image, document] }]);
  const previews = h.all(h.render(), 'ChatImageAttachment');
  assert.equal(previews.length, 1);
  assert.equal(previews[0].props.attachment.id, 'image');
  assert.equal(h.all(h.render(), 'Button').filter(button => button.props.title === 'Download attachment').length, 2);
});

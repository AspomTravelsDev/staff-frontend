import test from 'node:test';
import assert from 'node:assert/strict';
import React from 'react';
import { renderToStaticMarkup } from 'react-dom/server';
import * as icons from 'lucide-react';
import { actionLoader } from './api/action-test-utils.mjs';

const jsx = await import('react/jsx-runtime');
function harness(open) {
  const state = [open, open];
  let slot = 0;
  let searchInput;
  const selected = [];
  const { load } = actionLoader(() => {}, {
    react: { ...React, useRef: () => ({ current: null }), useState(initial) {
      const index = slot++;
      if (!(index in state)) state[index] = initial;
      return [state[index], value => { state[index] = value; }];
    } },
    'react/jsx-runtime': jsx,
    'react-dom': { flushSync: callback => callback() },
    'lucide-react': icons,
    '@/components/ui/button': { Button: ({ children, variant, size, ...props }) => React.createElement('button', props, children) },
    '@/components/ui/input': { Input: props => { searchInput = props; return React.createElement('input', props); } },
    '@/components/ui/popover': {
      Popover: ({ children }) => React.createElement('div', null, children),
      PopoverTrigger: ({ children }) => children,
      PopoverContent: ({ children }) => React.createElement('div', null, children),
    },
  });
  const { EmojiPicker, EmojiGrid } = load('components/chat/emoji-picker.tsx');
  const { chatEmojis } = load('lib/chat-emojis.ts');
  return {
    render() { slot = 0; return renderToStaticMarkup(React.createElement(EmojiPicker, { onSelect: emoji => selected.push(emoji) })); },
    prepare() { state[1] = true; },
    search(value) { searchInput.onChange({ target: { value } }); },
    grid() { slot = 2; return EmojiGrid({ items: chatEmojis, onSelect: emoji => selected.push(emoji) }); },
    chatEmojis, selected,
  };
}

test('unprepared closed picker builds only its trigger', () => {
  const html = harness(false).render();
  assert.equal((html.match(/<button/g) || []).length, 1);
  assert.doesNotMatch(html, /role="gridcell"/);
});

test('open picker bounds mounted emoji buttons rather than rendering the full catalogue', () => {
  const h = harness(true);
  const html = h.render();
  const count = (html.match(/role="gridcell"/g) || []).length;
  assert.ok(count > 0 && count <= 60);
  assert.ok(count < h.chatEmojis.length);
});

test('search still reaches emoji beyond the first visible rows', () => {
  const h = harness(true);
  h.render();
  h.search('Pointing left');
  const html = h.render();
  assert.match(html, /Pointing left/);
  assert.doesNotMatch(html, /Grinning happy/);
});

test('scrolling reaches the last emoji and selection returns its original character', () => {
  const h = harness(true);
  let grid = h.grid();
  grid.props.onScroll({ currentTarget: { scrollTop: Math.ceil(h.chatEmojis.length / 6) * 44 - 240 } });
  grid = h.grid();
  const rows = grid.props.children.props.children;
  const buttons = rows.flatMap(row => row.props.children);
  const last = h.chatEmojis.at(-1);
  const match = buttons.find(button => button.props.title === last.label);
  assert.ok(match);
  assert.equal(buttons.filter(button => button.props.tabIndex === 0).length, 1);
  match.props.onClick();
  assert.deepEqual(h.selected, [last.emoji]);
});


test('a prepared picker retains its palette while closed without displaying it', () => {
  const h = harness(false);
  h.prepare();
  const html = h.render();
  assert.match(html, /data-state="closed"/);
  assert.match(html, /display:none/);
  assert.match(html, /role="gridcell"/);
});

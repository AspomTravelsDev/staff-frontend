'use client';

import { memo, useCallback, useEffect, useId, useMemo, useRef, useState } from 'react';
import { flushSync } from 'react-dom';
import { Smile } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { chatEmojis, emojiCategories, type EmojiCategory } from '@/lib/chat-emojis';

const indexedEmojis = chatEmojis.map(item => ({ ...item, searchText: item.label.toLowerCase() }));
const columns = 6;
const rowHeight = 44;
const viewportHeight = 240;
const overscan = 2;
type Emoji = (typeof indexedEmojis)[number];

export function EmojiGrid({ items, onSelect }: { items: Emoji[]; onSelect: (emoji: string) => void }) {
  const [scrollTop, setScrollTop] = useState(0);
  const [activeIndex, setActiveIndex] = useState(0);
  const container = useRef<HTMLDivElement>(null);
  const rowCount = Math.ceil(items.length / columns);
  const start = Math.max(0, Math.floor(scrollTop / rowHeight) - overscan);
  const end = Math.min(rowCount, Math.floor(scrollTop / rowHeight) + Math.ceil(viewportHeight / rowHeight) + overscan);
  const rows = Array.from({ length: end - start }, (_, offset) => start + offset);
  const tabStop = activeIndex < start * columns || activeIndex >= end * columns ? start * columns : activeIndex;

  function moveFocus(event: React.KeyboardEvent<HTMLButtonElement>, index: number) {
    const steps: Record<string, number> = { ArrowRight: 1, ArrowLeft: -1, ArrowDown: columns, ArrowUp: -columns };
    let next = index;
    if (event.key in steps) next += steps[event.key];
    else if (event.key === 'Home') next = 0;
    else if (event.key === 'End') next = items.length - 1;
    else return;
    event.preventDefault();
    next = Math.max(0, Math.min(items.length - 1, next));
    setActiveIndex(next);
    const top = Math.floor(next / columns) * rowHeight;
    if (container.current) {
      if (top < container.current.scrollTop) container.current.scrollTop = top;
      else if (top + rowHeight > container.current.scrollTop + container.current.clientHeight) container.current.scrollTop = top + rowHeight - container.current.clientHeight;
      setScrollTop(container.current.scrollTop);
    }
    requestAnimationFrame(() => container.current?.querySelector<HTMLButtonElement>(`[data-emoji-index="${next}"]`)?.focus());
  }

  return <div ref={container} role="grid" aria-label="Emoji" aria-rowcount={rowCount} aria-colcount={columns} className="min-h-0 overflow-y-auto overscroll-contain" style={{ height: Math.min(viewportHeight, rowCount * rowHeight) }} onScroll={event => setScrollTop(event.currentTarget.scrollTop)}>
    <div className="relative w-full" style={{ height: rowCount * rowHeight }}>
      {rows.map(row => <div key={row} role="row" aria-rowindex={row + 1} className="absolute inset-x-0 grid grid-cols-6 gap-1" style={{ top: row * rowHeight, height: rowHeight }}>
        {items.slice(row * columns, (row + 1) * columns).map(({ emoji, label }, column) => {
          const index = row * columns + column;
          return <button key={emoji} type="button" role="gridcell" aria-colindex={column + 1} tabIndex={index === tabStop ? 0 : -1} data-emoji-index={index} className="flex h-10 min-w-0 items-center justify-center rounded-md p-0 text-xl hover:bg-muted focus-visible:bg-muted focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring" aria-label={label} title={label} onFocus={() => setActiveIndex(index)} onKeyDown={event => moveFocus(event, index)} onClick={() => onSelect(emoji)}>{emoji}</button>;
        })}
      </div>)}
    </div>
  </div>;
}

const EmojiPanel = memo(function EmojiPanel({ onSelect }: { onSelect: (emoji: string) => void }) {
  const [search, setSearch] = useState('');
  const [category, setCategory] = useState<EmojiCategory | 'all'>('all');
  const query = search.trim().toLowerCase();
  const filtered = useMemo(() => indexedEmojis.filter(item => (category === 'all' || item.category === category) && item.searchText.includes(query)), [category, query]);
  return <>
    <Input value={search} onChange={event => setSearch(event.target.value)} aria-label="Search emoji" placeholder="Search emoji…" />
    <div className="flex shrink-0 gap-1 overflow-x-auto pb-1 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden" role="group" aria-label="Emoji categories">{(['all', ...Object.keys(emojiCategories)] as (EmojiCategory | 'all')[]).map(value => <Button key={value} type="button" variant={category === value ? 'secondary' : 'ghost'} size="sm" className="shrink-0" aria-pressed={category === value} onClick={() => setCategory(value)}>{value === 'all' ? 'All' : emojiCategories[value]}</Button>)}</div>
    {filtered.length ? <EmojiGrid key={`${category}:${query}`} items={filtered} onSelect={onSelect} /> : <p className="py-4 text-sm text-muted-foreground">No emoji match this search.</p>}
  </>;
});

export const EmojiPicker = memo(function EmojiPicker({ disabled, onSelect }: { disabled?: boolean; onSelect: (emoji: string) => void }) {
  const [open, setOpen] = useState(false);
  const [prepared, setPrepared] = useState(false);
  const trigger = useRef<HTMLButtonElement>(null);
  const panel = useRef<HTMLDivElement>(null);
  const nativePopover = useRef(false);
  const id = useId();
  const prepare = useCallback(() => setPrepared(true), []);

  const close = useCallback(() => {
    if (nativePopover.current && panel.current?.matches(':popover-open')) panel.current.hidePopover();
    setOpen(false);
  }, []);

  useEffect(() => {
    nativePopover.current = !!panel.current && 'showPopover' in panel.current;
    // Build once during idle time, rather than on the click that opens the palette.
    if ('requestIdleCallback' in window) {
      const idle = window.requestIdleCallback(prepare, { timeout: 600 });
      return () => window.cancelIdleCallback(idle);
    }
    const timer = setTimeout(prepare, 150);
    return () => clearTimeout(timer);
  }, [prepare]);

  useEffect(() => {
    if (!disabled) return;
    const timer = window.setTimeout(close, 0);
    return () => window.clearTimeout(timer);
  }, [disabled, close]);
  useEffect(() => {
    if (!open) return;
    const outside = (event: PointerEvent) => {
      if (!panel.current?.contains(event.target as Node) && !trigger.current?.contains(event.target as Node)) close();
    };
    const escape = (event: KeyboardEvent) => {
      if (event.key === 'Escape') { close(); trigger.current?.focus({ preventScroll: true }); }
    };
    document.addEventListener('pointerdown', outside);
    document.addEventListener('keydown', escape);
    window.addEventListener('resize', close);
    return () => { document.removeEventListener('pointerdown', outside); document.removeEventListener('keydown', escape); window.removeEventListener('resize', close); };
  }, [open, close]);

  const choose = useCallback((emoji: string) => { close(); onSelect(emoji); }, [close, onSelect]);

  function toggle(keyboard: boolean) {
    if (disabled) return;
    if (open) { close(); return; }
    if (!prepared) flushSync(prepare);
    const content = panel.current;
    const anchor = trigger.current?.getBoundingClientRect();
    if (!content || !anchor) return;
    const width = Math.min(320, window.innerWidth - 16);
    content.style.width = width + 'px';
    content.style.left = Math.max(8, Math.min(anchor.left, window.innerWidth - width - 8)) + 'px';
    content.style.bottom = window.innerHeight - anchor.top + 8 + 'px';
    content.style.maxHeight = Math.max(120, anchor.top - 16) + 'px';
    setOpen(true);
    if (nativePopover.current) content.showPopover();
    // Pointer users keep composer focus and avoid opening a mobile keyboard.
    if (keyboard) requestAnimationFrame(() => content.querySelector<HTMLInputElement>('input')?.focus({ preventScroll: true }));
  }

  return <>
    <Button ref={trigger} type="button" variant="ghost" size="icon" disabled={disabled} className="size-9 shrink-0 text-muted-foreground" aria-label="Choose emoji" aria-haspopup="dialog" aria-controls={id} aria-expanded={open} title="Emoji" onPointerEnter={prepare} onFocus={prepare} onClick={event => toggle(event.detail === 0)}><Smile className="size-4" /></Button>
    <div ref={panel} id={id} popover="auto" role="dialog" aria-modal="false" aria-label="Emoji picker" data-state={open ? 'open' : 'closed'} hidden={!open} onToggle={event => setOpen(event.newState === 'open')} className="fixed z-50 m-0 flex data-[state=closed]:hidden flex-col gap-3 overflow-hidden rounded-lg border-0 bg-popover p-2.5 text-popover-foreground shadow-md ring-1 ring-foreground/10" style={{ inset: 'auto', display: open ? 'flex' : 'none' }}>
      {prepared && <EmojiPanel onSelect={choose} />}
    </div>
  </>;
});

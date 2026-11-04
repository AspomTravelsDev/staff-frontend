import { CheckCheck, Clock3 } from 'lucide-react';
import type { Message } from '@/types/chat';
import { messageReceiptState } from '@/lib/chat-message-state';

export function MessageReceipt({ message, currentUserId, lastReadAt }: { message: Message; currentUserId?: string; lastReadAt?: string | null }) {
  const state = messageReceiptState(message, currentUserId, lastReadAt);
  if (!state) return null;
  const label = state === 'sending' ? 'Sending' : state === 'read' ? 'Read' : 'Sent';
  return <span role="img" aria-label={label} title={label} className={state === 'read' ? 'inline-flex text-sky-600 dark:text-sky-400' : 'inline-flex text-slate-500 dark:text-slate-400'}>
    {state === 'sending' ? <Clock3 aria-hidden="true" className="size-3.5" /> : <CheckCheck aria-hidden="true" className="size-3.5" />}
  </span>;
}

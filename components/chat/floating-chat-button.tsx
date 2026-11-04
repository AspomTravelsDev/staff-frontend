"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { MessageCircle } from "lucide-react";
import { useRoleNotifications } from "@/lib/api/hooks/use-notifications";
import { useQueryClient } from "@tanstack/react-query";
import { useEffect, useRef, useState, useSyncExternalStore, type PointerEvent as ReactPointerEvent } from "react";
import { getEchoInstance } from "@/lib/echo";
import { useUser } from "@/providers/user-provider";
import { CHAT_DOCK_STORAGE_KEY, clampChatPoint, parseChatDock, snapChatDock, type ChatDock } from "@/lib/chat-dock";

function subscribeDock(listener: () => void) {
  window.addEventListener("storage", listener);
  return () => window.removeEventListener("storage", listener);
}

function readSavedDock() {
  try { return window.localStorage.getItem(CHAT_DOCK_STORAGE_KEY); } catch { return null; }
}

const serverDock = () => null;

export function FloatingChatButton() {
  const pathname = usePathname();
  const { user } = useUser();
  const queryClient = useQueryClient();
  const { data: notifications } = useRoleNotifications();
  const savedDock = useSyncExternalStore(subscribeDock, readSavedDock, serverDock);
  const [localDock, setDock] = useState<ChatDock | null>(null);
  const dock = localDock ?? parseChatDock(savedDock);
  const [dragPoint, setDragPoint] = useState<{ x: number; y: number } | null>(null);
  const boundsRef = useRef<HTMLDivElement>(null);
  const gesture = useRef<{ id: number; startX: number; startY: number; offsetX: number; offsetY: number; moved: boolean } | null>(null);
  const suppressClick = useRef(false);

  function saveDock(next: ChatDock) {
    setDock(next);
    try { window.localStorage.setItem(CHAT_DOCK_STORAGE_KEY, JSON.stringify(next)); } catch { /* Keep moving when storage is unavailable. */ }
  }

  function move(event: ReactPointerEvent<HTMLAnchorElement>) {
    const start = gesture.current;
    const bounds = boundsRef.current?.getBoundingClientRect();
    if (!start || start.id !== event.pointerId || !bounds) return;
    if (!start.moved && Math.hypot(event.clientX - start.startX, event.clientY - start.startY) < 8) return;
    start.moved = true;
    suppressClick.current = true;
    event.preventDefault();
    setDragPoint(clampChatPoint(event.clientX - bounds.left - start.offsetX, event.clientY - bounds.top - start.offsetY, bounds.width, bounds.height));
  }

  function finish(event: ReactPointerEvent<HTMLAnchorElement>, cancelled = false) {
    const start = gesture.current;
    if (!start || start.id !== event.pointerId) return;
    gesture.current = null;
    const bounds = boundsRef.current?.getBoundingClientRect();
    if (start.moved && !cancelled && bounds) {
      const point = clampChatPoint(event.clientX - bounds.left - start.offsetX, event.clientY - bounds.top - start.offsetY, bounds.width, bounds.height);
      saveDock(snapChatDock(point.x, point.y, bounds.width, bounds.height));
    }
    setDragPoint(null);
    if (event.currentTarget.hasPointerCapture(event.pointerId)) event.currentTarget.releasePointerCapture(event.pointerId);
  }

  useEffect(() => {
    if (!user?.id) return;
    const echo = getEchoInstance();
    if (!echo) return;

    const channelName = `App.Models.User.${user.id}`;
    const channel = echo.private(channelName);
    const refreshUnread = () => {
      void queryClient.invalidateQueries({ queryKey: ["notifications"] });
    };

    channel.listen(".MessageSent", refreshUnread);
    channel.listen(".ConversationRead", refreshUnread);

    return () => {
      echo.leave(channelName);
    };
  }, [user?.id, queryClient]);

  if (pathname?.startsWith("/chat") || pathname?.startsWith("/attendance/scan")) return null;

  const chatNotifications = notifications?.chatMessages;
  const unreadChats = typeof chatNotifications === "number"
    ? (chatNotifications > 0 ? 1 : 0)
    : chatNotifications?.items?.filter((chat) => chat.count > 0).length ?? 0;
  const badge = unreadChats > 99 ? "99+" : unreadChats;

  return (
    <div ref={boundsRef} className="pointer-events-none fixed inset-x-5 top-[min(6rem,20vh)] bottom-[calc(5rem+env(safe-area-inset-bottom))] z-40 md:bottom-[calc(1.5rem+env(safe-area-inset-bottom))]">
    <Link
      href="/chat"
      aria-label={unreadChats ? `Open chat, ${unreadChats} unread chats` : "Open chat"}
      title="Open chat · Drag to move, or use Alt + arrow keys"
      aria-describedby="floating-chat-help"
      aria-keyshortcuts="Alt+ArrowUp Alt+ArrowDown Alt+ArrowLeft Alt+ArrowRight"
      draggable={false}
      onDragStart={event => event.preventDefault()}
      onPointerDown={event => {
        if (!event.isPrimary || event.button !== 0) return;
        const rect = event.currentTarget.getBoundingClientRect();
        suppressClick.current = false;
        gesture.current = { id: event.pointerId, startX: event.clientX, startY: event.clientY, offsetX: event.clientX - rect.left, offsetY: event.clientY - rect.top, moved: false };
        event.currentTarget.setPointerCapture(event.pointerId);
      }}
      onPointerMove={move}
      onPointerUp={event => finish(event)}
      onPointerCancel={event => finish(event, true)}
      onLostPointerCapture={event => finish(event, true)}
      onClick={event => {
        if (suppressClick.current && event.detail !== 0) { event.preventDefault(); event.stopPropagation(); suppressClick.current = false; }
      }}
      onKeyDown={event => {
        if (!event.altKey || !["ArrowLeft", "ArrowRight", "ArrowUp", "ArrowDown"].includes(event.key)) return;
        event.preventDefault();
        const levels = ["top", "middle", "bottom"] as const;
        const index = levels.indexOf(dock.level);
        saveDock({ edge: event.key === "ArrowLeft" ? "left" : event.key === "ArrowRight" ? "right" : dock.edge, level: event.key === "ArrowUp" ? levels[Math.max(0, index - 1)] : event.key === "ArrowDown" ? levels[Math.min(2, index + 1)] : dock.level });
      }}
      style={{ left: dragPoint ? dragPoint.x : dock.edge === "left" ? 0 : "max(0px, calc(100% - 3.5rem))", top: dragPoint ? dragPoint.y : dock.level === "top" ? 0 : dock.level === "middle" ? "max(0px, calc(50% - 1.75rem))" : "max(0px, calc(100% - 3.5rem))" }}
      className={`pointer-events-auto absolute flex size-14 touch-none select-none items-center justify-center rounded-full bg-primary text-primary-foreground shadow-lg hover:shadow-xl focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 motion-reduce:transition-none ${dragPoint ? "cursor-grabbing transition-none" : "cursor-grab transition-[left,top,box-shadow] duration-200 ease-out"}`}
    >
      <MessageCircle className="size-6" aria-hidden="true" />
      {unreadChats > 0 && (
        <span className="absolute -right-1 -top-1 flex min-h-5 min-w-5 items-center justify-center rounded-full border-2 border-background bg-destructive px-1 text-[10px] font-bold leading-none text-destructive-foreground">
          {badge}
        </span>
      )}
    </Link>
    <span id="floating-chat-help" className="sr-only">Drag chat to the top, middle or bottom of either screen edge. With chat focused, use Alt and arrow keys to move it. Press Enter to open chat.</span>
    </div>
  );
}

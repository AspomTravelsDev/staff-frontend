"use client";

import { useEffect, useRef } from "react";
import { usePathname } from "next/navigation";
import { toast } from "sonner";
import { getEchoInstance } from "@/lib/echo";
import { useUser } from "@/providers/user-provider";
import { Message } from "@/types/chat";

const CHAT_ROUTE_PREFIX = "/chat";

export function GlobalChatNotifications() {
  const pathname = usePathname();
  const { user } = useUser();
  const userId = user?.id;
  const audioRef = useRef<HTMLAudioElement | null>(null);

  useEffect(() => {
    if (typeof window === "undefined") return;

    const audio = new Audio("/sounds/beep.mp3");
    audio.preload = "auto";
    audio.volume = 0.4;
    audioRef.current = audio;
  }, []);

  useEffect(() => {
    if (typeof window === "undefined") return;
    if (pathname?.startsWith(CHAT_ROUTE_PREFIX)) return;

    let isMounted = true;
    async function subscribeToConversations() {
      try {
        const echo = getEchoInstance();
        if (!echo) {
          console.warn("GlobalChatNotifications: unable to initialize Echo");
          return;
        }

        if (!userId) return;

        const channelName = `App.Models.User.${userId}`;
        const channel = echo.private(channelName);
        channel.listen(".MessageSent", (event: { message: Message }) => {
          if (!isMounted || !user || event.message.sender?.id === user.id) return;

          const senderName = event.message.sender?.name || "Someone";
          const bodyText = event.message.body ? event.message.body : "Sent an attachment.";
          audioRef.current?.play().catch(() => {});
          toast.success(`New message in Chat: ${senderName}${event.message.body ? "" : " sent an attachment."}`);

          if (
            document.visibilityState !== "visible" &&
            "Notification" in window &&
            Notification.permission === "granted"
          ) {
            new Notification(`New message from ${senderName}`, {
              body: bodyText,
              tag: `chat-${event.message.conversation_id}`,
            });
          }
        });
      } catch (error) {
        console.warn("Unable to subscribe to chat notifications:", error);
      }
    }

    subscribeToConversations();

    return () => {
      isMounted = false;
      const echo = getEchoInstance();
      if (user?.id) echo?.leave(`App.Models.User.${user.id}`);
    };
  }, [pathname, user, userId]);

  return null;
}

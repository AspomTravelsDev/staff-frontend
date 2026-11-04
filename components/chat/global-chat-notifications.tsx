"use client";

import { useEffect, useRef } from "react";
import { usePathname } from "next/navigation";
import { toast } from "sonner";
import { getEchoInstance } from "@/lib/echo";
import { useUser } from "@/providers/user-provider";
import { Message } from "@/types/chat";

interface ConversationOverview {
  id: string;
  name?: string | null;
  other_user?: {
    name?: string | null;
  } | null;
}

const CHAT_ROUTE_PREFIX = "/chat";

export function GlobalChatNotifications() {
  const pathname = usePathname();
  const { user } = useUser();
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
    const channels: string[] = [];

    async function subscribeToConversations() {
      try {
        const echo = getEchoInstance();
        if (!echo) {
          console.warn("GlobalChatNotifications: unable to initialize Echo");
          return;
        }

        const response = await fetch("/api/conversations", {
          cache: "no-store",
          credentials: "include",
          headers: {
            Accept: "application/json",
          },
        });

        if (!response.ok) {
          console.warn(
            "GlobalChatNotifications: failed to load conversations",
            response.status,
            await response.text(),
          );
          return;
        }

        const result = await response.json();
        const conversations: ConversationOverview[] = result.data ?? [];

        conversations.forEach((conversation) => {
          const channelName = `conversation.${conversation.id}`;
          const channel = echo.private(channelName);

          channel.subscribed(() => {
            console.info("GlobalChatNotifications: subscribed to", channelName);
          });
          channel.error((error: unknown) => {
            console.warn(
              "GlobalChatNotifications channel error",
              channelName,
              error,
            );
          });
          console.info("GlobalChatNotifications: subscribing to", channelName);

          channel.listen(".MessageSent", (event: { message: Message }) => {
            console.info(
              "GlobalChatNotifications: received MessageSent",
              channelName,
              event,
            );
            if (!isMounted) return;
            if (!user) return;
            if (event.message.sender?.id === user.id) return;

            const senderName = event.message.sender?.name || "Someone";
            const conversationLabel =
              conversation.name || conversation.other_user?.name || "Chat";
            const bodyText = event.message.body
              ? event.message.body
              : "Sent an attachment.";

            audioRef.current?.play().catch(() => {
              // ignore play errors
            });

            toast.success(
              `New message in ${conversationLabel}: ${senderName}${event.message.body ? "" : " sent an attachment."}`,
            );

            if (
              document.visibilityState !== "visible" &&
              "Notification" in window &&
              Notification.permission === "granted"
            ) {
              new Notification(`New message from ${senderName}`, {
                body: bodyText,
                tag: `chat-${conversation.id}`,
              });
            }
          });

          channels.push(channelName);
        });
      } catch (error) {
        console.warn("Unable to subscribe to chat notifications:", error);
      }
    }

    subscribeToConversations();

    return () => {
      isMounted = false;
      const echo = getEchoInstance();
      channels.forEach((channelName) => {
        try {
          echo?.leave(channelName);
        } catch {
          // ignore cleanup errors
        }
      });
    };
  }, [pathname]);

  return null;
}

"use client";

import { Fragment, useState, useRef, useEffect, useCallback } from "react";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Checkbox } from "@/components/ui/checkbox";
import { Textarea } from "@/components/ui/textarea";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from "@/components/ui/alert-dialog";
import { EmojiPicker } from "./emoji-picker";
import { ForwardModal } from "./forward-modal";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Send,
  Paperclip,
  KeyRound,
  X,
  FileText,
  Download,
  Edit2,
  Trash2,
  MoreVertical,
  Loader2,
  RefreshCw,
  MessageSquare,
  File,
  Image as ImageIcon,
  Check,
  ArrowLeft,
  Copy,
  Reply,
  UploadCloud,
  Search,
  ListChecks,
  CheckSquare,
  CornerUpRight,
  ChevronUp,
  ChevronDown,
} from "lucide-react";
import { Conversation, Message, MessageAttachment } from "@/types/chat";
import { toProxiedImageUrl } from "@/lib/utils/image-url";
import { loadOpeningChat } from "@/lib/chat-opening";
import {
  isForwardedMessage,
  getDisplayMessageBody,
  formatForwardedBody,
  formatWhatsAppMessages,
  searchMessagesInChat,
} from "@/lib/chat-message-state";
import { ChatImageAttachment } from "./chat-image-attachment";
import { MessageReceipt } from "./message-receipt";
import { CreateSecretModal } from "./create-secret-modal";
import { SecretCapsuleCard } from "./secret-capsule-card";
import { extractSecretInfo, formatSecretTag } from "@/lib/secret-helpers";
import { useOptionalUser } from "@/providers/user-provider";
import {
  getMessages,
  sendMessage,
  updateMessage,
  deleteMessage,
  deleteMessagesBatch,
  getAttachmentDownloadUrl,
  markAsRead,
} from "@/lib/api/chat";
import { getEchoInstance } from "@/lib/echo";
import { toast } from "sonner";
import { useQueryClient } from "@tanstack/react-query";

interface ChatWindowProps {
  conversation: Conversation | null;
  conversations?: Conversation[];
  currentUserId?: string;
  onMessageSent?: () => void;
  onMessageChanged?: (message: Message) => void;
  onBack?: () => void;
  onSelectConversation?: (conversationId: string) => void;
}

export function ChatWindow({
  conversation,
  conversations,
  currentUserId,
  onMessageSent,
  onMessageChanged,
  onBack,
  onSelectConversation,
}: ChatWindowProps) {
  const queryClient = useQueryClient();
  const [messages, setMessages] = useState<Message[]>([]);
  const [otherLastReadAt, setOtherLastReadAt] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [sending, setSending] = useState(false);
  const [page, setPage] = useState(1);
  const [hasMore, setHasMore] = useState(false);
  const [loadingMore, setLoadingMore] = useState(false);
  const [connectionStatus, setConnectionStatus] = useState<
    "connecting" | "connected" | "reconnecting" | "disconnected"
  >("connecting");
  const [notificationPermission, setNotificationPermission] =
    useState<NotificationPermission>("default");
  const [isPageVisible, setIsPageVisible] = useState(true);

  // Composer state
  const [inputBody, setInputBody] = useState("");
  const [selectedFiles, setSelectedFiles] = useState<File[]>([]);
  const [isDraggingFiles, setIsDraggingFiles] = useState(false);
  const [editingMessage, setEditingMessage] = useState<Message | null>(null);
  const [replyingTo, setReplyingTo] = useState<Message | null>(null);
  const [downloadingId, setDownloadingId] = useState<string | null>(null);
  const [unreadMarker, setUnreadMarker] = useState<{ messageId: string; count: number } | null>(null);
  const openingRequestRef = useRef(0);
  const openingLoadingRef = useRef(false);
  const [messageToDelete, setMessageToDelete] = useState<Message | null>(null);
  const [deleting, setDeleting] = useState(false);

  // In-chat search state
  const [searchOpen, setSearchOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [currentMatchIndex, setCurrentMatchIndex] = useState(0);
  const searchInputRef = useRef<HTMLInputElement | null>(null);

  // Multi-select & Batch actions state
  const [isSelectionMode, setIsSelectionMode] = useState(false);
  const [selectedMessageIds, setSelectedMessageIds] = useState<Set<string>>(new Set());
  const [batchDeleteConfirmOpen, setBatchDeleteConfirmOpen] = useState(false);
  const [batchDeleting, setBatchDeleting] = useState(false);

  // Forwarding state
  const [forwardModalOpen, setForwardModalOpen] = useState(false);
  const [messagesToForward, setMessagesToForward] = useState<Message[]>([]);

  // IT Secret Drop state
  const userContext = useOptionalUser();
  const user = userContext?.user;
  const isItOfficer = user?.role === "it" || user?.role === "super" || user?.role === "admin";
  const [createSecretOpen, setCreateSecretOpen] = useState(false);

  const fileInputRef = useRef<HTMLInputElement | null>(null);
  const dragDepthRef = useRef(0);
  const messageInputRef = useRef<HTMLTextAreaElement | null>(null);
  const scrollContainerRef = useRef<HTMLDivElement | null>(null);
  const notificationAudioRef = useRef<HTMLAudioElement | null>(null);
  const messagesRef = useRef<Message[]>([]);
  messagesRef.current = messages;
  const composerReply = replyingTo ? messages.find(message => message.id === replyingTo.id) ?? replyingTo : null;

  async function markConversationAsRead(conversationId: string, throughMessageId?: string) {
    if (openingLoadingRef.current) return;
    await markAsRead(conversationId, throughMessageId);
    await queryClient.invalidateQueries({ queryKey: ["notifications"] });
  }

  useEffect(() => {
    if (!conversation) return;
    const focusTimer = window.setTimeout(() => messageInputRef.current?.focus(), 100);
    return () => window.clearTimeout(focusTimer);
  }, [conversation?.id]);

  useEffect(() => {
    if (typeof window === "undefined") return;

    const audio = new Audio("/sounds/beep.mp3");
    audio.preload = "auto";
    audio.volume = 0.4;
    notificationAudioRef.current = audio;
  }, []);

  function playNotificationSound() {
    try {
      notificationAudioRef.current?.play();
    } catch (error) {
      // Silence if browser prevents audio playback.
    }
  }

  function showBrowserNotification(
    title: string,
    options: NotificationOptions,
  ) {
    if (typeof window === "undefined" || notificationPermission !== "granted")
      return;

    try {
      const notification = new Notification(title, options);
      notification.onclick = () => {
        window.focus();
      };
    } catch (error) {
      console.warn("Unable to show browser notification:", error);
    }
  }

  async function requestNotificationPermission() {
    if (typeof window === "undefined" || !("Notification" in window)) {
      toast.error(
        "Browser notifications are not supported in this environment.",
      );
      return;
    }

    try {
      const permission = await Notification.requestPermission();
      setNotificationPermission(permission);
      if (permission === "granted") {
        toast.success("Chat notifications enabled.");
      } else if (permission === "denied") {
        toast.error(
          "Browser notifications denied. You can enable them in your browser settings.",
        );
      }
    } catch (error) {
      toast.error("Failed to request notification permission.");
    }
  }

  function notifyOnNewMessage(message: Message) {
    const isOtherUser = message.sender?.id !== currentUserId;
    if (!isOtherUser) return;

    const title = "New chat message";
    const body = message.body
      ? `${message.sender?.name}: ${message.body}`
      : `${message.sender?.name} sent an attachment.`;

    if (!isPageVisible && notificationPermission === "granted") {
      showBrowserNotification(title, {
        body,
        tag: `chat-${conversation?.id}`,
      });
    }

    playNotificationSound();

    if (!isPageVisible) {
      toast.success("New chat message received.");
    }
  }

  useEffect(() => {
    const updateVisibility = () =>
      setIsPageVisible(document.visibilityState === "visible");

    updateVisibility();
    setNotificationPermission(
      typeof window !== "undefined" && "Notification" in window
        ? Notification.permission
        : "default",
    );

    document.addEventListener("visibilitychange", updateVisibility);

    return () => {
      document.removeEventListener("visibilitychange", updateVisibility);
    };
  }, []);

  useEffect(() => {
    let cleanupEcho: (() => void) | null = null;

    setUnreadMarker(null);
    setMessages([]);
    if (conversation) {
      setOtherLastReadAt(null);
      fetchInitialMessages(conversation.id);

      // Reverb WebSocket setup
      const echo = getEchoInstance();
      if (echo) {
        const channelName = `conversation.${conversation.id}`;
        const channel = echo.private(channelName);
        console.info("ChatWindow: subscribing to", channelName);

        const connector = (echo as any).connector;
        const socket = connector?.socket;

        if (socket) {
          setConnectionStatus("connecting");

          const bindState = (
            eventName: string,
            state: "connecting" | "connected" | "reconnecting" | "disconnected",
          ) => {
            if (socket.bind) {
              socket.bind(eventName, () => setConnectionStatus(state));
            }
          };

          bindState("connecting", "connecting");
          bindState("connected", "connected");
          bindState("disconnected", "disconnected");
          bindState("error", "reconnecting");
        }

        channel.listen(".MessageSent", (e: { message: Message }) => {
          console.info("ChatWindow: received MessageSent", channelName, e);
          setMessages((prev) => {
            if (prev.some((m) => m.id === e.message.id)) {
              return prev;
            }
            return [...prev, e.message];
          });
          setTimeout(scrollToBottom, 50);
          notifyOnNewMessage(e.message);
          if (e.message.sender?.id !== currentUserId && document.visibilityState === "visible") {
            void markConversationAsRead(conversation.id, e.message.id).catch((error) => {
              console.error("Failed to update chat read receipt:", error);
            });
          }
          if (onMessageSent) onMessageSent();
        });

        channel.listen(".MessageUpdated", (e: { message: Message }) => {
          console.info("ChatWindow: received MessageUpdated", channelName, e);
          setMessages((prev) =>
            prev.map((m) => (m.id === e.message.id ? e.message : m)),
          );
          onMessageChanged?.(e.message);
        });

        channel.listen(".MessageDeleted", (e: { message: Message }) => {
          console.info("ChatWindow: received MessageDeleted", channelName, e);
          setMessages((prev) =>
            prev.map((m) => (m.id === e.message.id ? e.message : m)),
          );
          onMessageChanged?.(e.message);
        });

        channel.listen(".ConversationRead", (e: { conversation_id: string; user_id: string; read_at: string }) => {
          if (e.user_id === conversation.other_user?.id) {
            setOtherLastReadAt(e.read_at);
          }
        });

        channel.listen(".SecretBurned", (e: { secret_id: string }) => {
          console.info("ChatWindow: received SecretBurned", channelName, e);
          setMessages((prev) => [...prev]);
        });

        cleanupEcho = () => {
          echo.leave(channelName);
          if (socket?.unbind) {
            socket.unbind("connecting");
            socket.unbind("connected");
            socket.unbind("disconnected");
            socket.unbind("error");
          }
        };
      }
    } else {
      setMessages([]);
    }

    setEditingMessage(null);
    setReplyingTo(null);
    setMessageToDelete(null);
    setInputBody("");
    setSelectedFiles([]);
    setSearchOpen(false);
    setSearchQuery("");
    setCurrentMatchIndex(0);
    setIsSelectionMode(false);
    setSelectedMessageIds(new Set());
    setBatchDeleteConfirmOpen(false);
    setForwardModalOpen(false);
    setMessagesToForward([]);

    return () => {
      openingRequestRef.current++;
      openingLoadingRef.current = false;
      if (cleanupEcho) cleanupEcho();
    };
  }, [conversation?.id]);

  useEffect(() => {
    if (!conversation) return;
    let active = true;

    const refreshLatestMessages = async () => {
      if (document.visibilityState !== "visible" || openingLoadingRef.current) return;
      try {
        const result = await getMessages(conversation.id, 1);
        if (!active) return;
        const latestMessages = result.data.reverse();
        const knownIds = new Set(messagesRef.current.map((message) => message.id));
        const hasNewIncoming = latestMessages.some(
          (message) => message.sender?.id !== currentUserId && !knownIds.has(message.id),
        );

        setMessages((previous) => {
          const merged = new Map(previous.map((message) => [message.id, message]));
          latestMessages.forEach((message) => merged.set(message.id, message));
          return [...merged.values()].sort(
            (a, b) => new Date(a.created_at).getTime() - new Date(b.created_at).getTime(),
          );
        });
        setOtherLastReadAt(result.meta.other_last_read_at || null);
        if (latestMessages.length && document.visibilityState === "visible") {
          void markConversationAsRead(conversation.id, result.meta.read_through_message_id ?? latestMessages.at(-1)?.id).catch((error) => {
            console.error("Failed to update chat read receipt:", error);
          });
        }
        if (hasNewIncoming) {
          onMessageSent?.();
        }
      } catch (error) {
        console.warn("Unable to refresh recent chat messages:", error);
      }
    };

    const interval = window.setInterval(refreshLatestMessages, 15000);
    const handleVisibility = () => {
      if (document.visibilityState === "visible") void refreshLatestMessages();
    };
    document.addEventListener("visibilitychange", handleVisibility);
    window.addEventListener("focus", handleVisibility);

    return () => {
      active = false;
      window.clearInterval(interval);
      document.removeEventListener("visibilitychange", handleVisibility);
      window.removeEventListener("focus", handleVisibility);
    };
  }, [conversation?.id, currentUserId, onMessageSent, onMessageChanged]);

  async function fetchInitialMessages(convId: string, preserveMarker = false) {
    const request = ++openingRequestRef.current;
    const isCurrent = () => request === openingRequestRef.current;
    openingLoadingRef.current = true;
    setLoading(true);
    setPage(1);
    try {
      const opening = await loadOpeningChat(page => getMessages(convId, page), isCurrent);
      if (!opening || !isCurrent()) return;
      const combined = new Map(messagesRef.current.filter(message => message.conversation_id === convId).map(message => [message.id, message]));
      opening.messages.forEach(message => combined.set(message.id, message));
      const timeline = [...combined.values()].sort((a, b) => Date.parse(a.created_at) - Date.parse(b.created_at) || a.id.localeCompare(b.id));
      setMessages(timeline);
      const markerForSession = preserveMarker ? unreadMarker : opening.marker;
      setUnreadMarker(markerForSession);
      setOtherLastReadAt(opening.otherLastReadAt);
      setHasMore(opening.hasMore);
      setPage(opening.page);
      setLoading(false);
      openingLoadingRef.current = false;
      window.setTimeout(() => {
        if (!isCurrent()) return;
        const marker = document.getElementById("chat-unread-marker");
        if (markerForSession && marker) marker.scrollIntoView({ block: "start" });
        else scrollToBottom();
      }, 100);
      if (timeline.length && document.visibilityState === "visible") {
        await markConversationAsRead(convId, timeline.at(-1)?.id ?? opening.readThroughId);
        onMessageSent?.();
      }
    } catch (error) {
      if (isCurrent()) toast.error(error instanceof Error ? error.message : "Failed to load messages.");
    } finally {
      if (isCurrent()) { setLoading(false); openingLoadingRef.current = false; }
    }
  }

  async function handleLoadMore() {
    if (!conversation || loadingMore || !hasMore) return;
    setLoadingMore(true);

    const container = scrollContainerRef.current;
    const prevScrollHeight = container ? container.scrollHeight : 0;
    const nextPage = page + 1;

    try {
      const res = await getMessages(conversation.id, nextPage);
      const olderMessages = res.data.reverse();
      setMessages((prev) => [...olderMessages, ...prev]);
      setPage(nextPage);
      setHasMore(res.meta.has_more_pages);

      requestAnimationFrame(() => {
        if (container) {
          const newScrollHeight = container.scrollHeight;
          container.scrollTop = newScrollHeight - prevScrollHeight;
        }
      });
    } catch (err: any) {
      toast.error("Failed to load older messages.");
    } finally {
      setLoadingMore(false);
    }
  }

  function handleScroll(e: React.UIEvent<HTMLDivElement>) {
    const container = e.currentTarget;
    if (container.scrollTop <= 50 && hasMore && !loadingMore && !loading) {
      handleLoadMore();
    }
  }

  function scrollToBottom() {
    if (scrollContainerRef.current) {
      scrollContainerRef.current.scrollTop =
        scrollContainerRef.current.scrollHeight;
    }
  }

  async function handleSend() {
    if (!conversation || sending) return;
    if (!inputBody.trim() && selectedFiles.length === 0) return;

    if (editingMessage) {
      // Edit mode
      try {
        const text = inputBody.trim();
        const bodyToSend = isForwardedMessage(editingMessage) ? formatForwardedBody(text) : text;
        const updated = await updateMessage(
          editingMessage.id,
          bodyToSend,
        );
        setMessages((prev) =>
          prev.map((msg) => (msg.id === updated.id ? updated : msg)),
        );
        toast.success("Message updated.");
        onMessageChanged?.(updated);
        setEditingMessage(null);
        setInputBody("");
      } catch (err: any) {
        toast.error(err?.message || "Failed to update message.");
      }
      return;
    }

    // New message send - Optimistic UI update
    const text = inputBody.trim();
    const filesToSend = [...selectedFiles];
    const replyTarget = replyingTo ? messages.find(message => message.id === replyingTo.id) ?? replyingTo : null;
    if (replyTarget?.is_deleted) { toast.error("This message was deleted. Cancel the reply or choose another message."); return; }
    const tempId = `temp-${Date.now()}`;
    const nowIso = new Date().toISOString();

    const optimisticMessage: Message = {
      id: tempId,
      conversation_id: conversation.id,
      reply_to: replyTarget ? { id: replyTarget.id, body: replyTarget.body, is_deleted: false, sender: replyTarget.sender, attachment_name: replyTarget.attachments[0]?.original_name } : null,
      body: text || null,
      created_at: nowIso,
      edited_at: null,
      deleted_at: null,
      is_edited: false,
      is_deleted: false,
      sender: {
        id: currentUserId || "me",
        name: "You",
        email: "",
      },
      attachments: filesToSend.map((file, idx) => ({
        id: `temp-att-${idx}`,
        original_name: file.name,
        mime_type: file.type || "application/octet-stream",
        size: file.size,
      })),
    };

    // 1. Instantly append optimistic message & clear composer inputs
    setMessages((prev) => [...prev, optimisticMessage]);
    setInputBody("");
    setSelectedFiles([]);
    setReplyingTo(null);
    setTimeout(scrollToBottom, 20);

    setSending(true);
    try {
      const formData = new FormData();
      formData.append("conversation_id", conversation.id);
      if (replyTarget) formData.append("reply_to_message_id", replyTarget.id);
      if (text) {
        formData.append("body", text);
      }
      filesToSend.forEach((file) => {
        formData.append("attachments[]", file);
      });

      const realMsg = await sendMessage(formData);

      setMessages((prev) => {
        const alreadyExists = prev.some((m) => m.id === realMsg.id);
        if (alreadyExists) {
          // WebSocket broadcast already added realMsg, remove tempId
          return prev.filter((m) => m.id !== tempId);
        }
        return prev.map((m) => (m.id === tempId ? realMsg : m));
      });

      if (onMessageSent) onMessageSent();
    } catch (err: any) {
      setMessages((prev) => prev.filter((msg) => msg.id !== tempId));
      setInputBody(text);
      setSelectedFiles(filesToSend);
      setReplyingTo(replyTarget);
      toast.error(err?.message || "Failed to send message.");
    } finally {
      setSending(false);
    }
  }

  async function handleDeleteMessage(msgId: string) {
    if (deleting) return;
    setDeleting(true);
    try {
      const deleted = await deleteMessage(msgId);
      setMessages((prev) =>
        prev.map((msg) => (msg.id === deleted.id ? deleted : msg)),
      );
      toast.success("Message deleted.");
      onMessageChanged?.(deleted);
      setMessageToDelete(null);
      if (editingMessage?.id === deleted.id) { setEditingMessage(null); setInputBody(""); }
    } catch (err: any) {
      toast.error(err?.message || "Failed to delete message.");
    } finally { setDeleting(false); }
  }

  async function handleCopyMessage(body: string) {
    try { await navigator.clipboard.writeText(body); toast.success("Message copied."); }
    catch { toast.error("Could not copy the message. Please try again."); }
  }

  // Search logic
  const searchMatches = searchMessagesInChat(messages, searchQuery);

  useEffect(() => {
    if (currentMatchIndex >= searchMatches.length && searchMatches.length > 0) {
      setCurrentMatchIndex(searchMatches.length - 1);
    }
  }, [searchMatches.length, currentMatchIndex]);

  useEffect(() => {
    if (!searchOpen || searchMatches.length === 0) return;
    const matchId = searchMatches[currentMatchIndex];
    if (!matchId) return;
    const el = document.getElementById(`chat-message-${matchId}`);
    if (el) {
      el.scrollIntoView({ behavior: "smooth", block: "center" });
    }
  }, [searchOpen, currentMatchIndex, searchMatches]);

  const handleNextSearchMatch = () => {
    if (searchMatches.length === 0) return;
    setCurrentMatchIndex((prev) => (prev + 1) % searchMatches.length);
  };

  const handlePrevSearchMatch = () => {
    if (searchMatches.length === 0) return;
    setCurrentMatchIndex((prev) => (prev - 1 + searchMatches.length) % searchMatches.length);
  };

  // Selection & Batch actions logic
  const nonDeletedMessages = messages.filter((m) => !m.is_deleted);
  const selectedMessages = messages.filter((m) => selectedMessageIds.has(m.id));
  const selectedOwnMessages = selectedMessages.filter(
    (m) => m.sender?.id === currentUserId && !m.is_deleted
  );

  const handleToggleSelectMessage = (id: string) => {
    setSelectedMessageIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  const handleToggleSelectAll = () => {
    if (selectedMessageIds.size === nonDeletedMessages.length) {
      setSelectedMessageIds(new Set());
    } else {
      setSelectedMessageIds(new Set(nonDeletedMessages.map((m) => m.id)));
    }
  };

  const handleBatchCopy = async () => {
    if (selectedMessages.length === 0) return;
    const text = formatWhatsAppMessages(selectedMessages, currentUserId);
    try {
      await navigator.clipboard.writeText(text);
      toast.success(
        `Copied ${selectedMessages.length} message${
          selectedMessages.length === 1 ? "" : "s"
        } (WhatsApp format).`
      );
    } catch {
      toast.error("Failed to copy messages.");
    }
  };

  const handleBatchDelete = async () => {
    if (batchDeleting || selectedOwnMessages.length === 0) return;
    setBatchDeleting(true);
    try {
      const idsToDelete = selectedOwnMessages.map((m) => m.id);
      const res = await deleteMessagesBatch(idsToDelete);
      const deletedMap = new Map((res.data || []).map((m) => [m.id, m]));

      setMessages((prev) =>
        prev.map((m) => {
          if (deletedMap.has(m.id)) return deletedMap.get(m.id)!;
          if (idsToDelete.includes(m.id)) {
            return { ...m, body: null, is_deleted: true, deleted_at: new Date().toISOString() };
          }
          return m;
        })
      );

      res.data?.forEach((deletedMsg) => {
        onMessageChanged?.(deletedMsg);
      });

      const deletedCount = res.count ?? idsToDelete.length;
      toast.success(
        `Deleted ${deletedCount} message${deletedCount === 1 ? "" : "s"}.`
      );
      setIsSelectionMode(false);
      setSelectedMessageIds(new Set());
      setBatchDeleteConfirmOpen(false);
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : "Failed to delete selected messages.";
      toast.error(msg);
    } finally {
      setBatchDeleting(false);
    }
  };

  const handleSingleForward = (msg: Message) => {
    setMessagesToForward([msg]);
    setForwardModalOpen(true);
  };

  const handleBatchForward = () => {
    if (selectedMessages.length === 0) return;
    setMessagesToForward(selectedMessages);
    setForwardModalOpen(true);
  };

  const insertEmoji = useCallback((emoji: string) => {
    const input = messageInputRef.current;
    const start = input?.selectionStart ?? input?.value.length ?? 0;
    const end = input?.selectionEnd ?? start;
    setInputBody(body => body.slice(0, start) + emoji + body.slice(end));
    requestAnimationFrame(() => { input?.focus(); input?.setSelectionRange(start + emoji.length, start + emoji.length); });
  }, []);

  async function handleDownloadAttachment(att: MessageAttachment) {
    setDownloadingId(att.id);
    try {
      const url = await getAttachmentDownloadUrl(att.id);
      window.open(url, "_blank");
    } catch (err: any) {
      toast.error("Failed to get download link.");
    } finally {
      setDownloadingId(null);
    }
  }

  const ALLOWED_MIME_TYPES = [
    "application/pdf",
    "application/msword",
    "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
    "application/vnd.ms-excel",
    "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
    "text/csv",
    "image/jpeg",
    "image/png",
    "image/gif",
    "image/bmp",
    "image/webp",
    "text/plain",
  ];

  const ACCEPT_ATTRIBUTE =
    ".pdf,.doc,.docx,.xls,.xlsx,.csv,.png,.jpg,.jpeg,.gif,.bmp,.webp,.txt";
  const MAX_FILE_SIZE_BYTES = 10 * 1024 * 1024; // 10MB

  function addFiles(filesArray: File[]) {
    const validFiles: File[] = [];

    filesArray.forEach((file) => {
      const isValidType =
        ALLOWED_MIME_TYPES.includes(file.type) ||
        ALLOWED_MIME_TYPES.some(
          (type) =>
            type.startsWith("image/") && file.type.startsWith("image/"),
        );
      const isValidSize = file.size <= MAX_FILE_SIZE_BYTES;

      if (!isValidType) {
        toast.error(
          `"${file.name}" is not a supported file format. Allowed: PDF, Word, Excel, CSV, Images (PNG, JPG, WebP, GIF), Text.`,
        );
      } else if (!isValidSize) {
        toast.error(
          `"${file.name}" exceeds the maximum 10MB file size limit.`,
        );
      } else {
        validFiles.push(file);
      }
    });

    if (validFiles.length > 0) {
      setSelectedFiles((prev) => [...prev, ...validFiles]);
    }
  }

  function handleFileChange(e: React.ChangeEvent<HTMLInputElement>) {
    if (e.target.files) addFiles(Array.from(e.target.files));

    // Reset input value so re-selecting the same file works
    if (e.target) {
      e.target.value = "";
    }
  }

  function removeFile(index: number) {
    setSelectedFiles((prev) => prev.filter((_, i) => i !== index));
  }

  function handleDragEnter(event: React.DragEvent<HTMLDivElement>) {
    if (!event.dataTransfer.types.includes("Files")) return;
    event.preventDefault();
    if (sending || editingMessage) return;
    dragDepthRef.current += 1;
    setIsDraggingFiles(true);
  }

  function handleDragOver(event: React.DragEvent<HTMLDivElement>) {
    if (!event.dataTransfer.types.includes("Files")) return;
    event.preventDefault();
    event.dataTransfer.dropEffect = sending || editingMessage ? "none" : "copy";
  }

  function handleDragLeave(event: React.DragEvent<HTMLDivElement>) {
    if (!event.dataTransfer.types.includes("Files")) return;
    event.preventDefault();
    dragDepthRef.current = Math.max(0, dragDepthRef.current - 1);
    if (dragDepthRef.current === 0) setIsDraggingFiles(false);
  }

  function handleDrop(event: React.DragEvent<HTMLDivElement>) {
    if (!event.dataTransfer.types.includes("Files")) return;
    event.preventDefault();
    dragDepthRef.current = 0;
    setIsDraggingFiles(false);
    if (sending || editingMessage) {
      toast.info(sending ? "Wait for this message to finish sending." : "Finish editing before attaching files.");
      return;
    }
    addFiles(Array.from(event.dataTransfer.files));
  }

  function formatFileSize(bytes: number): string {
    if (bytes < 1024) return bytes + " B";
    if (bytes < 1048576) return (bytes / 1024).toFixed(1) + " KB";
    return (bytes / 1048576).toFixed(1) + " MB";
  }

  function formatMsgTime(iso: string): string {
    const d = new Date(iso);
    return d.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });
  }

  if (!conversation) {
    return (
      <div className="flex-1 flex flex-col items-center justify-center p-8 text-center bg-muted/10 h-full">
        <div className="h-16 w-16 rounded-full bg-primary/10 flex items-center justify-center mb-4">
          <MessageSquare className="h-8 w-8 text-primary" />
        </div>
        <h3 className="text-lg font-semibold text-foreground mb-1">
          Select a Direct Conversation
        </h3>
        <p className="text-sm text-muted-foreground max-w-sm">
          Choose a conversation from the sidebar or click "New Chat" to start
          messaging a colleague.
        </p>
      </div>
    );
  }

  const otherUser = conversation.other_user;
  const titleName = conversation.name || otherUser?.name || "Direct Message";
  const initials =
    (titleName.split(" ")[0]?.[0] || "") + (titleName.split(" ")[1]?.[0] || "");

  return (
    <div
      className="relative flex h-full min-h-0 min-w-0 flex-1 flex-col bg-background"
      onDragEnter={handleDragEnter}
      onDragOver={handleDragOver}
      onDragLeave={handleDragLeave}
      onDrop={handleDrop}
    >
      {isDraggingFiles && (
        <div className="pointer-events-none absolute inset-2 z-50 flex items-center justify-center rounded-xl border-2 border-dashed border-primary bg-background/95 shadow-lg" role="status" aria-live="polite">
          <div className="flex flex-col items-center gap-2 text-center">
            <span className="flex size-12 items-center justify-center rounded-full bg-primary/10 text-primary"><UploadCloud className="size-6" /></span>
            <span className="font-semibold">Drop files to attach</span>
            <span className="text-sm text-muted-foreground">Files up to 10 MB · Send when you’re ready</span>
          </div>
        </div>
      )}
      {/* Header */}
      <div className="p-3 sm:p-4 border-b border-border flex items-center justify-between gap-2 bg-card shrink-0">
        <div className="flex flex-1 items-center gap-2 sm:gap-3 min-w-0">
          {onBack && (
            <Button
              variant="ghost"
              size="icon"
              onClick={onBack}
              className="h-8 w-8 text-muted-foreground hover:text-foreground lg:hidden shrink-0"
              title="Back to conversation list"
            >
              <ArrowLeft className="h-4 w-4" />
            </Button>
          )}
          <Avatar className="h-10 w-10 border border-border shrink-0">
            <AvatarImage
              src={toProxiedImageUrl(otherUser?.avatar_url)}
              alt={titleName}
            />
            <AvatarFallback className="bg-primary/10 text-primary font-semibold text-xs">
              {initials.toUpperCase() || "DM"}
            </AvatarFallback>
          </Avatar>
          <div className="min-w-0 flex-1">
            <div className="flex flex-wrap items-center gap-2">
              <h3 className="font-semibold text-foreground text-sm truncate">
                {titleName}
              </h3>
            </div>
            {otherUser?.email && (
              <p className="text-xs text-muted-foreground truncate">
                {otherUser.email}
              </p>
            )}
          </div>
        </div>

        <div className="flex items-center gap-1.5 sm:gap-2">
          {notificationPermission === "default" && (
            <Button
              variant="outline"
              size="sm"
              onClick={requestNotificationPermission}
              className="hidden xl:inline-flex h-8"
            >
              Enable notifications
            </Button>
          )}
          <Button
            variant="ghost"
            size="icon"
            onClick={() => {
              setSearchOpen((prev) => {
                const next = !prev;
                if (next) {
                  setTimeout(() => searchInputRef.current?.focus(), 50);
                } else {
                  setSearchQuery("");
                }
                return next;
              });
            }}
            className={`h-8 w-8 ${
              searchOpen
                ? "bg-accent text-foreground"
                : "text-muted-foreground hover:text-foreground"
            }`}
            title="Search in conversation"
            aria-label="Search in conversation"
          >
            <Search className="h-4 w-4" />
          </Button>
          <Button
            variant="ghost"
            size="icon"
            onClick={() => {
              setIsSelectionMode((prev) => {
                const next = !prev;
                if (!next) setSelectedMessageIds(new Set());
                return next;
              });
            }}
            className={`h-8 w-8 ${
              isSelectionMode
                ? "bg-primary/10 text-primary"
                : "text-muted-foreground hover:text-foreground"
            }`}
            title={isSelectionMode ? "Cancel selection" : "Select messages"}
            aria-label={isSelectionMode ? "Cancel selection" : "Select messages"}
          >
            <ListChecks className="h-4 w-4" />
          </Button>
          <Button
            variant="ghost"
            size="icon"
            onClick={() => fetchInitialMessages(conversation.id, true)}
            className="h-8 w-8 text-muted-foreground hover:text-foreground"
            title="Refresh messages"
          >
            <RefreshCw className={`h-4 w-4 ${loading ? "animate-spin" : ""}`} />
          </Button>
        </div>
      </div>

      {/* In-chat Search Bar */}
      {searchOpen && (
        <div className="px-3 py-2 bg-card border-b border-border flex items-center gap-2 shrink-0 animate-in fade-in slide-in-from-top-1 duration-150">
          <div className="relative flex-1 min-w-0">
            <Search className="absolute left-2.5 top-2.5 h-3.5 w-3.5 text-muted-foreground" />
            <Input
              ref={searchInputRef}
              value={searchQuery}
              onChange={(e) => {
                setSearchQuery(e.target.value);
                setCurrentMatchIndex(0);
              }}
              onKeyDown={(e) => {
                if (e.key === "Enter") {
                  e.preventDefault();
                  if (e.shiftKey) handlePrevSearchMatch();
                  else handleNextSearchMatch();
                } else if (e.key === "Escape") {
                  setSearchOpen(false);
                  setSearchQuery("");
                }
              }}
              placeholder="Search in conversation..."
              className="pl-8 pr-20 h-8 text-xs bg-muted/40 focus:bg-background"
            />
            <div className="absolute right-2 top-2 flex items-center gap-1 text-[11px] text-muted-foreground pointer-events-none">
              {searchMatches.length > 0 ? (
                <span>
                  {`${currentMatchIndex + 1} of ${searchMatches.length}`}
                </span>
              ) : searchQuery.trim() ? (
                <span className="text-muted-foreground/80">0 results</span>
              ) : null}
            </div>
          </div>
          <div className="flex items-center gap-0.5 shrink-0">
            <Button
              variant="ghost"
              size="icon"
              disabled={searchMatches.length === 0}
              onClick={handlePrevSearchMatch}
              className="h-8 w-8 text-muted-foreground hover:text-foreground"
              title="Previous match (Shift+Enter)"
              aria-label="Previous match"
            >
              <ChevronUp className="h-4 w-4" />
            </Button>
            <Button
              variant="ghost"
              size="icon"
              disabled={searchMatches.length === 0}
              onClick={handleNextSearchMatch}
              className="h-8 w-8 text-muted-foreground hover:text-foreground"
              title="Next match (Enter)"
              aria-label="Next match"
            >
              <ChevronDown className="h-4 w-4" />
            </Button>
            <Button
              variant="ghost"
              size="icon"
              onClick={() => {
                setSearchOpen(false);
                setSearchQuery("");
              }}
              className="h-8 w-8 text-muted-foreground hover:text-foreground"
              title="Close search"
              aria-label="Close search"
            >
              <X className="h-4 w-4" />
            </Button>
          </div>
        </div>
      )}

      {/* Selection Mode Bar */}
      {isSelectionMode && (
        <div className="px-3 py-2 bg-primary/10 border-b border-primary/20 flex items-center justify-between gap-2 shrink-0 animate-in fade-in slide-in-from-top-1 duration-150">
          <div className="flex items-center gap-2">
            <Button
              variant="ghost"
              size="icon"
              onClick={() => {
                setIsSelectionMode(false);
                setSelectedMessageIds(new Set());
              }}
              className="h-7 w-7 text-muted-foreground hover:text-foreground"
              title="Cancel selection"
              aria-label="Cancel selection"
            >
              <X className="h-4 w-4" />
            </Button>
            <span className="text-xs font-semibold text-foreground">
              {selectedMessageIds.size} selected
            </span>
            <Button
              variant="ghost"
              size="sm"
              onClick={handleToggleSelectAll}
              className="h-7 text-xs px-2 text-primary hover:text-primary hover:bg-primary/15"
            >
              {selectedMessageIds.size === nonDeletedMessages.length && nonDeletedMessages.length > 0
                ? "Deselect All"
                : "Select All"}
            </Button>
          </div>

          <div className="flex items-center gap-1.5">
            <Button
              variant="outline"
              size="sm"
              disabled={selectedMessageIds.size === 0}
              onClick={handleBatchCopy}
              className="h-7 text-xs px-2.5 gap-1.5 bg-background shadow-xs"
              title="Copy selected messages (WhatsApp format)"
            >
              <Copy className="h-3.5 w-3.5" />
              <span className="hidden sm:inline">Copy</span>
            </Button>

            <Button
              variant="outline"
              size="sm"
              disabled={selectedMessageIds.size === 0}
              onClick={handleBatchForward}
              className="h-7 text-xs px-2.5 gap-1.5 bg-background shadow-xs"
              title="Forward selected messages"
            >
              <CornerUpRight className="h-3.5 w-3.5" />
              <span className="hidden sm:inline">Forward</span>
            </Button>

            <Button
              variant="destructive"
              size="sm"
              disabled={selectedOwnMessages.length === 0}
              onClick={() => setBatchDeleteConfirmOpen(true)}
              className="h-7 text-xs px-2.5 gap-1.5"
              title={
                selectedOwnMessages.length === 0
                  ? "Select your own messages to delete"
                  : `Delete ${selectedOwnMessages.length} selected message${
                      selectedOwnMessages.length === 1 ? "" : "s"
                    }`
              }
            >
              <Trash2 className="h-3.5 w-3.5" />
              <span className="hidden sm:inline">
                Delete {selectedOwnMessages.length > 0 ? `(${selectedOwnMessages.length})` : ""}
              </span>
            </Button>
          </div>
        </div>
      )}

      {/* Message Feed Area */}
      <div
        ref={scrollContainerRef}
        onScroll={handleScroll}
        className="flex-1 min-h-0 min-w-0 overflow-x-hidden overflow-y-auto p-3 sm:p-4 space-y-4 bg-muted/5"
      >
        {hasMore && (
          <div className="flex justify-center my-2">
            <Button
              variant="outline"
              size="sm"
              onClick={handleLoadMore}
              disabled={loadingMore}
              className="text-xs h-7 gap-1"
            >
              {loadingMore ? (
                <Loader2 className="h-3 w-3 animate-spin" />
              ) : (
                "Load older messages"
              )}
            </Button>
          </div>
        )}

        {loading ? (
          <div className="flex flex-col items-center justify-center h-48 gap-2 text-muted-foreground">
            <Loader2 className="h-6 w-6 animate-spin text-primary" />
            <span className="text-sm">Loading message history...</span>
          </div>
        ) : messages.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-48 gap-1 text-center text-muted-foreground">
            <MessageSquare className="h-8 w-8 stroke-1 text-muted-foreground/60" />
            <p className="font-medium text-sm">No messages yet</p>
            <p className="text-xs">
              Send a message below to start the conversation.
            </p>
          </div>
        ) : (
          messages.map((msg, index) => {
            const isOwn = msg.sender?.id === currentUserId;
            const isDeleted = msg.is_deleted;
            const isEdited = msg.is_edited;
            const isForwarded = isForwardedMessage(msg);
            const cleanBody = getDisplayMessageBody(msg.body);
            const isSelected = selectedMessageIds.has(msg.id);
            const isCurrentSearchMatch = searchMatches[currentMatchIndex] === msg.id;
            const isAnySearchMatch = searchMatches.includes(msg.id);
            const parent = msg.reply_to ? messages.find(message => message.id === msg.reply_to!.id) : null;
            const quote = parent ? { id: parent.id, body: parent.body, is_deleted: parent.is_deleted, sender: parent.sender, attachment_name: parent.attachments[0]?.original_name } : msg.reply_to;

            return (
              <Fragment key={`${msg.id}-${index}`}>
              {unreadMarker?.messageId === msg.id && <div id="chat-unread-marker" className="flex scroll-mt-3 items-center gap-3 py-2" role="separator" aria-label={`${unreadMarker.count} unread messages`}><div className="h-px flex-1 bg-border" /><span className="shrink-0 rounded-full bg-muted px-3 py-1 text-xs font-medium text-muted-foreground">{unreadMarker.count} unread {unreadMarker.count === 1 ? "message" : "messages"}</span><Button type="button" variant="ghost" size="icon" className="size-6 shrink-0 text-muted-foreground" aria-label="Dismiss unread marker" onClick={() => setUnreadMarker(null)}><X className="size-3" /></Button><div className="h-px flex-1 bg-border" /></div>}
              <div
                id={`chat-message-${msg.id}`}
                onClick={() => {
                  if (isSelectionMode && !isDeleted) {
                    handleToggleSelectMessage(msg.id);
                  }
                }}
                className={`flex items-end gap-2 group transition-all rounded-xl p-1 -m-1 ${
                  isOwn ? "justify-end" : "justify-start"
                } ${isSelectionMode && !isDeleted ? "cursor-pointer hover:bg-muted/40" : ""} ${
                  isSelected ? "bg-primary/10 ring-1 ring-primary/30" : ""
                } ${
                  isCurrentSearchMatch
                    ? "ring-2 ring-primary ring-offset-2 ring-offset-background"
                    : isAnySearchMatch
                    ? "bg-amber-500/10"
                    : ""
                }`}
              >
                {isSelectionMode && !isDeleted && (
                  <div
                    className={`flex items-center self-center px-1 shrink-0 ${
                      isOwn ? "order-last ml-1" : "order-first mr-1"
                    }`}
                  >
                    <Checkbox
                      checked={isSelected}
                      onCheckedChange={() => handleToggleSelectMessage(msg.id)}
                      aria-label={`Select message from ${msg.sender?.name || "Staff"}`}
                    />
                  </div>
                )}

                {!isOwn && (
                  <Avatar className="h-7 w-7 mb-1 shrink-0 border border-border">
                    <AvatarFallback className="bg-primary/10 text-primary font-semibold text-[10px]">
                      {(msg.sender?.name?.[0] || "U").toUpperCase()}
                    </AvatarFallback>
                  </Avatar>
                )}

                <div className="min-w-0 max-w-[85%] sm:max-w-[75%] xl:max-w-[65%] space-y-1">
                  {!isOwn && msg.sender?.name && (
                    <p className="text-[11px] font-medium text-muted-foreground ml-1">
                      {msg.sender.name}
                    </p>
                  )}

                  <div className="relative group/bubble flex items-center gap-1">
                    {/* Message actions */}
                    {!isDeleted && (
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button
                            variant="ghost"
                            size="icon"
                            className={`h-7 w-7 shrink-0 text-muted-foreground sm:opacity-0 sm:group-hover/bubble:opacity-100 focus-visible:opacity-100 data-[state=open]:opacity-100 transition-opacity ${isOwn ? "" : "order-last"}`}
                            aria-label="Message actions"
                          >
                            <MoreVertical className="h-3.5 w-3.5" />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end" className="text-xs">
                          <DropdownMenuItem disabled={msg.id.startsWith("temp-") || sending} onSelect={() => { setReplyingTo(msg); setEditingMessage(null); messageInputRef.current?.focus(); }} className="gap-2"><Reply className="size-3.5" />Reply</DropdownMenuItem>
                          {cleanBody && <DropdownMenuItem onSelect={() => { void handleCopyMessage(cleanBody); }} className="gap-2"><Copy className="size-3.5" />Copy</DropdownMenuItem>}
                          <DropdownMenuItem disabled={msg.id.startsWith("temp-")} onSelect={() => handleSingleForward(msg)} className="gap-2"><CornerUpRight className="size-3.5" />Forward</DropdownMenuItem>
                          <DropdownMenuItem onSelect={() => { setIsSelectionMode(true); setSelectedMessageIds(new Set([msg.id])); }} className="gap-2"><CheckSquare className="size-3.5" />Select</DropdownMenuItem>
                          {isOwn && <>
                          <DropdownMenuItem
                            disabled={msg.id.startsWith("temp-")}
                            onClick={() => {
                              setReplyingTo(null);
                              setEditingMessage(msg);
                              setInputBody(cleanBody || "");
                            }}
                            className="gap-2"
                          >
                            <Edit2 className="h-3.5 w-3.5" /> Edit
                          </DropdownMenuItem>
                          <DropdownMenuItem
                            disabled={msg.id.startsWith("temp-")}
                            onSelect={() => setMessageToDelete(msg)}
                            className="gap-2 text-destructive focus:text-destructive"
                          >
                            <Trash2 className="h-3.5 w-3.5" /> Delete
                          </DropdownMenuItem>
                          </>}
                        </DropdownMenuContent>
                      </DropdownMenu>
                    )}

                    <div
                      className={`min-w-0 p-2.5 sm:p-3 rounded-2xl text-sm shadow-sm ${
                        isOwn
                          ? "bg-primary text-primary-foreground rounded-br-none"
                          : "bg-card text-foreground border border-border/60 rounded-bl-none"
                      }`}
                    >
                      {isDeleted ? (
                        <p className="italic opacity-70 flex items-center gap-1.5 text-xs">
                          <Trash2 className="h-3 w-3" />
                          This message was deleted
                        </p>
                      ) : (
                        <>
                          {isForwarded && (
                            <div
                              className={`flex items-center gap-1 text-[11px] font-medium italic mb-1.5 ${
                                isOwn ? "text-primary-foreground/80" : "text-muted-foreground"
                              }`}
                            >
                              <CornerUpRight className="h-3 w-3 shrink-0" />
                              <span>Forwarded</span>
                            </div>
                          )}
                          {quote && <button type="button" className={`mb-2 block w-full min-w-0 rounded-md border-l-2 px-2 py-1.5 text-left text-xs ${isOwn ? "border-primary-foreground/60 bg-black/10 text-primary-foreground" : "border-primary bg-muted text-foreground"}`} aria-label="View original message" onClick={() => {
                            const original = document.getElementById(`chat-message-${quote.id}`);
                            if (original) original.scrollIntoView({ behavior: "smooth", block: "center" });
                            else toast.info("Load earlier messages to view the original.");
                          }}><span className="block truncate font-semibold">{quote.sender?.id === currentUserId ? "You" : quote.sender?.name || "Staff member"}</span><span className="block max-w-full truncate opacity-80">{quote.is_deleted ? "This message was deleted" : getDisplayMessageBody(quote.body) || quote.attachment_name || "Attachment"}</span></button>}
                          {(() => {
                            const secretInfo = extractSecretInfo(cleanBody);
                            if (secretInfo) {
                              const remainingText = cleanBody.replace(/\[secret:[^\]]+\]/, "").trim();
                              return (
                                <div className="space-y-2">
                                  {remainingText && (
                                    <p className="whitespace-pre-wrap [overflow-wrap:anywhere] leading-relaxed">
                                      {remainingText}
                                    </p>
                                  )}
                                  <SecretCapsuleCard
                                    secretId={secretInfo.secretId}
                                    initialTitle={secretInfo.title}
                                    currentUserId={currentUserId}
                                    isOwn={isOwn}
                                    onBurned={() => {
                                      setMessages((prev) => [...prev]);
                                    }}
                                  />
                                </div>
                              );
                            }
                            return cleanBody ? (
                              <p className="whitespace-pre-wrap [overflow-wrap:anywhere] leading-relaxed">
                                {cleanBody}
                              </p>
                            ) : null;
                          })()}

                          {/* Attachments */}
                          {msg.attachments && msg.attachments.length > 0 && (
                            <div className="mt-2 space-y-1.5 pt-1 border-t border-primary-foreground/20">
                              {msg.attachments.map((att) => (
                                <div key={att.id} className="min-w-0 space-y-2">
                                  {att.mime_type.startsWith("image/") && !att.id.startsWith("temp-") && <ChatImageAttachment attachment={att} />}
                                <div
                                  key={att.id}
                                  className={`flex items-center justify-between gap-3 p-2 rounded-lg text-xs ${
                                    isOwn
                                      ? "bg-primary-foreground/10 text-primary-foreground"
                                      : "bg-muted text-foreground"
                                  }`}
                                >
                                  <div className="flex items-center gap-2 min-w-0">
                                    {att.mime_type.startsWith("image/") ? (
                                      <ImageIcon className="h-4 w-4 shrink-0" />
                                    ) : (
                                      <FileText className="h-4 w-4 shrink-0" />
                                    )}
                                    <div className="min-w-0">
                                      <p className="truncate font-medium">
                                        {att.original_name}
                                      </p>
                                      <p className="text-[10px] opacity-80">
                                        {formatFileSize(att.size)}
                                      </p>
                                    </div>
                                  </div>

                                  <Button
                                    size="icon"
                                    variant="ghost"
                                    disabled={downloadingId === att.id}
                                    onClick={() =>
                                      handleDownloadAttachment(att)
                                    }
                                    className="h-7 w-7 shrink-0 hover:bg-black/10 dark:hover:bg-white/10"
                                    title="Download attachment"
                                  >
                                    {downloadingId === att.id ? (
                                      <Loader2 className="h-3.5 w-3.5 animate-spin" />
                                    ) : (
                                      <Download className="h-3.5 w-3.5" />
                                    )}
                                  </Button>
                                </div>
                                </div>
                              ))}
                            </div>
                          )}
                        </>
                      )}

                    </div>
                  </div>
                  <div className={`flex items-center justify-end gap-1 text-[10px] text-muted-foreground ${!isOwn && !isDeleted ? "pr-8" : ""}`}>
                    {isEdited && !isDeleted && <span>(edited)</span>}
                    <span>{formatMsgTime(msg.created_at)}</span>
                    <MessageReceipt message={msg} currentUserId={currentUserId} lastReadAt={otherLastReadAt} />
                  </div>
                </div>
              </div>
              </Fragment>
            );
          })
        )}
      </div>

      {composerReply && !editingMessage && <div className="flex min-w-0 items-center gap-3 border-t border-border bg-accent/60 px-4 py-2" role="status">
        <Reply className="size-4 shrink-0 text-primary" />
        <div className="min-w-0 flex-1 text-xs"><p className="font-semibold">Replying to {composerReply.sender?.id === currentUserId ? "yourself" : composerReply.sender?.name || "staff member"}</p><p className="truncate text-muted-foreground">{composerReply.is_deleted ? "This message was deleted" : composerReply.body || composerReply.attachments[0]?.original_name || "Attachment"}</p></div>
        <Button type="button" size="icon" variant="ghost" className="size-7 shrink-0" aria-label="Cancel reply" onClick={() => setReplyingTo(null)}><X className="size-4" /></Button>
      </div>}
      {/* Editing state banner */}
      {editingMessage && (
        <div className="px-4 py-2 bg-accent/60 border-t border-border flex items-center justify-between text-xs text-foreground">
          <span className="flex items-center gap-1.5 font-medium">
            <Edit2 className="h-3.5 w-3.5 text-primary" />
            Editing message...
          </span>
          <Button
            size="sm"
            variant="ghost"
            onClick={() => {
              setEditingMessage(null);
              setInputBody("");
            }}
            className="h-6 text-xs px-2"
          >
            Cancel
          </Button>
        </div>
      )}

      {/* Selected files preview bar */}
      {selectedFiles.length > 0 && (
        <div className="px-4 py-2 border-t border-border bg-card flex flex-wrap gap-2">
          {selectedFiles.map((file, idx) => (
            <div
              key={idx}
              className="flex items-center gap-2 bg-muted px-2.5 py-1 rounded-md text-xs font-medium border border-border"
            >
              <File className="h-3.5 w-3.5 text-primary" />
              <span className="max-w-37.5 truncate">{file.name}</span>
              <span className="text-[10px] text-muted-foreground">
                ({formatFileSize(file.size)})
              </span>
              <button
                onClick={() => removeFile(idx)}
                className="text-muted-foreground hover:text-destructive transition-colors ml-1"
              >
                <X className="h-3.5 w-3.5" />
              </button>
            </div>
          ))}
        </div>
      )}

      {/* Composer Bar */}
      <div className="p-3 border-t border-border bg-card flex items-end gap-2 shrink-0">
        <input
          type="file"
          multiple
          accept={ACCEPT_ATTRIBUTE}
          ref={fileInputRef}
          onChange={handleFileChange}
          className="hidden"
        />

        <Button
          type="button"
          variant="ghost"
          size="icon"
          onClick={() => fileInputRef.current?.click()}
          disabled={sending || !!editingMessage}
          className="h-9 w-9 text-muted-foreground hover:text-foreground shrink-0"
          title="Attach files"
        >
          <Paperclip className="h-4 w-4" />
        </Button>

        <EmojiPicker disabled={sending} onSelect={insertEmoji} />

        {isItOfficer && (
          <Button
            type="button"
            variant="ghost"
            size="icon"
            onClick={() => setCreateSecretOpen(true)}
            disabled={sending || !!editingMessage}
            className="h-9 w-9 text-amber-600 dark:text-amber-400 hover:text-amber-700 dark:hover:text-amber-300 shrink-0 hover:bg-amber-500/10"
            title="Send secure credential drop (IT only)"
            aria-label="Send secure credential drop"
          >
            <KeyRound className="h-4 w-4" />
          </Button>
        )}

        <Textarea
          ref={messageInputRef}
          rows={1}
          aria-label={editingMessage ? "Edit message" : "Message"}
          aria-describedby="chat-composer-help"
          placeholder={
            editingMessage ? "Update your message..." : "Type a message..."
          }
          value={inputBody}
          onChange={(e) => setInputBody(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === "Enter" && !e.shiftKey && !e.nativeEvent.isComposing) {
              e.preventDefault();
              handleSend();
            }
          }}
          className="flex-1 min-w-0 min-h-9 max-h-36 overflow-y-auto text-base sm:text-sm bg-muted/30 focus:bg-background transition-colors"
        />

        <Button
          onClick={handleSend}
          disabled={
            sending || (!inputBody.trim() && selectedFiles.length === 0)
          }
          size="sm"
          aria-label={editingMessage ? "Save message" : "Send message"}
          className="h-9 w-9 sm:w-auto px-0 sm:px-3 gap-1 text-xs font-medium shrink-0"
        >
          {sending ? (
            <Loader2 className="h-4 w-4 animate-spin" />
          ) : editingMessage ? (
            <>
              <Check className="h-4 w-4" /><span className="hidden sm:inline">Save</span>
            </>
          ) : (
            <>
              <Send className="h-4 w-4" /><span className="hidden sm:inline">Send</span>
            </>
          )}
        </Button>
      </div>
      <p id="chat-composer-help" className="bg-card px-3 pb-2 text-[11px] text-muted-foreground">Enter to {editingMessage ? "save" : "send"} · Shift+Enter for a new line</p>
      <AlertDialog open={Boolean(messageToDelete)} onOpenChange={open => { if (!open && !deleting) setMessageToDelete(null); }}>
        <AlertDialogContent>
          <AlertDialogHeader><AlertDialogTitle>Delete this message?</AlertDialogTitle><AlertDialogDescription>The message will be replaced with a deleted-message notice for everyone in this conversation.</AlertDialogDescription></AlertDialogHeader>
          {messageToDelete?.body && <p className="max-h-32 overflow-y-auto whitespace-pre-wrap break-words rounded-md bg-muted p-3 text-sm">{messageToDelete.body}</p>}
          <AlertDialogFooter><AlertDialogCancel disabled={deleting}>Cancel</AlertDialogCancel><AlertDialogAction variant="destructive" disabled={deleting} onClick={event => { event.preventDefault(); if (messageToDelete) void handleDeleteMessage(messageToDelete.id); }}>{deleting ? "Deleting…" : "Delete message"}</AlertDialogAction></AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Batch delete confirmation dialog */}
      <AlertDialog
        open={batchDeleteConfirmOpen}
        onOpenChange={(open) => {
          if (!open && !batchDeleting) setBatchDeleteConfirmOpen(false);
        }}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>
              {`Delete ${selectedOwnMessages.length} selected message${
                selectedOwnMessages.length === 1 ? "" : "s"
              }?`}
            </AlertDialogTitle>
            <AlertDialogDescription>
              {selectedMessages.length > selectedOwnMessages.length
                ? `You have selected ${selectedMessages.length} messages, but only your own messages (${selectedOwnMessages.length}) will be deleted. They will be replaced with a deleted-message notice.`
                : "These messages will be replaced with a deleted-message notice for everyone in this conversation."}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={batchDeleting}>Cancel</AlertDialogCancel>
            <AlertDialogAction
              variant="destructive"
              disabled={batchDeleting || selectedOwnMessages.length === 0}
              onClick={(event) => {
                event.preventDefault();
                void handleBatchDelete();
              }}
            >
              {batchDeleting
                ? "Deleting…"
                : `Delete ${selectedOwnMessages.length} message${
                    selectedOwnMessages.length === 1 ? "" : "s"
                  }`}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Forward message(s) modal */}
      <ForwardModal
        open={forwardModalOpen}
        onOpenChange={setForwardModalOpen}
        messages={messagesToForward}
        conversations={conversations}
        currentUserId={currentUserId}
        currentConversationId={conversation.id}
        onForwardSuccess={(targetConvId) => {
          setIsSelectionMode(false);
          setSelectedMessageIds(new Set());
          if (targetConvId === conversation.id) {
            void fetchInitialMessages(conversation.id, true);
          } else if (onSelectConversation) {
            onSelectConversation(targetConvId);
          }
        }}
      />

      {/* Create Secret Modal (IT Officers only) */}
      {isItOfficer && (
        <CreateSecretModal
          open={createSecretOpen}
          onOpenChange={setCreateSecretOpen}
          recipientId={otherUser?.id}
          recipientName={titleName}
          conversationId={conversation.id}
          onSecretCreated={async (secretId, secretTitle) => {
            const secretTag = formatSecretTag(secretId, secretTitle);
            try {
              const formData = new FormData();
              formData.append("conversation_id", conversation.id);
              formData.append("body", secretTag);
              await sendMessage(formData);
              void fetchInitialMessages(conversation.id, true);
              onMessageSent?.();
              toast.success("Secure credential drop sent into chat.");
            } catch (err: unknown) {
              toast.error(
                "Failed to post credential drop: " +
                  (err instanceof Error ? err.message : "Error")
              );
            }
          }}
        />
      )}
    </div>
  );
}

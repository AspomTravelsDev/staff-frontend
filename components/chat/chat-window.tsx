"use client";

import { useState, useRef, useEffect } from "react";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Send,
  Paperclip,
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
} from "lucide-react";
import { Conversation, Message, MessageAttachment } from "@/types/chat";
import {
  getMessages,
  sendMessage,
  updateMessage,
  deleteMessage,
  getAttachmentDownloadUrl,
  markAsRead,
} from "@/lib/api/chat";
import { getEchoInstance } from "@/lib/echo";
import { toast } from "sonner";

interface ChatWindowProps {
  conversation: Conversation | null;
  currentUserId?: string;
  onMessageSent?: () => void;
  onBack?: () => void;
}

export function ChatWindow({
  conversation,
  currentUserId,
  onMessageSent,
  onBack,
}: ChatWindowProps) {
  const [messages, setMessages] = useState<Message[]>([]);
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
  const [editingMessage, setEditingMessage] = useState<Message | null>(null);
  const [downloadingId, setDownloadingId] = useState<string | null>(null);

  const fileInputRef = useRef<HTMLInputElement | null>(null);
  const scrollContainerRef = useRef<HTMLDivElement | null>(null);
  const notificationAudioRef = useRef<HTMLAudioElement | null>(null);

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
    let isMounted = true;
    let cleanupEcho: (() => void) | null = null;

    if (conversation) {
      fetchInitialMessages(conversation.id);
      void markAsRead(conversation.id).catch((error) => {
        console.error("Failed to mark conversation as read:", error);
      });

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
          if (onMessageSent) onMessageSent();
        });

        channel.listen(".MessageUpdated", (e: { message: Message }) => {
          console.info("ChatWindow: received MessageUpdated", channelName, e);
          setMessages((prev) =>
            prev.map((m) => (m.id === e.message.id ? e.message : m)),
          );
        });

        channel.listen(".MessageDeleted", (e: { message: Message }) => {
          console.info("ChatWindow: received MessageDeleted", channelName, e);
          setMessages((prev) =>
            prev.map((m) => (m.id === e.message.id ? e.message : m)),
          );
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
    setInputBody("");
    setSelectedFiles([]);

    return () => {
      isMounted = false;
      if (cleanupEcho) cleanupEcho();
    };
  }, [conversation?.id]);

  async function fetchInitialMessages(convId: string) {
    setLoading(true);
    setPage(1);
    try {
      const res = await getMessages(convId, 1);
      setMessages(res.data.reverse());
      setHasMore(res.meta.has_more_pages);
      setTimeout(scrollToBottom, 100);
    } catch (err: any) {
      toast.error("Failed to load messages: " + (err?.message || "Error"));
    } finally {
      setLoading(false);
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
    if (!conversation) return;
    if (!inputBody.trim() && selectedFiles.length === 0) return;

    if (editingMessage) {
      // Edit mode
      try {
        const updated = await updateMessage(
          editingMessage.id,
          inputBody.trim(),
        );
        setMessages((prev) =>
          prev.map((msg) => (msg.id === updated.id ? updated : msg)),
        );
        toast.success("Message updated.");
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
    const tempId = `temp-${Date.now()}`;
    const nowIso = new Date().toISOString();

    const optimisticMessage: Message = {
      id: tempId,
      conversation_id: conversation.id,
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
    setTimeout(scrollToBottom, 20);

    setSending(true);
    try {
      const formData = new FormData();
      formData.append("conversation_id", conversation.id);
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
      toast.error(err?.message || "Failed to send message.");
    } finally {
      setSending(false);
    }
  }

  async function handleDeleteMessage(msgId: string) {
    try {
      const deleted = await deleteMessage(msgId);
      setMessages((prev) =>
        prev.map((msg) => (msg.id === deleted.id ? deleted : msg)),
      );
      toast.success("Message deleted.");
    } catch (err: any) {
      toast.error(err?.message || "Failed to delete message.");
    }
  }

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

  function handleFileChange(e: React.ChangeEvent<HTMLInputElement>) {
    if (e.target.files) {
      const filesArray = Array.from(e.target.files);
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

    // Reset input value so re-selecting the same file works
    if (e.target) {
      e.target.value = "";
    }
  }

  function removeFile(index: number) {
    setSelectedFiles((prev) => prev.filter((_, i) => i !== index));
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
    <div className="flex-1 flex flex-col h-full bg-background min-w-0">
      {/* Header */}
      <div className="p-4 border-b border-border flex items-center justify-between bg-card shrink-0">
        <div className="flex items-center gap-3 min-w-0">
          {onBack && (
            <Button
              variant="ghost"
              size="icon"
              onClick={onBack}
              className="h-8 w-8 text-muted-foreground hover:text-foreground md:hidden shrink-0"
              title="Back to conversation list"
            >
              <ArrowLeft className="h-4 w-4" />
            </Button>
          )}
          <Avatar className="h-10 w-10 border border-border shrink-0">
            <AvatarImage
              src={otherUser?.avatar_url || undefined}
              alt={titleName}
            />
            <AvatarFallback className="bg-primary/10 text-primary font-semibold text-xs">
              {initials.toUpperCase() || "DM"}
            </AvatarFallback>
          </Avatar>
          <div className="min-w-0">
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

        <div className="flex items-center gap-2">
          {notificationPermission === "default" && (
            <Button
              variant="outline"
              size="sm"
              onClick={requestNotificationPermission}
              className="hidden md:inline-flex h-8"
            >
              Enable notifications
            </Button>
          )}
          <Button
            variant="ghost"
            size="icon"
            onClick={() => fetchInitialMessages(conversation.id)}
            className="h-8 w-8 text-muted-foreground hover:text-foreground"
            title="Refresh messages"
          >
            <RefreshCw className={`h-4 w-4 ${loading ? "animate-spin" : ""}`} />
          </Button>
        </div>
      </div>

      {/* Message Feed Area */}
      <div
        ref={scrollContainerRef}
        onScroll={handleScroll}
        className="flex-1 overflow-y-auto p-4 space-y-4 bg-muted/5"
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

            return (
              <div
                key={`${msg.id}-${index}`}
                className={`flex items-end gap-2 group ${
                  isOwn ? "justify-end" : "justify-start"
                }`}
              >
                {!isOwn && (
                  <Avatar className="h-7 w-7 mb-1 shrink-0 border border-border">
                    <AvatarFallback className="bg-primary/10 text-primary font-semibold text-[10px]">
                      {(msg.sender?.name?.[0] || "U").toUpperCase()}
                    </AvatarFallback>
                  </Avatar>
                )}

                <div className="max-w-[75%] sm:max-w-[65%] space-y-1">
                  {!isOwn && msg.sender?.name && (
                    <p className="text-[11px] font-medium text-muted-foreground ml-1">
                      {msg.sender.name}
                    </p>
                  )}

                  <div className="relative group/bubble flex items-center gap-1">
                    {/* Dropdown menu for own message actions */}
                    {isOwn && !isDeleted && (
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button
                            variant="ghost"
                            size="icon"
                            className="h-6 w-6 opacity-0 group-hover/bubble:opacity-100 transition-opacity text-muted-foreground"
                          >
                            <MoreVertical className="h-3.5 w-3.5" />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end" className="text-xs">
                          <DropdownMenuItem
                            onClick={() => {
                              setEditingMessage(msg);
                              setInputBody(msg.body || "");
                            }}
                            className="gap-2"
                          >
                            <Edit2 className="h-3.5 w-3.5" /> Edit Message
                          </DropdownMenuItem>
                          <DropdownMenuItem
                            onClick={() => handleDeleteMessage(msg.id)}
                            className="gap-2 text-destructive focus:text-destructive"
                          >
                            <Trash2 className="h-3.5 w-3.5" /> Delete Message
                          </DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    )}

                    <div
                      className={`p-3 rounded-2xl text-xs sm:text-sm shadow-sm ${
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
                          {msg.body && (
                            <p className="whitespace-pre-wrap wrap-break-word leading-relaxed">
                              {msg.body}
                            </p>
                          )}

                          {/* Attachments */}
                          {msg.attachments && msg.attachments.length > 0 && (
                            <div className="mt-2 space-y-1.5 pt-1 border-t border-primary-foreground/20">
                              {msg.attachments.map((att) => (
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
                              ))}
                            </div>
                          )}
                        </>
                      )}

                      <div
                        className={`flex items-center justify-end gap-1 mt-1 text-[10px] ${
                          isOwn
                            ? "text-primary-foreground/80"
                            : "text-muted-foreground"
                        }`}
                      >
                        {isEdited && !isDeleted && <span>(edited)</span>}
                        <span>{formatMsgTime(msg.created_at)}</span>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            );
          })
        )}
      </div>

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
      <div className="p-3 border-t border-border bg-card flex items-center gap-2 shrink-0">
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

        <Input
          placeholder={
            editingMessage ? "Update your message..." : "Type a message..."
          }
          value={inputBody}
          onChange={(e) => setInputBody(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === "Enter" && !e.shiftKey) {
              e.preventDefault();
              handleSend();
            }
          }}
          className="flex-1 h-9 text-xs sm:text-sm bg-muted/30 focus:bg-background transition-colors"
        />

        <Button
          onClick={handleSend}
          disabled={
            sending || (!inputBody.trim() && selectedFiles.length === 0)
          }
          size="sm"
          className="h-9 px-3 gap-1 text-xs font-medium shrink-0"
        >
          {sending ? (
            <Loader2 className="h-4 w-4 animate-spin" />
          ) : editingMessage ? (
            <>
              <Check className="h-4 w-4" /> Save
            </>
          ) : (
            <>
              <Send className="h-4 w-4" /> Send
            </>
          )}
        </Button>
      </div>
    </div>
  );
}

"use client";

import { useState, useEffect } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Search, Loader2, CornerUpRight, MessageSquare, Check } from "lucide-react";
import { Conversation, Message } from "@/types/chat";
import { getConversations, sendMessage } from "@/lib/api/chat";
import { toProxiedImageUrl } from "@/lib/utils/image-url";
import { formatForwardedBody, getDisplayMessageBody } from "@/lib/chat-message-state";
import { toast } from "sonner";

interface ForwardModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  messages: Message[];
  conversations?: Conversation[];
  currentUserId?: string;
  currentConversationId?: string;
  onForwardSuccess?: (targetConversationId: string, count: number) => void;
}

export function ForwardModal({
  open,
  onOpenChange,
  messages,
  conversations: initialConversations,
  currentUserId,
  currentConversationId,
  onForwardSuccess,
}: ForwardModalProps) {
  const [conversations, setConversations] = useState<Conversation[]>(
    initialConversations || []
  );
  const [loading, setLoading] = useState(false);
  const [forwarding, setForwarding] = useState(false);
  const [selectedConversationId, setSelectedConversationId] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState("");

  useEffect(() => {
    if (open) {
      setSelectedConversationId(null);
      setSearchQuery("");
      if (!initialConversations || initialConversations.length === 0) {
        setLoading(true);
        getConversations()
          .then((data) => setConversations(data))
          .catch((err) => toast.error("Failed to load conversations: " + err.message))
          .finally(() => setLoading(false));
      } else {
        setConversations(initialConversations);
      }
    }
  }, [open, initialConversations]);

  const filteredConversations = conversations.filter((conv) => {
    const q = searchQuery.toLowerCase().trim();
    if (!q) return true;
    const name = (conv.name || conv.other_user?.name || "").toLowerCase();
    const email = (conv.other_user?.email || "").toLowerCase();
    return name.includes(q) || email.includes(q);
  });

  async function handleForward() {
    if (!selectedConversationId || messages.length === 0 || forwarding) return;
    setForwarding(true);

    try {
      const sortedMessages = [...messages].sort(
        (a, b) => new Date(a.created_at).getTime() - new Date(b.created_at).getTime()
      );

      for (const msg of sortedMessages) {
        const formData = new FormData();
        formData.append("conversation_id", selectedConversationId);
        formData.append("is_forwarded", "1");

        const cleanBody = getDisplayMessageBody(msg.body);
        const attachmentNames = msg.attachments?.length
          ? msg.attachments.map((a) => a.original_name).join(", ")
          : "";

        let bodyToSend = cleanBody;
        if (!bodyToSend && attachmentNames) {
          bodyToSend = `[Attachment: ${attachmentNames}]`;
        } else if (bodyToSend && attachmentNames) {
          bodyToSend = `${bodyToSend}\n[Attachment: ${attachmentNames}]`;
        }

        formData.append("body", formatForwardedBody(bodyToSend || ""));
        await sendMessage(formData);
      }

      const targetConv = conversations.find((c) => c.id === selectedConversationId);
      const targetName = targetConv?.name || targetConv?.other_user?.name || "conversation";

      toast.success(
        `Forwarded ${messages.length} message${messages.length === 1 ? "" : "s"} to ${targetName}.`
      );
      onForwardSuccess?.(selectedConversationId, messages.length);
      onOpenChange(false);
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : "Failed to forward message(s)";
      toast.error(msg);
    } finally {
      setForwarding(false);
    }
  }

  const selectedTarget = conversations.find((c) => c.id === selectedConversationId);

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="w-[calc(100vw-1rem)] max-h-[calc(100dvh-1rem)] gap-0 overflow-hidden p-0 sm:max-w-[460px]">
        <DialogHeader className="p-4 pb-3 sm:p-5 sm:pb-3 border-b border-border">
          <DialogTitle className="text-lg flex items-center gap-2">
            <CornerUpRight className="h-5 w-5 text-primary" />
            Forward {messages.length === 1 ? "Message" : `${messages.length} Messages`}
          </DialogTitle>
          <DialogDescription className="text-xs">
            Choose a conversation to forward the selected message{messages.length === 1 ? "" : "s"} to.
          </DialogDescription>
        </DialogHeader>

        {/* Message preview snippet */}
        <div className="bg-muted/40 px-4 py-2 text-xs border-b border-border text-muted-foreground flex items-center justify-between">
          <span className="truncate max-w-[280px]">
            {messages.length === 1
              ? getDisplayMessageBody(messages[0]?.body) ||
                messages[0]?.attachments?.[0]?.original_name ||
                "1 message"
              : `${messages.length} messages selected`}
          </span>
          <span className="shrink-0 text-[10px] bg-primary/10 text-primary px-2 py-0.5 rounded-full font-medium">
            Forwarded tag included
          </span>
        </div>

        {/* Search */}
        <div className="p-3 border-b border-border">
          <div className="relative">
            <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Search conversations..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-8 h-9 text-xs bg-muted/30 focus:bg-background"
            />
          </div>
        </div>

        {/* List of conversations */}
        <ScrollArea className="h-64 sm:h-72">
          <div className="p-2 space-y-1">
            {loading ? (
              <div className="flex flex-col items-center justify-center h-48 gap-2 text-muted-foreground">
                <Loader2 className="h-5 w-5 animate-spin text-primary" />
                <span className="text-xs">Loading conversations...</span>
              </div>
            ) : filteredConversations.length === 0 ? (
              <div className="flex flex-col items-center justify-center h-48 gap-1 text-center text-muted-foreground">
                <MessageSquare className="h-7 w-7 text-muted-foreground/50 stroke-1" />
                <p className="text-xs font-medium">No conversations found</p>
              </div>
            ) : (
              filteredConversations.map((conv) => {
                const name = conv.name || conv.other_user?.name || "Direct Message";
                const isSelected = selectedConversationId === conv.id;
                const isCurrent = conv.id === currentConversationId;
                const initials =
                  (name.split(" ")[0]?.[0] || "") + (name.split(" ")[1]?.[0] || "");

                return (
                  <button
                    key={conv.id}
                    type="button"
                    onClick={() => setSelectedConversationId(conv.id)}
                    className={`w-full flex items-center justify-between gap-3 p-2.5 rounded-lg text-left transition-colors ${
                      isSelected
                        ? "bg-primary/10 border border-primary/30"
                        : "hover:bg-muted/60"
                    }`}
                  >
                    <div className="flex items-center gap-3 min-w-0">
                      <Avatar className="h-8 w-8 border border-border shrink-0">
                        <AvatarImage
                          src={toProxiedImageUrl(conv.other_user?.avatar_url)}
                          alt={name}
                        />
                        <AvatarFallback className="bg-primary/10 text-primary text-[10px] font-semibold">
                          {initials.toUpperCase() || "DM"}
                        </AvatarFallback>
                      </Avatar>
                      <div className="min-w-0">
                        <div className="flex items-center gap-1.5">
                          <p className="text-xs font-semibold text-foreground truncate">
                            {name}
                          </p>
                          {isCurrent && (
                            <span className="text-[10px] text-muted-foreground italic">
                              (this chat)
                            </span>
                          )}
                        </div>
                        {conv.other_user?.email && (
                          <p className="text-[11px] text-muted-foreground truncate">
                            {conv.other_user.email}
                          </p>
                        )}
                      </div>
                    </div>

                    <div className="shrink-0 flex items-center">
                      {isSelected && (
                        <div className="h-5 w-5 rounded-full bg-primary text-primary-foreground flex items-center justify-center">
                          <Check className="h-3 w-3 stroke-[3]" />
                        </div>
                      )}
                    </div>
                  </button>
                );
              })
            )}
          </div>
        </ScrollArea>

        <DialogFooter className="p-3 border-t border-border flex items-center justify-between sm:justify-between bg-card">
          <Button
            type="button"
            variant="ghost"
            size="sm"
            onClick={() => onOpenChange(false)}
            disabled={forwarding}
            className="text-xs h-8"
          >
            Cancel
          </Button>

          <Button
            type="button"
            size="sm"
            onClick={handleForward}
            disabled={!selectedConversationId || forwarding}
            className="text-xs h-8 gap-1.5"
          >
            {forwarding ? (
              <Loader2 className="h-3.5 w-3.5 animate-spin" />
            ) : (
              <CornerUpRight className="h-3.5 w-3.5" />
            )}
            <span>
              {forwarding
                ? "Forwarding..."
                : selectedTarget
                ? `Forward to ${selectedTarget.name || selectedTarget.other_user?.name || "chat"}`
                : "Forward"}
            </span>
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

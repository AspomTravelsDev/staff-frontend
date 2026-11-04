"use client";

import { useState } from "react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Skeleton } from "@/components/ui/skeleton";
import { Search, Plus, MessageSquare, RefreshCw } from "lucide-react";
import { Conversation } from "@/types/chat";
import { toProxiedImageUrl } from "@/lib/utils/image-url";
import { conversationPreview } from "@/lib/chat-message-state";

interface ChatSidebarProps {
    conversations: Conversation[];
    selectedId: string | null;
    onSelectConversation: (conversation: Conversation) => void;
    onOpenNewChat: () => void;
    loading: boolean;
    onRefresh: () => void;
}

export function ChatSidebar({
    conversations,
    selectedId,
    onSelectConversation,
    onOpenNewChat,
    loading,
    onRefresh,
}: ChatSidebarProps) {
    const [searchQuery, setSearchQuery] = useState("");

    const filteredConversations = conversations.filter((conv) => {
        const query = searchQuery.toLowerCase();
        const name = (conv.name || conv.other_user?.name || "").toLowerCase();
        const email = (conv.other_user?.email || "").toLowerCase();
        const lastMsg = conv.last_message?.is_deleted ? "" : (conv.last_message?.body || "").toLowerCase();
        return name.includes(query) || email.includes(query) || lastMsg.includes(query);
    });

    function formatTime(isoString?: string | null): string {
        if (!isoString) return "";
        const date = new Date(isoString);
        const now = new Date();
        const diffMs = now.getTime() - date.getTime();
        const diffMins = Math.floor(diffMs / 60000);
        const diffHours = Math.floor(diffMs / 3600000);
        const diffDays = Math.floor(diffMs / 86400000);

        if (diffMins < 1) return "Just now";
        if (diffMins < 60) return `${diffMins}m ago`;
        if (diffHours < 24) return `${diffHours}h ago`;
        if (diffDays === 1) return "Yesterday";
        if (diffDays < 7) return `${diffDays}d ago`;

        return date.toLocaleDateString(undefined, { month: "short", day: "numeric" });
    }

    return (
        <div className="flex min-w-0 flex-col min-h-0 h-full w-full overflow-hidden bg-card">
            {/* Sidebar Header */}
            <div className="p-4 border-b border-border space-y-3">
                <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                        <MessageSquare className="h-5 w-5 text-primary" />
                        <h2 className="font-semibold text-lg tracking-tight text-foreground">Direct Messages</h2>
                    </div>
                    <div className="flex items-center gap-1">
                        <Button
                            variant="ghost"
                            size="icon"
                            className="h-8 w-8 text-muted-foreground hover:text-foreground"
                            onClick={onRefresh}
                            title="Refresh conversations"
                        >
                            <RefreshCw className="h-4 w-4" />
                        </Button>
                        <Button
                            size="sm"
                            onClick={onOpenNewChat}
                            className="h-8 px-2.5 gap-1 text-xs font-medium"
                        >
                            <Plus className="h-3.5 w-3.5" />
                            New Chat
                        </Button>
                    </div>
                </div>

                <div className="relative">
                    <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
                    <Input
                        placeholder="Search chats or messages..."
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                        className="pl-8 h-9 text-xs bg-muted/40 border-muted focus:bg-background transition-colors"
                    />
                </div>
            </div>

            {/* Conversation List */}
            <ScrollArea className="flex-1 min-h-0 min-w-0 [&_[data-slot=scroll-area-viewport]>div]:!block">
                {loading && conversations.length === 0 ? (
                    <div className="p-3 space-y-3">
                        {[1, 2, 3, 4, 5].map((i) => (
                            <div key={i} className="flex items-center gap-3 p-2">
                                <Skeleton className="h-10 w-10 rounded-full" />
                                <div className="space-y-1.5 flex-1">
                                    <Skeleton className="h-4 w-28" />
                                    <Skeleton className="h-3 w-44" />
                                </div>
                            </div>
                        ))}
                    </div>
                ) : filteredConversations.length === 0 ? (
                    <div className="flex flex-col items-center justify-center p-8 text-center text-muted-foreground space-y-2 h-64">
                        <MessageSquare className="h-8 w-8 stroke-1 text-muted-foreground/60" />
                        <p className="text-sm font-medium">No conversations found</p>
                        <p className="text-xs text-muted-foreground">
                            {searchQuery
                                ? "Try a different search query."
                                : "Start a new direct chat with a team member."}
                        </p>
                        {!searchQuery && (
                            <Button size="sm" variant="outline" onClick={onOpenNewChat} className="mt-2 text-xs">
                                Start Chat
                            </Button>
                        )}
                    </div>
                ) : (
                    <div className="p-2 space-y-1">
                        {filteredConversations.map((conv) => {
                            const isSelected = selectedId === conv.id;
                            const otherUser = conv.other_user;
                            const displayName = conv.name || otherUser?.name || "Direct Message";
                            const initials = (displayName.split(" ")[0]?.[0] || "") + (displayName.split(" ")[1]?.[0] || "");
                            const lastMsg = conv.last_message;
                            const hasUnread = conv.unread_count > 0;

                            return (
                                <div
                                    key={conv.id}
                                    onClick={() => onSelectConversation(conv)}
                                    className={`flex min-w-0 max-w-full items-center gap-3 p-3 rounded-lg cursor-pointer transition-all ${
                                        isSelected
                                            ? "bg-primary/10 text-primary font-medium dark:bg-primary/20"
                                            : "hover:bg-accent/60 text-foreground"
                                    }`}
                                >
                                    <div className="relative shrink-0">
                                        <Avatar className="h-10 w-10 border border-border/50">
                                            <AvatarImage src={toProxiedImageUrl(otherUser?.avatar_url)} alt={displayName} />
                                            <AvatarFallback className="bg-primary/10 text-primary font-semibold text-xs">
                                                {initials.toUpperCase() || "DM"}
                                            </AvatarFallback>
                                        </Avatar>
                                    </div>

                                    <div className="min-w-0 flex-1">
                                        <div className="flex items-center justify-between gap-1 mb-0.5">
                                            <span className="text-sm font-semibold truncate text-foreground">
                                                {displayName}
                                            </span>
                                            {lastMsg?.created_at && (
                                                <span className="text-[11px] text-muted-foreground shrink-0">
                                                    {formatTime(lastMsg.created_at)}
                                                </span>
                                            )}
                                        </div>

                                        <div className="flex items-center justify-between gap-2">
                                            <p className={`min-w-0 flex-1 text-xs truncate ${hasUnread ? "font-semibold text-foreground" : "text-muted-foreground"}`}>
                                                {conversationPreview(lastMsg)}
                                            </p>
                                            {hasUnread && (
                                                <Badge className="shrink-0 bg-primary text-primary-foreground text-[10px] h-5 min-w-5 px-1.5 rounded-full flex items-center justify-center font-bold">
                                                    {conv.unread_count}
                                                </Badge>
                                            )}
                                        </div>
                                    </div>
                                </div>
                            );
                        })}
                    </div>
                )}
            </ScrollArea>
        </div>
    );
}

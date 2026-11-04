"use client";

import { useState, useEffect, useCallback, useRef } from "react";
import { useSearchParams } from "next/navigation";
import { ChatSidebar } from "@/components/chat/chat-sidebar";
import { ChatWindow } from "@/components/chat/chat-window";
import { NewChatModal } from "@/components/chat/new-chat-modal";
import { Conversation, Message } from "@/types/chat";
import { updateConversationPreview } from "@/lib/chat-message-state";
import { getConversations } from "@/lib/api/chat";
import { getCurrentUser } from "@/lib/api/employees";
import { toast } from "sonner";

export default function ChatPage() {
    const searchParams = useSearchParams();
    const urlConvId = searchParams.get("conversationId");

    const [conversations, setConversations] = useState<Conversation[]>([]);
    const [selectedId, setSelectedId] = useState<string | null>(null);
    const [loading, setLoading] = useState(true);
    const [newChatOpen, setNewChatOpen] = useState(false);
    const [currentUserId, setCurrentUserId] = useState<string | undefined>(undefined);
    const conversationsRequestRef = useRef(0);

    const loadConversations = useCallback(async (isSilent = false) => {
        if (!isSilent) setLoading(true);
        const requestId = ++conversationsRequestRef.current;
        try {
            const data = await getConversations();
            if (requestId === conversationsRequestRef.current) setConversations(data);
        } catch (err: any) {
            if (!isSilent) {
                toast.error("Failed to load conversations: " + (err?.message || "Unknown error"));
            }
        } finally {
            if (!isSilent) setLoading(false);
        }
    }, []);
    const refreshConversationsSilently = useCallback(() => {
        void loadConversations(true);
    }, [loadConversations]);
    const handleMessageChanged = useCallback((message: Message) => {
        ++conversationsRequestRef.current;
        setConversations(previous => updateConversationPreview(previous, message));
        void loadConversations(true);
    }, [loadConversations]);

    useEffect(() => {
        const refreshIfVisible = () => {
            if (document.visibilityState === "visible") void loadConversations(true);
        };
        const interval = window.setInterval(refreshIfVisible, 15000);
        document.addEventListener("visibilitychange", refreshIfVisible);
        window.addEventListener("focus", refreshIfVisible);

        return () => {
            window.clearInterval(interval);
            document.removeEventListener("visibilitychange", refreshIfVisible);
            window.removeEventListener("focus", refreshIfVisible);
        };
    }, [loadConversations]);

    useEffect(() => {
        if (urlConvId) {
            setSelectedId(urlConvId);
        }
    }, [urlConvId]);

    useEffect(() => {
        getCurrentUser().then((user) => {
            if (user) {
                setCurrentUserId(user.id);
            }
        }).catch(() => {
            toast.error("Unable to load your chat account. Please refresh and try again.");
        });

        loadConversations();
    }, [loadConversations]);

    const selectedConversation = conversations.find((c) => c.id === selectedId) || null;

    const handleConversationCreated = (newConv: Conversation) => {
        setConversations((prev) => {
            const exists = prev.find((c) => c.id === newConv.id);
            if (exists) return prev;
            return [newConv, ...prev];
        });
        setSelectedId(newConv.id);
    };

    return (
        <div className="flex min-h-0 w-full flex-1 overflow-hidden">
            {/* Sidebar List */}
            <div className={`min-h-0 w-full lg:w-64 xl:w-80 shrink-0 border-r border-border flex flex-col ${selectedId ? "hidden lg:flex" : "flex"}`}>
                <ChatSidebar
                    conversations={conversations}
                    selectedId={selectedId}
                    onSelectConversation={(conv) => setSelectedId(conv.id)}
                    onOpenNewChat={() => setNewChatOpen(true)}
                    loading={loading}
                    onRefresh={() => loadConversations(false)}
                />
            </div>

            {/* Main Chat Viewport */}
            <div className={`flex-1 flex flex-col min-h-0 min-w-0 ${!selectedId ? "hidden lg:flex" : "flex"}`}>
                <ChatWindow
                    conversation={selectedConversation}
                    currentUserId={currentUserId}
                    onMessageSent={refreshConversationsSilently}
                    onMessageChanged={handleMessageChanged}
                    onBack={() => setSelectedId(null)}
                />
            </div>

            {/* New Direct Chat Staff Picker Modal */}
            <NewChatModal
                open={newChatOpen}
                onOpenChange={setNewChatOpen}
                onConversationCreated={handleConversationCreated}
                currentUserId={currentUserId}
            />
        </div>
    );
}

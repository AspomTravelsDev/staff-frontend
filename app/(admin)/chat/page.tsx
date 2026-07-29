"use client";

import { useState, useEffect, useCallback } from "react";
import { useSearchParams } from "next/navigation";
import { ChatSidebar } from "@/components/chat/chat-sidebar";
import { ChatWindow } from "@/components/chat/chat-window";
import { NewChatModal } from "@/components/chat/new-chat-modal";
import { Conversation } from "@/types/chat";
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

    const loadConversations = useCallback(async (isSilent = false) => {
        if (!isSilent) setLoading(true);
        try {
            const data = await getConversations();
            setConversations(data);
        } catch (err: any) {
            if (!isSilent) {
                toast.error("Failed to load conversations: " + (err?.message || "Unknown error"));
            }
        } finally {
            if (!isSilent) setLoading(false);
        }
    }, []);

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
        <div className="flex h-[calc(100vh-6.5rem)] w-full overflow-hidden">
            {/* Sidebar List */}
            <div className={`w-full md:w-80 lg:w-96 shrink-0 border-r border-border flex flex-col ${selectedId ? "hidden md:flex" : "flex"}`}>
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
            <div className={`flex-1 flex flex-col min-w-0 ${!selectedId ? "hidden md:flex" : "flex"}`}>
                <ChatWindow
                    conversation={selectedConversation}
                    currentUserId={currentUserId}
                    onMessageSent={() => loadConversations(true)}
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

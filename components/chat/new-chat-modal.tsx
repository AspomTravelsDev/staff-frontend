"use client";

import { useState, useEffect } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Search, Loader2, UserPlus, Building2, MessageCircle } from "lucide-react";
import { getEmployees, Employee } from "@/lib/api/employees";
import { createConversation } from "@/lib/api/chat";
import { Conversation } from "@/types/chat";
import { toast } from "sonner";
import { getRoleLabel } from "@/types/user-types";
import { toProxiedImageUrl } from "@/lib/utils/image-url";

interface NewChatModalProps {
    open: boolean;
    onOpenChange: (open: boolean) => void;
    onConversationCreated: (conversation: Conversation) => void;
    currentUserId?: string;
}

export function NewChatModal({
    open,
    onOpenChange,
    onConversationCreated,
    currentUserId,
}: NewChatModalProps) {
    const [searchQuery, setSearchQuery] = useState("");
    const [employees, setEmployees] = useState<Employee[]>([]);
    const [loading, setLoading] = useState(false);
    const [creatingId, setCreatingId] = useState<string | null>(null);

    useEffect(() => {
        if (open) {
            fetchStaff();
        } else {
            setSearchQuery("");
        }
    }, [open]);

    async function fetchStaff() {
        setLoading(true);
        try {
            const response = await getEmployees({ status: "Active", limit: 100 });
            // Filter out current user if present
            const filtered = response.items.filter((emp) => emp.id !== currentUserId);
            setEmployees(filtered);
        } catch (err: any) {
            toast.error("Failed to load staff list: " + (err?.message || "Unknown error"));
        } finally {
            setLoading(false);
        }
    }

    async function handleStartChat(employee: Employee) {
        setCreatingId(employee.id);
        try {
            const conversation = await createConversation(employee.id);
            toast.success(`Chat started with ${employee.firstName} ${employee.lastName}`);
            onConversationCreated(conversation);
            onOpenChange(false);
        } catch (err: any) {
            toast.error(err?.message || "Failed to start conversation");
        } finally {
            setCreatingId(null);
        }
    }

    const filteredEmployees = employees.filter((emp) => {
        const query = searchQuery.toLowerCase();
        const fullName = `${emp.firstName} ${emp.lastName}`.toLowerCase();
        return (
            fullName.includes(query) ||
            emp.email.toLowerCase().includes(query) ||
            (emp.department && emp.department.toLowerCase().includes(query))
        );
    });

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent className="w-[calc(100vw-1rem)] max-h-[calc(100dvh-1rem)] gap-0 overflow-hidden p-0 sm:max-w-[500px]">
                <DialogHeader className="p-4 pb-3 sm:p-6 sm:pb-3">
                    <DialogTitle className="text-xl flex items-center gap-2">
                        <UserPlus className="h-5 w-5 text-primary" />
                        Start Direct Conversation
                    </DialogTitle>
                    <DialogDescription>
                        Select a staff member from the directory to start chatting.
                    </DialogDescription>
                </DialogHeader>

                <div className="px-4 pb-4 sm:px-6">
                    <div className="relative">
                        <Search className="absolute left-3 top-2.5 h-4 w-4 text-muted-foreground" />
                        <Input
                            placeholder="Search staff by name, email, or department..."
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                            className="pl-9"
                        />
                    </div>
                </div>

                <ScrollArea className="h-[min(52vh,24rem)] min-h-[180px] max-h-[calc(100dvh-12rem)] min-w-0 border-t px-3 py-2 sm:px-4">
                    {loading ? (
                        <div className="flex flex-col items-center justify-center h-48 gap-2 text-muted-foreground">
                            <Loader2 className="h-6 w-6 animate-spin text-primary" />
                            <span className="text-sm">Loading staff directory...</span>
                        </div>
                    ) : filteredEmployees.length === 0 ? (
                        <div className="flex flex-col items-center justify-center h-48 gap-1 text-center text-muted-foreground">
                            <p className="font-medium">No staff members found</p>
                            <p className="text-xs">Try adjusting your search filter.</p>
                        </div>
                    ) : (
                        <div className="space-y-1 py-1">
                            {filteredEmployees.map((emp) => {
                                const fullName = `${emp.firstName} ${emp.lastName}`;
                                const isCreating = creatingId === emp.id;
                                const initials = emp.firstName[0] + (emp.lastName[0] || "");

                                return (
                                    <button
                                        key={emp.id}
                                        type="button"
                                        disabled={creatingId !== null}
                                        onClick={() => handleStartChat(emp)}
                                        className="group flex w-full min-w-0 flex-col items-stretch gap-3 rounded-lg p-3 text-left transition-colors hover:bg-accent disabled:cursor-wait disabled:opacity-70 sm:flex-row sm:items-center sm:justify-between"
                                    >
                                        <div className="flex items-center gap-3 min-w-0">
                                            <Avatar className="h-11 w-11 shrink-0 border border-border">
                                                <AvatarImage src={toProxiedImageUrl(emp.image_url)} alt={fullName} />
                                                <AvatarFallback className="bg-primary/10 text-primary font-semibold text-xs">
                                                    {initials.toUpperCase()}
                                                </AvatarFallback>
                                            </Avatar>
                                            <div className="min-w-0 flex-1">
                                                <p className="font-medium text-sm text-foreground truncate group-hover:text-primary transition-colors">
                                                    {fullName}
                                                </p>
                                                <div className="flex min-w-0 flex-wrap items-center gap-x-2 gap-y-1 text-xs text-muted-foreground">
                                                    <span className="min-w-0 truncate">{emp.email}</span>
                                                    {emp.department && (
                                                        <>
                                                            <span className="hidden sm:inline">•</span>
                                                            <span className="flex min-w-0 items-center gap-1 truncate">
                                                                <Building2 className="h-3 w-3" />
                                                                <span className="truncate">{emp.department}</span>
                                                            </span>
                                                        </>
                                                    )}
                                                </div>
                                            </div>
                                        </div>

                                        <div className="flex items-center justify-between gap-2 pl-14 sm:justify-end sm:pl-0">
                                            <Badge variant="outline" className="max-w-full truncate text-[11px] font-normal sm:shrink-0">
                                                {getRoleLabel(emp.role)}
                                            </Badge>
                                            {isCreating ? (
                                                <Loader2 className="h-4 w-4 animate-spin text-primary" />
                                            ) : (
                                                <span className="flex shrink-0 items-center gap-1 text-xs text-primary sm:opacity-0 sm:transition-opacity sm:group-hover:opacity-100">
                                                    <MessageCircle className="h-3.5 w-3.5" />
                                                    <span className="sm:sr-only">Start chat</span>
                                                </span>
                                            )}
                                        </div>
                                    </button>
                                );
                            })}
                        </div>
                    )}
                </ScrollArea>
            </DialogContent>
        </Dialog>
    );
}

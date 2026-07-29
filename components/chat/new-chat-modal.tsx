"use client";

import { useState, useEffect } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Search, Loader2, UserPlus, Building2 } from "lucide-react";
import { getEmployees, Employee } from "@/lib/api/employees";
import { createConversation } from "@/lib/api/chat";
import { Conversation } from "@/types/chat";
import { toast } from "sonner";
import { getRoleLabel } from "@/types/user-types";

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
            <DialogContent className="sm:max-w-[500px] p-0 overflow-hidden">
                <DialogHeader className="p-6 pb-2">
                    <DialogTitle className="text-xl flex items-center gap-2">
                        <UserPlus className="h-5 w-5 text-primary" />
                        Start Direct Conversation
                    </DialogTitle>
                    <DialogDescription>
                        Select a staff member from the directory to start chatting.
                    </DialogDescription>
                </DialogHeader>

                <div className="px-6 py-2">
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

                <ScrollArea className="h-[340px] px-6 py-2 border-t">
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
                                    <div
                                        key={emp.id}
                                        onClick={() => !isCreating && handleStartChat(emp)}
                                        className="flex items-center justify-between p-3 rounded-lg hover:bg-accent transition-colors cursor-pointer group"
                                    >
                                        <div className="flex items-center gap-3 min-w-0">
                                            <Avatar className="h-10 w-10 border border-border">
                                                <AvatarImage src={emp.image_url || undefined} alt={fullName} />
                                                <AvatarFallback className="bg-primary/10 text-primary font-semibold text-xs">
                                                    {initials.toUpperCase()}
                                                </AvatarFallback>
                                            </Avatar>
                                            <div className="min-w-0 flex-1">
                                                <p className="font-medium text-sm text-foreground truncate group-hover:text-primary transition-colors">
                                                    {fullName}
                                                </p>
                                                <div className="flex items-center gap-2 text-xs text-muted-foreground truncate">
                                                    <span>{emp.email}</span>
                                                    {emp.department && (
                                                        <>
                                                            <span>•</span>
                                                            <span className="flex items-center gap-1">
                                                                <Building2 className="h-3 w-3" />
                                                                {emp.department}
                                                            </span>
                                                        </>
                                                    )}
                                                </div>
                                            </div>
                                        </div>

                                        <div className="flex items-center gap-2">
                                            <Badge variant="outline" className="text-[11px] font-normal shrink-0">
                                                {getRoleLabel(emp.role)}
                                            </Badge>
                                            {isCreating ? (
                                                <Loader2 className="h-4 w-4 animate-spin text-primary" />
                                            ) : (
                                                <Button size="sm" variant="ghost" className="h-8 px-2 text-xs opacity-0 group-hover:opacity-100 transition-opacity">
                                                    Chat
                                                </Button>
                                            )}
                                        </div>
                                    </div>
                                );
                            })}
                        </div>
                    )}
                </ScrollArea>
            </DialogContent>
        </Dialog>
    );
}

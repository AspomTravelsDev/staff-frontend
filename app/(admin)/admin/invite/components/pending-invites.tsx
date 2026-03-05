"use client";

import { InviteRecord } from "@/lib/auth/api";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  IconMail,
  IconTrash,
  IconUserCheck,
  IconClock,
  IconCalendarEvent,
} from "@tabler/icons-react";
import { format } from "date-fns";
import { deleteInviteAction } from "../actions";
import { useState, useTransition } from "react";
import { toast } from "sonner";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";

interface PendingInvitesProps {
  invites: InviteRecord[];
}

export function PendingInvites({ invites }: PendingInvitesProps) {
  const [isPending, startTransition] = useTransition();
  const [deletingId, setDeletingId] = useState<string | null>(null);

  const handleDelete = (id: string) => {
    setDeletingId(id);
    startTransition(async () => {
      try {
        await deleteInviteAction(id);
        toast.success("Invitation cancelled successfully");
      } catch (error: any) {
        toast.error(error.message || "Failed to cancel invitation");
      } finally {
        setDeletingId(null);
      }
    });
  };

  if (invites.length === 0) {
    return null;
  }

  return (
    <Card className="w-full mt-8">
      <CardHeader className="bg-muted/30 pb-6 rounded-t-xl mb-2">
        <div className="flex items-center gap-3">
          <div className="p-2.5 bg-primary/10 rounded-lg shrink-0">
            <IconMail className="h-6 w-6 text-primary" />
          </div>
          <div>
            <CardTitle className="text-xl">Pending Invitations</CardTitle>
            <CardDescription className="mt-1">
              Invitations that have been sent but not yet used. You can cancel
              these to revoke access or resend a new one.
            </CardDescription>
          </div>
        </div>
      </CardHeader>
      <CardContent className="p-0">
        <div className="overflow-x-auto">
          <Table>
            <TableHeader>
              <TableRow className="hover:bg-transparent border-b bg-muted/50">
                <TableHead className="w-[30%] py-4 px-6 font-semibold uppercase text-[11px] tracking-wider">
                  Email & Role
                </TableHead>
                <TableHead className="w-[20%] py-4 px-6 font-semibold uppercase text-[11px] tracking-wider">
                  Sent On
                </TableHead>
                <TableHead className="w-[20%] py-4 px-6 font-semibold uppercase text-[11px] tracking-wider">
                  Expires
                </TableHead>
                <TableHead className="w-[15%] py-4 px-6 font-semibold uppercase text-[11px] tracking-wider">
                  Status
                </TableHead>
                <TableHead className="w-[15%] py-4 px-6 text-right font-semibold uppercase text-[11px] tracking-wider">
                  Actions
                </TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {invites.map((invite) => {
                const isExpired = new Date(invite.expires_at) < new Date();
                return (
                  <TableRow key={invite.id} className="group hover:bg-muted/30">
                    <TableCell className="py-4 px-6">
                      <div className="flex flex-col gap-0.5">
                        <span className="font-semibold text-foreground">
                          {invite.email}
                        </span>
                        <div className="flex items-center gap-1.5 text-muted-foreground text-xs uppercase tracking-tight">
                          <IconUserCheck className="h-3 w-3" />
                          {invite.role} • {invite.department || "No Department"}
                        </div>
                      </div>
                    </TableCell>
                    <TableCell className="py-4 px-6">
                      <div className="flex items-center gap-2 text-sm text-muted-foreground">
                        <IconCalendarEvent className="h-4 w-4" />
                        {format(new Date(invite.created_at), "MMM d, yyyy")}
                      </div>
                    </TableCell>
                    <TableCell className="py-4 px-6">
                      <div className="flex items-center gap-2 text-sm text-muted-foreground">
                        <IconClock className="h-4 w-4" />
                        {format(new Date(invite.expires_at), "MMM d, h:mm a")}
                      </div>
                    </TableCell>
                    <TableCell className="py-4 px-6">
                      {isExpired ? (
                        <Badge variant="destructive" className="font-bold">
                          Expired
                        </Badge>
                      ) : (
                        <Badge
                          variant="secondary"
                          className="bg-green-100 text-green-700 hover:bg-green-100 border-none font-bold"
                        >
                          Active
                        </Badge>
                      )}
                    </TableCell>
                    <TableCell className="py-4 px-6 text-right">
                      <AlertDialog>
                        <AlertDialogTrigger asChild>
                          <Button
                            variant="ghost"
                            size="icon"
                            disabled={isPending && deletingId === invite.id}
                            className="text-muted-foreground hover:text-destructive hover:bg-destructive/10 transition-colors"
                          >
                            <IconTrash className="h-4 w-4" />
                          </Button>
                        </AlertDialogTrigger>
                        <AlertDialogContent>
                          <AlertDialogHeader>
                            <AlertDialogTitle>
                              Cancel Invitation
                            </AlertDialogTitle>
                            <AlertDialogDescription>
                              Are you sure you want to cancel the invitation for{" "}
                              <strong>{invite.email}</strong>? The user will no
                              longer be able to use the previous link to setup
                              their account.
                            </AlertDialogDescription>
                          </AlertDialogHeader>
                          <AlertDialogFooter>
                            <AlertDialogCancel>Keep Invite</AlertDialogCancel>
                            <AlertDialogAction
                              onClick={() => handleDelete(invite.id)}
                              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                            >
                              Yes, Cancel Invitation
                            </AlertDialogAction>
                          </AlertDialogFooter>
                        </AlertDialogContent>
                      </AlertDialog>
                    </TableCell>
                  </TableRow>
                );
              })}
            </TableBody>
          </Table>
        </div>
      </CardContent>
    </Card>
  );
}

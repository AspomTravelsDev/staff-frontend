"use client";

import { Copy, Eye, MoreHorizontal, Trash } from "lucide-react";
import Link from "next/link";
import { toast } from "sonner";
import { useTransition } from "react";

import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { deleteApplicationAction } from "../actions";

interface ApplicationActionsProps {
  id: string;
  step: number;
}

export function ApplicationActions({ id, step }: ApplicationActionsProps) {
  const [isPending, startTransition] = useTransition();

  const onCopyLink = () => {
    const url = `${window.location.origin}/applicant/${id}/1`;
    navigator.clipboard.writeText(url);
    toast.success("Link copied to clipboard");
  };

  const onDelete = () => {
    toast.promise(
      new Promise((resolve, reject) => {
        startTransition(async () => {
          try {
            await deleteApplicationAction(id);
            resolve(true);
          } catch (error) {
            reject(error);
          }
        });
      }),
      {
        loading: "Deleting application...",
        success: "Application deleted",
        error: "Failed to delete application",
      },
    );
  };

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="ghost" className="h-8 w-8 p-0">
          <span className="sr-only">Open menu</span>
          <MoreHorizontal className="h-4 w-4" />
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end">
        <DropdownMenuLabel>Actions</DropdownMenuLabel>
        <DropdownMenuItem onClick={onCopyLink}>
          <Copy className="mr-2 h-4 w-4" />
          Copy Link
        </DropdownMenuItem>
        <DropdownMenuItem asChild>
          <Link href={`/hr/applications/${id}`}>
            <Eye className="mr-2 h-4 w-4" />
            View
          </Link>
        </DropdownMenuItem>
        <DropdownMenuSeparator />
        <DropdownMenuItem
          onClick={onDelete}
          disabled={isPending}
          className="text-red-600 focus:text-red-600 focus:bg-red-50"
        >
          <Trash className="mr-2 h-4 w-4" />
          Delete
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}

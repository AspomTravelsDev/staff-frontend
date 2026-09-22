"use client";

import { useState } from "react";
import { Copy, Check, ChevronDown, List, FileText } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { toast } from "sonner";
import {
  formatTasksForWhatsApp,
  copyToClipboard,
} from "@/lib/utils/task-whatsapp-format";
import type { TaskItem } from "@/types/task-types";
import { cn } from "@/lib/utils";

interface CopyTasksButtonProps {
  tasks: Array<TaskItem | { text: string; completed?: boolean }>;
  date?: string | Date | null;
  userName?: string | null;
  staffId?: string | null;
  department?: string | null;
  isSubmitted?: boolean;
  variant?: "default" | "outline" | "secondary" | "ghost";
  size?: "default" | "sm" | "lg" | "icon";
  className?: string;
  showDropdown?: boolean;
  label?: string;
  iconOnly?: boolean;
}

export function CopyTasksButton({
  tasks,
  date,
  userName,
  staffId,
  department,
  isSubmitted = false,
  variant = "outline",
  size = "sm",
  className,
  showDropdown = true,
  label = "Copy for WhatsApp",
  iconOnly = false,
}: CopyTasksButtonProps) {
  const [copied, setCopied] = useState(false);

  const handleCopy = async (tasksOnly = false) => {
    const validTasks = (tasks || []).filter((t) => t.text && t.text.trim() !== "");

    if (validTasks.length === 0) {
      toast.error("No tasks to copy");
      return;
    }

    const textToCopy = formatTasksForWhatsApp({
      tasks: validTasks,
      date,
      userName,
      staffId,
      department,
      isSubmitted,
      tasksOnly,
    });

    const success = await copyToClipboard(textToCopy);

    if (success) {
      setCopied(true);
      toast.success(
        tasksOnly
          ? "Task list copied to clipboard!"
          : "Copied to clipboard for WhatsApp!"
      );
      setTimeout(() => setCopied(false), 2000);
    } else {
      toast.error("Could not copy to clipboard");
    }
  };

  if (iconOnly) {
    return (
      <TooltipProvider>
        <Tooltip>
          <TooltipTrigger asChild>
            <Button
              variant={variant}
              size="icon"
              className={cn("h-8 w-8 transition-colors", className)}
              onClick={() => handleCopy(false)}
              aria-label={label}
            >
              {copied ? (
                <Check className="h-4 w-4 text-green-600 dark:text-green-400" />
              ) : (
                <Copy className="h-4 w-4 text-muted-foreground" />
              )}
            </Button>
          </TooltipTrigger>
          <TooltipContent side="top">
            <p className="text-xs">{copied ? "Copied!" : label}</p>
          </TooltipContent>
        </Tooltip>
      </TooltipProvider>
    );
  }

  if (!showDropdown) {
    return (
      <Button
        variant={variant}
        size={size}
        onClick={() => handleCopy(false)}
        className={cn(
          "gap-1.5 transition-colors border-emerald-600/30 hover:border-emerald-600 hover:bg-emerald-50 dark:hover:bg-emerald-950/20 text-foreground",
          className
        )}
      >
        {copied ? (
          <Check className="h-4 w-4 text-green-600 dark:text-green-400" />
        ) : (
          <Copy className="h-4 w-4 text-emerald-600 dark:text-emerald-400" />
        )}
        <span>{copied ? "Copied!" : label}</span>
      </Button>
    );
  }

  return (
    <div className={cn("inline-flex items-center rounded-md", className)}>
      <Button
        variant={variant}
        size={size}
        onClick={() => handleCopy(false)}
        className={cn(
          "gap-1.5 rounded-r-none border-emerald-600/30 hover:border-emerald-600 hover:bg-emerald-50 dark:hover:bg-emerald-950/20 text-foreground transition-colors",
          size === "sm" ? "h-8 px-3" : ""
        )}
      >
        {copied ? (
          <Check className="h-3.5 w-3.5 text-green-600 dark:text-green-400" />
        ) : (
          <Copy className="h-3.5 w-3.5 text-emerald-600 dark:text-emerald-400" />
        )}
        <span>{copied ? "Copied!" : label}</span>
      </Button>
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button
            variant={variant}
            size={size}
            className={cn(
              "px-1.5 rounded-l-none border-l-0 border-emerald-600/30 hover:border-emerald-600 hover:bg-emerald-50 dark:hover:bg-emerald-950/20",
              size === "sm" ? "h-8" : ""
            )}
            aria-label="More copy options"
          >
            <ChevronDown className="h-3.5 w-3.5 opacity-60" />
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end" className="w-56">
          <DropdownMenuItem onClick={() => handleCopy(false)} className="gap-2 text-xs">
            <FileText className="h-3.5 w-3.5 text-emerald-600" />
            <span>Copy Full Report (WhatsApp)</span>
          </DropdownMenuItem>
          <DropdownMenuItem onClick={() => handleCopy(true)} className="gap-2 text-xs">
            <List className="h-3.5 w-3.5 text-muted-foreground" />
            <span>Copy Task List Only</span>
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>
    </div>
  );
}

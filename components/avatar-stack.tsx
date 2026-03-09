"use client";

import * as React from "react";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { cn, getProxiedImageUrl } from "@/lib/utils";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";

interface User {
  id: string;
  name: string;
  image_url: string | null;
}

interface AvatarStackProps {
  users: User[];
  limit?: number;
  className?: string;
  avatarClassName?: string;
}

export function AvatarStack({
  users,
  limit = 5,
  className,
  avatarClassName,
}: AvatarStackProps) {
  if (!users || users.length === 0) return null;

  const displayUsers = users.slice(0, limit);
  const remainingCount = users.length - limit;

  return (
    <TooltipProvider delayDuration={100}>
      <div className={cn("flex items-center -space-x-3", className)}>
        {displayUsers.map((user) => (
          <Tooltip key={user.id}>
            <TooltipTrigger asChild>
              <Avatar
                className={cn(
                  "ring-2 ring-background transition-all duration-300 hover:-translate-y-1 hover:z-10 cursor-default",
                  avatarClassName,
                )}
              >
                {user.image_url && (
                  <AvatarImage
                    src={getProxiedImageUrl(user.image_url)}
                    alt={user.name}
                    className="object-cover object-top"
                  />
                )}
                <AvatarFallback className="text-[10px] font-bold">
                  {user.name
                    .split(" ")
                    .map((n) => n[0])
                    .join("")
                    .toUpperCase()
                    .slice(0, 2)}
                </AvatarFallback>
              </Avatar>
            </TooltipTrigger>
            <TooltipContent side="top">
              <p className="text-xs font-semibold">{user.name}</p>
            </TooltipContent>
          </Tooltip>
        ))}

        {remainingCount > 0 && (
          <Avatar
            className={cn(
              "ring-2 ring-background bg-muted flex items-center justify-center cursor-default",
              avatarClassName,
            )}
          >
            <AvatarFallback className="text-[10px] font-black text-primary">
              +{remainingCount}
            </AvatarFallback>
          </Avatar>
        )}

        <div className="ml-5">
          <p className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest">
            Read by {users.length} {users.length === 1 ? "person" : "people"}
          </p>
        </div>
      </div>
    </TooltipProvider>
  );
}

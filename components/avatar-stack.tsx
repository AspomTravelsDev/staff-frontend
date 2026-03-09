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
import { motion, AnimatePresence } from "framer-motion";

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
  limit = 8, // Increased default limit for better stack visualization
  className,
  avatarClassName,
}: AvatarStackProps) {
  const [isHovered, setIsHovered] = React.useState(false);

  if (!users || users.length === 0) return null;

  const displayUsers = isHovered ? users : users.slice(0, limit);
  const remainingCount = users.length - limit;

  return (
    <TooltipProvider delayDuration={100}>
      <motion.div
        className={cn("flex items-center cursor-pointer py-2", className)}
        onMouseEnter={() => setIsHovered(true)}
        onMouseLeave={() => setIsHovered(false)}
        initial={false}
      >
        <div className="flex items-center -space-x-3 relative">
          <AnimatePresence mode="popLayout">
            {displayUsers.map((user, index) => (
              <motion.div
                key={user.id}
                layout
                initial={{ opacity: 0, x: -10, scale: 0.8 }}
                animate={{
                  opacity: 1,
                  x: isHovered ? index * 4 : 0, // Spread out when hovered
                  scale: 1,
                  zIndex: users.length - index,
                }}
                exit={{ opacity: 0, scale: 0.5, x: -10 }}
                transition={{
                  type: "spring",
                  stiffness: 300,
                  damping: 25,
                  mass: 0.5,
                }}
              >
                <Tooltip>
                  <TooltipTrigger asChild>
                    <Avatar
                      className={cn(
                        "ring-2 ring-background transition-shadow duration-300 hover:ring-primary/50",
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
              </motion.div>
            ))}
          </AnimatePresence>

          {!isHovered && remainingCount > 0 && (
            <motion.div
              layout
              initial={{ opacity: 0, scale: 0.8 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.5 }}
            >
              <Avatar
                className={cn(
                  "ring-2 ring-background bg-muted flex items-center justify-center",
                  avatarClassName,
                )}
              >
                <AvatarFallback className="text-[10px] font-black text-primary">
                  +{remainingCount}
                </AvatarFallback>
              </Avatar>
            </motion.div>
          )}
        </div>

        <motion.div
          layout
          className="ml-6"
          animate={{ x: isHovered ? displayUsers.length * 4 : 0 }}
          transition={{ type: "spring", stiffness: 300, damping: 25 }}
        >
          <p className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest whitespace-nowrap">
            Read by {users.length} {users.length === 1 ? "person" : "people"}
          </p>
        </motion.div>
      </motion.div>
    </TooltipProvider>
  );
}

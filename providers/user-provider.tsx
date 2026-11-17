"use client";

import { createContext, useContext, useEffect, ReactNode } from "react";
import { installSessionRecovery } from "@/lib/auth/browser-session";
import { User } from "@/types/user-types";

interface UserContextType {
  user: User | null;
}

const UserContext = createContext<UserContextType | undefined>(undefined);

interface UserProviderProps {
  children: ReactNode;
  user: User | null;
}

export function UserProvider({ children, user }: UserProviderProps) {
  useEffect(() => user ? installSessionRecovery() : undefined, [user]);
  return (
    <UserContext.Provider value={{ user }}>{children}</UserContext.Provider>
  );
}

export function useUser() {
  const context = useContext(UserContext);
  if (context === undefined) {
    throw new Error("useUser must be used within a UserProvider");
  }
  return context;
}

export function useOptionalUser() {
  return useContext(UserContext);
}

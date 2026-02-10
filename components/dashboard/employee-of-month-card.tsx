"use client";

import { Card, CardContent, CardTitle } from "@/components/ui/card";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Crown, Sparkles, Loader2 } from "lucide-react";
import { useEmployeeOfTheMonth } from "@/lib/api/hooks/use-dashboard";

export function EmployeeOfTheMonthCard() {
  const { data: employee, isLoading } = useEmployeeOfTheMonth();

  if (isLoading) {
    return (
      <Card className="flex flex-col justify-between h-full w-full lg:w-2/7">
        <CardContent className="flex flex-1 flex-col items-center justify-center p-4">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
        </CardContent>
      </Card>
    );
  }

  if (!employee) return null;

  return (
    <Card className="flex flex-col justify-between h-full w-full lg:w-2/7">
      <CardContent className="flex flex-1 flex-col items-center justify-center p-4 text-center mt-6">
        <div className="relative mb-6 group">
          {/* Glow effect */}
          <div className="absolute inset-0 bg-primary/20 blur-3xl rounded-full scale-110 animate-pulse" />

          {/* Crown Icon */}
          <Crown className="absolute -top-8 left-1/2 -translate-x-1/2 h-10 w-10 text-primary fill-primary animate-bounce z-10 drop-shadow-md" />

          {/* Sparkles */}
          <Sparkles className="absolute -left-6 top-0 h-6 w-6 text-primary fill-primary/20 animate-pulse" />
          <Sparkles className="absolute -right-6 top-8 h-5 w-5 text-primary fill-primary/20 animate-pulse delay-75" />
          <Sparkles className="absolute -left-2 bottom-0 h-4 w-4 text-primary fill-primary/20 animate-pulse delay-150" />
          <Sparkles className="absolute -right-4 -bottom-2 h-7 w-7 text-primary fill-primary/20 animate-bounce delay-300" />

          <Avatar className="h-48 w-48 rounded-xl ring-4 ring-primary ring-offset-4 ring-offset-background shadow-2xl relative z-0 transition-transform duration-500 group-hover:scale-105">
            <AvatarImage
              src={employee.image}
              alt={employee.name}
              className="object-cover"
            />
            <AvatarFallback>{employee.initials}</AvatarFallback>
          </Avatar>
        </div>
        <CardTitle className="text-center">Employee of the Month</CardTitle>
        <h3 className="font-bold text-lg">{employee.name}</h3>
        <p className="text-sm text-muted-foreground">{employee.role}</p>
      </CardContent>
    </Card>
  );
}

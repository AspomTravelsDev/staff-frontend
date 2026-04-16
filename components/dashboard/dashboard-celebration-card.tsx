import { Card, CardContent, CardTitle } from "@/components/ui/card";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Crown, Cake, Sparkles, Gift, Heart, Stars } from "lucide-react";
import { Employee } from "@/lib/api/employees";
import { toProxiedImageUrl } from "@/lib/utils/image-url";
import Link from "next/link";
import { Badge } from "@/components/ui/badge";

interface DashboardCelebrationCardProps {
  employeeOfTheMonth?: {
    name: string;
    role: string;
    image?: string | null;
    initials: string;
  };
  todayBirthdays: Employee[];
}

export function DashboardCelebrationCard({
  employeeOfTheMonth,
  todayBirthdays,
}: DashboardCelebrationCardProps) {
  const isBirthday = todayBirthdays.length > 0;

  if (isBirthday) {
    const primaryBirthday = todayBirthdays[0];
    const birthdayNames = todayBirthdays.map((e) => e.firstName).join(" & ");

    return (
      <Card className="flex flex-col justify-between h-full w-full lg:w-2/7 overflow-hidden border-pink-200 bg-linear-to-b from-white to-pink-50/30">
        <CardContent className="flex flex-1 flex-col items-center justify-center p-6 text-center mt-4">
          <div className="relative mb-6 group">
            {/* Glow effect */}
            <div className="absolute inset-0 bg-pink-500/20 blur-3xl rounded-full scale-110 animate-pulse" />

            {/* Cake Icon */}
            <Cake className="absolute -top-8 left-1/2 -translate-x-1/2 h-10 w-10 text-pink-500 animate-bounce z-10 drop-shadow-md" />

            {/* Celebration Icons */}
            <Gift className="absolute -left-6 top-0 h-6 w-6 text-pink-500 animate-pulse" />
            <Sparkles className="absolute -right-6 top-8 h-5 w-5 text-pink-500 animate-pulse delay-75" />
            <Heart className="absolute -left-2 bottom-0 h-4 w-4 text-pink-500 animate-pulse delay-150" />
            <Stars className="absolute -right-4 -bottom-2 h-7 w-7 text-pink-500 animate-bounce delay-300" />

            <Avatar className="h-48 w-48 rounded-xl ring-4 ring-pink-500 ring-offset-4 ring-offset-background shadow-2xl relative z-0 transition-transform duration-500 group-hover:scale-105">
              <AvatarImage
                src={toProxiedImageUrl(primaryBirthday.image_url)}
                alt={primaryBirthday.firstName}
                className="object-cover object-top"
              />
              <AvatarFallback className="bg-pink-100 text-pink-700 text-2xl font-bold">
                {primaryBirthday.firstName[0]}
                {primaryBirthday.lastName[0]}
              </AvatarFallback>
            </Avatar>
          </div>

          <Badge className="mb-2 bg-pink-500 hover:bg-pink-600 animate-in fade-in zoom-in duration-500">
            TODAY&apos;S BIRTHDAY! 🎂
          </Badge>

          <CardTitle className="text-center mb-1">Happy Birthday!</CardTitle>
          <h3 className="font-bold text-xl text-pink-700 mb-1">
            {birthdayNames}
          </h3>
          <p className="text-sm text-muted-foreground mb-4">
            Celebrating{" "}
            {todayBirthdays.length > 1
              ? "our awesome colleagues"
              : "an awesome colleague"}{" "}
            today!
          </p>
        </CardContent>
      </Card>
    );
  }

  // Fallback to Employee of the Month
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
            {employeeOfTheMonth ? (
              <>
                <AvatarImage
                  src={employeeOfTheMonth.image || ""}
                  alt={employeeOfTheMonth.name}
                  className="object-cover object-top"
                />
                <AvatarFallback>{employeeOfTheMonth.initials}</AvatarFallback>
              </>
            ) : (
              <AvatarFallback className="bg-muted">
                <Crown className="h-12 w-12 text-primary/40" />
              </AvatarFallback>
            )}
          </Avatar>
        </div>
        <CardTitle className="text-center">Employee of the Month</CardTitle>
        {employeeOfTheMonth ? (
          <>
            <h3 className="font-bold text-lg">{employeeOfTheMonth.name}</h3>
            <p className="text-sm text-muted-foreground">
              {employeeOfTheMonth.role}
            </p>
          </>
        ) : (
          <>
            <h3 className="font-bold text-lg">To be announced</h3>
            <p className="text-sm text-muted-foreground">
              Keep up the great work!
            </p>
          </>
        )}
      </CardContent>
    </Card>
  );
}

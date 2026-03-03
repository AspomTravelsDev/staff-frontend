"use client";

import { useEffect, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { getUpcomingBirthdays, Employee } from "@/lib/api/employees";
import { Cake, ChevronRight, Gift } from "lucide-react";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { format, isToday, parseISO } from "date-fns";
import { toProxiedImageUrl } from "@/lib/utils/image-url";
import Link from "next/link";
import { Skeleton } from "@/components/ui/skeleton";

export function UpcomingBirthdaysCard() {
  const [birthdays, setBirthdays] = useState<Employee[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    getUpcomingBirthdays()
      .then(setBirthdays)
      .finally(() => setIsLoading(false));
  }, []);

  if (isLoading) {
    return (
      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">
            Upcoming Birthdays
          </CardTitle>
          <Cake className="h-4 w-4 text-muted-foreground" />
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {[1, 2, 3].map((i) => (
              <div key={i} className="flex items-center gap-3">
                <Skeleton className="h-9 w-9 rounded-full" />
                <div className="space-y-1">
                  <Skeleton className="h-4 w-24" />
                  <Skeleton className="h-3 w-16" />
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="overflow-hidden">
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2 bg-linear-to-r from-pink-500/10 to-transparent">
        <CardTitle className="text-sm font-medium flex items-center gap-2">
          <Cake className="h-4 w-4 text-pink-500" />
          Birthdays This Month
        </CardTitle>
        <span className="text-xs text-muted-foreground font-normal">
          {format(new Date(), "MMMM yyyy")}
        </span>
      </CardHeader>
      <CardContent className="pt-4">
        <div className="space-y-4">
          {birthdays.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-6 text-center">
              <Gift className="h-8 w-8 text-muted-foreground/30 mb-2" />
              <p className="text-sm text-muted-foreground">
                No birthdays this month
              </p>
            </div>
          ) : (
            birthdays.map((employee) => {
              const birthdayDate = employee.dob ? parseISO(employee.dob) : null;
              const isEmployeeBirthdayToday = birthdayDate
                ? isToday(birthdayDate)
                : false;

              return (
                <div
                  key={employee.id}
                  className="group relative flex items-center gap-3 p-1 rounded-lg hover:bg-muted/50 transition-colors"
                >
                  <Avatar className="h-9 w-9 ring-offset-background group-hover:ring-2 group-hover:ring-pink-500 transition-all">
                    <AvatarImage
                      src={toProxiedImageUrl(employee.dob)}
                      alt={`${employee.firstName} ${employee.lastName}`}
                    />
                    <AvatarFallback className="bg-pink-100 text-pink-700 text-xs">
                      {employee.firstName[0]}
                      {employee.lastName[0]}
                    </AvatarFallback>
                  </Avatar>

                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium leading-none truncate flex items-center gap-1">
                      {employee.firstName} {employee.lastName}
                      {isEmployeeBirthdayToday && (
                        <span className="inline-flex h-2 w-2 rounded-full bg-pink-500 animate-pulse" />
                      )}
                    </p>
                    <p className="text-xs text-muted-foreground mt-1">
                      {birthdayDate ? (
                        isEmployeeBirthdayToday ? (
                          <span className="text-pink-600 font-medium">
                            Today! 🎂
                          </span>
                        ) : (
                          format(birthdayDate, "do MMMM")
                        )
                      ) : (
                        "Date N/A"
                      )}
                    </p>
                  </div>

                  <Link
                    href={`/hr/employees/${employee.id}`}
                    className="opacity-0 group-hover:opacity-100 transition-opacity"
                  >
                    <ChevronRight className="h-4 w-4 text-muted-foreground" />
                  </Link>
                </div>
              );
            })
          )}
        </div>
      </CardContent>
    </Card>
  );
}

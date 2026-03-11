import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { getUpcomingBirthdays } from "@/lib/api/employees";
import { Cake, ChevronRight, Gift } from "lucide-react";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { format, isToday, parseISO } from "date-fns";
import { toProxiedImageUrl } from "@/lib/utils/image-url";
import Link from "next/link";

export async function UpcomingBirthdaysCard() {
  const birthdays = await getUpcomingBirthdays().catch(() => []);

  return (
    <Card className="overflow-hidden">
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2 bg-linear-to-r from-pink-500/10 dark:from-pink-500/20 to-transparent">
        <div className="flex flex-col gap-1">
          <CardTitle className="text-sm font-medium flex items-center gap-2">
            <Cake className="h-4 w-4 text-pink-500 dark:text-pink-400" />
            Birthdays This Month
          </CardTitle>
          <span className="text-xs text-muted-foreground font-normal">
            {format(new Date(), "MMMM yyyy")}
          </span>
        </div>
        <Link
          href="/hr/birthdays"
          className="text-xs font-medium text-pink-600 dark:text-pink-400 hover:text-pink-700 dark:hover:text-pink-300 hover:underline transition-colors"
        >
          View All
        </Link>
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
                  <Avatar className="h-9 w-9 ring-offset-background group-hover:ring-2 group-hover:ring-pink-500 dark:group-hover:ring-pink-400 transition-all">
                    <AvatarImage
                      src={toProxiedImageUrl(employee.image_url)}
                      alt={`${employee.firstName} ${employee.lastName}`}
                    />
                    <AvatarFallback className="bg-pink-100 dark:bg-pink-900/40 text-pink-700 dark:text-pink-300 text-xs uppercase">
                      {employee.firstName[0]}
                      {employee.lastName[0]}
                    </AvatarFallback>
                  </Avatar>

                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium leading-none truncate flex items-center gap-1">
                      {employee.firstName} {employee.lastName}
                      {isEmployeeBirthdayToday && (
                        <span className="inline-flex h-2 w-2 rounded-full bg-pink-500 dark:bg-pink-400 animate-pulse" />
                      )}
                    </p>
                    <p className="text-xs text-muted-foreground mt-1">
                      {birthdayDate ? (
                        isEmployeeBirthdayToday ? (
                          <span className="text-pink-600 dark:text-pink-400 font-medium">
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
                </div>
              );
            })
          )}
        </div>
      </CardContent>
    </Card>
  );
}

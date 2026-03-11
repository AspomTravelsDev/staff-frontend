import {
  getUpcomingBirthdays,
  getTodayBirthdays,
  Employee,
} from "@/lib/api/employees";
import { format, parseISO } from "date-fns";
import { Cake, Gift, Calendar, ChevronRight } from "lucide-react";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { toProxiedImageUrl } from "@/lib/utils/image-url";
import Link from "next/link";
import { Badge } from "@/components/ui/badge";

// --- Sub-components ---

function BirthdayHero({ todayBirthdays }: { todayBirthdays: Employee[] }) {
  if (todayBirthdays.length === 0) return null;

  return (
    <div className="relative overflow-hidden rounded-3xl bg-linear-to-r from-pink-500 to-rose-400 p-8 text-white shadow-xl">
      <div className="relative z-10 flex flex-col md:flex-row items-center gap-8 text-center md:text-left">
        <div className="h-32 w-32 rounded-full border-4 border-white/30 p-1 bg-white/10 backdrop-blur-sm animate-bounce-slow">
          <div className="flex h-full w-full items-center justify-center rounded-full bg-white/20">
            <Cake className="h-16 w-16" />
          </div>
        </div>
        <div className="flex-1 space-y-4">
          <Badge
            variant="outline"
            className="bg-white/20 text-white border-white/40 backdrop-blur-sm px-4 py-1 text-sm font-semibold uppercase tracking-wider"
          >
            TODAY&apos;S BIRTHDAY 🎂
          </Badge>
          <h2 className="text-4xl md:text-5xl font-black tracking-tight">
            Happy Birthday, {todayBirthdays.map((e) => e.firstName).join(" & ")}
            !
          </h2>
          <div className="flex flex-wrap justify-center md:justify-start gap-4 pt-2">
            {todayBirthdays.map((employee) => (
              <div
                key={employee.id}
                className="flex items-center gap-3 bg-white/10 transition-colors backdrop-blur-sm rounded-full pl-1 pr-4 py-1 border border-white/20 group"
              >
                <Avatar className="h-10 w-10 border-2 border-white/50 p">
                  <AvatarImage
                    src={toProxiedImageUrl(employee.image_url)}
                    className="object-cover object-top"
                  />
                  <AvatarFallback className="bg-pink-100 text-pink-700">
                    {employee.firstName[0]}
                    {employee.lastName[0]}
                  </AvatarFallback>
                </Avatar>
                <span className="font-bold text-lg">
                  {employee.firstName} {employee.lastName}
                </span>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Decorative Elements */}
      <div className="absolute -right-20 -top-20 h-64 w-64 rounded-full bg-white/10 blur-3xl" />
      <div className="absolute -left-20 -bottom-20 h-64 w-64 rounded-full bg-pink-400/20 blur-3xl" />
      <Gift className="absolute right-10 bottom-10 h-32 w-32 text-white/10 -rotate-12" />
    </div>
  );
}

function MonthBirthdayCard({
  monthIndex,
  monthName,
  employees,
  isCurrentMonth,
  todayDay,
}: {
  monthIndex: number;
  monthName: string;
  employees: Employee[];
  isCurrentMonth: boolean;
  todayDay: number;
}) {
  if (employees.length === 0 && !isCurrentMonth) return null;

  return (
    <Card
      className={`overflow-hidden transition-all duration-300 hover:shadow-md ${isCurrentMonth ? "ring-2 ring-pink-500/20" : ""}`}
    >
      <CardHeader
        className={`pb-3 ${isCurrentMonth ? "bg-pink-50 text-pink-900 border-b border-pink-100" : "bg-muted/30 border-b"}`}
      >
        <div className="flex items-center justify-between">
          <CardTitle className="text-xl font-bold flex items-center gap-2">
            <Calendar
              className={`h-5 w-5 ${isCurrentMonth ? "text-pink-600" : "text-muted-foreground"}`}
            />
            {monthName}
          </CardTitle>
          {isCurrentMonth && (
            <Badge
              variant="outline"
              className="bg-pink-100 text-pink-700 border-pink-200 uppercase text-[10px] font-bold"
            >
              Current Month
            </Badge>
          )}
        </div>
      </CardHeader>
      <CardContent className="p-0">
        <div className="divide-y divide-border">
          {employees.length === 0 ? (
            <div className="p-8 text-center text-muted-foreground italic text-sm">
              No birthdays this month
            </div>
          ) : (
            employees.map((employee) => {
              const dob = employee.dob ? parseISO(employee.dob) : null;
              const isToday = isCurrentMonth && dob?.getDate() === todayDay;

              return (
                <div
                  key={employee.id}
                  className={`flex items-center gap-4 p-4 transition-colors group relative ${isToday ? "bg-pink-50/30" : ""}`}
                >
                  <Avatar
                    className={`h-12 w-12 border-2 transition-all group-hover:scale-105 ${isToday ? "border-pink-300 ring-2 ring-pink-100" : "border-transparent"}`}
                  >
                    <AvatarImage
                      src={toProxiedImageUrl(employee.image_url)}
                      alt={employee.firstName}
                      className="object-cover object-top"
                    />
                    <AvatarFallback className="bg-muted text-muted-foreground text-sm font-medium">
                      {employee.firstName[0]}
                      {employee.lastName[0]}
                    </AvatarFallback>
                  </Avatar>
                  <div className="flex-1 min-w-0">
                    <p
                      className={`font-semibold text-sm leading-none truncate ${isToday ? "text-pink-700" : ""}`}
                    >
                      {employee.firstName} {employee.lastName}
                    </p>
                    <p className="text-xs text-muted-foreground mt-1.5 flex items-center gap-1">
                      {isToday ? (
                        <span className="text-pink-600 font-bold animate-pulse inline-flex items-center gap-1">
                          Today! <Cake className="h-3 w-3" />
                        </span>
                      ) : (
                        <>
                          <span className="font-medium text-foreground/80">
                            {format(dob!, "do")}
                          </span>
                          <span>{format(dob!, "MMMM")}</span>
                        </>
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

// --- Main Server Page ---

export default async function BirthdaysPage() {
  // 1. Fetch data on the Server
  const [allBirthdays, todayBirthdays] = await Promise.all([
    getUpcomingBirthdays(),
    getTodayBirthdays(),
  ]);

  const now = new Date();
  const currentMonth = now.getMonth(); // 0-11
  const todayDay = now.getDate();

  // 2. Process data
  const groupedBirthdays = allBirthdays.reduce(
    (acc, employee) => {
      if (!employee.dob) return acc;
      const dob = parseISO(employee.dob);
      const month = dob.getMonth();
      if (!acc[month]) acc[month] = [];
      acc[month].push(employee);
      return acc;
    },
    {} as Record<number, Employee[]>,
  );

  const monthNames = [
    "January",
    "February",
    "March",
    "April",
    "May",
    "June",
    "July",
    "August",
    "September",
    "October",
    "November",
    "December",
  ];

  const sortedMonths = Array.from(
    { length: 12 },
    (_, i) => (currentMonth + i) % 12,
  );

  return (
    <div className="space-y-8 p-6">
      <div className="flex flex-col gap-2">
        <h1 className="text-3xl font-bold tracking-tight">Staff Birthdays</h1>
        <p className="text-muted-foreground">
          Celebrate and keep track of everyone&apos;s special day.
        </p>
      </div>

      {/* 3. Pass data to sub-components */}
      <BirthdayHero todayBirthdays={todayBirthdays} />

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {sortedMonths.map((monthIndex) => (
          <MonthBirthdayCard
            key={monthIndex}
            monthIndex={monthIndex}
            monthName={monthNames[monthIndex]}
            employees={groupedBirthdays[monthIndex] || []}
            isCurrentMonth={monthIndex === currentMonth}
            todayDay={todayDay}
          />
        ))}
      </div>
    </div>
  );
}

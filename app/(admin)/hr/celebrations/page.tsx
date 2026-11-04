"use client";

import { useState, useEffect } from "react";
import {
  getUpcomingBirthdays,
  getTodayBirthdays,
  getUpcomingAnniversaries,
  getTodayAnniversaries,
  Employee,
} from "@/lib/api/employees";
import { format, parseISO, differenceInYears, differenceInMonths } from "date-fns";
import { parseCalendarDate } from "@/lib/utils/date-utils";
import { Cake, Gift, Calendar, Trophy, PartyPopper } from "lucide-react";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { toProxiedImageUrl } from "@/lib/utils/image-url";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Skeleton } from "@/components/ui/skeleton";

// --- Types ---
type CelebrationType = "birthday" | "anniversary";

// --- Helper Functions ---
function getAnniversaryMilestone(joinDateStr: string | null | undefined): { heroText: string; badgeText: string } | null {
  if (!joinDateStr) return null;
  const joinDate = parseISO(joinDateStr);
  const now = new Date();

  const years = differenceInYears(now, joinDate);
  if (years >= 1) {
    return {
      heroText: `${years} Year${years > 1 ? "s" : ""} Excellence`,
      badgeText: `${years}Y`,
    };
  }

  const months = differenceInMonths(now, joinDate);
  if (months === 1) {
    return { heroText: "1 Month Milestone", badgeText: "1M" };
  }
  if (months === 3) {
    return { heroText: "3 Months Milestone", badgeText: "3M" };
  }
  if (months === 6) {
    return { heroText: "6 Months Milestone", badgeText: "6M" };
  }
  if (months > 0) {
    return { heroText: `${months} Months Milestone`, badgeText: `${months}M` };
  }

  return null;
}

// --- Sub-components ---

function CelebrationHero({ 
  todayItems, 
  type 
}: { 
  todayItems: Employee[]; 
  type: CelebrationType 
}) {
  if (todayItems.length === 0) return null;

  const isBirthday = type === "birthday";
  const Icon = isBirthday ? Cake : Trophy;
  const label = isBirthday ? "TODAY'S BIRTHDAY 🎂" : "WORK ANNIVERSARY 🏆";
  const bgGradient = isBirthday 
    ? "from-pink-500 to-rose-400" 
    : "from-amber-500 to-orange-400";

  return (
    <div className={`relative overflow-hidden rounded-3xl bg-linear-to-r ${bgGradient} p-8 text-white shadow-xl`}>
      <div className="relative z-10 flex flex-col md:flex-row items-center gap-8 text-center md:text-left">
        <div className="h-32 w-32 rounded-full border-4 border-white/30 p-1 bg-white/10 backdrop-blur-sm animate-bounce-slow">
          <div className="flex h-full w-full items-center justify-center rounded-full bg-white/20">
            <Icon className="h-16 w-16" />
          </div>
        </div>
        <div className="flex-1 space-y-4">
          <Badge
            variant="outline"
            className="bg-white/20 text-white border-white/40 backdrop-blur-sm px-4 py-1 text-sm font-semibold uppercase tracking-wider"
          >
            {label}
          </Badge>
          <h2 className="text-4xl md:text-5xl font-black tracking-tight">
            {isBirthday ? "Happy Birthday" : "Congratulations"}, {todayItems.map((e) => e.firstName).join(" & ")}
            !
          </h2>
          <div className="flex flex-wrap justify-center md:justify-start gap-4 pt-2">
            {todayItems.map((employee) => {
                const milestone = !isBirthday && employee.joinDate 
                    ? getAnniversaryMilestone(employee.joinDate) 
                    : null;
                
                return (
                    <div
                        key={employee.id}
                        className="flex items-center gap-3 bg-white/10 transition-colors backdrop-blur-sm rounded-full pl-1 pr-4 py-1 border border-white/20 group"
                    >
                        <Avatar className="h-10 w-10 border-2 border-white/50 p">
                        <AvatarImage
                            src={toProxiedImageUrl(employee.image_url)}
                            className="object-cover object-top"
                        />
                        <AvatarFallback className={isBirthday ? "bg-pink-100 text-pink-700" : "bg-amber-100 text-amber-700"}>
                            {employee.firstName[0]}
                            {employee.lastName[0]}
                        </AvatarFallback>
                        </Avatar>
                        <div className="flex flex-col items-start leading-tight">
                            <span className="font-bold text-lg">
                            {employee.firstName} {employee.lastName}
                            </span>
                            {!isBirthday && milestone && (
                                <span className="text-[10px] opacity-80 uppercase font-bold tracking-wider">
                                    {milestone.heroText}
                                </span>
                            )}
                        </div>
                    </div>
                );
            })}
          </div>
        </div>
      </div>

      {/* Decorative Elements */}
      <div className="absolute -right-20 -top-20 h-64 w-64 rounded-full bg-white/10 blur-3xl" />
      <div className="absolute -left-20 -bottom-20 h-64 w-64 rounded-full bg-white/5 blur-3xl" />
      {isBirthday ? (
          <Gift className="absolute right-10 bottom-10 h-32 w-32 text-white/10 -rotate-12" />
      ) : null}
    </div>
  );
}

function MonthCelebrationCard({
  monthIndex,
  monthName,
  employees,
  isCurrentMonth,
  todayDay,
  type
}: {
  monthIndex: number;
  monthName: string;
  employees: Employee[];
  isCurrentMonth: boolean;
  todayDay: number;
  type: CelebrationType;
}) {
  if (employees.length === 0 && !isCurrentMonth) return null;

  const isBirthday = type === "birthday";
  const Icon = isBirthday ? Cake : Trophy;

  const theme = isBirthday
    ? {
        ring: "ring-2 ring-pink-500/20 dark:ring-pink-500/30",
        headerBg: "bg-pink-50 dark:bg-pink-950/30 text-pink-900 dark:text-pink-200 border-b border-pink-100 dark:border-pink-900/30",
        iconColor: "text-pink-600 dark:text-pink-400",
        badgeBg: "bg-pink-100 dark:bg-pink-900/40 text-pink-700 dark:text-pink-300 border-pink-200 dark:border-pink-800/50",
        itemTodayBg: "bg-pink-50/30 dark:bg-pink-900/10",
        avatarBorder: "border-pink-300 dark:border-pink-800 ring-2 ring-pink-100 dark:ring-pink-900/30",
        nameTodayText: "text-pink-700 dark:text-pink-300",
        todaySpan: "text-pink-600 dark:text-pink-400",
      }
    : {
        ring: "ring-2 ring-amber-500/20 dark:ring-amber-500/30",
        headerBg: "bg-amber-50 dark:bg-amber-950/30 text-amber-900 dark:text-amber-200 border-b border-amber-100 dark:border-amber-900/30",
        iconColor: "text-amber-600 dark:text-amber-400",
        badgeBg: "bg-amber-100 dark:bg-amber-900/40 text-amber-700 dark:text-amber-300 border-amber-200 dark:border-amber-800/50",
        itemTodayBg: "bg-amber-50/30 dark:bg-amber-900/10",
        avatarBorder: "border-amber-300 dark:border-amber-800 ring-2 ring-amber-100 dark:ring-amber-900/30",
        nameTodayText: "text-amber-700 dark:text-amber-300",
        todaySpan: "text-amber-600 dark:text-amber-400",
      };

  return (
    <Card
      className={`overflow-hidden transition-all duration-300 hover:shadow-md ${isCurrentMonth ? theme.ring : ""}`}
    >
      <CardHeader
        className={`pb-3 ${isCurrentMonth ? theme.headerBg : "bg-muted/30 border-b"}`}
      >
        <div className="flex items-center justify-between">
          <CardTitle className="text-xl font-bold flex items-center gap-2">
            <Calendar
              className={`h-5 w-5 ${isCurrentMonth ? theme.iconColor : "text-muted-foreground"}`}
            />
            {monthName}
          </CardTitle>
          {isCurrentMonth && (
            <Badge
              variant="outline"
              className={`${theme.badgeBg} uppercase text-[10px] font-bold`}
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
              No {isBirthday ? "birthdays" : "anniversaries"} this month
            </div>
          ) : (
            employees.map((employee) => {
              const dateStr = isBirthday ? employee.dob : employee.joinDate;
              const date = dateStr ? parseISO(dateStr) : null;
              const isToday = isCurrentMonth && date?.getDate() === todayDay;

              const milestone = !isBirthday && employee.joinDate 
                ? getAnniversaryMilestone(employee.joinDate) 
                : null;

              return (
                <div
                  key={employee.id}
                  className={`flex items-center gap-4 p-4 transition-colors group relative ${isToday ? theme.itemTodayBg : "hover:bg-muted/20"}`}
                >
                  <Avatar
                    className={`h-12 w-12 border-2 transition-all group-hover:scale-105 ${isToday ? theme.avatarBorder : "border-transparent"}`}
                  >
                    <AvatarImage
                      src={toProxiedImageUrl(employee.image_url)}
                      alt={employee.firstName}
                      className="object-cover object-top"
                    />
                    <AvatarFallback className="bg-muted text-muted-foreground text-sm font-medium uppercase">
                      {employee.firstName[0]}
                      {employee.lastName[0]}
                    </AvatarFallback>
                  </Avatar>
                  <div className="flex-1 min-w-0">
                    <p
                      className={`font-semibold text-sm leading-none truncate ${isToday ? theme.nameTodayText : ""}`}
                    >
                      {employee.firstName} {employee.lastName}
                    </p>
                    <p className="text-xs text-muted-foreground mt-1.5 flex items-center gap-1">
                      {isToday ? (
                        <span className={`${theme.todaySpan} font-bold animate-pulse inline-flex items-center gap-1`}>
                          Today! <Icon className="h-3 w-3" />
                        </span>
                      ) : (
                        <>
                          <span className="font-medium text-foreground/80 dark:text-foreground/60">
                            {format(date!, "do")}
                          </span>
                          <span className="dark:text-muted-foreground/80">{format(date!, "MMMM")}</span>
                        </>
                      )}
                      {!isBirthday && milestone && (
                        <Badge variant="secondary" className="ml-auto text-[9px] h-4 px-1.5 bg-amber-100 dark:bg-amber-900/30 text-amber-700 dark:text-amber-400 border-none">
                            {milestone.badgeText}
                        </Badge>
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

// --- Main Page ---

export default function CelebrationsPage() {
  const [activeTab, setActiveTab] = useState<CelebrationType>("birthday");
  const [loading, setLoading] = useState(true);
  const [data, setData] = useState<{
    upcomingBirthdays: Employee[];
    todayBirthdays: Employee[];
    upcomingAnniversaries: Employee[];
    todayAnniversaries: Employee[];
  }>({
    upcomingBirthdays: [],
    todayBirthdays: [],
    upcomingAnniversaries: [],
    todayAnniversaries: [],
  });

  useEffect(() => {
    async function fetchData() {
      try {
        const [uB, tB, uA, tA] = await Promise.all([
          getUpcomingBirthdays(),
          getTodayBirthdays(),
          getUpcomingAnniversaries(),
          getTodayAnniversaries(),
        ]);
        setData({
          upcomingBirthdays: uB,
          todayBirthdays: tB,
          upcomingAnniversaries: uA,
          todayAnniversaries: tA,
        });
      } catch (error) {
        console.error("Failed to fetch celebrations", error);
      } finally {
        setLoading(false);
      }
    }
    fetchData();
  }, []);

  const now = new Date();
  const currentMonth = now.getMonth();
  const todayDay = now.getDate();

  const monthNames = [
    "January", "February", "March", "April", "May", "June",
    "July", "August", "September", "October", "November", "December"
  ];

  const sortedMonths = Array.from({ length: 12 }, (_, i) => (currentMonth + i) % 12);

  const groupData = (items: Employee[], dateKey: "dob" | "joinDate") => {
    return items.reduce((acc, employee) => {
      const dateStr = employee[dateKey];
      if (!dateStr) return acc;
      const date = parseCalendarDate(dateStr);
      const month = date.getMonth();
      if (!acc[month]) acc[month] = [];
      acc[month].push(employee);
      return acc;
    }, {} as Record<number, Employee[]>);
  };

  const groupedBirthdays = groupData(data.upcomingBirthdays, "dob");
  const groupedAnniversaries = groupData(data.upcomingAnniversaries, "joinDate");

  if (loading) {
      return (
          <div className="space-y-8 p-6">
              <div className="space-y-2">
                  <Skeleton className="h-10 w-64" />
                  <Skeleton className="h-4 w-96" />
              </div>
              <Skeleton className="h-48 w-full rounded-3xl" />
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                  {[1, 2, 3].map(i => <Skeleton key={i} className="h-64 rounded-xl" />)}
              </div>
          </div>
      );
  }

  return (
    <div className="flex flex-1 flex-col gap-6">
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-4">
        <div className="space-y-2">
          <h1 className="text-3xl font-bold tracking-tight">Staff Celebrations</h1>
          <p className="text-muted-foreground">
            Keep track of birthdays and work milestones across the company.
          </p>
        </div>

        <Tabs defaultValue="birthday" className="w-full md:w-auto" onValueChange={(v) => setActiveTab(v as CelebrationType)}>
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="birthday" className="gap-2">
                <Cake className="h-4 w-4" />
                Birthdays
            </TabsTrigger>
            <TabsTrigger value="anniversary" className="gap-2">
                <Trophy className="h-4 w-4" />
                Anniversaries
            </TabsTrigger>
          </TabsList>
        </Tabs>
      </div>

      <Tabs value={activeTab} className="mt-0">
        <TabsContent value="birthday" className="space-y-8 mt-0 border-none p-0 outline-hidden">
          <CelebrationHero todayItems={data.todayBirthdays} type="birthday" />
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {sortedMonths.map((monthIndex) => (
              <MonthCelebrationCard
                key={monthIndex}
                monthIndex={monthIndex}
                monthName={monthNames[monthIndex]}
                employees={groupedBirthdays[monthIndex] || []}
                isCurrentMonth={monthIndex === currentMonth}
                todayDay={todayDay}
                type="birthday"
              />
            ))}
          </div>
        </TabsContent>

        <TabsContent value="anniversary" className="space-y-8 mt-0 border-none p-0 outline-hidden">
          <CelebrationHero todayItems={data.todayAnniversaries} type="anniversary" />
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {sortedMonths.map((monthIndex) => (
              <MonthCelebrationCard
                key={monthIndex}
                monthIndex={monthIndex}
                monthName={monthNames[monthIndex]}
                employees={groupedAnniversaries[monthIndex] || []}
                isCurrentMonth={monthIndex === currentMonth}
                todayDay={todayDay}
                type="anniversary"
              />
            ))}
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
}

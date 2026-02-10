import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import {
  Calendar,
  CreditCard,
  FileText,
  Trophy,
  LucideIcon,
  AlertTriangle,
  MailIcon,
  Earth,
  TreePalm,
  Baby,
  Clock10Icon,
} from "lucide-react";

import { RecentUpdates } from "@/components/dashboard/recent-updates";
import { StatsCard } from "@/components/stats-card";
import { ExchangeRateCard } from "@/components/dashboard/exchange-rate-card";
import { EmployeeOfTheMonthCard } from "@/components/dashboard/employee-of-month-card";
import Link from "next/link";
import { getClockInHistory } from "@/lib/api/clock-in";

interface QuickLinkButtonProps {
  icon: LucideIcon;
  title: string;
  url: string;
  color?: string;
  target?: "_blank" | "_self";
}

function QuickLinkButton({
  icon: Icon,
  title,
  url,
  color = "blue",
  target = "_blank",
}: QuickLinkButtonProps) {
  const colorStyles = {
    blue: "text-blue-600 hover:text-blue-700 hover:bg-blue-50 border-blue-100",
    green:
      "text-emerald-600 hover:text-emerald-700 hover:bg-emerald-50 border-emerald-100",
    purple:
      "text-purple-600 hover:text-purple-700 hover:bg-purple-50 border-purple-100",
    orange:
      "text-orange-600 hover:text-orange-700 hover:bg-orange-50 border-orange-100",
    indigo:
      "text-indigo-600 hover:text-indigo-700 hover:bg-indigo-50 border-indigo-100",
    rose: "text-rose-600 hover:text-rose-700 hover:bg-rose-50 border-rose-100",
  };

  return (
    <Link href={url} target={target} className="flex items-center gap-2 ">
      <Button
        variant="outline"
        className={`h-10 w-fit flex items-center justify-center gap-2 transition-colors cursor-pointer ${
          colorStyles[color as keyof typeof colorStyles]
        }`}
      >
        <Icon className="h-6 w-6" />
        <span className="font-semibold">{title}</span>
      </Button>
    </Link>
  );
}

import { mockDashboardStats } from "@/lib/data/mock-dashboard";

export default async function Page() {
  // Fetch Attendance Data
  const now = new Date();
  const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
  const formatDate = (date: Date) => date.toISOString().split("T")[0]; // YYYY-MM-DD

  const clockInResponse = await getClockInHistory(
    formatDate(startOfMonth),
    formatDate(now),
  );

  let totalAttendance = 0;
  let lateDays = 0;

  if (clockInResponse.success) {
    const history = clockInResponse.data.data;
    totalAttendance = history.length;

    // Calculate late days (Clock in > 9:05 AM UTC+1)
    // 9:05 AM UTC+1 is 8:05 AM UTC
    lateDays = history.filter((record) => {
      const date = new Date(record.clock_in_at);
      const utcHours = date.getUTCHours();
      const utcMinutes = date.getUTCMinutes();

      if (utcHours > 8) return true;
      if (utcHours === 8 && utcMinutes > 5) return true;
      return false;
    }).length;
  }

  return (
    <div className="flex flex-1 flex-col gap-12 pt-6">
      {/* Stats Cards */}
      <div className="grid gap-4 md:grid-cols-4">
        <StatsCard
          title={`Attendance - Clock In (${now.toLocaleString("default", { month: "long" })})`}
          icon={Clock10Icon}
          value={`${totalAttendance} / ${
            Array.from({ length: now.getDate() }, (_, i) =>
              new Date(now.getFullYear(), now.getMonth(), i + 1).getDay(),
            ).filter((day) => day !== 0 && day !== 6).length
          }`}
          description={`${lateDays} late arrival${lateDays === 1 ? "" : "s"} | Resumption: 9:05 AM UTC+1`}
          variant="dashboard"
          cardColor="blue"
        />
        <StatsCard
          title={mockDashboardStats.leaveDays.title}
          icon={Calendar}
          value={mockDashboardStats.leaveDays.value}
          description={mockDashboardStats.leaveDays.description}
          variant="dashboard"
          cardColor={mockDashboardStats.leaveDays.color}
        />
        <StatsCard
          title={mockDashboardStats.totalAwards.title}
          icon={Trophy}
          value={mockDashboardStats.totalAwards.value}
          description={mockDashboardStats.totalAwards.description}
          variant="dashboard"
          cardColor={mockDashboardStats.totalAwards.color}
        />
        <ExchangeRateCard />
      </div>

      <div className="flex flex-col gap-4">
        <h6 className="text-sm font-bold">Quick Links</h6>
        {/* Buttons */}
        <div className="flex items-center gap-2 flex-wrap">
          <QuickLinkButton
            icon={TreePalm}
            title="Aspom Website"
            url="https://aspomtravels.com"
            color="green"
          />
          <QuickLinkButton
            icon={MailIcon}
            title="My Webmail"
            url="https://webmail.aspomtravels.com"
            color="rose"
          />
          <QuickLinkButton
            icon={Earth}
            title="Aspom Travels FAQ"
            url="https://faq.aspomtravels.com/"
            color="blue"
          />
          <QuickLinkButton
            icon={Baby}
            title="Aspom Birth Services"
            url="http://aspombirthservices.com/"
            color="green"
          />
          <QuickLinkButton
            icon={FileText}
            title="Request Leave"
            url="/my/leave"
            target="_self"
            color="rose"
          />
          <QuickLinkButton
            icon={FileText}
            title="Submit Task Report"
            url="/my/tasks"
            target="_self"
            color="indigo"
          />
          <QuickLinkButton
            icon={CreditCard}
            title="Report IT Issue"
            url="/my/it-issue"
            target="_self"
            color="rose"
          />
        </div>
      </div>

      <div className="flex flex-col lg:flex-row gap-4">
        <RecentUpdates className="lg:w-5/7" />
        <EmployeeOfTheMonthCard />
      </div>

      {/* Team Members */}
      {/* <Card>
        <CardHeader>
          <CardTitle>Team Members</CardTitle>
          <CardDescription>
            Colleagues you work with frequently.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Employee</TableHead>
                <TableHead>Role</TableHead>
                <TableHead>Email</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {teamMembers.map((member, index) => (
                <TableRow key={index}>
                  <TableCell className="font-medium">
                    <div className="flex items-center space-x-3">
                      <Avatar className="h-8 w-8">
                        <AvatarImage src={member.image} alt={member.name} />
                        <AvatarFallback>{member.initials}</AvatarFallback>
                      </Avatar>
                      <span>{member.name}</span>
                    </div>
                  </TableCell>
                  <TableCell>{member.role}</TableCell>
                  <TableCell>{member.email}</TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card> */}
    </div>
  );
}

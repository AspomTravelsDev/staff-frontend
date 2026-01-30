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
  Crown,
  Sparkles,
} from "lucide-react";

import { RecentUpdates } from "@/components/dashboard/recent-updates";
import { StatsCard } from "@/components/stats-card";
import { ExchangeRateCard } from "@/components/dashboard/exchange-rate-card";
import Link from "next/link";

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

import {
  mockDashboardStats,
  mockEmployeeOfMonth,
  mockExchangeRates,
} from "@/lib/data/mock-dashboard";

export default function Page() {
  return (
    <div className="flex flex-1 flex-col gap-12 pt-6">
      {/* Stats Cards */}
      <div className="grid gap-4 md:grid-cols-4">
        <StatsCard
          title={mockDashboardStats.totalAttendance.title}
          icon={Clock10Icon}
          value={mockDashboardStats.totalAttendance.value}
          description={mockDashboardStats.totalAttendance.description}
          variant="dashboard"
          cardColor={mockDashboardStats.totalAttendance.color}
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
        <ExchangeRateCard rates={mockExchangeRates} />
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

      {/* ... Recent Updates ... */}
      <div className="flex flex-col lg:flex-row gap-4">
        <RecentUpdates className="lg:w-5/7" />

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
                  src={mockEmployeeOfMonth.image}
                  alt={mockEmployeeOfMonth.name}
                  className="object-cover"
                />
                <AvatarFallback>{mockEmployeeOfMonth.initials}</AvatarFallback>
              </Avatar>
            </div>
            <CardTitle className="text-center">Employee of the Month</CardTitle>
            <h3 className="font-bold text-lg">{mockEmployeeOfMonth.name}</h3>
            <p className="text-sm text-muted-foreground">
              {mockEmployeeOfMonth.role}
            </p>
          </CardContent>
        </Card>
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

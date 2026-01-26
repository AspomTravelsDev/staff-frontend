import {
  Card,
  CardContent,
  CardDescription,
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
} from "lucide-react";

import { RecentUpdates } from "@/components/dashboard/recent-updates";
import { StatsCard } from "@/components/dashboard/stats-card";
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

export default function Page() {
  return (
    <div className="flex flex-1 flex-col gap-12 pt-6">
      {/* Stats Cards */}
      <div className="grid gap-4 md:grid-cols-4">
        <StatsCard
          title="Occurences this Month"
          icon={AlertTriangle}
          value="8"
          description="+3 from last month"
          color="red"
        />
        <StatsCard
          title="Leave Days Remaining"
          icon={Calendar}
          value="12 Days"
          description="Available for 2026"
          color="green"
        />
        <StatsCard
          title="Total Awards"
          icon={Trophy}
          value="3"
          description="Employee of the Month"
          color="yellow"
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

      <div className="flex flex-col lg:flex-row items-center gap-4">
        {/* Recent Updates */}
        <RecentUpdates className="lg:w-5/7" />

        <Card className="flex flex-col justify-between h-full lg:w-2/7">
          <CardHeader>
            <CardTitle>Employee of the Month</CardTitle>
            <CardDescription>Celebrating excellence</CardDescription>
          </CardHeader>
          <CardContent className="flex flex-1 flex-col items-center justify-center p-6 text-center pt-0">
            <Avatar className="h-32 w-32 rounded-lg mb-4 ring-2 ring-primary ring-offset-2">
              <AvatarImage
                src="https://github.com/shadcn.png"
                alt="Sarah Wilson"
              />
              <AvatarFallback>SW</AvatarFallback>
            </Avatar>
            <h3 className="font-bold text-lg">Sarah Wilson</h3>
            <p className="text-sm text-muted-foreground mb-4">
              Visa Officer
            </p>
            <p className="text-sm text-muted-foreground italic">
              &quot;Outstanding contribution to the new mobile app design.&quot;
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

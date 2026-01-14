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
  Clock,
  CreditCard,
  FileText,
  Settings,
  Trophy,
  Users,
  LucideIcon,
} from "lucide-react";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { RecentUpdates } from "@/components/dashboard/recent-updates";

interface StatsCardProps {
  title: string;
  icon: LucideIcon;
  value: string;
  description: string;
}

function StatsCard({ title, icon: Icon, value, description }: StatsCardProps) {
  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
        <CardTitle className="text-sm font-medium">{title}</CardTitle>
        <Icon className="h-4 w-4 text-muted-foreground" />
      </CardHeader>
      <CardContent>
        <div className="text-2xl font-bold">{value}</div>
        <p className="text-xs text-muted-foreground">{description}</p>
      </CardContent>
    </Card>
  );
}

export default function Page() {
  // Dummy data for team members
  const teamMembers = [
    {
      name: "Sarah Wilson",
      role: "Product Designer",
      email: "sarah.w@aspom.com",
      image: "https://github.com/shadcn.png",
      initials: "SW",
    },
    {
      name: "Michael Chen",
      role: "Senior Developer",
      email: "michael.c@aspom.com",
      image: "",
      initials: "MC",
    },
    {
      name: "Emma Rodriguez",
      role: "Marketing Lead",
      email: "emma.r@aspom.com",
      image: "",
      initials: "ER",
    },
    {
      name: "James Kim",
      role: "Project Manager",
      email: "james.k@aspom.com",
      image: "",
      initials: "JK",
    },
  ];

  return (
    <div className="flex flex-1 flex-col gap-8">
      {/* Stats Cards */}
      <div className="grid gap-4 md:grid-cols-3">
        <StatsCard
          title="Punctuality Score"
          icon={Clock}
          value="98%"
          description="+2% from last month"
        />
        <StatsCard
          title="Leave Days Remaining"
          icon={Calendar}
          value="20 Days"
          description="Available for 2026"
        />
        <StatsCard
          title="Total Awards"
          icon={Trophy}
          value="3"
          description="Employee of the Month (Jan)"
        />
      </div>

      <div className="flex flex-col lg:flex-row gap-4 items-stretch">
        <div className="grid gap-4 grid-cols-2 flex-1">
          <Button
            variant="outline"
            className="h-24 flex-col items-start justify-center gap-2"
          >
            <FileText className="h-6 w-6" />
            <span className="font-semibold">Request Leave</span>
          </Button>
          <Button
            variant="outline"
            className="h-24 flex-col items-start justify-center gap-2"
          >
            <CreditCard className="h-6 w-6" />
            <span className="font-semibold">View Payslips</span>
          </Button>
          <Button
            variant="outline"
            className="h-24 flex-col items-start justify-center gap-2"
          >
            <Users className="h-6 w-6" />
            <span className="font-semibold">Team Directory</span>
          </Button>
          <Button
            variant="outline"
            className="h-24 flex-col items-start justify-center gap-2"
          >
            <Settings className="h-6 w-6" />
            <span className="font-semibold">Settings</span>
          </Button>
        </div>
        <Card className="flex flex-col justify-between lg:aspect-square lg:w-auto w-full">
          <CardHeader>
            <CardTitle>Employee of the Month</CardTitle>
            <CardDescription>Celebrating excellence</CardDescription>
          </CardHeader>
          <CardContent className="flex flex-1 flex-col items-center justify-center p-6 text-center pt-0">
            <Avatar className="h-24 w-24 mb-4 ring-2 ring-primary ring-offset-2">
              <AvatarImage
                src="https://github.com/shadcn.png"
                alt="Sarah Wilson"
              />
              <AvatarFallback>SW</AvatarFallback>
            </Avatar>
            <h3 className="font-bold text-lg">Sarah Wilson</h3>
            <p className="text-sm text-muted-foreground mb-4">
              Product Designer
            </p>
            <p className="text-sm text-muted-foreground italic">
              "Outstanding contribution to the new mobile app design."
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Recent Updates */}
      <RecentUpdates />

      {/* Team Members */}
      <Card>
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
      </Card>
    </div>
  );
}

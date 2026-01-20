"use client";

import * as React from "react";
import {
  BookOpen,
  Bot,
  Briefcase,
  Clock,
  CreditCard,
  FileSearch,
  Frame,
  History,
  Home,
  Map,
  PieChart,
  Settings2,
  ShieldAlert,
  SquareTerminal,
  Users,
  FileText,
} from "lucide-react";
import { AspomLogo } from "./icons/aspom-logo";

import { NavMain } from "@/components/nav-main";
// import { NavProjects } from "@/components/nav-projects";
import { NavUser } from "@/components/nav-user";
import { TeamSwitcher } from "@/components/team-switcher";
import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarHeader,
  SidebarRail,
} from "@/components/ui/sidebar";

const data = {
  user: {
    name: "Damian Gabriel",
    email: "g.damian@aspomtravels.com",
    avatar: "https://github.com/shadcn.png",
  },
  teams: [
    {
      name: "Aspom Travels",
      logo: AspomLogo,
      plan: "Internal Staff Portal",
    },
  ],
  dashboard: [
    {
      title: "Dashboard",
      url: "/dashboard",
      icon: Home,
    },
  ],
  navMain: [
    {
      title: "Finance & Accounts",
      url: "/accounts",
      icon: CreditCard,
      items: [
        { title: "Payment Confirmation", url: "/accounts/confirmation" },
        { title: "Expenses", url: "/accounts/expenses" },
        { title: "Outstanding", url: "/accounts/outstanding" },
        { title: "Assigned Projects", url: "/accounts/assigned-projects" },
        // { title: "Invoice Generation", url: "/accounts/invoices" },
        // { title: "Refund Requests", url: "/accounts/refunds" },
      ],
    },
    {
      title: "Visa Operations",
      url: "/visa",
      icon: FileSearch,
      items: [
        { title: "Active Applications", url: "/visa/active" },
        { title: "Embassy Appointments", url: "/visa/appointments" },
        { title: "Passport Collection", url: "/visa/collection" },
        { title: "Escalated Cases", url: "/visa/escalated" },
      ],
    },

    {
      title: "Human Resources",
      url: "/hr",
      icon: Users,
      items: [
        { title: "Employee Handouts", url: "/hr/handouts" },
        { title: "Leave Management", url: "/hr/leave" },
        { title: "Performance Reviews", url: "/hr/performance" },
      ],
    },
  ],
  projects: [
    {
      title: "My Compliance Record",
      url: "/compliance",
      icon: History,
    },
    {
      title: "Forms",
      url: "/forms",
      icon: FileText,
    },
  ],
  admin: [
    {
      title: "Administration",
      url: "/admin",
      icon: Settings2,
      items: [{ title: "Invite Staff", url: "/admin/invite" }],
    },
  ],
};

export function AppSidebar({ ...props }: React.ComponentProps<typeof Sidebar>) {
  return (
    <Sidebar collapsible="icon" {...props}>
      <SidebarHeader>
        <TeamSwitcher teams={data.teams} />
      </SidebarHeader>
      <SidebarContent>
        <NavMain
          items={[
            ...data.dashboard,
            ...data.navMain,
            ...data.projects,
            ...data.admin,
          ]}
        />
      </SidebarContent>
      <SidebarFooter>
        <NavUser user={data.user} />
      </SidebarFooter>
      <SidebarRail />
    </Sidebar>
  );
}

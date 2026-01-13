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
} from "lucide-react";
import { AspomLogo } from "./icons/aspom-logo";

import { NavMain } from "@/components/nav-main";
import { NavProjects } from "@/components/nav-projects";
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
    avatar: "/avatars/damian.jpg",
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
      name: "Dashboard",
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
        { title: "Product Expenses", url: "/accounts/product-expenses" },
        { title: "Other Expenses", url: "/accounts/other-expenses" },
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
      isActive: true,
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
        { title: "Attendance (8:55 AM)", url: "/hr/attendance" },
        { title: "Leave Management", url: "/hr/leave" },
        { title: "Performance Reviews", url: "/hr/performance" },
        { title: "Cooperative Savings", url: "/hr/savings" },
      ],
    },
  ],
  projects: [
    {
      name: "My Compliance Record",
      url: "/compliance",
      icon: History,
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
        <NavProjects projects={data.dashboard} />
        <NavMain items={data.navMain} />
        <NavProjects projects={data.projects} />
      </SidebarContent>
      <SidebarFooter>
        <NavUser user={data.user} />
      </SidebarFooter>
      <SidebarRail />
    </Sidebar>
  );
}

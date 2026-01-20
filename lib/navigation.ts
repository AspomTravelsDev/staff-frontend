import {
    CalendarCheck,
    ClipboardList,
    CreditCard,
    FileSearch,
    FileText,
    FolderOpen,
    History,
    LayoutDashboard,
    Receipt,
    Settings2,
    ShieldCheck,
    Users,
    type LucideIcon,
} from "lucide-react";
import type { User } from "./auth/api";

export type UserRole = User["role"];

export interface NavItem {
    title: string;
    url: string;
    icon?: LucideIcon;
    isActive?: boolean;
    allowedRoles?: UserRole[]; // If undefined, visible to all
    items?: {
        title: string;
        url: string;
    }[];
}

/**
 * Dashboard - visible to all users
 */
export const dashboardNav: NavItem[] = [
    {
        title: "Dashboard",
        url: "/dashboard",
        icon: LayoutDashboard,
    },
];

/**
 * Department-specific navigation
 * Only visible to users with matching roles
 * Admin and Super see all department items
 */
export const departmentNav: NavItem[] = [
    {
        title: "Finance & Accounts",
        url: "/accounts",
        icon: CreditCard,
        allowedRoles: ["account"],
        items: [
            { title: "Payment Confirmation", url: "/accounts/confirmation" },
            { title: "Expenses Management", url: "/accounts/expenses" },
            { title: "Outstanding Payments", url: "/accounts/outstanding" },
            { title: "Assigned Projects", url: "/accounts/assigned-projects" },
        ],
    },
    {
        title: "Visa Operations",
        url: "/visa",
        icon: FileSearch,
        allowedRoles: ["visa"],
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
        allowedRoles: ["hr"],
        items: [
            { title: "Employee Handouts", url: "/hr/handouts" },
            { title: "Leave Management", url: "/hr/leave" },
            { title: "Performance Reviews", url: "/hr/performance" },
        ],
    },
    {
        title: "Compliance",
        url: "/compliance",
        icon: ShieldCheck,
        allowedRoles: ["compliance"],
        items: [
            { title: "Compliance Dashboard", url: "/compliance" },
            // Add more compliance-specific items as needed
        ],
    },
    {
        title: "Administration",
        url: "/admin",
        icon: Settings2,
        allowedRoles: ["super", "admin", "it"],
        items: [
            { title: "Invite Staff", url: "/admin/invite" },
            // { title: "User Management", url: "/admin/users" },
            // { title: "System Settings", url: "/admin/settings" },
        ],
    },
];

/**
 * Personal navigation - visible to ALL users
 * These are actions every employee can perform for themselves
 */
export const personalNav: NavItem[] = [
    {
        title: "My Tasks",
        url: "/my/tasks",
        icon: ClipboardList,
    },
    {
        title: "My Leave",
        url: "/my/leave",
        icon: CalendarCheck,
    },
    {
        title: "My Expenses",
        url: "/my/expenses",
        icon: Receipt,
    },
    {
        title: "My Compliance",
        url: "/my/compliance",
        icon: History,
    },
    {
        title: "Documents",
        url: "/my/documents",
        icon: FolderOpen,
    },
    {
        title: "Forms",
        url: "/forms",
        icon: FileText,
    },
];

/**
 * Filter navigation items based on user role
 * Admin and Super see all department items
 */
export function filterNavByRole(items: NavItem[], role: UserRole): NavItem[] {
    // Admin and Super see everything
    if (role === "admin" || role === "super") {
        return items;
    }

    return items.filter((item) => {
        // If no allowedRoles defined, visible to all
        if (!item.allowedRoles) {
            return true;
        }
        // Check if user's role is in allowed list
        return item.allowedRoles.includes(role);
    });
}

/**
 * Get complete navigation for a user
 */
export function getNavigationForUser(role: UserRole) {
    return {
        dashboard: dashboardNav,
        department: filterNavByRole(departmentNav, role),
        personal: personalNav,
    };
}

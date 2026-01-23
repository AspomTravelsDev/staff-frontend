import {
    Activity,
    CalendarCheck,
    ClipboardList,
    CreditCard,
    FileSearch,
    FileText,
    FolderOpen,
    LayoutDashboard,
    Receipt,
    Settings2,
    ShieldCheck,
    User as LucideUser,
    MessageCircle,
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
    allowedRoles?: UserRole[];
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
 * Now flattened as standalone links
 */
export const departmentNav: NavItem[] = [
    {
        title: "Payment Confirmation",
        url: "/accounts/confirmation",
        icon: CreditCard,
        allowedRoles: ["account"],
    },
    {
        title: "Expenses Management",
        url: "/accounts/expenses",
        icon: Receipt,
        allowedRoles: ["account"],
    },
    {
        title: "Outstanding Payments",
        url: "/accounts/outstanding",
        icon: CreditCard,
        allowedRoles: ["account"],
    },
    {
        title: "Assigned Projects",
        url: "/accounts/assigned-projects",
        icon: FolderOpen,
        allowedRoles: ["account"],
    },
    {
        title: "Visa Applications",
        url: "/visa/applications",
        icon: FileSearch,
        allowedRoles: ["visa"],
    },
    {
        title: "Employee Handouts",
        url: "/hr/handouts",
        icon: FileText,
        allowedRoles: ["hr"],
    },
    {
        title: "Leave Management",
        url: "/hr/leave",
        icon: CalendarCheck,
        allowedRoles: ["hr"],
    },
    {
        title: "Performance Reviews",
        url: "/hr/performance",
        icon: ClipboardList,
        allowedRoles: ["hr"],
    },
    {
        title: "Compliance Dashboard",
        url: "/compliance",
        icon: ShieldCheck,
        allowedRoles: ["compliance"],
    },
    {
        title: "Invite Staff",
        url: "/admin/invite",
        icon: Users,
        allowedRoles: ["super", "admin", "it"],
    },
    {
        title: "Activity Log",
        url: "/activity",
        icon: Activity,
        allowedRoles: ["super", "admin", "it"],
    },
    {
        title: "Customer Database",
        url: "/crm",
        icon: ClipboardList,
        allowedRoles: ["account", "visa", "media"]
    },
    {
        title: "HR Applications",
        url: "/hr/applications",
        icon: FileText,
        allowedRoles: ["hr"],
    },
    {
        title: "HR Tasks",
        url: "/hr/tasks",
        icon: ClipboardList,
        allowedRoles: ["hr"],
    },
    {
        title: "Tasks",
        url: "/accounts/tasks",
        icon: ClipboardList,
        allowedRoles: ["account"],
    },
    {
        title: "Applications",
        url: "/accounts/applications",
        icon: FileText,
        allowedRoles: ["account"],
    },
    {
        title: "Tasks",
        url: "/visa/tasks",
        icon: ClipboardList,
        allowedRoles: ["visa"],
    },
    {
        title: "Upload Documents",
        url: "/visa/documents",
        icon: FileText,
        allowedRoles: ["visa"],
    },
];

/**
 * Personal navigation - visible to ALL users
 * Now grouped into collapsible sections
 */
export const personalNav: NavItem[] = [
    {
        title: "HR Requests",
        url: "",
        icon: Users,
        items: [
            { title: "Leave", url: "/my/leave" },
            { title: "Tasks", url: "/my/tasks" },
            { title: "Handouts/Documents", url: "/my/documents" },
            { title: "Appraisal", url: "/hr/performance" },
        ],
    },
    {
        title: "IT Service Desk",
        url: "",
        icon: Settings2,
        items: [
            // { title: "Laptop Request", url: "/it/laptop" },
            // { title: "Laptop Request", url: "/it/phone" },
            { title: "Laptop Request", url: "https://forms.gle/eB66WGDe49aKXW4R9" },
            { title: "Phone Request", url: "https://forms.gle/eB66WGDe49aKXW4R9" },
            // { title: "Software Access", url: "/it/software" },
            // { title: "Report Issue", url: "/it/report" },
            { title: "Software Access", url: "https://forms.gle/1fMFiV7uZb1urgip8" },
            { title: "Report Issue", url: "https://forms.gle/1fMFiV7uZb1urgip8" },
        ],
    },
    {
        title: "Account",
        url: "",
        icon: CreditCard,
        items: [
            {
                title: "Payment Confirmation", url: "/account/confirmation"
            },
            {
                title: "Expenses", url: "/account/expenses"
            }
        ]
    },
    {
        title: "Admin",
        url: "",
        icon: LucideUser,
        items: [
            {
                title: "General Requests", url: "/admin/requests"
            },
        ]
    },
    {
        title: "Information Desk",
        url: "",
        icon: FolderOpen,
        items: [
            {
                title: "Visa Information Desk", url: "/information/visa"
            },
            {
                title: "Birth Services Information Desk", url: "/information/birth-services"
            },
        ]
    },
    {
        title: "My Compliance Record",
        url: "/my/compliance",
        icon: ShieldCheck,

    },
    {
        title: "Chat",
        url: "/chat",
        icon: MessageCircle,

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

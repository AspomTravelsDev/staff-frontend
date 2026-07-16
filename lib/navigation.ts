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
    Trophy,
    Coins,
    Megaphone,
    MessageSquare,
} from "lucide-react";
import type { UserRole } from "@/types/user-types";

export interface NavItem {
    title: string;
    url: string;
    icon?: LucideIcon;
    isActive?: boolean;
    allowedRoles?: UserRole[];
    badgeKey?: string;
    badgeLabel?: string;
    disabled?: boolean;
    items?: {
        title: string;
        url: string;
        badgeKey?: string;
        badgeLabel?: string;
        disabled?: boolean;
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
        badgeKey: "unreadAnnouncements",
        badgeLabel: "New announcements",
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
        disabled: true,
    },
    {
        title: "Outstanding Payments",
        url: "/accounts/outstanding",
        icon: CreditCard,
        allowedRoles: ["account"],
    },
    // {
    //     title: "Assigned Projects",
    //     url: "/accounts/assigned-projects",
    //     icon: FolderOpen,
    //     allowedRoles: ["account"],
    // },
    {
        title: "Celebrations",
        url: "/hr/celebrations",
        icon: LayoutDashboard,
        allowedRoles: ["hr"],
    },
    {
        title: "Visa Applications",
        url: "/visa/applications",
        icon: FileSearch,
        allowedRoles: ["visa"],
        disabled: true,
    },
    {
        title: "Employee Documents",
        url: "/hr/docs",
        icon: FileText,
        allowedRoles: ["hr"],
    },
    {
        title: "Leave Management",
        url: "/hr/leave",
        icon: CalendarCheck,
        allowedRoles: ["hr"],
        badgeKey: "pendingLeaves",
        badgeLabel: "Pending leave requests",
    },
    {
        title: "Performance Reviews",
        url: "/hr/performance",
        icon: ClipboardList,
        allowedRoles: ["hr", "compliance"],
        disabled: true,
    },
    {
        title: "Compliance Dashboard",
        url: "/compliance",
        icon: ShieldCheck,
        allowedRoles: ["compliance"],
        badgeKey: "complianceReplies",
        badgeLabel: "Staff replies pending review"
    },
    {
        title: "Invite Staff",
        url: "/admin/invite",
        icon: Users,
        allowedRoles: ["super", "it"],
    },
    {
        title: "Activity Log",
        url: "/activity",
        icon: Activity,
        allowedRoles: ["super", "it"],
        disabled: true,
    },
    {
        title: "Customer Database (CRM)",
        url: "/crm",
        icon: Users,
        allowedRoles: ["super", "it", "visa", "account", "social-media", "compliance"],
    },
    {
        title: "HR Applications",
        url: "/hr/applications",
        icon: FileText,
        allowedRoles: ["hr", "compliance"],
        badgeKey: "onboardingCompleted",
        badgeLabel: "New onboarding completions",
    },
    {
        title: "Onboarding Documents",
        url: "/hr/onboarding",
        icon: FileText,
        allowedRoles: ["hr"],
    },
    {
        title: "Payroll",
        url: "/hr/payroll",
        icon: CreditCard,
        allowedRoles: ["hr", "super"],
    },
    {
        title: "General Tasks & Reports",
        url: "/hr/tasks",
        icon: ClipboardList,
        allowedRoles: ["hr", "compliance"],
    },
    {
        title: "Weekly Feedback",
        url: "/hr/weekly-feedback",
        icon: ClipboardList,
        allowedRoles: ["hr", "super"],
    },
    {
        title: "Anonymous Comments",
        url: "/hr/anonymous-comments",
        icon: MessageSquare,
        allowedRoles: ["hr", "super"],
        badgeKey: "anonymousComments",
    },
    // {
    //     title: "Applications",
    //     url: "/accounts/applications",
    //     icon: FileText,
    //     allowedRoles: ["account"],
    // },
    {
        title: "Visa Documents",
        url: "/visa/documents",
        icon: FileText,
        allowedRoles: ["visa"],
    },
    // {
    //     title: "IT Service Desk",
    //     url: "/it/service-desk",
    //     icon: Settings2,
    //     allowedRoles: ["it", "super"],
    // },
    {
        title: "All IT Issues",
        url: "/it/report-issues",
        icon: MessageCircle,
        allowedRoles: ["it", "super"],
        badgeKey: "itIssues",
        badgeLabel: "IT issues open or in progress",
    },
    {
        title: "Cheatsheet Admin",
        url: "/admin/cheatsheet",
        icon: FileText,
        allowedRoles: ["it", "super"],
    },
    {

        title: "Employee List",
        url: "/hr/employees",
        icon: Users,
        allowedRoles: ["hr"],
    },
    {
        title: "Staff Requests",
        url: "/hr/staff-requests",
        icon: Users,
        allowedRoles: ["hr", "super", "compliance"],
        badgeKey: "hrRequests",
        badgeLabel: "Staff requests pending review"
    },
    {
        title: "Loan Requests Queue",
        url: "/hr/loan-requests",
        icon: CreditCard,
        allowedRoles: ["hr", "super"],
        badgeKey: "loanRequestsHr",
        badgeLabel: "Loan requests pending HR review",
        disabled: true,
    },
    {
        title: "Salary Advance Queue",
        url: "/hr/salary-advance-requests",
        icon: CreditCard,
        allowedRoles: ["hr", "super"],
        badgeKey: "salaryAdvanceRequestsHr",
        badgeLabel: "Salary advances pending HR review",
        disabled: true,
    },
    {
        title: "Loan Disbursement Queue",
        url: "/accounts/loan-requests",
        icon: CreditCard,
        allowedRoles: ["account", "super"],
        badgeKey: "loanRequestsAccounts",
        badgeLabel: "Loan requests pending Accounts action",
        disabled: true,
    },
    {
        title: "Salary Advance Disbursement",
        url: "/accounts/salary-advance-requests",
        icon: CreditCard,
        allowedRoles: ["account", "super"],
        badgeKey: "salaryAdvanceRequestsAccounts",
        badgeLabel: "Salary advances pending Accounts action",
        disabled: true,
    },
    {
        title: "All General Requests",
        url: "/admin/requests",
        icon: ClipboardList,
        allowedRoles: ["admin", "it", "super", "compliance"],
        badgeKey: "requests",
        badgeLabel: "General requests pending review",
    },
    {
        title: "Inventory",
        url: "/admin/inventory",
        icon: ClipboardList,
        allowedRoles: ["admin", "it", "super", "compliance"]
    },
    // {
    //     title: "Visa Client List",
    //     url: "/visa/clients",
    //     icon: ClipboardList,
    //     allowedRoles: ["visa"]
    // },
    {
        title: "Visa Information Desk",
        url: "/visa/information-desk",
        icon: FolderOpen,
        allowedRoles: ["visa"]
    },
    {
        title: "Manage IT Information Desk",
        url: "/admin/it-desk",
        icon: FolderOpen,
        allowedRoles: ["it", "super"],
    },
    {
        title: "Manage Dept Contacts",
        url: "/it/departmental-contacts",
        icon: Users,
        allowedRoles: ["it", "super"],
    },
    {
        title: "Award Staff",
        url: "/hr/award-staff",
        icon: Trophy,
        allowedRoles: ["hr", "super", "compliance"],
        badgeKey: "awardStaff",
        badgeLabel: "Award Staff of the month"
    },
    {
        title: "Current Rates",
        url: "/accounts/current-rates",
        icon: Coins,
        allowedRoles: ["account"],
        badgeKey: "dollarRate",
        badgeLabel: "Enter today's dollar rate",
    },
    {
        title: "Announcements",
        url: "/admin/announcements",
        icon: Megaphone,
        allowedRoles: ["it", "super"],
        badgeKey: "announcements",
        badgeLabel: "Announcements pending review"
    },
    {
        title: "General Attendance",
        url: "/attendance",
        icon: CalendarCheck,
        allowedRoles: ["hr", "super", "it", "compliance"]
    },

];

/**
 * Personal navigation - visible to ALL users
 * Now grouped into collapsible sections
 */
export const personalNav: NavItem[] = [
    {
        title: "HR Updates",
        url: "",
        icon: Users,
        items: [
            { title: "Request Leave", url: "/my/leave", badgeKey: "myLeaveUpdates", badgeLabel: "Leave request updates" },
            {
                title: "To-Do & Reports",
                url: "/my/tasks",
                badgeKey: "myTasks,reportReminder",
                badgeLabel: "Submit your to-do list"
            },
            {
                title: "Weekly Questionnaire",
                url: "/my/weekly-feedback",
                badgeKey: "weeklyQuestionnairePending",
                badgeLabel: "Complete your weekly questionnaire",
            },
            {
                title: "Attendance",
                url: "/my/attendance",
                badgeKey: "attendance",
                badgeLabel: "Clock in for today"
            },
            { title: "Employee Documents", url: "/my/documents" },
            { title: "Appraisal", url: "/my/performance", disabled: true },
            { title: "Request Staff", url: "/my/request-staff" },
        ],
    },
    {
        title: "IT Support",
        url: "",
        icon: Settings2,
        items: [
            { title: "My IT Assets", url: "/my/inventory" },
            { title: "Report Issue", url: "/my/it-issue" },
            // { title: "Request Gadget", url: "/my/gadget-request" },
        ],
    },
    {
        title: "Account",
        url: "",
        icon: CreditCard,
        items: [
            {
                title: "Payment Confirmation", url: "/my/payment"
            },
            {
                title: "Expenses", url: "/my/expenses", disabled: true,
            },
            {
                title: "Payslip", url: "/my/payslip",
            },
            {
                title: "Loan Requests", url: "/my/loan-requests",
                badgeKey: "myLoanRequestUpdates",
                badgeLabel: "Loan request status updates",
                disabled: true,
            },
            {
                title: "Salary Advance Requests", url: "/my/salary-advance-requests",
                badgeKey: "mySalaryAdvanceRequestUpdates",
                badgeLabel: "Salary advance status updates",
                disabled: true,
            }
        ]
    },
    {
        title: "Admin",
        url: "",
        icon: LucideUser,
        items: [
            {
                title: "General Requests",
                url: "/my/requests",
                badgeKey: "myGeneralRequestUpdates",
                badgeLabel: "General request updates",
            },
        ]
    },
    {
        title: "My Clients",
        url: "/my/clients",
        icon: Users,
    },
    {
        title: "Information Desk",
        url: "",
        icon: FolderOpen,
        items: [
            {
                title: "Visa Information Desk", url: "/my/visa"
            },
            // {
            //     title: "Birth Services Information Desk", url: "/my/birth-services"
            // },
            {
                title: "IT Information Desk", url: "/my/it",
                badgeKey: "unreadITGuides",
                badgeLabel: "New IT guides available",
            },
            {
                title: "Daily Product Quiz", url: "/my/cheatsheet-quiz"
            }
        ]
    },
    {
        title: "My Compliance Record",
        url: "/my/compliance",
        icon: ShieldCheck,
        badgeKey: "compliance",
        badgeLabel: "New compliance query"
    },
    {
        title: "Staff Directory",
        url: "/directory",
        icon: Users,
    },
    {
        title: "Make Announcement",
        url: "/my/announcement",
        icon: Megaphone,
    },
    {
        title: "Chat",
        url: "/chat",
        icon: MessageCircle,
        disabled: true,

    },

];

/**
 * Filter navigation items based on user role
 * Super see all department items
 */
export function filterNavByRole(items: NavItem[], role: UserRole): NavItem[] {
    // Super see everything
    if (role === "super") {
        return items;
    }

    return items.filter((item) => {
        // If no allowedRoles defined, invisible to all
        if (!item.allowedRoles) {
            return false;
        }
        // Check if user's role is in allowed list
        return item.allowedRoles.includes(role);
    });
}

export function getNavigationForUser(user: { role: UserRole; is_department_account?: boolean }) {
    return {
        dashboard: dashboardNav,
        department: filterNavByRole(departmentNav, user.role),
        personal: user.is_department_account ? [] : personalNav,
    };
}

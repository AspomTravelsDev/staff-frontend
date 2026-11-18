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
  Mail,
  Briefcase,
  ListTodo,
  Ticket,
} from "lucide-react";
import type { UserRole } from "@/types/user-types";
import { ANNOUNCEMENT_REVIEW_ROLES, canReviewAnnouncements } from "@/lib/announcement-review-access";

export interface NavItem {
  title: string;
  url: string;
  icon?: LucideIcon;
  isActive?: boolean;
  allowedRoles?: UserRole[];
  requiresExplicitRole?: boolean;
  requiresReviewer?: boolean;
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
    allowedRoles: ["account", "compliance", "office-operations"],
    badgeKey: "pendingPayments",
  },
  {
    title: "Invoice Generator",
    url: "/accounts/invoices",
    icon: FileText,
    allowedRoles: ["account"],
  },
  {
    title: "Payment Links",
    url: "/accounts/payment-links",
    icon: CreditCard,
    allowedRoles: ["account"],
    badgeKey: "paymentLinkUpdates,paymentLinkAttention",
    badgeLabel: "Payment requests needing attention",
  },
  {
    title: "Expenses Management",
    url: "/accounts/expenses",
    icon: Receipt,
    allowedRoles: ["account", "compliance"],
    disabled: true,
  },
  {
    title: "Outstanding Payments",
    url: "/accounts/outstanding",
    icon: CreditCard,
    allowedRoles: ["account", "office-operations", "compliance"],
  },
  // {
  //     title: "Assigned Projects",
  //     url: "/accounts/assigned-projects",
  //     icon: FolderOpen,
  //     allowedRoles: ["account"],
  // },
  {
    title: "Staff Celebrations",
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
    allowedRoles: ["hr", "compliance"],
  },
  {
    title: "Leave Management",
    url: "/hr/leave",
    icon: CalendarCheck,
    allowedRoles: ["hr", "compliance"],
    badgeKey: "pendingLeaves",
    badgeLabel: "Pending leave requests",
  },
  {
    title: "Compliance Dashboard",
    url: "/compliance",
    icon: ShieldCheck,
    allowedRoles: ["compliance", "office-operations", "hr"],
    badgeKey: "complianceReplies",
    badgeLabel: "Compliance queries awaiting review",
  },
  {
    title: "Department KPIs",
    url: "/compliance/kpis",
    icon: ClipboardList,
    allowedRoles: ["compliance", "super"],
    requiresExplicitRole: true,
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
    allowedRoles: [
      "super",
      "it",
      "visa",
      "account",
      "social-media",
      "compliance",
      "office-operations",
    ],
  },
  {
    title: "New Staff Onboarding",
    url: "/hr/applications",
    icon: FileText,
    allowedRoles: ["hr", "compliance", "office-operations"],
    badgeKey: "onboardingCompleted",
    badgeLabel: "New onboarding completions",
  },
  {
    title: "Payroll",
    url: "/hr/payroll",
    icon: CreditCard,
    allowedRoles: [
      "hr",
      "super",
      "account",
      "compliance",
      "mp",
      "md",
      "office-operations",
    ],
    badgeKey: "payrollQueue,payrollComments",
    badgeLabel: "Payroll runs awaiting review",
  },
  {
    title: "General Tasks & Reports",
    url: "/hr/tasks",
    icon: ClipboardList,
    allowedRoles: ["hr", "compliance", "office-operations"],
  },
  {
    title: "Office Task Tracker",
    url: "/operations/delegated-tasks",
    icon: ListTodo,
    allowedRoles: ["office-operations", "compliance", "mp", "md"],
    badgeKey: "delegatedDeliverables",
    badgeLabel: "Overdue or pending delegated deliverables",
  },
  {
    title: "Staff Surveys",
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
  {
    title: "Visa Samples Generator",
    url: "/visa/samples",
    icon: FileText,
    allowedRoles: ["visa", "super"],
  },
  {
    title: "Travel Info Generator",
    url: "/visa/info-generator",
    icon: FileText,
    allowedRoles: ["visa", "super"],
  },
  {
    title: "Booking Generator",
    url: "/social-media/booking-confirmation",
    icon: Ticket,
    allowedRoles: ["social-media", "super"],
  },
  {
    title: "Staff Profile Generator",
    url: "/social-media/profile-generator",
    icon: Megaphone,
    allowedRoles: ["social-media", "super"],
  },
  {
    title: "Content Collections",
    url: "/social-media/content-collections",
    icon: Megaphone,
    allowedRoles: ["social-media", "super"],
    badgeKey: "openContentIdeas",
    badgeLabel: "New open content ideas in Idea Bank",
  },
  {
    title: "Ad Compliance Checker",
    url: "/social-media/compliance",
    icon: ShieldCheck,
    allowedRoles: ["social-media", "super"],
  },
  {
    title: "All IT Issues",
    url: "/it/report-issues",
    icon: MessageCircle,
    allowedRoles: ["it", "super"],
    badgeKey: "itIssues",
    badgeLabel: "IT issues open or in progress",
  },
  {
    title: "Staff Provisioning",
    url: "/it/onboarding",
    icon: Mail,
    allowedRoles: ["it", "super"],
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
    allowedRoles: ["hr", "it", "compliance"],
  },
  {
    title: "Department Supervisors",
    url: "/hr/department-supervisors",
    icon: Users,
    allowedRoles: ["hr", "super"],
  },
  {
    title: "Employee Black List",
    url: "/hr/blacklist",
    icon: Users,
    allowedRoles: ["hr", "it", "compliance"],
  },
  {
    title: "Staff Requests",
    url: "/hr/staff-requests",
    icon: Users,
    allowedRoles: ["hr", "super", "compliance", "office-operations"],
    badgeKey: "hrRequests",
    badgeLabel: "Staff requests pending review",
  },
  {
    title: "Recruitment",
    url: "/hr/recruitment",
    badgeKey: "recruitmentUpdates",
    badgeLabel: "Recruitment updates",
    icon: Briefcase,
    allowedRoles: ["hr", "super", "mp", "md"],
  },
  {
    title: "Attendance Requests",
    url: "/hr/attendance-requests",
    icon: CalendarCheck,
    allowedRoles: ["hr", "super", "compliance", "office-operations", "mp", "md"],
    badgeKey: "pendingLatePermissionRequests,workFromHomeRequests",
    badgeLabel: "Pending attendance requests",
  },
  {
    title: "Loan Requests Queue",
    url: "/hr/loan-requests",
    icon: CreditCard,
    allowedRoles: ["hr", "super", "compliance"],
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
    allowedRoles: ["admin", "it", "super", "compliance", "office-operations"],
    badgeKey: "requests",
    badgeLabel: "General requests pending review",
  },
  {
    title: "Company Inventory",
    url: "/admin/company-inventory",
    icon: ClipboardList,
    allowedRoles: ["admin", "it", "super", "compliance", "office-operations"],
  },
  {
    title: "Gadget Assignments",
    url: "/admin/inventory",
    icon: ClipboardList,
    allowedRoles: ["admin", "it", "super", "compliance", "office-operations"],
    badgeKey:
      "inventoryAssignmentsOfficer,inventoryAssignmentsCompliance,inventoryClearanceOfficer,inventoryClearanceCompliance",
    badgeLabel: "Pending asset assignment approvals",
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
    allowedRoles: ["visa"],
  },
  {
    title: "Birth Services Information",
    url: "/birth-services/information-desk",
    icon: FolderOpen,
    allowedRoles: ["birth-services"],
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
    allowedRoles: ["hr", "super", "compliance", "office-operations"],
    badgeKey: "awardStaff",
    badgeLabel: "Award Staff of the month",
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
    title: "All Announcements",
    url: "/announcements",
    icon: Megaphone,
    allowedRoles: ["hr", "it", "super", "mp", "md", "compliance", "office-operations", "account", "admin", "visa", "social-media"],
    badgeKey: "unreadAnnouncements",
    badgeLabel: "Unread announcements",
  },
  {
    title: "Announcement Reviews",
    url: "/admin/announcements",
    icon: Megaphone,
    allowedRoles: ANNOUNCEMENT_REVIEW_ROLES,
    requiresExplicitRole: true,
    badgeKey: "announcements",
    badgeLabel: "Announcements awaiting review",
  },
  {
    title: "Appraisal Review Queue",
    url: "/performance/reviews",
    icon: ClipboardList,
    allowedRoles: ["hr", "compliance", "mp", "md", "super"],
    requiresReviewer: true,
    badgeKey: "performanceReviews",
    badgeLabel: "Appraisals ready for your review",
  },
  {
    title: "General Attendance",
    url: "/attendance",
    icon: CalendarCheck,
    allowedRoles: ["hr", "super", "it", "compliance", "office-operations"],
  },
];

/**
 * Personal navigation - visible to ALL users
 * Now grouped into collapsible sections
 */
export const personalNav: NavItem[] = [
  {
    title: "My Content Ideas",
    url: "/my/content-ideas",
    icon: Megaphone,
    badgeKey: "contentIdeas",
    badgeLabel: "Content assignments to complete",
  },
  {
    title: "HR Updates",
    url: "",
    icon: Users,
    items: [
      {
        title: "Request Leave",
        url: "/my/leave",
        badgeKey: "myLeaveUpdates",
        badgeLabel: "Leave request updates",
      },
      {
        title: "To-Do & Reports",
        url: "/my/tasks",
        badgeKey: "myTasks,reportReminder",
        badgeLabel: "Submit your to-do list",
      },
      {
        title: "Task Tracker",
        url: "/my/task-tracker",
        badgeKey: "assignedTasks",
        badgeLabel: "Tasks assigned to you",
      },
      {
        title: "Staff Surveys",
        url: "/my/weekly-feedback",
        badgeKey: "weeklyQuestionnairePending",
        badgeLabel: "Complete active staff survey",
      },
      {
        title: "Attendance",
        url: "/my/attendance",
        badgeKey: "attendance",
        badgeLabel: "Clock in for today",
      },
      { title: "Employee Documents", url: "/my/documents" },
      { title: "My Performance", url: "/my/performance", badgeKey: "monthlyKpiAssessment,performanceAppraisalUpdates", badgeLabel: "Monthly KPI assessment or appraisal update" },
      { title: "Request Staff", url: "/my/request-staff" },
    ],
  },
  {
    title: "IT Support",
    url: "",
    icon: Settings2,
    items: [
      {
        title: "My IT Assets",
        url: "/my/inventory",
        badgeKey: "inventoryAssignmentsStaff",
        badgeLabel: "Devices awaiting acknowledgement or clearance handover",
      },
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
        title: "Payment Confirmation",
        url: "/my/payment",
        badgeKey: "myPaymentUpdates",
        badgeLabel: "New status updates",
      },
      {
        title: "My Payment Links",
        url: "/my/payment-links",
        badgeKey: "myPaymentLinkUpdates",
        badgeLabel: "Payment link updates",
      },
      {
        title: "Assigned Deals",
        url: "/my/assigned-deals",
        badgeKey: "myAssignedDeals",
        badgeLabel: "New deal assignments",
      },
      {
        title: "Expenses",
        url: "/my/expenses",
        disabled: true,
      },
      {
        title: "Payslip",
        url: "/my/payslip",
      },
      {
        title: "Loan Requests",
        url: "/my/loan-requests",
        badgeKey: "myLoanRequestUpdates",
        badgeLabel: "Loan request status updates",
        disabled: true,
      },
      {
        title: "Salary Advance Requests",
        url: "/my/salary-advance-requests",
        badgeKey: "mySalaryAdvanceRequestUpdates",
        badgeLabel: "Salary advance status updates",
        disabled: true,
      },
    ],
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
    ],
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
        title: "Visa Information Desk",
        url: "/my/visa",
      },
      {
        title: "Birth Services Information Desk", url: "/my/birth-services",
      },
      {
        title: "IT Information Desk",
        url: "/my/it",
        badgeKey: "unreadITGuides",
        badgeLabel: "New IT guides available",
      },
      {
        title: "Daily Product Quiz",
        url: "/my/cheatsheet-quiz",
      },
    ],
  },
  {
    title: "Compliance",
    url: "/my/compliance",
    icon: ShieldCheck,
    items: [
      {
        title: "My Compliance Record",
        url: "/my/compliance",
        badgeKey: "compliance",
        badgeLabel: "New compliance query",
      },
      {
        title: "Compliance Guide",
        url: "/my/compliance/guide",
      },
    ],
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
    badgeKey: "chatMessages",
    badgeLabel: "Unread chat messages",
  },
];

const managementHiddenRoutes = new Set([
  "/hr/award-staff",
  "/hr/docs",
  "/hr/onboarding",
  "/hr/late-requests",
  "/hr/staff-requests",
  "/hr/weekly-feedback",
  "/accounts/current-rates",
  "/it/report-issues",
  "/admin/cheatsheet",
  "/admin/invite",
  "/admin/it-desk",
  "/it/departmental-contacts",
  "/it/onboarding",
  "/my/content-ideas",
  "/my/documents",
  "/my/request-staff",
  "/my/weekly-feedback",
  "/my/visa",
  "/my/birth-services",
]);

function managementNavigation(items: NavItem[]): NavItem[] {
  const visible = (url: string) =>
    !managementHiddenRoutes.has(url) &&
    !url.startsWith("/visa/") &&
    !url.startsWith("/birth-services/") &&
    !url.startsWith("/social-media/");
  return items
    .filter((item) => visible(item.url))
    .map((item) =>
      item.items
        ? { ...item, items: item.items.filter((child) => visible(child.url)) }
        : item,
    )
    .filter((item) => !item.items || item.items.length > 0);
}

/** Filter department tools; management exclusions also apply with secondary roles. */
export function filterNavByRole(
  items: NavItem[],
  roleOrRoles: UserRole | UserRole[],
): NavItem[] {
  const roles = Array.isArray(roleOrRoles) ? roleOrRoles : [roleOrRoles];
  const eligibleItems = items.filter((item) => !item.requiresExplicitRole || item.allowedRoles?.some((allowed) => roles.includes(allowed)));

  if (roles.some((r) => r === "mp" || r === "md"))
    return managementNavigation(eligibleItems);
  if (roles.includes("super")) return [...eligibleItems];

  return eligibleItems.filter((item) => {
    // If no allowedRoles defined, invisible to all
    if (!item.allowedRoles) {
      return false;
    }
    // Check if any of user's active roles is in allowed list
    return item.allowedRoles.some((allowedRole) => roles.includes(allowedRole));
  });
}

export function getNavigationForUser(user: {
  id?: string;
  role: UserRole;
  secondary_roles?: UserRole[] | null;
  roles?: UserRole[];
  is_department_account?: boolean;
  is_active?: boolean;
  is_supervisor?: boolean;
}) {
  const activeRoles =
    user.roles && user.roles.length > 0
      ? user.roles
      : [user.role, ...(user.secondary_roles || [])];

  const canReviewPerformance = !user.is_department_account && (user.is_supervisor || activeRoles.some((role) => role === "hr" || role === "compliance" || role === "mp" || role === "md" || role === "super"));
  const department = filterNavByRole(departmentNav, activeRoles)
    .filter((item) => !item.requiresReviewer || canReviewPerformance)
    .filter((item) => !user.is_department_account || !item.requiresExplicitRole)
    .filter((item) => item.url !== "/admin/announcements" || canReviewAnnouncements(user));
  if (canReviewPerformance && !department.some((item) => item.url === "/performance/reviews")) {
    const reviewWorkspace = departmentNav.find((item) => item.url === "/performance/reviews");
    if (reviewWorkspace) department.push(reviewWorkspace);
  }
  if (user.is_active !== false && user.is_supervisor && !user.is_department_account && !department.some(item => item.url === "/compliance")) {
    const compliance = departmentNav.find(item => item.url === "/compliance");
    if (compliance) department.push(compliance);
  }
  if (
    user.id === "019c56b9-09c2-729b-84de-a13bfc2b8e8d" &&
    !department.some((item) => item.url === "/hr/tasks")
  ) {
    const tasks = departmentNav.find((item) => item.url === "/hr/tasks");
    if (tasks) department.push(tasks);
  }
  return {
    dashboard: dashboardNav,
    department,
    personal: user.is_department_account
      ? []
      : (activeRoles.some((r) => r === "mp" || r === "md")
        ? managementNavigation(personalNav)
        : personalNav),
  };
}

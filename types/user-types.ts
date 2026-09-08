export const USER_ROLES = {
    SUPER_ADMIN: "super",
    MP: "mp",
    MD: "md",
    ADMIN_OFFICER: "admin",
    IT_OFFICER: "it",
    ACCOUNT_OFFICER: "account",
    VISA_OFFICER: "visa",
    HR_OFFICER: "hr",
    SOCIAL_MEDIA_OFFICER: "social-media",
    COMPLIANCE_OFFICER: "compliance",
    BIRTH_SERVICES_OFFICER: "birth-services",
    HOLIDAYS_OFFICER: "holidays",
    TICKETING_OFFICER: "ticket",
    OFFICE_ASSISTANT: "office-assistant",
} as const;

export type UserRole = typeof USER_ROLES[keyof typeof USER_ROLES];

export type RoleOption = {
    label: string;
    value: string;
};

export type RoleMetadataItem = {
    value: string;
    label: string;
    department: string | null;
};

export type RolesMetadataContract = {
    version: number;
    roles: RoleMetadataItem[];
    role_to_department: Record<string, string>;
    departments: string[];
};

export const ROLE_TO_DEPARTMENT_FALLBACK: Record<string, string> = {
    super: "Management",
    mp: "Management",
    md: "Management",
    admin: "Administration",
    it: "IT",
    account: "Accounts",
    visa: "Visa",
    hr: "HR",
    "social-media": "Social Media",
    compliance: "Compliance",
    "birth-services": "Birth Services",
    holidays: "Holidays",
    ticket: "Ticketing",
    "office-assistant": "Office Assistants",
};

export const USER_ROLE_DETAILS: Record<UserRole, { label: string; value: UserRole }> = {
    [USER_ROLES.SUPER_ADMIN]: { label: "Super Admin", value: "super" },
    [USER_ROLES.MP]: { label: "Managing Partner", value: "mp" },
    [USER_ROLES.MD]: { label: "Managing Director", value: "md" },
    [USER_ROLES.ADMIN_OFFICER]: { label: "Admin Officer", value: "admin" },
    [USER_ROLES.IT_OFFICER]: { label: "IT Officer", value: "it" },
    [USER_ROLES.ACCOUNT_OFFICER]: { label: "Accounts Officer", value: "account" },
    [USER_ROLES.VISA_OFFICER]: { label: "Visa Officer", value: "visa" },
    [USER_ROLES.HR_OFFICER]: { label: "HR Officer", value: "hr" },
    [USER_ROLES.SOCIAL_MEDIA_OFFICER]: { label: "Social Media Officer", value: "social-media" },
    [USER_ROLES.COMPLIANCE_OFFICER]: { label: "Compliance Officer", value: "compliance" },
    [USER_ROLES.BIRTH_SERVICES_OFFICER]: { label: "Birth Services Officer", value: "birth-services" },
    [USER_ROLES.HOLIDAYS_OFFICER]: { label: "Holidays Officer", value: "holidays" },
    [USER_ROLES.TICKETING_OFFICER]: { label: "Ticketing Officer", value: "ticket" },
    [USER_ROLES.OFFICE_ASSISTANT]: { label: "Office Assistant", value: "office-assistant" },
};

export function getRolesForSelect() {
    return Object.values(USER_ROLE_DETAILS).map(({ label, value }) => ({
        label,
        value,
    }));
}

export function getFallbackRolesMetadataContract(): RolesMetadataContract {
    const roles: RoleMetadataItem[] = Object.values(USER_ROLE_DETAILS).map(
        ({ value, label }) => ({
            value,
            label,
            department: ROLE_TO_DEPARTMENT_FALLBACK[value] ?? null,
        })
    );

    const departments = Array.from(
        new Set([
            "General",
            ...Object.values(ROLE_TO_DEPARTMENT_FALLBACK),
            "Customer Service",
            "Office Assistants",
            "others",
            "Other",
        ])
    );

    return {
        version: 1,
        roles,
        role_to_department: { ...ROLE_TO_DEPARTMENT_FALLBACK },
        departments,
    };
}

export function getRoleLabel(
    role?: string,
    options?: { isSupervisor?: boolean }
): string {
    if (!role) return "";

    if (role === USER_ROLES.HR_OFFICER) {
        return options?.isSupervisor ? "HR Manager" : "HR Officer";
    }

    // Cast strict check, fallback to raw string if unknown
    const detail = USER_ROLE_DETAILS[role as UserRole];
    return detail ? detail.label : role;
}

/**
 * Helper to get all active roles (primary + secondary) for a user
 */
export function getUserActiveRoles(user?: { role?: string; secondary_roles?: string[] | null; roles?: string[] } | null): string[] {
    if (!user) return [];
    if (user.roles && user.roles.length > 0) return user.roles;
    const secondary = user.secondary_roles || [];
    return Array.from(new Set([user.role, ...secondary].filter(Boolean) as string[]));
}

/**
 * Check if a user has a specific role (primary or secondary)
 */
export function userHasRole(user: { role?: string; secondary_roles?: string[] | null; roles?: string[] } | null | undefined, targetRole: string): boolean {
    return getUserActiveRoles(user).includes(targetRole);
}

/**
 * Check if a user has any of the specified roles
 */
export function userHasAnyRole(user: { role?: string; secondary_roles?: string[] | null; roles?: string[] } | null | undefined, targetRoles: string[]): boolean {
    const active = getUserActiveRoles(user);
    return targetRoles.some((role) => active.includes(role));
}

/**
 * Convenient aliases
 */
export const getRoles = getUserActiveRoles;
export const getUserRoles = getUserActiveRoles;


export interface User {
    id: string;
    staff_id: string;
    tax_id: string | null;
    name: string;
    email: string;
    phone: string | null;
    mobile_phone: string | null;
    image_url: string | null;
    role: UserRole;
    secondary_roles?: UserRole[] | null;
    roles?: UserRole[];
    department: string | null;
    is_active: boolean;
    is_supervisor: boolean;
    gross_pay: string;
    date_joined: string | null; // ISO date string (YYYY-MM-DD)
    created_at: string;
    updated_at: string;
    dob: string | null;
    contract_type: "full_time" | "part_time" | "contract" | "nysc" | "intern" | null;
    is_department_account: boolean;
}

export interface LoginUser {
    id: string;
    staff_id: string;
    name: string;
    email: string;
    phone: string | null;
    mobile_phone: string | null;
    image_url: string | null;
    role: UserRole;
    secondary_roles?: UserRole[] | null;
    roles?: UserRole[];
    is_active: boolean;
    is_supervisor: boolean;
    is_department_account: boolean;
}

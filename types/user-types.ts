export const USER_ROLES = {
    SUPER_ADMIN: "super",
    ADMIN_OFFICER: "admin",
    IT_OFFICER: "it",
    ACCOUNT_OFFICER: "account",
    VISA_OFFICER: "visa",
    HR_OFFICER: "hr",
    SOCIAL_MEDIA_OFFICER: "social-media",
    COMPLIANCE_OFFICER: "compliance",
    BIRTH_SERVICES_OFFICER: "birth-services",
    HOLIDAYS_OFFICER: "holidays",
} as const;

export type UserRole = typeof USER_ROLES[keyof typeof USER_ROLES];

export const USER_ROLE_DETAILS: Record<UserRole, { label: string; value: UserRole }> = {
    [USER_ROLES.SUPER_ADMIN]: { label: "Super Admin", value: "super" },
    [USER_ROLES.ADMIN_OFFICER]: { label: "Admin Officer", value: "admin" },
    [USER_ROLES.IT_OFFICER]: { label: "IT Officer", value: "it" },
    [USER_ROLES.ACCOUNT_OFFICER]: { label: "Accounts Officer", value: "account" },
    [USER_ROLES.VISA_OFFICER]: { label: "Visa Officer", value: "visa" },
    [USER_ROLES.HR_OFFICER]: { label: "HR Officer", value: "hr" },
    [USER_ROLES.SOCIAL_MEDIA_OFFICER]: { label: "Social Media Officer", value: "social-media" },
    [USER_ROLES.COMPLIANCE_OFFICER]: { label: "Compliance Officer", value: "compliance" },
    [USER_ROLES.BIRTH_SERVICES_OFFICER]: { label: "Birth Services Officer", value: "birth-services" },
    [USER_ROLES.HOLIDAYS_OFFICER]: { label: "Holidays Officer", value: "holidays" },
};

export function getRolesForSelect() {
    return Object.values(USER_ROLE_DETAILS).map(({ label, value }) => ({
        label,
        value,
    }));
}

export function getRoleLabel(role?: string): string {
    if (!role) return "";
    // Cast strict check, fallback to raw string if unknown
    const detail = USER_ROLE_DETAILS[role as UserRole];
    return detail ? detail.label : role;
}

export interface User {
    id: string;
    staff_id: string;
    name: string;
    email: string;
    phone: string | null;
    image_url: string | null;
    role: UserRole;
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
    image_url: string | null;
    role: UserRole;
    is_active: boolean;
    is_supervisor: boolean;
    is_department_account: boolean;
}

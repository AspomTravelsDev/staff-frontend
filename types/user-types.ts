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
    TICKETING_OFFICER: "ticket",
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
};

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
    [USER_ROLES.TICKETING_OFFICER]: { label: "Ticketing Officer", value: "ticket" },
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

export interface User {
    id: string;
    staff_id: string;
    tax_id: string | null;
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

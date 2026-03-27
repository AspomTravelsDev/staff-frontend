export type PayslipLineType = "earning" | "deduction";

export type PayslipLineCode =
    | "basic"
    | "rent"
    | "transport"
    | "medical"
    | "furniture"
    | "utility"
    | "entertainment"
    | "meal"
    | "clothing"
    | "passages"
    | "tax"
    | "pension"
    | "nhf"
    | "accommodation"
    | "absence"
    | "suspension"
    | "loan"
    | "salary_advance"
    | "other";

export interface PayslipPeriod {
    month: number;
    year: number;
    start_date: string;
    end_date: string;
    timezone: string;
}

export interface PayslipEmployee {
    id: string;
    staff_id: string;
    name: string;
    department: string | null;
    role: string | null;
}

export interface PayslipLineItem {
    code: PayslipLineCode;
    label: string;
    type: PayslipLineType;
    amount: number;
    quantity?: number;
    unit_amount?: number;
    meta?: Record<string, string | number | boolean | null>;
}

export interface PayslipTotals {
    gross_salary: number;
    adjusted_gross: number;
    total_earnings: number;
    total_deductions: number;
    net_pay: number;
}

export interface PayslipResponse {
    period: PayslipPeriod;
    employee: PayslipEmployee;
    lines: PayslipLineItem[];
    totals: PayslipTotals;
    generated_at: string;
    version: "v1";
}

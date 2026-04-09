/**
 * Payment Confirmation constants — safe to import from both server and client components.
 */

export const PAYMENT_PRODUCTS = [
    "UK Visa",
    "US Visa",
    "Canada Visa",
    "Schengen Visa",
    "Australia Visa",
    "Dubai Visa",
    "Birth Services",
    "School Services",
    "Travel Package",
    "Business Visa",
    "Student Visa",
    "Other",
] as const;

export const PAYMENT_BANKS = [
    "GTB",
    "Access Bank",
    "Zenith Bank",
    "First Bank",
    "UBA",
    "Sterling Bank",
    "Polaris Bank",
    "Fidelity Bank",
    "FCMB",
    "Stanbic IBTC",
    "Opay",
    "PalmPay",
    "Cash",
    "Other",
] as const;

export type PaymentStatus = "pending" | "approved" | "rejected";

export const STATUS_LABELS: Record<PaymentStatus, string> = {
    pending: "Pending",
    approved: "Approved",
    rejected: "Rejected",
};

export const STATUS_COLORS: Record<PaymentStatus, string> = {
    pending: "bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-400",
    approved: "bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400",
    rejected: "bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-400",
};

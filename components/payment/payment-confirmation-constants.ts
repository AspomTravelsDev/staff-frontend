/**
 * Payment Confirmation constants — safe to import from both server and client components.
 */

export const PAYMENT_PRODUCTS = [
    "Airport Transfer",
    "ATIS",
    "Australia Visa",
    "Birth Services",
    "Brazil Visa",
    "Canada School Service",
    "Canada Visa",
    "Courier Cost",
    "COVID-19",
    "Dubai Visa",
    "Egypt Visa",
    "Esusu (Aspom Savings Plan)",
    "Hotel",
    "International Flight",
    "International Passport",
    "Kenya Visa",
    "Local Flight",
    "Schengen Visa",
    "Singapore Visa",
    "South Africa Visa",
    "Tour Package",
    "Travel Insurance",
    "Turkey Visa",
    "UK Visa",
    "US Visa",
    "USA School Services",
    "Yellow Fever",
    "Zanzibar Visa",
    "Others",
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

export type PaymentStatus = "pending" | "approved" | "rejected" | "cancelled";

export const STATUS_LABELS: Record<PaymentStatus, string> = {
    pending: "Pending",
    approved: "Approved",
    rejected: "Declined",
    cancelled: "Cancelled",
};

export const STATUS_COLORS: Record<PaymentStatus, string> = {
    pending: "bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-400",
    approved: "bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400",
    rejected: "bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-400",
    cancelled: "bg-muted text-muted-foreground",
};

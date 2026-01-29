export interface ExchangeRate {
    currency: string;
    rate: string;
    change: string;
    trend: "up" | "down";
}

export interface DashboardStat {
    title: string;
    value: string;
    description: string;
    color: "blue" | "green" | "yellow" | "red"; // aligning with StatsCard props
}

export const mockExchangeRates: ExchangeRate[] = [
    { currency: "USD", rate: "1,520", change: "+2.5%", trend: "up" },
    { currency: "CAD", rate: "1,640", change: "-0.8%", trend: "down" },
    { currency: "EUR", rate: "1,640", change: "-0.8%", trend: "down" },
    { currency: "GBP", rate: "1,910", change: "+1.2%", trend: "up" },
];

export const mockDashboardStats = {
    totalAttendance: {
        title: "Total Attendance",
        value: "0",
        description: "0 days late this month",
        color: "blue" as const,
    },
    leaveDays: {
        title: "Working Leave Days Remaining",
        value: "20",
        description: "Available for 2026",
        color: "green" as const,
    },
    totalAwards: {
        title: "Total Awards",
        value: "0",
        description: "Employee of the Month",
        color: "yellow" as const,
    },
};

export const mockEmployeeOfMonth = {
    name: "Ehiorobo Maryjane",
    role: "Visa Officer",
    image: "/mj.webp",
    initials: "EM",
};

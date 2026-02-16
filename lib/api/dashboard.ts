"use server";

import { apiClient, shouldMock, type ApiResponse } from "./client";
import { delay } from "@/lib/utils";

// --- Employee of the Month ---

export interface EmployeeOfTheMonth {
    name: string;
    role: string;
    image: string;
    initials: string;
    achievements: string[];
    month: string;
}

const MOCK_EMPLOYEE_OF_MONTH: EmployeeOfTheMonth = {
    name: "Adebimpe Oyelola",
    role: "Social Media Officer",
    image: "/sotm.jpeg",
    initials: "AO",
    achievements: [
        "Best Social Media Campaign",
        "Most Engaging Content",
        "Best Use of Hashtags",
    ],
    month: new Date().toLocaleString("default", { month: "long" }),
};

export async function getEmployeeOfTheMonth(): Promise<ApiResponse<EmployeeOfTheMonth>> {
    if (shouldMock("useMockDashboard")) {
        await delay(500);
        return {
            success: true,
            data: MOCK_EMPLOYEE_OF_MONTH,
        };
    }
    return apiClient<EmployeeOfTheMonth>("/dashboard/employee-of-month");
}

// --- News & Announcements ---

export interface NewsItem {
    id: string;
    title: string;
    category: "Policy" | "Event" | "Maintenance" | "Holiday" | "Other";
    date: string;
    status: "New" | "Important" | "Regular" | "Alert";
    content: string;
}

const MOCK_NEWS: NewsItem[] = [
    // {
    //     id: "1",
    //     title: "New Travel Policy Update",
    //     category: "Policy",
    //     date: "2024-03-15",
    //     status: "Important",
    //     content: "We have updated our travel policy regarding international flights...",
    // },
    // {
    //     id: "2",
    //     title: "Office Maintenance Schedule",
    //     category: "Maintenance",
    //     date: "2024-03-20",
    //     status: "Alert",
    //     content: "Maintenance work will be carried out on the 3rd floor...",
    // },
    // {
    //     id: "3",
    //     title: "Q1 Town Hall Meeting",
    //     category: "Event",
    //     date: "2024-03-25",
    //     status: "New",
    //     content: "Join us for our Q1 Town Hall meeting to discuss quarterly results...",
    // },
    // {
    //     id: "4",
    //     title: "Easter Holiday Announcement",
    //     category: "Holiday",
    //     date: "2024-03-28",
    //     status: "Regular",
    //     content: "The office will be closed on Good Friday and Easter Monday...",
    // },
    // {
    //     id: "5",
    //     title: "System Upgrade Completed",
    //     category: "Maintenance",
    //     date: "2024-03-10",
    //     status: "Regular",
    //     content: "The CRM system upgrade has been successfully completed...",
    // },
];

export async function getDashboardUpdates(): Promise<ApiResponse<NewsItem[]>> {
    if (shouldMock("useMockDashboard")) {
        await delay(600);
        return {
            success: true,
            data: MOCK_NEWS,
        };
    }
    return apiClient<NewsItem[]>("/dashboard/updates");
}

export async function getAnnouncementBySlug(slug: string): Promise<ApiResponse<NewsItem>> {
    const getSlug = (title: string) =>
        title
            .toLowerCase()
            .replace(/[^\w\s-]/g, "")
            .replace(/\s+/g, "-");

    if (shouldMock("useMockDashboard")) {
        await delay(300);
        const item = MOCK_NEWS.find((item) => getSlug(item.title) === slug);
        if (!item) {
            return {
                success: false,
                error: { code: "404", error: "Announcement not found" },
            };
        }
        return {
            success: true,
            data: item,
        };
    }
    return apiClient<NewsItem>(`/dashboard/updates/${slug}`);
}

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

// Legacy NewsItem removed. Use AnnouncementItem from @/lib/api/announcements instead.

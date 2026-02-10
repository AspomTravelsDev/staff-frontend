import { useQuery } from "@tanstack/react-query";
import {
    getEmployeeOfTheMonth,
    getDashboardUpdates,
    type EmployeeOfTheMonth,
    type NewsItem,
} from "../dashboard";

export const DASHBOARD_EMPLOYEE_QUERY_KEY = ["dashboard", "employee"];
export const DASHBOARD_UPDATES_QUERY_KEY = ["dashboard", "updates"];

export function useEmployeeOfTheMonth() {
    return useQuery({
        queryKey: DASHBOARD_EMPLOYEE_QUERY_KEY,
        queryFn: async () => {
            const response = await getEmployeeOfTheMonth();
            if (!response.success) {
                // Return null or throw depending on how we want to handle errors
                // For now, logging and returning null is safer for UI
                console.error("Failed to fetch employee of the month:", response.error);
                throw new Error(response.error?.error || "Failed to fetch data");
            }
            return response.data;
        },
    });
}

export function useDashboardUpdates() {
    return useQuery({
        queryKey: DASHBOARD_UPDATES_QUERY_KEY,
        queryFn: async () => {
            const response = await getDashboardUpdates();
            if (!response.success) {
                console.error("Failed to fetch dashboard updates:", response.error);
                throw new Error(response.error?.error || "Failed to fetch data");
            }
            return response.data;
        },
    });
}

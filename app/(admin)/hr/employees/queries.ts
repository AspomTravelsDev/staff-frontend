import {
    getEmployees,
    getEmployeeStats,
    type Employee,
    type EmployeeStats,
} from "@/lib/api/employees";

export async function getAllEmployees(): Promise<Employee[]> {
    const result = await getEmployees({ limit: 1000 });
    return result.items;
}

export async function getStats(): Promise<EmployeeStats> {
    return getEmployeeStats();
}

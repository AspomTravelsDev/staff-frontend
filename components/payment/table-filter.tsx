"use client";

import { useRouter, usePathname, useSearchParams } from "next/navigation";
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select";

export interface FilterOption {
    label: string;
    value: string;
}

export function TableFilter({ 
    currentStatus, 
    options = [
        { label: "All Status", value: "all" },
        { label: "Pending", value: "pending" },
        { label: "Approved", value: "approved" },
        { label: "Rejected", value: "rejected" },
    ],
    placeholder = "Filter by status",
    queryKey = "status"
}: { 
    currentStatus: string;
    options?: FilterOption[];
    placeholder?: string;
    queryKey?: string;
}) {
    const router = useRouter();
    const pathname = usePathname();
    const searchParams = useSearchParams();

    const handleValueChange = (value: string) => {
        const params = new URLSearchParams(searchParams.toString());
        if (value === "all") {
            params.delete(queryKey);
        } else {
            params.set(queryKey, value);
        }
        params.delete("page"); // Reset to page 1 on filter change
        router.push(`${pathname}?${params.toString()}`);
    };

    return (
        <Select value={currentStatus} onValueChange={handleValueChange}>
            <SelectTrigger className="w-40 h-8 text-sm">
                <SelectValue placeholder={placeholder} />
            </SelectTrigger>
            <SelectContent>
                {options.map((option) => (
                    <SelectItem key={option.value} value={option.value}>
                        {option.label}
                    </SelectItem>
                ))}
            </SelectContent>
        </Select>
    );
}

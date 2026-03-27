"use client";

import { usePathname, useRouter, useSearchParams } from "next/navigation";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

interface RequestFiltersProps {
  statusOptions: string[];
}

export function RequestFilters({ statusOptions }: RequestFiltersProps) {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();

  const status = searchParams.get("status") ?? "all";
  const fromDate = searchParams.get("from_date") ?? "";
  const toDate = searchParams.get("to_date") ?? "";

  function updateParam(key: string, value: string) {
    const params = new URLSearchParams(searchParams.toString());
    if (!value || value === "all") {
      params.delete(key);
    } else {
      params.set(key, value);
    }
    router.push(`${pathname}?${params.toString()}`);
  }

  function resetFilters() {
    router.push(pathname);
  }

  return (
    <div className="grid grid-cols-1 gap-3 rounded-lg border bg-card p-4 md:grid-cols-4 md:items-end">
      <div className="space-y-2">
        <Label>Status</Label>
        <Select
          value={status}
          onValueChange={(value) => updateParam("status", value)}
        >
          <SelectTrigger>
            <SelectValue placeholder="All statuses" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All statuses</SelectItem>
            {statusOptions.map((option) => (
              <SelectItem key={option} value={option}>
                {option}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      <div className="space-y-2">
        <Label>From</Label>
        <Input
          type="date"
          value={fromDate}
          onChange={(event) => updateParam("from_date", event.target.value)}
        />
      </div>

      <div className="space-y-2">
        <Label>To</Label>
        <Input
          type="date"
          value={toDate}
          onChange={(event) => updateParam("to_date", event.target.value)}
        />
      </div>

      <div className="flex gap-2">
        <Button variant="outline" onClick={resetFilters} className="w-full">
          Reset
        </Button>
      </div>
    </div>
  );
}

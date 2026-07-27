"use client";

import { useRouter, useSearchParams } from "next/navigation";
import { useCallback, useState, useEffect } from "react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { X, Search } from "lucide-react";

export function RequestsFilters() {
  const router = useRouter();
  const searchParams = useSearchParams();

  // Local state for search input to allow typing without immediate navigation
  const [searchValue, setSearchValue] = useState(searchParams.get("search") || "");

  // Update URL search parameters
  const updateSearchParams = useCallback(
    (updates: Record<string, string | undefined>) => {
      const params = new URLSearchParams(searchParams.toString());
      // When applying a filter, reset page to 1
      params.set("page", "1");
      
      for (const [key, value] of Object.entries(updates)) {
        if (value === undefined || value === "all" || value === "") {
          params.delete(key);
        } else {
          params.set(key, value);
        }
      }
      router.push(`?${params.toString()}`);
    },
    [router, searchParams]
  );

  // Debounce search value updates
  useEffect(() => {
    const delayDebounceFn = setTimeout(() => {
      const currentSearch = searchParams.get("search") || "";
      if (searchValue !== currentSearch) {
        updateSearchParams({ search: searchValue });
      }
    }, 400);

    return () => clearTimeout(delayDebounceFn);
  }, [searchValue, updateSearchParams, searchParams]);

  // Sync search input with URL if it changes elsewhere
  useEffect(() => {
    setSearchValue(searchParams.get("search") || "");
  }, [searchParams]);

  const handleStatusChange = (value: string) => {
    updateSearchParams({ status: value });
  };

  const handleCategoryChange = (value: string) => {
    updateSearchParams({ category: value });
  };

  const handlePriorityChange = (value: string) => {
    updateSearchParams({ priority: value });
  };

  const clearFilters = () => {
    setSearchValue("");
    router.push("/admin/requests");
  };

  const hasActiveFilters =
    searchParams.has("search") ||
    searchParams.has("status") ||
    searchParams.has("category") ||
    searchParams.has("priority");

  return (
    <div className="flex flex-col gap-3 md:flex-row md:items-center bg-card p-4 rounded-lg border">
      <div className="relative flex-1">
        <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
        <Input
          placeholder="Search by requester, reason, category..."
          value={searchValue}
          onChange={(e) => setSearchValue(e.target.value)}
          className="pl-8 h-9"
        />
      </div>

      <div className="flex flex-wrap items-center gap-2">
        <div className="grid gap-1.5">
          <Select
            value={searchParams.get("status") || "all"}
            onValueChange={handleStatusChange}
          >
            <SelectTrigger className="w-[140px] h-9">
              <SelectValue placeholder="Status" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Statuses</SelectItem>
              <SelectItem value="pending">Pending</SelectItem>
              <SelectItem value="in_progress">In Progress</SelectItem>
              <SelectItem value="completed">Completed</SelectItem>
              <SelectItem value="approved">Approved</SelectItem>
              <SelectItem value="rejected">Rejected</SelectItem>
              <SelectItem value="cancelled">Cancelled</SelectItem>
            </SelectContent>
          </Select>
        </div>

        <div className="grid gap-1.5">
          <Select
            value={searchParams.get("category") || "all"}
            onValueChange={handleCategoryChange}
          >
            <SelectTrigger className="w-[140px] h-9">
              <SelectValue placeholder="Category" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Categories</SelectItem>
              <SelectItem value="Toiletries">Toiletries</SelectItem>
              <SelectItem value="Repairs">Repairs</SelectItem>
              <SelectItem value="Gadget">Gadget</SelectItem>
              <SelectItem value="Access">Access</SelectItem>
              <SelectItem value="Other">Other</SelectItem>
            </SelectContent>
          </Select>
        </div>

        <div className="grid gap-1.5">
          <Select
            value={searchParams.get("priority") || "all"}
            onValueChange={handlePriorityChange}
          >
            <SelectTrigger className="w-[140px] h-9">
              <SelectValue placeholder="Priority" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Priorities</SelectItem>
              <SelectItem value="low">Low</SelectItem>
              <SelectItem value="medium">Medium</SelectItem>
              <SelectItem value="high">High</SelectItem>
              <SelectItem value="critical">Critical</SelectItem>
            </SelectContent>
          </Select>
        </div>

        {hasActiveFilters && (
          <Button
            variant="ghost"
            size="sm"
            onClick={clearFilters}
            className="h-9 px-2 text-muted-foreground hover:text-foreground"
          >
            <X className="h-4 w-4 mr-2" />
            Clear
          </Button>
        )}
      </div>
    </div>
  );
}

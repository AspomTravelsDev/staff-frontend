"use client";

import { useState, useEffect } from "react";
import { useRouter, useSearchParams, usePathname } from "next/navigation";
import { DatePickerWithRange } from "@/components/ui/date-range-picker";
import { Button } from "@/components/ui/button";
import { Filter, History, TrendingUp, TrendingDown, Minus } from "lucide-react";
import { DateRange } from "react-day-picker";
import { format, parseISO } from "date-fns";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import type { RateHistoryItem } from "@/lib/api/rates";

interface RatesHistoryClientProps {
  history: RateHistoryItem[];
  initialFrom?: string;
  initialTo?: string;
}

export function RatesHistoryClient({
  history,
  initialFrom,
  initialTo,
}: RatesHistoryClientProps) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const pathname = usePathname();

  const [dateRange, setDateRange] = useState<DateRange | undefined>(() => {
    if (initialFrom) {
      return {
        from: parseISO(initialFrom),
        to: initialTo ? parseISO(initialTo) : undefined,
      };
    }
    return undefined;
  });

  const [isPending, setIsPending] = useState(false);

  useEffect(() => {
    const params = new URLSearchParams(searchParams.toString());
    let hasChanges = false;

    if (dateRange?.from) {
      const fromStr = format(dateRange.from, "yyyy-MM-dd");
      if (params.get("from") !== fromStr) {
        params.set("from", fromStr);
        hasChanges = true;
      }
    } else {
      if (params.has("from")) {
        params.delete("from");
        hasChanges = true;
      }
    }

    if (dateRange?.to) {
      const toStr = format(dateRange.to, "yyyy-MM-dd");
      if (params.get("to") !== toStr) {
        params.set("to", toStr);
        hasChanges = true;
      }
    } else {
      if (params.has("to")) {
        params.delete("to");
        hasChanges = true;
      }
    }

    if (hasChanges) {
      setIsPending(true);
      router.push(`${pathname}?${params.toString()}`);
    } else {
      setIsPending(false);
    }
  }, [dateRange, searchParams, pathname, router]);

  useEffect(() => {
    setIsPending(false);
  }, [history]);

  const formatCurrency = (value: number) =>
    new Intl.NumberFormat("en-NG", {
      style: "currency",
      currency: "NGN",
      minimumFractionDigits: 2,
    }).format(value);

  const getChangeIcon = (current: number, previous: number | null) => {
    if (previous === null) return null;
    if (current > previous)
      return <TrendingUp className="h-3.5 w-3.5 text-green-600" />;
    if (current < previous)
      return <TrendingDown className="h-3.5 w-3.5 text-red-600" />;
    return <Minus className="h-3.5 w-3.5 text-muted-foreground" />;
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <History className="h-5 w-5" />
          Rate History
        </CardTitle>
        <CardDescription>
          View historical rate changes. Showing{" "}
          {dateRange?.from
            ? `from ${format(dateRange.from, "MMM d, yyyy")}${
                dateRange.to ? ` to ${format(dateRange.to, "MMM d, yyyy")}` : ""
              }`
            : "the last 7 days"}
          .
        </CardDescription>
      </CardHeader>
      <CardContent>
        <div className="flex flex-col sm:flex-row gap-3 sm:items-center mb-6">
          <label className="text-sm font-medium flex items-center gap-1.5 whitespace-nowrap shrink-0">
            <Filter size={14} className="text-muted-foreground" />
            Date Range
          </label>
          <DatePickerWithRange
            date={dateRange}
            setDate={setDateRange}
            disabled={isPending}
            className="w-full sm:w-[260px]"
          />
          <Button
            variant="outline"
            size="sm"
            onClick={() => setDateRange(undefined)}
            disabled={isPending || !dateRange}
          >
            Reset
          </Button>
        </div>

        {isPending ? (
          <div className="rounded-md border p-8 flex justify-center items-center h-[200px]">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary" />
          </div>
        ) : history.length === 0 ? (
          <div className="rounded-md border p-8 text-center text-muted-foreground">
            No rate changes found for the selected period.
          </div>
        ) : (
          <div className="rounded-md border">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Date & Time</TableHead>
                  <TableHead className="text-right">Internal Rate (₦)</TableHead>
                  <TableHead className="text-right">Billing Rate (₦)</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {history.map((item, index) => {
                  const prevItem =
                    index < history.length - 1 ? history[index + 1] : null;
                  return (
                    <TableRow key={item.id}>
                      <TableCell className="font-medium">
                        {format(
                          parseISO(item.created_at),
                          "MMM d, yyyy 'at' h:mm a"
                        )}
                      </TableCell>
                      <TableCell className="text-right">
                        <div className="flex items-center justify-end gap-1.5">
                          {getChangeIcon(
                            item.internal_rate,
                            prevItem?.internal_rate ?? null
                          )}
                          {formatCurrency(item.internal_rate)}
                        </div>
                      </TableCell>
                      <TableCell className="text-right">
                        <div className="flex items-center justify-end gap-1.5">
                          {getChangeIcon(
                            item.billing_rate,
                            prevItem?.billing_rate ?? null
                          )}
                          {formatCurrency(item.billing_rate)}
                        </div>
                      </TableCell>
                    </TableRow>
                  );
                })}
              </TableBody>
            </Table>
          </div>
        )}
      </CardContent>
    </Card>
  );
}

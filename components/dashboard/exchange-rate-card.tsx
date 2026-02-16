"use client";

import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { ArrowUp, ArrowDown, Loader2 } from "lucide-react";
import { useRates } from "@/lib/api/hooks/use-rates";

export function ExchangeRateCard() {
  const { data: rates, isLoading } = useRates();

  if (isLoading) {
    return (
      <Card>
        <CardContent className="flex items-center justify-center p-6 h-[88px]">
          <Loader2 className="h-4 w-4 animate-spin text-muted-foreground" />
        </CardContent>
      </Card>
    );
  }

  if (!rates) return null;

  return (
    <Card>
      <CardHeader>
        <CardTitle>Dollar Billing Rate</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-3 mt-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-1">
              <span className="font-bold text-xs bg-muted px-1.5 py-0.5 rounded">
                Internal Rate
              </span>
            </div>
            <div className="flex items-center gap-2">
              <span className="font-bold">
                ₦{rates.internal_rate.toLocaleString()}
              </span>
              {/* Trend logic can be added later if API supports history */}
            </div>
          </div>

          <div className="flex items-center justify-between">
            <div className="flex items-center gap-1">
              <span className="font-bold text-xs bg-muted px-1.5 py-0.5 rounded">
                Billing Rate
              </span>
            </div>
            <div className="flex items-center gap-2">
              <span className="font-bold">
                ₦{rates.billing_rate.toLocaleString()}
              </span>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

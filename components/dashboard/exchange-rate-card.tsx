import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import type { Rates } from "@/lib/api/rates";

interface ExchangeRateCardProps {
  rates: Rates | null;
}

export function ExchangeRateCard({ rates }: ExchangeRateCardProps) {
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
                ₦{(rates.internal_rate ?? 0).toLocaleString()}
              </span>
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
                ₦{(rates.billing_rate ?? 0).toLocaleString()}
              </span>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

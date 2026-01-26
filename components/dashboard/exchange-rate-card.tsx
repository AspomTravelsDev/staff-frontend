import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { ArrowUp, ArrowDown, Banknote } from "lucide-react";

export function ExchangeRateCard() {
  const rates = [
    { currency: "USD", rate: "1,520", change: "+2.5%", trend: "up" },
    { currency: "EUR", rate: "1,640", change: "-0.8%", trend: "down" },
    { currency: "GBP", rate: "1,910", change: "+1.2%", trend: "up" },
  ];

  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between space-y-0">
        <CardTitle className="text-sm font-medium">
          Exchange Rates (NGN)
        </CardTitle>
        <Banknote className="h-4 w-4 text-muted-foreground" />
      </CardHeader>
      <CardContent>
        <div className="space-y-1 mt-1">
          {rates.map((item) => (
            <div
              key={item.currency}
              className="flex items-center justify-between"
            >
              <div className="flex items-center gap-2">
                <span className="font-bold text-sm bg-muted px-1.5 py-0.5 rounded">
                  {item.currency}
                </span>
              </div>
              <div className="flex items-center gap-2">
                <span className="font-bold">₦{item.rate}</span>
                <span
                  className={`text-xs flex items-center ${
                    item.trend === "up" ? "text-green-600" : "text-red-600"
                  }`}
                >
                  {item.trend === "up" ? (
                    <ArrowUp className="h-3 w-3 mr-0.5" />
                  ) : (
                    <ArrowDown className="h-3 w-3 mr-0.5" />
                  )}
                  {item.change}
                </span>
              </div>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
}

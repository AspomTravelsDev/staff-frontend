import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

export interface RequestSummary {
  total_requested_amount: number;
  pending_balance: number;
  open_active_count: number;
  paid_count: number;
}

function formatCurrency(value: number) {
  return new Intl.NumberFormat("en-NG", {
    style: "currency",
    currency: "NGN",
    maximumFractionDigits: 2,
  }).format(value || 0);
}

export function RequestSummaryCards({ summary }: { summary: RequestSummary }) {
  const cards = [
    {
      title: "Total Requested",
      value: formatCurrency(summary.total_requested_amount),
    },
    {
      title: "Pending Balance",
      value: formatCurrency(summary.pending_balance),
    },
    {
      title: "Open/Active Requests",
      value: String(summary.open_active_count || 0),
    },
    {
      title: "Paid Requests",
      value: String(summary.paid_count || 0),
    },
  ];

  return (
    <div className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-4">
      {cards.map((card) => (
        <Card key={card.title}>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              {card.title}
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-bold tracking-tight">{card.value}</p>
          </CardContent>
        </Card>
      ))}
    </div>
  );
}

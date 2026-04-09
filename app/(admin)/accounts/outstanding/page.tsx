import { Suspense } from "react";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { OutstandingPaymentsTable } from "@/components/payment/outstanding-payments-table";
import { getOutstandingPayments } from "@/lib/api/payment-confirmations";
import { TableFilter } from "@/components/payment/table-filter";

function formatCurrency(value: number) {
  return new Intl.NumberFormat("en-NG", {
    style: "currency",
    currency: "NGN",
    maximumFractionDigits: 0,
  }).format(value || 0);
}

export default async function AccountsOutstandingPage({
  searchParams,
}: {
  searchParams: Promise<{ status?: string; page?: string }>;
}) {
  const sp = await searchParams;
  const status =
    sp.status === "all" ? undefined : (sp.status as any) || "pending";
  const page = parseInt(sp.page || "1");

  const outstandingData = await getOutstandingPayments({
    status,
    page,
    limit: 100,
  });

  const payments = outstandingData?.data ?? [];

  const pendingPayments = payments.filter(
    (payment) => payment.status === "pending",
  );
  const totalOutstandingValue = pendingPayments.reduce(
    (sum, payment) => sum + Number(payment.balance),
    0,
  );
  const totalCollectedValue = payments.reduce(
    (sum, payment) => sum + Number(payment.total_paid_amount),
    0,
  );
  const biggestOutstandingBalance = pendingPayments.reduce(
    (max, payment) => Math.max(max, Number(payment.balance)),
    0,
  );
  const openCases = pendingPayments.length;

  const stats = [
    {
      title: "Outstanding Cases",
      value: String(openCases),
      description: `${outstandingData.pagination.total} total records`,
    },
    {
      title: "Total Outstanding Value",
      value: formatCurrency(totalOutstandingValue),
      description: "Open balances",
    },
    {
      title: "Biggest Outstanding",
      value: formatCurrency(biggestOutstandingBalance),
      description: "Highest pending balance",
    },
    {
      title: "Total Collected",
      value: formatCurrency(totalCollectedValue),
      description: "Paid across listed records",
    },
  ];

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold tracking-tight">
          Outstanding Payments
        </h1>
        <p className="text-muted-foreground">
          Track all pending client payment balances and installment progress.
        </p>
      </div>

      <div className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-4">
        {stats.map((card) => (
          <Card key={card.title}>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">
                {card.title}
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-2xl font-bold tracking-tight">{card.value}</p>
              <p className="text-xs text-muted-foreground">
                {card.description}
              </p>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Table */}
      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <CardTitle>Outstanding Payments</CardTitle>
          <TableFilter
            currentStatus={sp.status || "pending"}
            options={[
              { label: "All Status", value: "all" },
              { label: "Pending", value: "pending" },
              { label: "Completed", value: "completed" },
            ]}
          />
        </CardHeader>
        <CardContent>
          <Suspense
            fallback={
              <div className="py-16 text-center text-muted-foreground text-sm">
                Loading...
              </div>
            }
          >
            <OutstandingPaymentsTable
              payments={payments as any}
              pagination={outstandingData.pagination}
            />
          </Suspense>
        </CardContent>
      </Card>
    </div>
  );
}

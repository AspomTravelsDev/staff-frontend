import { Suspense } from "react";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { PaymentConfirmationsTable } from "@/components/payment/payment-confirmations-table";
import { getPaymentConfirmations } from "@/lib/api/payment-confirmations";
import { getEmployees } from "@/lib/api/employees";
import { TableFilter } from "@/components/payment/table-filter";

const PAYMENT_CONFIRMATION_STATUSES = [
  "pending",
  "approved",
  "rejected",
] as const;

function formatCurrency(value: number) {
  return new Intl.NumberFormat("en-NG", {
    style: "currency",
    currency: "NGN",
    maximumFractionDigits: 0,
  }).format(value || 0);
}

export default async function AccountsConfirmationPage({
  searchParams,
}: {
  searchParams: Promise<{ status?: string; page?: string }>;
}) {
  const sp = await searchParams;
  const status = PAYMENT_CONFIRMATION_STATUSES.find(
    (candidate) => candidate === sp.status,
  );
  const page = parseInt(sp.page || "1");

  const [confirmationsData, employeesData] = await Promise.all([
    getPaymentConfirmations({
      status,
      page,
      limit: 100,
    }),
    getEmployees({ limit: 200 }),
  ]);

  const confirmations = confirmationsData?.data ?? [];
  const groupedDeals = confirmations.reduce((acc, confirmation) => {
    const key = confirmation.outstanding_payment_id || confirmation.id;
    const list = acc.get(key) || [];
    list.push(confirmation);
    acc.set(key, list);
    return acc;
  }, new Map<string, typeof confirmations>());

  const totalDeals = groupedDeals.size;
  const dealValues = Array.from(groupedDeals.values()).map((items) => {
    const approvedItems = items.filter((item) => item.status === "approved");
    return approvedItems.reduce(
      (sum, item) => sum + Number(item.amount_paid || 0),
      0,
    );
  });

  const closedDealsCount = dealValues.filter((value) => value > 0).length;
  const totalClosedValue = dealValues.reduce((sum, value) => sum + value, 0);
  const biggestDealClosed = dealValues.reduce(
    (max, value) => Math.max(max, value),
    0,
  );
  const approvalRate =
    totalDeals > 0 ? Math.round((closedDealsCount / totalDeals) * 100) : 0;

  const staffList = (employeesData?.items ?? []).map((e) => ({
    id: e.id,
    name: `${e.firstName} ${e.lastName}`,
  }));

  const stats = [
    {
      title: "Total Deals",
      value: String(totalDeals),
      description: "Unique deal records",
    },
    {
      title: "Total Closed Value",
      value: formatCurrency(totalClosedValue),
      description: "Approved amount paid",
    },
    {
      title: "Biggest Deal Closed",
      value: formatCurrency(biggestDealClosed),
      description: "Highest approved payment",
    },
    {
      title: "Approval Rate",
      value: `${approvalRate}%`,
      description: `${closedDealsCount} approved deals`,
    },
  ];

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold tracking-tight">
          Payment Confirmations
        </h1>
        <p className="text-muted-foreground">
          Review current and previous payment confirmations submitted by staff.
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
          <CardTitle>Payment Confirmations</CardTitle>
          <TableFilter currentStatus={sp.status || "all"} />
        </CardHeader>
        <CardContent>
          <Suspense
            fallback={
              <div className="py-16 text-center text-muted-foreground text-sm">
                Loading...
              </div>
            }
          >
            <PaymentConfirmationsTable
              confirmations={confirmations}
              pagination={confirmationsData.pagination}
              mode="accounts"
              staffList={staffList}
            />
          </Suspense>
        </CardContent>
      </Card>
    </div>
  );
}

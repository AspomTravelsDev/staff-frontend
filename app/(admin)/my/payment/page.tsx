import { Suspense } from "react";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { PaymentConfirmationDialog } from "@/components/payment/payment-confirmation-dialog";
import { PaymentConfirmationsTable } from "@/components/payment/payment-confirmations-table";
import {
  getPaymentConfirmations,
  getOutstandingPayments,
  markPaymentNotificationsAsRead,
  type PaymentConfirmationFilters,
} from "@/lib/api/payment-confirmations";
import { TableFilter } from "@/components/payment/table-filter";

function formatCurrency(value: number) {
  return new Intl.NumberFormat("en-NG", {
    style: "currency",
    currency: "NGN",
    maximumFractionDigits: 0,
  }).format(value || 0);
}

export default async function MyPaymentConfirmationsPage({
  searchParams,
}: {
  searchParams: Promise<{ status?: string; page?: string }>;
}) {
  const sp = await searchParams;
  const allowedStatuses = ["pending", "approved", "rejected"] as const;
  const status = allowedStatuses.find(
    (candidate) => candidate === sp.status,
  ) as PaymentConfirmationFilters["status"] | undefined;
  const page = parseInt(sp.page || "1");

  // Mark payment notifications viewed since the user is loading their confirmations dashboard
  try {
    await markPaymentNotificationsAsRead();
  } catch (err) {
    // Ignore error
  }

  const [confirmationsData, outstandingData] = await Promise.all([
    getPaymentConfirmations({
      status,
      page,
      limit: 50,
    }),
    getOutstandingPayments({ status: "pending", limit: 100 }),
  ]);

  const confirmations = confirmationsData?.data ?? [];
  const outstanding = outstandingData?.data ?? [];

  const groupedDeals = confirmations.reduce((acc, confirmation) => {
    const key = confirmation.outstanding_payment_id || confirmation.id;
    const list = acc.get(key) || [];
    list.push(confirmation);
    acc.set(key, list);
    return acc;
  }, new Map<string, typeof confirmations>());

  const submittedDeals = groupedDeals.size;
  const dealValues = Array.from(groupedDeals.values()).map((items) => {
    const approvedItems = items.filter((item) => item.status === "approved");
    return approvedItems.reduce(
      (sum, item) => sum + Number(item.amount_paid || 0),
      0,
    );
  });
  const approvedDealsCount = dealValues.filter((value) => value > 0).length;
  const totalClosedValue = dealValues.reduce((sum, value) => sum + value, 0);
  const biggestDealClosed = dealValues.reduce(
    (max, value) => Math.max(max, value),
    0,
  );
  const approvalRate =
    submittedDeals > 0
      ? Math.round((approvedDealsCount / submittedDeals) * 100)
      : 0;

  const stats = [
    {
      title: "Deals Closed",
      value: String(submittedDeals),
      description: "Total unique deals",
    },
    {
      title: "Total Value Closed",
      value: formatCurrency(totalClosedValue),
      description: "My closed deals",
    },
    {
      title: "Biggest Deal Closed",
      value: formatCurrency(biggestDealClosed),
      description: "Highest approved deal",
    },
    {
      title: "Approval Rate",
      value: `${approvalRate}%`,
      description: `${approvedDealsCount} approved deals`,
    },
  ];

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">
            Payment Confirmations
          </h1>
          <p className="text-muted-foreground">
            Submit and track your payment confirmations for accounts review.
          </p>
        </div>
        <PaymentConfirmationDialog outstandingPayments={outstanding} />
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
          <CardTitle>My Confirmations</CardTitle>
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
              mode="staff"
            />
          </Suspense>
        </CardContent>
      </Card>
    </div>
  );
}

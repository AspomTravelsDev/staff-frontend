import { Suspense } from "react";
import Link from "next/link";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { PaymentConfirmationsTable } from "@/components/payment/payment-confirmations-table";
import { AssignedDealsReadReceipt } from "@/components/payment/assigned-deals-read-receipt";
import {
  getPaymentConfirmations,
  type PaymentConfirmationFilters,
} from "@/lib/api/payment-confirmations";

function formatCurrency(value: number) {
  return new Intl.NumberFormat("en-NG", {
    style: "currency",
    currency: "NGN",
    maximumFractionDigits: 0,
  }).format(value || 0);
}

export default async function MyAssignedDealsPage({
  searchParams,
}: {
  searchParams: Promise<{ status?: string; page?: string; deal?: string }>;
}) {
  const sp = await searchParams;
  const allowedStatuses = ["pending", "approved", "rejected"] as const;
  const status = allowedStatuses.find(
    (candidate) => candidate === sp.status,
  ) as PaymentConfirmationFilters["status"] | undefined;
  const parsedPage = Number.parseInt(sp.page || "1", 10);
  const page = Number.isFinite(parsedPage) && parsedPage > 0 ? parsedPage : 1;

  const dealId = sp.deal && /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(sp.deal) ? sp.deal : undefined;

  const confirmationsData = await getPaymentConfirmations({
    status: dealId ? undefined : status,
    page: dealId ? 1 : page,
    limit: 50,
    assigned: true,
    confirmation_id: dealId,
  });

  const confirmations = confirmationsData?.data ?? [];

  const groupedDeals = confirmations.reduce((acc, confirmation) => {
    const key = confirmation.outstanding_payment_id || confirmation.id;
    const list = acc.get(key) || [];
    list.push(confirmation);
    acc.set(key, list);
    return acc;
  }, new Map<string, typeof confirmations>());

  const totalAssigned = groupedDeals.size;
  let totalApprovedValue = 0;
  let totalPendingValue = 0;
  let approvedDealsCount = 0;

  for (const items of Array.from(groupedDeals.values())) {
    const approvedItems = items.filter((item) => item.status === "approved");
    const pendingItems = items.filter((item) => item.status === "pending");

    const approvedVal = approvedItems.reduce((sum, item) => sum + Number(item.amount_paid || 0), 0);
    const pendingVal = pendingItems.reduce((sum, item) => sum + Number(item.amount_paid || 0), 0);

    if (approvedVal > 0) {
      approvedDealsCount++;
    }
    totalApprovedValue += approvedVal;
    totalPendingValue += pendingVal;
  }

  const approvalRate =
    totalAssigned > 0 ? Math.round((approvedDealsCount / totalAssigned) * 100) : 0;

  const stats = [
    {
      title: "Total Assigned",
      value: String(totalAssigned),
      description: "Deals assigned to me",
    },
    {
      title: "Approved Value",
      value: formatCurrency(totalApprovedValue),
      description: "Total approved amount",
    },
    {
      title: "Pending Value",
      value: formatCurrency(totalPendingValue),
      description: "Awaiting approval",
    },
    {
      title: "Approval Rate",
      value: `${approvalRate}%`,
      description: `${approvedDealsCount} of ${totalAssigned} deals approved`,
    },
  ];

  return (
    <div className="space-y-6">
      <AssignedDealsReadReceipt confirmationIds={confirmations.map(item => item.id)} throughId={confirmationsData.assignment_notifications_through_id} />
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Assigned Deals</h1>
        <p className="text-muted-foreground">
          View and track all payment confirmation deals that have been assigned to you.
        </p>
        {dealId && <Link href="/my/assigned-deals" className="mt-2 inline-block text-sm text-primary underline">View all assigned deals</Link>}
      </div>

      {/* Stats Cards */}
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
          showSubmittedBy={true}
        />
      </Suspense>
    </div>
  );
}

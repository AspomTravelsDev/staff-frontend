import { Suspense } from "react";

import { PaymentConfirmationsTable } from "@/components/payment/payment-confirmations-table";
import { getPaymentConfirmations } from "@/lib/api/payment-confirmations";
import { getEmployees } from "@/lib/api/employees";

const PAYMENT_CONFIRMATION_STATUSES = [
  "pending",
  "approved",
  "rejected",
] as const;

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

  const staffList = (employeesData?.items ?? []).map((e) => ({
    id: e.id,
    name: `${e.firstName} ${e.lastName}`,
    department: e.department,
  }));

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
          currentStatus={sp.status || "all"}
        />
      </Suspense>
    </div>
  );
}

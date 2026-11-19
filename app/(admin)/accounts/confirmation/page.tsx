import { Suspense } from "react";
import { redirect } from "next/navigation";

import { PaymentConfirmationsTable } from "@/components/payment/payment-confirmations-table";
import { getPaymentConfirmations } from "@/lib/api/payment-confirmations";
import { getEmployees } from "@/lib/api/employees";
import { getCurrentUser } from "@/lib/auth/session";
import { userHasRole } from "@/types/user-types";

const PAYMENT_CONFIRMATION_STATUSES = [
  "pending",
  "approved",
  "rejected",
  "cancelled",
] as const;

export default async function AccountsConfirmationPage({
  searchParams,
}: {
  searchParams: Promise<{ status?: string; page?: string }>;
}) {
  const user = await getCurrentUser();
  if (!user || (!userHasRole(user, "account") && !userHasRole(user, "super"))) {
    redirect("/dashboard");
  }

  const sp = await searchParams;
  const status = PAYMENT_CONFIRMATION_STATUSES.find(
    (candidate) => candidate === sp.status,
  );
  const parsedPage = Number.parseInt(sp.page || "1", 10);
  const page = Number.isFinite(parsedPage) && parsedPage > 0 ? parsedPage : 1;

  const [confirmationsData, employeesData] = await Promise.all([
    getPaymentConfirmations({
      status,
      page,
      limit: 100,
    }),
    getEmployees({ status: "Active", limit: 200 }),
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

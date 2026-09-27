import { Suspense } from "react";
import { Metadata } from "next";
import { getTodayStatus } from "@/lib/api/clock-in";
import { AttendanceScanClient } from "./components/attendance-scan-client";

export const metadata: Metadata = {
  title: "Attendance Verification | Aspom Travels",
  description: "Verify your office attendance and clock in securely.",
};

export default async function AttendanceScanPage() {
  const statusRes = await getTodayStatus().catch(() => ({
    success: false,
    data: null,
  }));

  const initialStatus =
    statusRes.success && statusRes.data ? statusRes.data.data : null;

  return (
    <Suspense fallback={<div className="min-h-screen flex items-center justify-center text-sm text-muted-foreground">Loading attendance...</div>}>
      <AttendanceScanClient initialStatus={initialStatus} />
    </Suspense>
  );
}

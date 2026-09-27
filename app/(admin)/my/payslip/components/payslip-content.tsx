"use client";

import { AlertTriangle, Building2 } from "lucide-react";

const currencyFormatter = new Intl.NumberFormat("en-NG", {
  style: "currency",
  currency: "NGN",
});

const formatPrice = (amount: number) => currencyFormatter.format(amount);

interface PayslipContentProps {
  entry: any;
  user: any;
  id?: string;
  fallbackMonth?: string; // Expects YYYY-MM
}

export function PayslipContent({
  entry,
  user,
  id = "payslip-document",
  fallbackMonth,
}: PayslipContentProps) {
  if (!entry) return null;

  const runStatus = entry.run?.status || entry.run_status;
  const isDraft =
    entry.status !== "approved" ||
    (Boolean(runStatus) && runStatus !== "closed");
  const isPending = isDraft;

  const getStatusLabel = () => {
    if (!isDraft) return "Approved & Finalized";
    if (runStatus === "draft" || runStatus === "hr_draft") return "Draft (HR Review)";
    if (runStatus === "account_review") return "Draft (Accounts Review)";
    if (runStatus === "compliance_review") return "Draft (Compliance Review)";
    if (runStatus === "mp_review") return "Draft (MP Review)";
    if (runStatus === "md_approval") return "Draft (MD Final Approval)";
    if (runStatus === "processing") return "Draft (Processing)";
    return "Draft (Pending Final Approval)";
  };

  const otherDeductionsList = Array.isArray(entry.other_deductions)
    ? entry.other_deductions
    : [];
  const otherDeductionsTotal = otherDeductionsList.reduce(
    (sum: number, item: any) => sum + Number(item?.amount ?? 0),
    0,
  );
  const otherDeductionsAmount =
    otherDeductionsList.length > 0
      ? otherDeductionsTotal
      : Number(entry.other_deductions_amount || 0);

  const additionsList = Array.isArray(entry.additions) ? entry.additions : [];
  const additionsTotal = additionsList.reduce(
    (sum: number, item: any) => sum + Number(item?.amount ?? 0),
    0,
  );
  const additionsAmount =
    additionsList.length > 0
      ? additionsTotal
      : Number(entry.additions_amount || 0);

  const accommodationAmount = Number(
    entry.accommodation_amount ??
    entry.calculation_snapshot?.accommodation_amount ??
    0,
  );

  const snapshotAttDeduction =
    entry.calculation_snapshot?.attendance_deduction !== undefined
      ? Number(entry.calculation_snapshot.attendance_deduction)
      : Number(entry.attendance_days || 0) * Number(entry.daily_rate || 0);

  const snapshotSuspDeduction =
    entry.calculation_snapshot?.suspension_deduction !== undefined
      ? Number(entry.calculation_snapshot.suspension_deduction)
      : Number(entry.suspension_days || 0) * Number(entry.daily_rate || 0);

  const storedDeductionAmount = Number(entry.deduction_amount || 0);
  const deductionAdjustment = storedDeductionAmount - (snapshotAttDeduction + snapshotSuspDeduction);

  const totalDeductions = Math.max(
    0,
    storedDeductionAmount +
    Number(entry.tax_amount || 0) +
    accommodationAmount +
    otherDeductionsAmount,
  );
  const netPay = Number(entry.net_amount || 0);
  const grossPay = Number(entry.gross_salary || 0);

  const displayMonth = entry.run?.payroll_month || fallbackMonth;

  return (
    <div
      id={id}
      className="relative bg-white text-slate-900 overflow-hidden rounded-sm border sm:border-4 md:border-8 border-slate-100 ring-1 ring-slate-200 w-full max-w-full"
    >
      {/* Full-Page Diagonal DRAFT Watermark Overlay */}
      {isDraft && (
        <div
          aria-hidden="true"
          className="pointer-events-none select-none absolute inset-0 z-20 flex flex-col justify-between items-center overflow-hidden py-8 sm:py-14 md:py-20 px-2 w-full max-w-full"
          style={{ contain: "strict" }}
        >
          {/* Upper diagonal band */}
          <div
            className="opacity-[0.06] text-center max-w-full"
            style={{ transform: "rotate(-24deg)" }}
          >
            <p className="text-base sm:text-2xl md:text-4xl lg:text-5xl font-black tracking-[0.2em] sm:tracking-[0.3em] uppercase text-red-600">
              DRAFT &bull; PRELIMINARY &bull; NOT FINAL
            </p>
          </div>

          {/* Main central prominent angled stamp */}
          <div
            className="text-center my-auto px-2 max-w-full"
            style={{ transform: "rotate(-24deg)" }}
          >
            <div className="inline-block border-4 sm:border-8 border-dashed border-red-600/30 rounded-2xl sm:rounded-3xl px-6 sm:px-12 md:px-16 py-3 sm:py-6 md:py-8 bg-red-600/[0.03] shadow-xs">
              <p className="text-4xl sm:text-7xl md:text-8xl lg:text-9xl font-black tracking-[0.2em] uppercase text-red-600/30 leading-none">
                DRAFT
              </p>
              <p className="mt-2 sm:mt-3 text-[8px] sm:text-xs md:text-sm font-black tracking-[0.25em] sm:tracking-[0.35em] uppercase text-red-600/45">
                PROVISIONAL &bull; FOR REVIEW ONLY &bull; NOT FINAL
              </p>
            </div>
          </div>

          {/* Lower diagonal band */}
          <div
            className="opacity-[0.06] text-center max-w-full"
            style={{ transform: "rotate(-24deg)" }}
          >
            <p className="text-base sm:text-2xl md:text-4xl lg:text-5xl font-black tracking-[0.2em] sm:tracking-[0.3em] uppercase text-red-600">
              DRAFT &bull; PRELIMINARY &bull; NOT FINAL
            </p>
          </div>
        </div>
      )}

      <div className="relative z-10 p-3.5 sm:p-6 md:p-10 space-y-6 sm:space-y-8 md:space-y-12">
        <div className="flex flex-col items-center text-center space-y-3 sm:space-y-4 border-b-2 border-primary/20 pb-5 sm:pb-8">
          <img
            src="/aspom-logo.png"
            alt="ASPOM Logo"
            className="h-12 sm:h-16 md:h-20 object-contain mb-1"
          />
          <h2 className="text-xl sm:text-2xl md:text-3xl lg:text-4xl font-black tracking-wider sm:tracking-widest md:tracking-[0.15em] text-slate-800 uppercase">
            Payroll Slip
          </h2>
          <div className="flex items-center gap-2 text-primary font-bold tracking-wider">
            <span className="text-sm sm:text-lg md:text-xl uppercase">
              ASPOM TRAVEL AGENCY
            </span>
          </div>
        </div>

        {/* Info Section */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-6 sm:gap-8 md:gap-x-16 md:gap-y-10 items-start">
          <section className="space-y-6">
            <h3 className="text-[11px] font-black uppercase tracking-[0.2em] text-slate-400 flex items-center gap-2">
              <div className="w-1.5 h-1.5 rounded-full bg-primary" /> Employee
              Details
            </h3>
            <div className="space-y-4">
              <div className="flex flex-col gap-0.5 border-l-2 border-slate-100 pl-4">
                <span className="text-[10px] text-muted-foreground uppercase font-bold tracking-tighter">
                  Full Name
                </span>
                <span className="text-base font-bold text-slate-800">
                  {user.name}
                </span>
              </div>
              <div className="flex flex-col gap-0.5 border-l-2 border-slate-100 pl-4">
                <span className="text-[10px] text-muted-foreground uppercase font-bold tracking-tighter">
                  Staff Member ID
                </span>
                <span className="text-base font-black text-primary tracking-tighter">
                  {user.staff_id}
                </span>
              </div>
              {user.tax_id && (
                <div className="flex flex-col gap-0.5 border-l-2 border-slate-100 pl-4">
                  <span className="text-[10px] text-muted-foreground uppercase font-bold tracking-tighter">
                    Tax ID (TIN)
                  </span>
                  <span className="text-sm font-semibold">{user.tax_id}</span>
                </div>
              )}
              <div className="flex flex-col gap-0.5 border-l-2 border-slate-100 pl-4">
                <span className="text-[10px] text-muted-foreground uppercase font-bold tracking-tighter">
                  Department
                </span>
                <span className="text-sm font-semibold uppercase">
                  {user.department || "Corporate"}
                </span>
              </div>
              {Number(entry.prorated_days) > 0 && (
                <div className="flex flex-col gap-0.5 border-l-2 border-slate-100 pl-4">
                  <span className="text-[10px] text-muted-foreground uppercase font-bold tracking-tighter">
                    Joined Mid-Month
                  </span>
                  <span className="text-sm font-semibold text-amber-600 font-bold">
                    {entry.prorated_days} working days missed before joining
                  </span>
                </div>
              )}
            </div>
          </section>

          <section className="space-y-6 text-left md:text-right">
            <h3 className="text-[11px] font-black uppercase tracking-[0.2em] text-slate-400 flex items-center gap-2 md:justify-end">
              Payroll Period{" "}
              <div className="w-1.5 h-1.5 rounded-full bg-primary" />
            </h3>
            <div className="space-y-1">
              <p className="text-xl md:text-2xl font-black text-slate-800 tracking-tighter">
                {displayMonth
                  ? new Date(displayMonth + "-01").toLocaleString("default", {
                    month: "long",
                    year: "numeric",
                  })
                  : "---"}
              </p>
              <p className="text-[10px] text-muted-foreground font-bold tracking-[0.2em] uppercase">
                Status:{" "}
                <span
                  className={
                    isDraft
                      ? "text-amber-600 font-black inline-flex items-center gap-1"
                      : "text-emerald-600 font-black"
                  }
                >
                  {isDraft && <span className="inline-block w-1.5 h-1.5 rounded-full bg-amber-500 animate-pulse" />}
                  {getStatusLabel()}
                </span>
              </p>
            </div>
            <div className="inline-block bg-slate-50 border border-slate-200 px-4 py-2 rounded">
              <p className="text-[9px] text-muted-foreground uppercase font-bold">
                Issue Date
              </p>
              <p className="text-xs font-bold">
                {new Date().toLocaleDateString("en-GB", {
                  day: "2-digit",
                  month: "short",
                  year: "numeric",
                })}
              </p>
            </div>
          </section>
        </div>

        {/* Breakdown Table */}
        <section className="space-y-4">
          <h3 className="text-[11px] font-black uppercase tracking-[0.2em] text-center text-slate-400 pb-2 border-b border-slate-100">
            Salary Breakdown
          </h3>
          <div className="overflow-hidden border border-slate-200 rounded-sm">
            <table className="w-full text-xs md:text-sm">
              <thead className="bg-slate-50 text-[10px] font-black uppercase tracking-widest text-slate-500 border-b border-slate-200">
                <tr>
                  <th className="px-4 md:px-6 py-3 md:py-4 text-left font-bold">
                    Description
                  </th>
                  <th className="px-4 md:px-6 py-3 md:py-4 text-right font-bold w-32 md:w-48">
                    Amount (NGN)
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                <tr className="bg-slate-50/30">
                  <td className="px-4 md:px-6 py-3 md:py-4 font-medium text-slate-600">
                    Basic Salary
                  </td>
                  <td className="px-4 md:px-6 py-3 md:py-4 text-right tabular-nums">
                    {formatPrice(
                      Number(entry?.calculation_snapshot?.basic || 0),
                    ).replace("NGN", "")}
                  </td>
                </tr>
                <tr className="bg-slate-50/30">
                  <td className="px-4 md:px-6 py-3 md:py-4 font-medium text-slate-600">
                    Housing Allowance
                  </td>
                  <td className="px-4 md:px-6 py-3 md:py-4 text-right tabular-nums">
                    {formatPrice(
                      Number(entry?.calculation_snapshot?.rent_housing || 0),
                    ).replace("NGN", "")}
                  </td>
                </tr>
                <tr className="bg-slate-50/30">
                  <td className="px-4 md:px-6 py-3 md:py-4 font-medium text-slate-600">
                    Transport Allowance
                  </td>
                  <td className="px-4 md:px-6 py-3 md:py-4 text-right tabular-nums">
                    {formatPrice(
                      Number(entry?.calculation_snapshot?.transport || 0),
                    ).replace("NGN", "")}
                  </td>
                </tr>
                <tr className="bg-slate-50/30">
                  <td className="px-4 md:px-6 py-3 md:py-4 font-medium text-slate-600">
                    Medical Allowance
                  </td>
                  <td className="px-4 md:px-6 py-3 md:py-4 text-right tabular-nums">
                    {formatPrice(
                      Number(entry?.calculation_snapshot?.medical || 0),
                    ).replace("NGN", "")}
                  </td>
                </tr>
                <tr className="bg-slate-50/30">
                  <td className="px-4 md:px-6 py-3 md:py-4 font-medium text-slate-600">
                    Other Allowances (Utility, etc.)
                  </td>
                  <td className="px-4 md:px-6 py-3 md:py-4 text-right tabular-nums">
                    {formatPrice(
                      Number(entry?.calculation_snapshot?.furniture || 0) +
                      Number(entry?.calculation_snapshot?.utility || 0) +
                      Number(
                        entry?.calculation_snapshot?.entertainment || 0,
                      ) +
                      Number(entry?.calculation_snapshot?.meal_subsidy || 0) +
                      Number(entry?.calculation_snapshot?.clothing || 0) +
                      Number(entry?.calculation_snapshot?.passages || 0),
                    ).replace("NGN", "")}
                  </td>
                </tr>
                <tr className="bg-primary/5 font-bold">
                  <td className="px-4 md:px-6 py-3 md:py-4 text-slate-800">
                    Total Gross Salary
                  </td>
                  <td className="px-4 md:px-6 py-3 md:py-4 text-right tabular-nums">
                    {formatPrice(grossPay).replace("NGN", "")}
                  </td>
                </tr>
                {additionsList.length > 0
                  ? additionsList.map((item: any, index: number) => (
                    <tr
                      key={`addition-${index}`}
                      className="bg-emerald-50/40"
                    >
                      <td className="px-4 md:px-6 py-3 md:py-4 font-medium text-slate-600">
                        {item?.label || "Addition"}
                      </td>
                      <td className="px-4 md:px-6 py-3 md:py-4 text-right font-bold tabular-nums text-emerald-700">
                        +
                        {formatPrice(Number(item?.amount ?? 0)).replace(
                          "NGN",
                          "",
                        )}
                      </td>
                    </tr>
                  ))
                  : additionsAmount > 0 && (
                    <tr className="bg-emerald-50/40">
                      <td className="px-4 md:px-6 py-3 md:py-4 font-medium text-slate-600">
                        Additions
                      </td>
                      <td className="px-4 md:px-6 py-3 md:py-4 text-right font-bold tabular-nums text-emerald-700">
                        +{formatPrice(additionsAmount).replace("NGN", "")}
                      </td>
                    </tr>
                  )}
                {/* Attendance Deductions (Absences) */}
                {Number(entry.attendance_days) > 0 && (
                  <tr className="bg-slate-50/30">
                    <td className="px-4 md:px-6 py-3 md:py-4 font-medium text-slate-600">
                      Absent Days (Unpaid) ({entry.attendance_days} working days)
                    </td>
                    <td className="px-4 md:px-6 py-3 md:py-4 text-right font-bold tabular-nums text-rose-600">
                      (
                      {formatPrice(snapshotAttDeduction).replace("NGN", "")}
                      )
                    </td>
                  </tr>
                )}

                {/* Compliance Deductions (Suspensions/Penalties) */}
                {Number(entry.suspension_days) > 0 && (
                  <tr className="bg-slate-50/30">
                    <td className="px-4 md:px-6 py-3 md:py-4 font-medium text-slate-600">
                      Suspension Period ({entry.suspension_days} working days)
                    </td>
                    <td className="px-4 md:px-6 py-3 md:py-4 text-right font-bold tabular-nums text-rose-600">
                      (
                      {formatPrice(snapshotSuspDeduction).replace("NGN", "")}
                      )
                    </td>
                  </tr>
                )}

                {/* Deduction Adjustment (if any) */}
                {Math.abs(deductionAdjustment) > 0.01 && (
                  <tr className="bg-slate-50/30">
                    <td className="px-4 md:px-6 py-3 md:py-4 font-medium text-slate-600">
                      Deductions Adjustment
                    </td>
                    <td className="px-4 md:px-6 py-3 md:py-4 text-right font-bold tabular-nums text-rose-600">
                      (
                      {formatPrice(Math.abs(deductionAdjustment)).replace("NGN", "")}
                      )
                    </td>
                  </tr>
                )}

                {/* Accommodation Fee */}
                {accommodationAmount > 0 && (
                  <tr className="bg-slate-50/30">
                    <td className="px-4 md:px-6 py-3 md:py-4 font-medium text-slate-600">
                      Accommodation Fee
                    </td>
                    <td className="px-4 md:px-6 py-3 md:py-4 text-right font-bold tabular-nums text-rose-600">
                      (
                      {formatPrice(accommodationAmount).replace("NGN", "")}
                      )
                    </td>
                  </tr>
                )}

                {otherDeductionsList.length > 0
                  ? otherDeductionsList.map((item: any, index: number) => (
                    <tr
                      key={`other-deduction-${index}`}
                      className="bg-slate-50/30"
                    >
                      <td className="px-4 md:px-6 py-3 md:py-4 font-medium text-slate-600">
                        {item?.label || "Other Deduction"}
                      </td>
                      <td className="px-4 md:px-6 py-3 md:py-4 text-right font-bold tabular-nums text-rose-600">
                        (
                        {formatPrice(Number(item?.amount ?? 0)).replace(
                          "NGN",
                          "",
                        )}
                        )
                      </td>
                    </tr>
                  ))
                  : otherDeductionsAmount > 0 && (
                    <tr className="bg-slate-50/30">
                      <td className="px-4 md:px-6 py-3 md:py-4 font-medium text-slate-600">
                        Other Deductions
                      </td>
                      <td className="px-4 md:px-6 py-3 md:py-4 text-right font-bold tabular-nums text-rose-600">
                        (
                        {formatPrice(otherDeductionsAmount).replace(
                          "NGN",
                          "",
                        )}
                        )
                      </td>
                    </tr>
                  )}
                <tr className="bg-slate-50 border-t border-slate-200">
                  <td className="px-4 md:px-6 py-3 md:py-4">
                    <div className="flex flex-col">
                      <span className="font-medium text-slate-600">
                        Income Tax (PAYE)
                      </span>
                      {entry.is_intern && (
                        <span className="text-[10px] text-muted-foreground">
                          Intern tax exemption applied
                        </span>
                      )}
                    </div>
                  </td>
                  <td className="px-4 md:px-6 py-3 md:py-4 text-right font-bold text-rose-600 tabular-nums">
                    ({formatPrice(entry.tax_amount).replace("NGN", "")})
                  </td>
                </tr>
              </tbody>
              <tfoot className="bg-primary/5 text-slate-900 border-t-2 border-primary/20">
                <tr className="border-b border-primary/10">
                  <td className="px-4 md:px-6 py-3 md:py-4 text-[10px] font-black uppercase tracking-wider text-slate-500">
                    Total Deductions
                  </td>
                  <td className="px-4 md:px-6 py-3 md:py-4 text-right font-black text-rose-600 tabular-nums">
                    {formatPrice(totalDeductions).replace("NGN", "")}
                  </td>
                </tr>
                <tr>
                  <td className="px-4 md:px-6 py-4 md:py-6 text-sm md:text-base font-black uppercase tracking-tighter text-primary">
                    Final Take-Home Pay
                  </td>
                  <td className="px-4 md:px-6 py-4 md:py-6 text-right">
                    <span className="text-xl sm:text-2xl md:text-3xl font-black text-primary tracking-tighter underline decoration-primary/20 underline-offset-8">
                      {formatPrice(netPay)}
                    </span>
                  </td>
                </tr>
              </tfoot>
            </table>
          </div>
        </section>

        <footer className="pt-8 border-t border-slate-100 flex justify-between items-center text-[9px] text-slate-400 font-bold uppercase tracking-widest">
          <div className="flex items-center gap-4">
            <div className="flex items-center gap-1 text-primary">
              <div
                className={`w-2 h-2 rounded-full ${isDraft ? "bg-amber-500 animate-pulse" : "bg-emerald-500"
                  }`}
              />{" "}
              Digital Record
            </div>
            <span>
              {isDraft ? "Provisional Draft — Pending Closing" : "Verified by HR System"}
            </span>
          </div>
          <div className="flex items-center gap-2">
            System Ref:{" "}
            <span className="font-mono text-slate-600">
              {isDraft ? "DRAFT-PR-" : "AS-PR-"}
              {new Date().getTime().toString().slice(-6)}
            </span>
          </div>
        </footer>
      </div>
    </div>
  );
}

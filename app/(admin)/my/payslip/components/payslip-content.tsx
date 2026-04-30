"use client";

import { Building2 } from "lucide-react";

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

export function PayslipContent({ entry, user, id = "payslip-document", fallbackMonth }: PayslipContentProps) {
  if (!entry) return null;

  const isPending = entry.status !== "approved";
  const totalDeductions = Math.max(0, Number(entry.deduction_amount || 0) + Number(entry.tax_amount || 0) + Number(entry.other_deductions_amount || 0));
  const netPay = Number(entry.net_amount || 0);
  const grossPay = Number(entry.gross_salary || 0);

  const displayMonth = entry.run?.payroll_month || fallbackMonth;

  return (
    <div
      id={id}
      className="bg-white text-slate-900 overflow-hidden rounded-sm border md:border-8 border-slate-100 ring-1 ring-slate-200"
    >
      <div className="p-4 md:p-10 space-y-8 md:space-y-12">
        <div className="flex flex-col items-center text-center space-y-4 border-b-2 border-primary/20 pb-6 md:pb-8">
          <img src="/aspom-logo.png" alt="ASPOM Logo" className="h-16 md:h-20 object-contain mb-2" />
          <h2 className="text-2xl md:text-3xl lg:text-4xl font-black tracking-widest md:tracking-[0.15em] text-slate-800 uppercase">
            Payroll Slip
          </h2>
          <div className="flex items-center gap-2 text-primary font-bold tracking-wider">
            <span className="text-lg md:text-xl uppercase">ASPOM TRAVEL AGENCY</span>
          </div>
        </div>

        {/* Info Section */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-x-16 gap-y-10 items-start">
          <section className="space-y-6">
            <h3 className="text-[11px] font-black uppercase tracking-[0.2em] text-slate-400 flex items-center gap-2">
              <div className="w-1.5 h-1.5 rounded-full bg-primary" /> Employee Details
            </h3>
            <div className="space-y-4">
              <div className="flex flex-col gap-0.5 border-l-2 border-slate-100 pl-4">
                <span className="text-[10px] text-muted-foreground uppercase font-bold tracking-tighter">Full Name</span>
                <span className="text-base font-bold text-slate-800">{user.name}</span>
              </div>
              <div className="flex flex-col gap-0.5 border-l-2 border-slate-100 pl-4">
                <span className="text-[10px] text-muted-foreground uppercase font-bold tracking-tighter">Staff Member ID</span>
                <span className="text-base font-black text-primary tracking-tighter">{user.staff_id}</span>
              </div>
              <div className="flex flex-col gap-0.5 border-l-2 border-slate-100 pl-4">
                <span className="text-[10px] text-muted-foreground uppercase font-bold tracking-tighter">Department</span>
                <span className="text-sm font-semibold uppercase">{user.department || "Corporate"}</span>
              </div>
            </div>
          </section>

          <section className="space-y-6 text-left md:text-right">
            <h3 className="text-[11px] font-black uppercase tracking-[0.2em] text-slate-400 flex items-center gap-2 md:justify-end">
              Payroll Period <div className="w-1.5 h-1.5 rounded-full bg-primary" />
            </h3>
            <div className="space-y-1">
              <p className="text-xl md:text-2xl font-black text-slate-800 tracking-tighter">
                {displayMonth ? new Date(displayMonth + "-01").toLocaleString("default", { month: "long", year: "numeric" }) : '---'}
              </p>
              <p className="text-[10px] text-muted-foreground font-bold tracking-[0.2em] uppercase">
                Status: {isPending ? "Pending HR Approval" : "Approved"}
              </p>
            </div>
            <div className="inline-block bg-slate-50 border border-slate-200 px-4 py-2 rounded">
              <p className="text-[9px] text-muted-foreground uppercase font-bold">Issue Date</p>
              <p className="text-xs font-bold">{new Date().toLocaleDateString("en-GB", { day: "2-digit", month: "short", year: "numeric" })}</p>
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
                  <th className="px-4 md:px-6 py-3 md:py-4 text-left font-bold">Description</th>
                  <th className="px-4 md:px-6 py-3 md:py-4 text-right font-bold w-32 md:w-48">Amount (NGN)</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                <tr className="bg-slate-50/30">
                  <td className="px-4 md:px-6 py-3 md:py-4 font-medium text-slate-600">Basic Salary</td>
                  <td className="px-4 md:px-6 py-3 md:py-4 text-right tabular-nums">
                    {formatPrice(Number(entry?.calculation_snapshot?.basic || 0)).replace("NGN", "")}
                  </td>
                </tr>
                <tr className="bg-slate-50/30">
                  <td className="px-4 md:px-6 py-3 md:py-4 font-medium text-slate-600">Housing Allowance</td>
                  <td className="px-4 md:px-6 py-3 md:py-4 text-right tabular-nums">
                    {formatPrice(Number(entry?.calculation_snapshot?.rent_housing || 0)).replace("NGN", "")}
                  </td>
                </tr>
                <tr className="bg-slate-50/30">
                  <td className="px-4 md:px-6 py-3 md:py-4 font-medium text-slate-600">Transport Allowance</td>
                  <td className="px-4 md:px-6 py-3 md:py-4 text-right tabular-nums">
                    {formatPrice(Number(entry?.calculation_snapshot?.transport || 0)).replace("NGN", "")}
                  </td>
                </tr>
                <tr className="bg-slate-50/30">
                  <td className="px-4 md:px-6 py-3 md:py-4 font-medium text-slate-600">Medical Allowance</td>
                  <td className="px-4 md:px-6 py-3 md:py-4 text-right tabular-nums">
                    {formatPrice(Number(entry?.calculation_snapshot?.medical || 0)).replace("NGN", "")}
                  </td>
                </tr>
                <tr className="bg-slate-50/30">
                  <td className="px-4 md:px-6 py-3 md:py-4 font-medium text-slate-600">Other Allowances (Utility, etc.)</td>
                  <td className="px-4 md:px-6 py-3 md:py-4 text-right tabular-nums">
                    {formatPrice(
                      Number(entry?.calculation_snapshot?.furniture || 0) +
                      Number(entry?.calculation_snapshot?.utility || 0) +
                      Number(entry?.calculation_snapshot?.entertainment || 0) +
                      Number(entry?.calculation_snapshot?.meal_subsidy || 0) +
                      Number(entry?.calculation_snapshot?.clothing || 0) +
                      Number(entry?.calculation_snapshot?.passages || 0)
                    ).replace("NGN", "")}
                  </td>
                </tr>
                <tr className="bg-primary/5 font-bold">
                  <td className="px-4 md:px-6 py-3 md:py-4 text-slate-800">Total Gross Salary</td>
                  <td className="px-4 md:px-6 py-3 md:py-4 text-right tabular-nums">
                    {formatPrice(grossPay).replace("NGN", "")}
                  </td>
                </tr>
                {/* Attendance Deductions (Absences) */}
                {Math.max(0, Number(entry.attendance_days) - Number(entry.prorated_days)) > 0 && (
                  <tr className="bg-slate-50/30">
                    <td className="px-4 md:px-6 py-3 md:py-4 font-medium text-slate-600">
                      Attendance Deductions ({Math.round((Number(entry.attendance_days) - Number(entry.prorated_days)) * 100) / 100} days)
                    </td>
                    <td className="px-4 md:px-6 py-3 md:py-4 text-right font-bold tabular-nums text-rose-600">
                      ({formatPrice(Math.max(0, Number(entry.attendance_days) - Number(entry.prorated_days)) * Number(entry.daily_rate)).replace("NGN", "")})
                    </td>
                  </tr>
                )}

                {/* Compliance Deductions (Suspensions/Penalties) */}
                {Number(entry.suspension_days) > 0 && (
                  <tr className="bg-slate-50/30">
                    <td className="px-4 md:px-6 py-3 md:py-4 font-medium text-slate-600">
                      Compliance Deductions ({entry.suspension_days} days)
                    </td>
                    <td className="px-4 md:px-6 py-3 md:py-4 text-right font-bold tabular-nums text-rose-600">
                      ({formatPrice(Number(entry.suspension_days) * Number(entry.daily_rate)).replace("NGN", "")})
                    </td>
                  </tr>
                )}

                {/* Mid-month Proration (Pre-employment) */}
                {Number(entry.prorated_days) > 0 && (
                  <tr className="bg-slate-50/30">
                    <td className="px-4 md:px-6 py-3 md:py-4 font-medium text-slate-600">
                      Mid-month Proration ({entry.prorated_days} days)
                    </td>
                    <td className="px-4 md:px-6 py-3 md:py-4 text-right font-bold tabular-nums text-rose-600">
                      ({formatPrice(Number(entry.prorated_days) * Number(entry.daily_rate)).replace("NGN", "")})
                    </td>
                  </tr>
                )}

                {entry.other_deductions_amount > 0 && (
                  <tr className="bg-slate-50/30">
                    <td className="px-4 md:px-6 py-3 md:py-4 font-medium text-slate-600">
                      Other Deductions
                    </td>
                    <td className="px-4 md:px-6 py-3 md:py-4 text-right font-bold tabular-nums text-rose-600">
                      ({formatPrice(entry.other_deductions_amount).replace("NGN", "")})
                    </td>
                  </tr>
                )}
                <tr className="bg-slate-50 border-t border-slate-200">
                  <td className="px-4 md:px-6 py-3 md:py-4">
                    <div className="flex flex-col">
                      <span className="font-medium text-slate-600">Income Tax (PAYE)</span>
                      {entry.is_intern && (
                        <span className="text-[10px] text-muted-foreground">Intern tax exemption applied</span>
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
                  <td className="px-4 md:px-6 py-3 md:py-4 text-[10px] font-black uppercase tracking-wider text-slate-500">Total Deductions</td>
                  <td className="px-4 md:px-6 py-3 md:py-4 text-right font-black text-rose-600 tabular-nums">
                    {formatPrice(totalDeductions).replace("NGN", "")}
                  </td>
                </tr>
                <tr>
                  <td className="px-4 md:px-6 py-4 md:py-6 text-sm md:text-base font-black uppercase tracking-tighter text-primary">Final Take-Home Pay</td>
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
              <div className="w-2 h-2 rounded-full bg-primary animate-pulse" /> Digital Record
            </div>
            <span>Verified by HR System</span>
          </div>
          <div className="flex items-center gap-2">
            System Ref: <span className="font-mono text-slate-600">AS-PR-{new Date().getTime().toString().slice(-6)}</span>
          </div>
        </footer>
      </div>
    </div>
  );
}

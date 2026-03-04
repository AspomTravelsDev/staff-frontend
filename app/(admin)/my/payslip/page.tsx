import { redirect } from "next/navigation";
import { getCurrentUser } from "@/lib/auth/session";
import { Building2, FileText } from "lucide-react";
import { ExportButton } from "./components/export-button";

export default async function PayslipPage() {
  const user = await getCurrentUser();

  if (!user) {
    redirect("/auth/login");
  }

  const grossPay = parseFloat(user.gross_pay) || 0;

  const salaryBreakdown = [
    { label: "Basic", amount: grossPay * 0.1835 },
    { label: "Rent", amount: grossPay * 0.0552 },
    { label: "Transport", amount: grossPay * 0.0552 },
    { label: "Medical/Health", amount: grossPay * 0.1826 },
    { label: "Furniture", amount: grossPay * 0.0634 },
    { label: "Utility", amount: grossPay * 0.0345 },
    { label: "Entertainment", amount: grossPay * 0.0446 },
    { label: "Meal", amount: grossPay * 0.1336 },
    { label: "Clothing", amount: grossPay * 0.1328 },
    { label: "Passages", amount: grossPay * 0.1146 },
  ];

  const annualGross = grossPay * 12;

  const annualPension = 0;
  const annualNHF = 0;

  const taxableIncome = Math.max(0, annualGross - annualPension - annualNHF);

  let remainingTaxable = taxableIncome;
  let annualTax = 0;

  // Band 1: First ₦800,000 at 0%
  const band1 = Math.min(remainingTaxable, 800000);
  // No tax on first band
  remainingTaxable -= band1;

  // Band 2: ₦800,001 - ₦3,000,000 at 15%
  if (remainingTaxable > 0) {
    const band2 = Math.min(remainingTaxable, 2200000); // 3,000,000 - 800,000
    annualTax += band2 * 0.15;
    remainingTaxable -= band2;
  }

  // Band 3: ₦3,000,001 - ₦12,000,000 at 18%
  if (remainingTaxable > 0) {
    const band3 = Math.min(remainingTaxable, 9000000); // 12,000,000 - 3,000,000
    annualTax += band3 * 0.18;
    remainingTaxable -= band3;
  }

  // Band 4: ₦12,000,001 - ₦25,000,000 at 21%
  if (remainingTaxable > 0) {
    const band4 = Math.min(remainingTaxable, 13000000); // 25,000,000 - 12,000,000
    annualTax += band4 * 0.21;
    remainingTaxable -= band4;
  }

  // Band 5: Above ₦25,000,000 at 25%
  if (remainingTaxable > 0) {
    annualTax += remainingTaxable * 0.25;
  }

  const monthlyTax = annualTax / 12;
  const monthlyPension = annualPension / 12;
  const monthlyNHF = annualNHF / 12;
  const totalMonthlyDeductions = monthlyTax + monthlyPension + monthlyNHF;
  const netPay = grossPay - totalMonthlyDeductions;

  const currencyFormatter = new Intl.NumberFormat("en-NG", {
    style: "currency",
    currency: "NGN",
  });

  const formatPrice = (amount: number) => currencyFormatter.format(amount);

  return (
    <div className="min-h-screen bg-muted/30 p-4 md:p-8 lg:p-12">
      <div className="max-w-4xl mx-auto space-y-6">
        {/* Header Actions */}
        <div className="flex justify-between items-center bg-background p-4 rounded-xl border shadow-sm">
          <div className="flex items-center gap-3">
            <div className="bg-primary/10 p-2 rounded-lg text-primary">
              <FileText className="h-5 w-5" />
            </div>
            <div>
              <h1 className="text-xl font-bold tracking-tight">
                Payroll Record
              </h1>
              <p className="text-[10px] text-muted-foreground uppercase tracking-widest font-semibold">
                Monthly Statements
              </p>
            </div>
          </div>
          <ExportButton />
        </div>

        {/* Main Payslip Document */}
        <div
          id="payslip-document"
          className="bg-white text-slate-900 shadow-2xl overflow-hidden rounded-sm border-12 border-slate-100 ring-1 ring-slate-200"
        >
          <div className="p-10 space-y-12">
            {/* Elegant Header */}
            <div className="flex flex-col items-center text-center space-y-2 border-b-2 border-primary/20 pb-8">
              <h2 className="text-4xl font-black tracking-[0.15em] text-slate-800 uppercase">
                Payroll Slip
              </h2>
              <div className="flex items-center gap-2 text-primary font-bold tracking-wider">
                <Building2 className="h-5 w-5" />
                <span className="text-xl">ASPOM TRAVELS AGENCY</span>
              </div>
            </div>

            {/* Info Section */}
            <div className="grid grid-cols-2 gap-x-16 gap-y-10 items-start">
              <section className="space-y-6">
                <h3 className="text-[11px] font-black uppercase tracking-[0.2em] text-slate-400 flex items-center gap-2">
                  <div className="w-1.5 h-1.5 rounded-full bg-primary" />{" "}
                  Employee Details
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
                  <div className="flex flex-col gap-0.5 border-l-2 border-slate-100 pl-4">
                    <span className="text-[10px] text-muted-foreground uppercase font-bold tracking-tighter">
                      Department
                    </span>
                    <span className="text-sm font-semibold uppercase">
                      {user.department || "Corporate"}
                    </span>
                  </div>
                </div>
              </section>

              <section className="space-y-6 text-right">
                <h3 className="text-[11px] font-black uppercase tracking-[0.2em] text-slate-400 flex items-center gap-2 justify-end">
                  Payroll Period{" "}
                  <div className="w-1.5 h-1.5 rounded-full bg-primary" />
                </h3>
                <div className="space-y-1">
                  <p className="text-2xl font-black text-slate-800 tracking-tighter">
                    {new Date().toLocaleString("default", {
                      month: "long",
                      year: "numeric",
                    })}
                  </p>
                  <p className="text-[10px] text-muted-foreground font-bold tracking-[0.2em] uppercase">
                    Status: Finalized
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
                <table className="w-full text-sm">
                  <thead className="bg-slate-50 text-[10px] font-black uppercase tracking-widest text-slate-500 border-b border-slate-200">
                    <tr>
                      <th className="px-6 py-4 text-left font-bold">
                        Description
                      </th>
                      <th className="px-6 py-4 text-right font-bold w-48">
                        Amount (NGN)
                      </th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {salaryBreakdown.map((item, idx) => (
                      <tr
                        key={idx}
                        className={idx % 2 === 1 ? "bg-slate-50/30" : ""}
                      >
                        <td className="px-6 py-4 font-medium text-slate-600">
                          {item.label}
                        </td>
                        <td className="px-6 py-4 text-right font-bold tabular-nums">
                          {formatPrice(item.amount).replace("NGN", "")}
                        </td>
                      </tr>
                    ))}
                    <tr className="bg-slate-50 border-t border-slate-200">
                      <td className="px-6 py-4">
                        <div className="flex flex-col">
                          <span className="font-medium text-slate-600">
                            Income Tax (PAYE)
                          </span>
                        </div>
                      </td>
                      <td className="px-6 py-4 text-right font-bold text-rose-600 tabular-nums">
                        ({formatPrice(monthlyTax).replace("NGN", "")})
                      </td>
                    </tr>
                    {/* Pension and NHF fund contribution commented out for now
                    <tr className="bg-slate-50">
                      <td className="px-6 py-4">
                        <div className="flex flex-col">
                          <span className="font-medium text-slate-600">
                            Pension Contribution
                          </span>
                          <span className="text-[10px] text-muted-foreground">
                            Standard 8% Fund
                          </span>
                        </div>
                      </td>
                      <td className="px-6 py-4 text-right font-bold text-rose-600 tabular-nums">
                        ({formatPrice(monthlyPension).replace("NGN", "")})
                      </td>
                    </tr>
                    <tr className="bg-slate-50">
                      <td className="px-6 py-4">
                        <div className="flex flex-col">
                          <span className="font-medium text-slate-600">
                            National Housing Fund (NHF)
                          </span>
                          <span className="text-[10px] text-muted-foreground">
                            Standard 2.5% Contribution
                          </span>
                        </div>
                      </td>
                      <td className="px-6 py-4 text-right font-bold text-rose-600 tabular-nums">
                        ({formatPrice(monthlyNHF).replace("NGN", "")})
                      </td>
                    </tr>
                    */}
                  </tbody>
                  <tfoot className="bg-primary/5 text-slate-900 border-t-2 border-primary/20">
                    <tr className="border-b border-primary/10">
                      <td className="px-6 py-4 text-[10px] font-black uppercase tracking-wider text-slate-500">
                        Total Deductions
                      </td>
                      <td className="px-6 py-4 text-right font-black text-rose-600 tabular-nums">
                        {formatPrice(totalMonthlyDeductions).replace("NGN", "")}
                      </td>
                    </tr>
                    <tr>
                      <td className="px-6 py-6 text-base font-black uppercase tracking-tighter text-primary">
                        Final Take-Home Pay
                      </td>
                      <td className="px-6 py-6 text-right">
                        <span className="text-3xl font-black text-primary tracking-tighter underline decoration-primary/20 underline-offset-8">
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
                  <div className="w-2 h-2 rounded-full bg-primary animate-pulse" />
                  Digital Record
                </div>
                <span>Verified by HR System</span>
              </div>
              <div className="flex items-center gap-2">
                System Ref:{" "}
                <span className="font-mono text-slate-600">
                  AS-PR-{new Date().getTime().toString().slice(-6)}
                </span>
              </div>
            </footer>
          </div>
        </div>
      </div>
    </div>
  );
}

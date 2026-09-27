const ROUND_PRECISION = 100;

function round2(value: number) {
    return Math.round(value * ROUND_PRECISION) / ROUND_PRECISION;
}

export function calculateMonthlyTax(taxableGross: number) {
    let remainingTaxable = Math.max(0, taxableGross * 12);
    let annualTax = 0;

    const bands = [
        { threshold: 800000, rate: 0.0 },
        { threshold: 2200000, rate: 0.15 },
        { threshold: 9000000, rate: 0.18 },
        { threshold: 13000000, rate: 0.21 },
        { threshold: 25000000, rate: 0.23 },
        { threshold: 50000000, rate: 0.25 }
    ];

    for (const band of bands) {
        const bandAmount = Math.min(remainingTaxable, band.threshold);
        annualTax += bandAmount * band.rate;
        remainingTaxable -= bandAmount;
        if (remainingTaxable <= 0) break;
    }
    if (remainingTaxable > 0) {
        annualTax += remainingTaxable * 0.25;
    }

    return round2(annualTax / 12);
}

export function countWeekdaysBetween(start: Date, end: Date) {
    if (end < start) return 0;
    let count = 0;
    const cur = new Date(start.getTime());
    while (cur <= end) {
        const day = cur.getDay();
        if (day !== 0 && day !== 6) count += 1;
        cur.setDate(cur.getDate() + 1);
    }
    return count;
}

export function getDaysInMonth(year: number, month: number) {
    return new Date(year, month, 0).getDate();
}

export function getWorkingDaysInMonth(year: number, month: number) {
    const start = new Date(year, month - 1, 1);
    const end = new Date(year, month, 0);
    return countWeekdaysBetween(start, end);
}

/**
 * Returns true for contract types that are exempt from PAYE tax.
 * Covers: intern, nysc, and contract staff.
 */
export function isTaxExempt(contractType?: string | null): boolean {
    return (
        contractType === "intern" ||
        contractType === "nysc" ||
        contractType === "contract"
    );
}

export function getAccommodationRate(contractType?: string, tenureMonths?: number) {
    if (contractType === "intern" || contractType === "nysc") return 5000;
    if ((tenureMonths ?? 0) >= 6) return 0;
    return 10000;
}

export function calculateActualGrossWorkingDays(
    baseSalary: number,
    workingDaysInMonth: number,
    proratedDays: number,
) {
    const activeWorkingDays = Math.max(0, workingDaysInMonth - proratedDays);
    if (workingDaysInMonth <= 0) return 0;
    return round2((baseSalary / workingDaysInMonth) * activeWorkingDays);
}

export function calculateAccommodationAmount(
    accommodationRate: number,
    daysInMonth: number,
    calendarProratedDays: number,
) {
    const activeCalendarDays = Math.max(0, daysInMonth - calendarProratedDays);
    if (daysInMonth <= 0) return 0;
    return round2((accommodationRate / daysInMonth) * activeCalendarDays);
}

export const SALARY_PERCENTAGES = {
  basic: 0.1835,
  rent_housing: 0.0552,
  transport: 0.0552,
  medical: 0.1826,
  furniture: 0.0634,
  utility: 0.0345,
  entertainment: 0.0446,
  meal_subsidy: 0.1336,
  clothing: 0.1328,
  passages: 0.1146,
};

export interface PayrollItemInput {
  label: string;
  amount: number;
  tax_treatment?: "post_tax" | "pre_tax"; // "post_tax" (default) or "pre_tax"
}

export interface PayrollEntryInput {
  baseSalary: number;
  contractType?: string | null;
  isIntern: boolean;
  dateJoined?: string | null;
  exitDate?: string | null;
  payrollMonth: string;
  proratedDays: number;
  accommodationAmount?: number | null;
  attendanceDays: number;
  suspensionDays: number;
  otherDeductions: PayrollItemInput[];
  additions: PayrollItemInput[];
  customGross?: number | null;
  customTax?: number | null;
  customDailyRate?: number | null;
  customNet?: number | null;
}

export function calculatePayrollEntry(input: PayrollEntryInput) {
  const {
    baseSalary,
    contractType,
    isIntern,
    dateJoined,
    exitDate,
    payrollMonth,
    proratedDays,
    accommodationAmount,
    attendanceDays,
    suspensionDays,
    otherDeductions,
    additions,
    customGross,
    customTax,
    customDailyRate,
    customNet,
  } = input;

  const [year, month] = payrollMonth.split("-").map(Number);
  const daysInMonth = getDaysInMonth(year, month);
  const workingDaysInMonth = getWorkingDaysInMonth(year, month);

  // Tenure
  let tenureMonths = 0;
  if (dateJoined) {
    const [joinYear, joinMonth] = dateJoined.split(" ")[0].split("-").map(Number);
    tenureMonths = (year - joinYear) * 12 + (month - joinMonth);
  }

  const accommodationRate = getAccommodationRate(contractType ?? undefined, tenureMonths);

  // Linear Proration Factor
  const activeWorkingDays = Math.max(0, workingDaysInMonth - proratedDays);
  const factor = workingDaysInMonth > 0 ? activeWorkingDays / workingDaysInMonth : 0.0;

  // Actual gross (prorated)
  const actualGross = (customGross !== undefined && customGross !== null)
    ? customGross
    : round2(baseSalary * factor);

  // Split deductions into Pre-Tax (Tax Deductible) and Post-Tax (After Tax)
  const preTaxDeductions = otherDeductions
    .filter((d) => d.tax_treatment === "pre_tax")
    .reduce((sum, d) => sum + Number(d.amount), 0);
  const postTaxDeductions = otherDeductions
    .filter((d) => d.tax_treatment !== "pre_tax")
    .reduce((sum, d) => sum + Number(d.amount), 0);
  const otherDeductionsAmount = round2(preTaxDeductions + postTaxDeductions);

  // Split additions into Pre-Tax (Taxable Addition) and Post-Tax (Non-Taxable Addition)
  const preTaxAdditions = additions
    .filter((a) => a.tax_treatment === "pre_tax")
    .reduce((sum, a) => sum + Number(a.amount), 0);
  const postTaxAdditions = additions
    .filter((a) => a.tax_treatment !== "pre_tax")
    .reduce((sum, a) => sum + Number(a.amount), 0);
  const additionsAmount = round2(preTaxAdditions + postTaxAdditions);

  // Taxable Gross Salary
  const taxableGross = round2(Math.max(0, actualGross + preTaxAdditions - preTaxDeductions));

  // Progressive tax calculated on Taxable Gross Salary
  // Exempt: interns, NYSC, and contract staff
  const taxExempt = isIntern || isTaxExempt(contractType);
  const taxAmount = taxExempt ? 0 : (
    (customTax !== undefined && customTax !== null)
      ? customTax
      : calculateMonthlyTax(taxableGross)
  );

  // Prorated After-Tax Salary
  const afterTaxSalary = round2(Math.max(0, actualGross + preTaxAdditions - preTaxDeductions - taxAmount));

  // Calendar proration for accommodation
  let calendarProratedDays = 0;
  if (dateJoined) {
    const joinDate = new Date(dateJoined.split(" ")[0]);
    const monthStart = new Date(year, month - 1, 1);
    if (joinDate > monthStart) {
      const diffMs = joinDate.getTime() - monthStart.getTime();
      calendarProratedDays += Math.floor(diffMs / (1000 * 60 * 60 * 24));
    }
  }
  if (exitDate) {
    const exitD = new Date(exitDate.split(" ")[0]);
    const monthEnd = new Date(year, month, 0);
    if (exitD < monthEnd) {
      const diffMs = monthEnd.getTime() - exitD.getTime();
      calendarProratedDays += Math.floor(diffMs / (1000 * 60 * 60 * 24));
    }
  }
  const activeCalendarDays = Math.max(0, daysInMonth - calendarProratedDays);
  const defaultAccommodationAmount = calculateAccommodationAmount(accommodationRate, daysInMonth, calendarProratedDays);
  const finalAccommodationAmount = (accommodationAmount !== undefined && accommodationAmount !== null)
    ? accommodationAmount
    : defaultAccommodationAmount;

  // Daily rate base
  const dailyRateBase = Math.max(0, actualGross + preTaxAdditions - preTaxDeductions - taxAmount - finalAccommodationAmount - postTaxDeductions);
  const defaultDailyRate = workingDaysInMonth > 0 ? round2(dailyRateBase / workingDaysInMonth) : 0;
  const dailyRate = (customDailyRate !== undefined && customDailyRate !== null)
    ? customDailyRate
    : defaultDailyRate;

  // Absences and Suspensions
  const attendanceDeduction = round2(attendanceDays * dailyRate);
  const suspensionDeduction = round2(suspensionDays * dailyRate);
  const deductionAmount = round2(attendanceDeduction + suspensionDeduction);

  const finalDeductionDays = round2(attendanceDays + suspensionDays);

  // Default Net Salary calculation
  const defaultNet = round2(
    Math.max(
      0,
      actualGross + preTaxAdditions - preTaxDeductions - taxAmount - finalAccommodationAmount - postTaxDeductions - deductionAmount + postTaxAdditions
    )
  );
  const netAmount = (customNet !== undefined && customNet !== null)
    ? customNet
    : defaultNet;

  // Salary breakdown
  const breakdown: Record<string, number> = {};
  for (const [key, pct] of Object.entries(SALARY_PERCENTAGES)) {
    breakdown[key] = round2(actualGross * pct);
  }

  const snapshot = {
    ...breakdown,
    base_monthly_salary: baseSalary,
    gross_salary: actualGross,
    taxable_gross: taxableGross,
    pre_tax_deductions: preTaxDeductions,
    post_tax_deductions: postTaxDeductions,
    pre_tax_additions: preTaxAdditions,
    post_tax_additions: postTaxAdditions,
    tax_amount: taxAmount,
    accommodation_rate: accommodationRate,
    accommodation_amount: finalAccommodationAmount,
    accommodation_weeks: Math.ceil(activeCalendarDays / 7),
    after_tax: round2(actualGross - taxAmount),
    after_tax_accommodation: dailyRateBase,
    daily_rate: dailyRate,
    working_days: workingDaysInMonth,
    rate_days: workingDaysInMonth,
    deduction_amount: deductionAmount,
    attendance_deduction: attendanceDeduction,
    suspension_deduction: suspensionDeduction,
    prorated_days: proratedDays,
    attendance_absence_days: attendanceDays,
    other_deductions_amount: otherDeductionsAmount,
    other_deductions: otherDeductions,
    additions_amount: additionsAmount,
    additions: additions,
    net_amount: netAmount,
    is_intern: isIntern,
    manual_overrides: {
      gross: customGross !== undefined && customGross !== null,
      tax: customTax !== undefined && customTax !== null,
      daily_rate: customDailyRate !== undefined && customDailyRate !== null,
      net: customNet !== undefined && customNet !== null,
    },
  };

  return {
    gross_salary: actualGross,
    taxable_gross: taxableGross,
    is_intern: isIntern,
    accommodation_amount: finalAccommodationAmount,
    attendance_days: attendanceDays,
    suspension_days: suspensionDays,
    prorated_days: proratedDays,
    other_deductions_amount: otherDeductionsAmount,
    other_deductions: otherDeductions,
    additions_amount: additionsAmount,
    additions: additions,
    final_deduction_days: finalDeductionDays,
    daily_rate: dailyRate,
    deduction_amount: deductionAmount,
    tax_amount: taxAmount,
    net_amount: netAmount,
    calculation_snapshot: snapshot,
    manual_overrides: snapshot.manual_overrides,
  };
}


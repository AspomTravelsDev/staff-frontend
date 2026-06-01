const ROUND_PRECISION = 100;

function round2(value: number) {
    return Math.round(value * ROUND_PRECISION) / ROUND_PRECISION;
}

export function calculateMonthlyTax(taxableGross: number) {
    let remainingTaxable = Math.max(0, taxableGross * 12);
    let annualTax = 0;

    const band1 = Math.min(remainingTaxable, 800000);
    remainingTaxable -= band1;

    if (remainingTaxable > 0) {
        const band2 = Math.min(remainingTaxable, 2200000);
        annualTax += band2 * 0.15;
        remainingTaxable -= band2;
    }
    if (remainingTaxable > 0) {
        const band3 = Math.min(remainingTaxable, 9000000);
        annualTax += band3 * 0.18;
        remainingTaxable -= band3;
    }
    if (remainingTaxable > 0) {
        const band4 = Math.min(remainingTaxable, 13000000);
        annualTax += band4 * 0.21;
        remainingTaxable -= band4;
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

export function calculateAccommodationWeeks(
    daysInMonth: number,
    calendarProratedDays: number,
) {
    const activeCalendarDays = Math.max(0, daysInMonth - calendarProratedDays);
    return Math.ceil(activeCalendarDays / 7);
}

export function calculateWeeklyAccommodationAmount(
    accommodationRate: number,
    accommodationWeeks: number,
) {
    return round2((accommodationRate / 4) * accommodationWeeks);
}

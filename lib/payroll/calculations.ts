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


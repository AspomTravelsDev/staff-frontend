import { SALARY_PERCENTAGES } from "@/lib/config/payroll";

export interface ComputedSalaryPackage {
  gross_salary: number;
  net_salary: number;
  statutory_tax_deduction: number;
  basic: number;
  rent_housing: number;
  transport: number;
  medical: number;
  furniture: number;
  utility: number;
  entertainment: number;
  meal_subsidy: number;
  clothing: number;
  passages: number;
}

/**
 * Calculates PAYE tax and Net Salary from a monthly Gross Salary.
 */
export function calculateNetFromGross(
  grossSalary: number,
  isTaxExempt: boolean = false
): ComputedSalaryPackage {
  if (grossSalary <= 0) {
    return getEmptyBreakdown();
  }

  let calculatedTax = 0;
  if (!isTaxExempt) {
    let remainingTaxable = grossSalary * 12;
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

    calculatedTax = Math.round((annualTax / 12) * 100) / 100;
  }

  const netSalary = Math.max(0, Math.round((grossSalary - calculatedTax) * 100) / 100);

  return buildSalaryPackage(grossSalary, netSalary, calculatedTax);
}

/**
 * Reverses the PAYE tax schedule to calculate monthly Gross Salary from a desired monthly Net Salary.
 */
export function calculateGrossFromNet(
  netSalary: number,
  isTaxExempt: boolean = false
): ComputedSalaryPackage {
  if (netSalary <= 0) {
    return getEmptyBreakdown();
  }

  if (isTaxExempt) {
    // Tax-exempt: Gross = Net
    return buildSalaryPackage(netSalary, netSalary, 0);
  }

  const annualNet = netSalary * 12;
  let annualGross = annualNet;

  if (annualNet <= 800000) {
    annualGross = annualNet;
  } else if (annualNet <= 2670000) {
    annualGross = (annualNet - 120000) / 0.85;
  } else if (annualNet <= 10050000) {
    annualGross = (annualNet - 210000) / 0.82;
  } else if (annualNet <= 20320000) {
    annualGross = (annualNet - 570000) / 0.79;
  } else {
    annualGross = (annualNet - 1570000) / 0.75;
  }

  const monthlyGross = Math.round((annualGross / 12) * 100) / 100;
  const annualTax = annualGross - annualNet;
  const monthlyTax = Math.round((annualTax / 12) * 100) / 100;

  return buildSalaryPackage(monthlyGross, netSalary, monthlyTax);
}

function buildSalaryPackage(
  gross: number,
  net: number,
  tax: number
): ComputedSalaryPackage {
  return {
    gross_salary: gross,
    net_salary: net,
    statutory_tax_deduction: tax,
    basic: Math.round(gross * SALARY_PERCENTAGES.basic * 100) / 100,
    rent_housing: Math.round(gross * SALARY_PERCENTAGES.rent_housing * 100) / 100,
    transport: Math.round(gross * SALARY_PERCENTAGES.transport * 100) / 100,
    medical: Math.round(gross * SALARY_PERCENTAGES.medical * 100) / 100,
    furniture: Math.round(gross * SALARY_PERCENTAGES.furniture * 100) / 100,
    utility: Math.round(gross * SALARY_PERCENTAGES.utility * 100) / 100,
    entertainment: Math.round(gross * SALARY_PERCENTAGES.entertainment * 100) / 100,
    meal_subsidy: Math.round(gross * SALARY_PERCENTAGES.meal_subsidy * 100) / 100,
    clothing: Math.round(gross * SALARY_PERCENTAGES.clothing * 100) / 100,
    passages: Math.round(gross * SALARY_PERCENTAGES.passages * 100) / 100,
  };
}

function getEmptyBreakdown(): ComputedSalaryPackage {
  return {
    gross_salary: 0,
    net_salary: 0,
    statutory_tax_deduction: 0,
    basic: 0,
    rent_housing: 0,
    transport: 0,
    medical: 0,
    furniture: 0,
    utility: 0,
    entertainment: 0,
    meal_subsidy: 0,
    clothing: 0,
    passages: 0,
  };
}

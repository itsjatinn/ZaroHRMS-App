// Shared payslip data + an Indian-format currency helper.

export type Payslip = {
  id: string;
  month: string; // e.g. "Feb 2026"
  net: number;
  gross: number;
  deductions: number;
  status: 'Paid' | 'Processing';
};

export const PAYSLIPS: Payslip[] = [
  { id: '2026-02', month: 'Feb 2026', net: 124500, gross: 150000, deductions: 25500, status: 'Paid' },
  { id: '2026-01', month: 'Jan 2026', net: 124500, gross: 150000, deductions: 25500, status: 'Paid' },
  { id: '2025-12', month: 'Dec 2025', net: 131200, gross: 158000, deductions: 26800, status: 'Paid' },
  { id: '2025-11', month: 'Nov 2025', net: 124500, gross: 150000, deductions: 25500, status: 'Paid' },
  { id: '2025-10', month: 'Oct 2025', net: 124500, gross: 150000, deductions: 25500, status: 'Paid' },
];

// Earnings & deductions for the latest payslip.
export const EARNINGS = [
  { label: 'Basic Salary', amount: 75000 },
  { label: 'House Rent Allowance', amount: 37500 },
  { label: 'Special Allowance', amount: 30000 },
  { label: 'Performance Bonus', amount: 7500 },
];

export const DEDUCTIONS = [
  { label: 'Provident Fund', amount: 9000 },
  { label: 'Professional Tax', amount: 2500 },
  { label: 'Income Tax (TDS)', amount: 14000 },
];

// Indian digit grouping (e.g. 124500 -> ₹1,24,500). Avoids relying on Intl,
// which is not fully supported by Hermes.
export function formatINR(num: number): string {
  const digits = Math.round(num).toString();
  let lastThree = digits.slice(-3);
  const other = digits.slice(0, -3);
  if (other !== '') lastThree = ',' + lastThree;
  const grouped = other.replace(/\B(?=(\d{2})+(?!\d))/g, ',') + lastThree;
  return `₹${grouped}`;
}

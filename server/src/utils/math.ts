/**
 * Utility functions for precise financial calculations
 * Avoiding floating point inaccuracies (e.g., 0.1 + 0.2 = 0.30000000000000004)
 */

export function round2(num: number): number {
  return Math.round((num + Number.EPSILON) * 100) / 100;
}

export function safeAdd(a: number, b: number): number {
  return round2(Math.round(a * 100 + b * 100) / 100);
}

export function safeSub(a: number, b: number): number {
  return round2(Math.round(a * 100 - b * 100) / 100);
}

export function safeMul(a: number, b: number): number {
  return round2(a * b);
}

export function safeDiv(a: number, b: number): number {
  if (b === 0) return 0;
  return round2(a / b);
}

export function formatCurrency(amount: number, currency = 'LKR'): string {
  const rounded = round2(amount);
  const formattedNumber = new Intl.NumberFormat('en-US', {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(rounded);

  switch (currency.toUpperCase()) {
    case 'LKR':
      return `Rs. ${formattedNumber}`;
    case 'USD':
      return `$${formattedNumber}`;
    case 'EUR':
      return `€${formattedNumber}`;
    case 'GBP':
      return `£${formattedNumber}`;
    case 'INR':
      return `₹${formattedNumber}`;
    case 'AUD':
      return `A$${formattedNumber}`;
    case 'CAD':
      return `C$${formattedNumber}`;
    default:
      return `${currency} ${formattedNumber}`;
  }
}

import { describe, it, expect } from 'vitest';
import { round2, safeAdd, safeSub, safeMul, safeDiv, formatCurrency } from './math';

describe('Financial Math Precision', () => {
  it('correctly handles floating point addition without precision drift', () => {
    // In standard JS: 0.1 + 0.2 = 0.30000000000000004
    expect(0.1 + 0.2).not.toBe(0.3);
    expect(safeAdd(0.1, 0.2)).toBe(0.3);
    expect(safeAdd(19.99, 0.01)).toBe(20.0);
    expect(safeAdd(12500.45, 2500.55)).toBe(15001.0);
  });

  it('correctly handles floating point subtraction', () => {
    expect(safeSub(1.0, 0.9)).toBe(0.1);
    expect(safeSub(20000, 12000)).toBe(8000);
    expect(safeSub(100.5, 0.25)).toBe(100.25);
  });

  it('safely rounds to 2 decimal places', () => {
    expect(round2(10.555)).toBe(10.56);
    expect(round2(10.554)).toBe(10.55);
    expect(round2(0)).toBe(0);
  });

  it('formats currency correctly for LKR, USD, EUR, GBP, INR', () => {
    expect(formatCurrency(12500, 'LKR')).toBe('Rs. 12,500.00');
    expect(formatCurrency(25.5, 'USD')).toBe('$25.50');
    expect(formatCurrency(49.99, 'EUR')).toBe('€49.99');
    expect(formatCurrency(100, 'GBP')).toBe('£100.00');
    expect(formatCurrency(1500, 'INR')).toBe('₹1,500.00');
  });

  it('handles division by zero safely', () => {
    expect(safeDiv(100, 0)).toBe(0);
    expect(safeDiv(100, 4)).toBe(25);
  });
});

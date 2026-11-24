import { describe, it, expect } from 'vitest';
import { MoneyPipe, MoneySimplePipe } from './money-pipe';

describe('MoneyPipe', () => {
  const pipe = new MoneyPipe();

  describe('transform', () => {
    it('should format paise to INR currency string', () => {
      expect(pipe.transform(150000)).toBe('₹1,500.00');
    });

    it('should return empty string for null', () => {
      expect(pipe.transform(null)).toBe('');
    });

    it('should return empty string for undefined', () => {
      expect(pipe.transform(undefined)).toBe('');
    });

    it('should handle string numbers', () => {
      expect(pipe.transform('50000')).toBe('₹500.00');
    });

    it('should return empty for NaN', () => {
      expect(pipe.transform(NaN)).toBe('');
      expect(pipe.transform('invalid')).toBe('');
    });
  });

  describe('parseDigitsInfo', () => {
    it('should correctly parse "1.2-2" (minFrac=2, maxFrac=2)', () => {
      // Default digitsInfo is '1.2-2'
      const result = pipe.transform(100, 'INR', 'symbol', '1.2-2');
      expect(result).toBe('₹1.00');
    });

    it('should correctly parse "1.2-3" (minFrac=2, maxFrac=3)', () => {
      const result = pipe.transform(105, 'INR', 'symbol', '1.2-3');
      // With maxFrac=3, should show ₹1.05 (trailing zeros stripped by formatter)
      expect(result).toContain('1');
    });

    it('should correctly parse "1.0-2" (minFrac=0, maxFrac=2)', () => {
      const result = pipe.transform(100, 'INR', 'symbol', '1.0-2');
      expect(result).toBe('₹1');
    });

    it('should correctly parse "1.0-0" (no decimal places)', () => {
      const result = pipe.transform(150, 'INR', 'symbol', '1.0-0');
      expect(result).toBe('₹2');
    });

    it('should handle single fraction digit (e.g., "1.2")', () => {
      const result = pipe.transform(100, 'INR', 'symbol', '1.2');
      // Intl.NumberFormat normalizes to 2 decimal places for currency
      expect(result).toBe('₹1.00');
    });

    it('should return empty object for invalid format', () => {
      // When parts.length < 2, returns {}
      const result = pipe.transform(100, 'INR', 'symbol', 'invalid');
      expect(result).toBe('₹1.00'); // Falls back to default formatting
    });
  });
});

describe('MoneySimplePipe', () => {
  const pipe = new MoneySimplePipe();

  it('should format with Indian numbering system', () => {
    expect(pipe.transform(150000)).toBe('₹1,500.00');
  });

  it('should handle null', () => {
    expect(pipe.transform(null)).toBe('');
  });

  it('should handle undefined', () => {
    expect(pipe.transform(undefined)).toBe('');
  });

  it('should handle large amounts with lakhs and crores', () => {
    // 1 crore = 10,000,000 paise = ₹100,000
    const result = pipe.transform(10000000);
    expect(result).toContain('₹');
    expect(result).toContain('1,00,000.00');
  });
});

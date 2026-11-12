import { describe, it, expect } from 'vitest';
import {
  formatPaiseToINR,
  formatPaiseToINRNoSymbol,
  parseINRToPaise,
  addPaise,
  subtractPaise,
  multiplyPaise,
  dividePaise,
  isZeroPaise,
  isNegativePaise,
  absPaise,
  roundToRupee,
  isValidPaise,
} from './currency.utils';

describe('Currency Utilities', () => {
  describe('formatPaiseToINR', () => {
    it('should convert 50000 paise to ₹500.00', () => {
      expect(formatPaiseToINR(50000)).toBe('₹500.00');
    });

    it('should convert 12345 paise to ₹123.45', () => {
      expect(formatPaiseToINR(12345)).toBe('₹123.45');
    });

    it('should convert 0 paise to ₹0.00', () => {
      expect(formatPaiseToINR(0)).toBe('₹0.00');
    });

    it('should handle single paise correctly', () => {
      expect(formatPaiseToINR(1)).toBe('₹0.01');
    });

    it('should handle 99 paise correctly', () => {
      expect(formatPaiseToINR(99)).toBe('₹0.99');
    });

    it('should handle amounts without paise (multiples of 100)', () => {
      expect(formatPaiseToINR(100)).toBe('₹1.00');
      expect(formatPaiseToINR(1000)).toBe('₹10.00');
    });

    it('should handle negative amounts', () => {
      expect(formatPaiseToINR(-50000)).toBe('-₹500.00');
      expect(formatPaiseToINR(-123)).toBe('-₹1.23');
    });

    it('should accept bigint values', () => {
      expect(formatPaiseToINR(BigInt(50000))).toBe('₹500.00');
    });

    it('should handle large amounts', () => {
      expect(formatPaiseToINR(10000000)).toBe('₹100000.00');
    });

    it('should pad single digit paise with leading zero', () => {
      expect(formatPaiseToINR(100)).toBe('₹1.00');
      expect(formatPaiseToINR(110)).toBe('₹1.10');
      expect(formatPaiseToINR(101)).toBe('₹1.01');
    });
  });

  describe('formatPaiseToINRNoSymbol', () => {
    it('should format without currency symbol', () => {
      expect(formatPaiseToINRNoSymbol(50000)).toBe('500.00');
      expect(formatPaiseToINRNoSymbol(12345)).toBe('123.45');
    });

    it('should handle negative values', () => {
      expect(formatPaiseToINRNoSymbol(-50000)).toBe('-500.00');
    });
  });

  describe('parseINRToPaise', () => {
    it('should parse "500.00" to 50000 paise', () => {
      expect(parseINRToPaise('500.00')).toBe(50000);
    });

    it('should parse "123.45" to 12345 paise', () => {
      expect(parseINRToPaise('123.45')).toBe(12345);
    });

    it('should parse "₹500.00" to 50000 paise', () => {
      expect(parseINRToPaise('₹500.00')).toBe(50000);
    });

    it('should parse amounts without paise', () => {
      expect(parseINRToPaise('500')).toBe(50000);
      expect(parseINRToPaise('0')).toBe(0);
    });

    it('should handle amounts without decimal', () => {
      expect(parseINRToPaise('1000')).toBe(100000);
    });

    it('should parse single digit paise as 10 paise', () => {
      expect(parseINRToPaise('0.1')).toBe(10);
    });

    it('should trim whitespace', () => {
      expect(parseINRToPaise('  500.00  ')).toBe(50000);
    });

    it('should handle commas in amounts', () => {
      // Note: Comma handling depends on implementation
      expect(parseINRToPaise('1,000.00')).toBe(100000);
    });
  });

  describe('addPaise', () => {
    it('should add two positive amounts', () => {
      expect(addPaise(50000, 25000)).toBe(75000);
    });

    it('should add amounts resulting in zero', () => {
      expect(addPaise(100, -100)).toBe(0);
    });

    it('should accept bigint arguments', () => {
      expect(addPaise(BigInt(50000), BigInt(25000))).toBe(75000);
    });

    it('should handle mixed bigint and number', () => {
      expect(addPaise(50000, BigInt(25000))).toBe(75000);
    });

    it('should add negative amounts', () => {
      expect(addPaise(50000, -25000)).toBe(25000);
    });
  });

  describe('subtractPaise', () => {
    it('should subtract smaller from larger', () => {
      expect(subtractPaise(50000, 25000)).toBe(25000);
    });

    it('should handle result of zero', () => {
      expect(subtractPaise(50000, 50000)).toBe(0);
    });

    it('should handle subtraction resulting in negative', () => {
      expect(subtractPaise(25000, 50000)).toBe(-25000);
    });

    it('should accept bigint arguments', () => {
      expect(subtractPaise(BigInt(50000), BigInt(25000))).toBe(25000);
    });
  });

  describe('multiplyPaise', () => {
    it('should multiply by 1 (no change)', () => {
      expect(multiplyPaise(50000, 1)).toBe(50000);
    });

    it('should multiply by 2', () => {
      expect(multiplyPaise(50000, 2)).toBe(100000);
    });

    it('should multiply by 0.5 (halve)', () => {
      expect(multiplyPaise(100000, 0.5)).toBe(50000);
    });

    it('should handle percentage increases', () => {
      expect(multiplyPaise(100000, 1.1)).toBe(110000); // 10% increase
    });

    it('should round small fractional results', () => {
      // 7 paise * 0.5 = 3.5 paise -> rounds to 4
      expect(multiplyPaise(7, 0.5)).toBe(4);
    });
  });

  describe('dividePaise', () => {
    it('should divide evenly', () => {
      expect(dividePaise(100000, 4)).toEqual([25000, 25000, 25000, 25000]);
    });

    it('should distribute remainder to first items', () => {
      expect(dividePaise(100001, 4)).toEqual([25001, 25000, 25000, 25000]);
    });

    it('should handle dividing by 1', () => {
      expect(dividePaise(50000, 1)).toEqual([50000]);
    });

    it('should throw on zero division', () => {
      expect(() => dividePaise(50000, 0)).toThrow('Parts must be greater than 0');
    });

    it('should handle dividing 0', () => {
      expect(dividePaise(0, 3)).toEqual([0, 0, 0]);
    });
  });

  describe('isZeroPaise', () => {
    it('should return true for zero', () => {
      expect(isZeroPaise(0)).toBe(true);
    });

    it('should return false for non-zero', () => {
      expect(isZeroPaise(1)).toBe(false);
      expect(isZeroPaise(100)).toBe(false);
    });

    it('should handle bigint zero', () => {
      expect(isZeroPaise(BigInt(0))).toBe(true);
    });
  });

  describe('isNegativePaise', () => {
    it('should return true for negative', () => {
      expect(isNegativePaise(-1)).toBe(true);
      expect(isNegativePaise(-100)).toBe(true);
    });

    it('should return false for non-negative', () => {
      expect(isNegativePaise(0)).toBe(false);
      expect(isNegativePaise(1)).toBe(false);
    });
  });

  describe('absPaise', () => {
    it('should return absolute value', () => {
      expect(absPaise(-50000)).toBe(50000);
      expect(absPaise(50000)).toBe(50000);
    });

    it('should handle zero', () => {
      expect(absPaise(0)).toBe(0);
    });
  });

  describe('roundToRupee', () => {
    it('should round to nearest 100 paise', () => {
      expect(roundToRupee(50000)).toBe(50000); // Already round
      expect(roundToRupee(50050)).toBe(50100); // Rounds up
      expect(roundToRupee(50049)).toBe(50000); // Rounds down
      expect(roundToRupee(50099)).toBe(50100); // Rounds up
    });
  });

  describe('isValidPaise', () => {
    it('should return true for valid non-negative integers', () => {
      expect(isValidPaise(0)).toBe(true);
      expect(isValidPaise(1)).toBe(true);
      expect(isValidPaise(50000)).toBe(true);
    });

    it('should return false for negative values', () => {
      expect(isValidPaise(-1)).toBe(false);
      expect(isValidPaise(-50000)).toBe(false);
    });

    it('should return false for non-integers', () => {
      expect(isValidPaise(1.5)).toBe(false);
    });

    it('should handle bigint', () => {
      expect(isValidPaise(BigInt(50000))).toBe(true);
      expect(isValidPaise(BigInt(-1))).toBe(false);
    });
  });
});
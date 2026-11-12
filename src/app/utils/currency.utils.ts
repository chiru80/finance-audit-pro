/**
 * Currency Utilities for Finance Audit Pro
 *
 * All monetary values are stored as paise (integer) to avoid floating-point errors.
 * 1 INR = 100 paise
 *
 * Business Rules (from PRODUCT_BRIEF):
 * - Store currency as integer paise using PostgreSQL BIGINT
 * - Do not use floating-point arithmetic for money
 */

/**
 * Convert paise (integer) to INR string format
 * Uses integer arithmetic only - no floating point
 *
 * @param paise - Amount in paise (e.g., 50000 = 500.00 INR)
 * @returns Formatted INR string (e.g., "₹500.00")
 *
 * @example
 * formatPaiseToINR(50000) // Returns "₹500.00"
 * formatPaiseToINR(12345)  // Returns "₹123.45"
 * formatPaiseToINR(0)      // Returns "₹0.00"
 */
export function formatPaiseToINR(paise: number | bigint): string {
  const paiseNum = typeof paise === 'bigint' ? Number(paise) : paise;

  // Handle negative amounts
  const isNegative = paiseNum < 0;
  const absPaise = Math.abs(paiseNum);

  const rupees = Math.floor(absPaise / 100);
  const paisePart = absPaise % 100;

  const formattedPaise = paisePart.toString().padStart(2, '0');
  const result = `${rupees}.${formattedPaise}`;

  return isNegative ? `-₹${result}` : `₹${result}`;
}

/**
 * Format paise for display without the currency symbol
 *
 * @param paise - Amount in paise
 * @returns Formatted string (e.g., "500.00")
 */
export function formatPaiseToINRNoSymbol(paise: number | bigint): string {
  const paiseNum = typeof paise === 'bigint' ? Number(paise) : paise;

  const isNegative = paiseNum < 0;
  const absPaise = Math.abs(paiseNum);

  const rupees = Math.floor(absPaise / 100);
  const paisePart = absPaise % 100;

  const formattedPaise = paisePart.toString().padStart(2, '0');
  const result = `${rupees}.${formattedPaise}`;

  return isNegative ? `-${result}` : result;
}

/**
 * Convert INR string to paise (integer)
 *
 * @param inrString - INR amount as string (e.g., "500.00", "123.45")
 * @returns Amount in paise (e.g., 50000, 12345)
 *
 * @example
 * parseINRToPaise("500.00") // Returns 50000
 * parseINRToPaise("123.45") // Returns 12345
 */
export function parseINRToPaise(inrString: string): number {
  // Remove currency symbol if present and whitespace
  const cleaned = inrString.replace(/[₹,\s]/g, '').trim();

  // Split into rupees and paise parts
  const parts = cleaned.split('.');
  const rupees = parseInt(parts[0] || '0', 10);
  const paiseStr = parts[1] || '0';

  // Handle different paise representations
  let paise = 0;
  if (paiseStr.length === 1) {
    // Single digit paise (e.g., ".5") means 50 paise
    paise = parseInt(paiseStr + '0', 10);
  } else if (paiseStr.length >= 2) {
    paise = parseInt(paiseStr.substring(0, 2), 10);
  }

  const totalPaise = rupees * 100 + paise;
  return totalPaise;
}

/**
 * Add paise amounts using integer arithmetic
 *
 * @param a - First amount in paise
 * @param b - Second amount in paise
 * @returns Sum in paise
 */
export function addPaise(a: number | bigint, b: number | bigint): number {
  const aNum = typeof a === 'bigint' ? Number(a) : a;
  const bNum = typeof b === 'bigint' ? Number(b) : b;
  return aNum + bNum;
}

/**
 * Subtract paise amounts using integer arithmetic
 *
 * @param a - First amount in paise (minuend)
 * @param b - Second amount in paise (subtrahend)
 * @returns Difference in paise (a - b)
 */
export function subtractPaise(a: number | bigint, b: number | bigint): number {
  const aNum = typeof a === 'bigint' ? Number(a) : a;
  const bNum = typeof b === 'bigint' ? Number(b) : b;
  return aNum - bNum;
}

/**
 * Multiply paise by a factor (for interest, discounts, etc.)
 * Results are rounded to nearest paise
 *
 * @param paise - Amount in paise
 * @param factor - Multiplication factor (e.g., 1.05 for 5% increase)
 * @returns Result in paise, rounded
 */
export function multiplyPaise(paise: number | bigint, factor: number): number {
  const paiseNum = typeof paise === 'bigint' ? Number(paise) : paise;
  // Use integer arithmetic: multiply by factor numerator, divide by denominator
  // For common factors like 1.05 = 105/100
  const numerator = Math.round(factor * 10000); // Scale to 5 decimal places
  const result = Math.round((paiseNum * numerator) / 10000);
  return result;
}

/**
 * Divide paise amount equally among N parts
 *
 * @param paise - Total amount in paise
 * @param parts - Number of parts to divide into
 * @returns Array of paise amounts (sum equals original)
 */
export function dividePaise(paise: number | bigint, parts: number): number[] {
  if (parts <= 0) {
    throw new Error('Parts must be greater than 0');
  }

  const paiseNum = typeof paise === 'bigint' ? Number(paise) : paise;
  const baseAmount = Math.floor(paiseNum / parts);
  const remainder = paiseNum % parts;

  // Distribute remainder to first 'remainder' items
  const result: number[] = [];
  for (let i = 0; i < parts; i++) {
    result.push(baseAmount + (i < remainder ? 1 : 0));
  }

  return result;
}

/**
 * Check if a paise amount is zero
 *
 * @param paise - Amount in paise
 * @returns true if zero, false otherwise
 */
export function isZeroPaise(paise: number | bigint): boolean {
  const paiseNum = typeof paise === 'bigint' ? Number(paise) : paise;
  return paiseNum === 0;
}

/**
 * Check if a paise amount is negative
 *
 * @param paise - Amount in paise
 * @returns true if negative, false otherwise
 */
export function isNegativePaise(paise: number | bigint): boolean {
  const paiseNum = typeof paise === 'bigint' ? Number(paise) : paise;
  return paiseNum < 0;
}

/**
 * Absolute value of paise amount
 *
 * @param paise - Amount in paise
 * @returns Absolute value in paise
 */
export function absPaise(paise: number | bigint): number {
  const paiseNum = typeof paise === 'bigint' ? Number(paise) : paise;
  return Math.abs(paiseNum);
}

/**
 * Round paise to nearest whole rupee (for display purposes)
 *
 * @param paise - Amount in paise
 * @returns Amount in paise, rounded to 100
 */
export function roundToRupee(paise: number | bigint): number {
  const paiseNum = typeof paise === 'bigint' ? Number(paise) : paise;
  return Math.round(paiseNum / 100) * 100;
}

/**
 * Validate paise amount
 *
 * @param paise - Amount to validate
 * @returns true if valid (non-negative integer for most financial operations)
 */
export function isValidPaise(paise: number | bigint): boolean {
  const paiseNum = typeof paise === 'bigint' ? Number(paise) : paise;
  return Number.isInteger(paiseNum) && paiseNum >= 0;
}
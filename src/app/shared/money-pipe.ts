import type { PipeTransform } from '@angular/core';
import { Pipe } from '@angular/core';

/**
 * Formats integer paise as INR currency. This is the single paise -> rupee
 * conversion point for template display; services must pass raw paise.
 * Usage: {{ amountInPaise | money }}
 * Example: 150000 -> ₹1,500.00
 */
@Pipe({
  name: 'money',
  standalone: true,
  pure: true,
})
export class MoneyPipe implements PipeTransform {
  /**
   * Transform amount from paise to INR formatted string
   * @param value - Amount in paise
   * @param currency - Currency code (default: 'INR')
   * @param display - 'code', 'symbol', or 'name' (default: 'symbol')
   * @param digitsInfo - Decimal digits info (default: '1.2-2')
   */
  transform(
    value: number | string | null | undefined,
    currency: string = 'INR',
    display: 'code' | 'symbol' | 'name' = 'symbol',
    digitsInfo: string = '1.2-2',
  ): string {
    if (value === null || value === undefined) {
      return '';
    }

    const numValue = typeof value === 'number' ? value : parseFloat(value);

    if (isNaN(numValue)) {
      return '';
    }

    // Single paise -> rupee conversion for display.
    const rupeeValue = numValue / 100;

    // Format as INR
    try {
      return new Intl.NumberFormat('en-IN', {
        style: 'currency',
        currency: currency,
        currencyDisplay: display,
        ...this.parseDigitsInfo(digitsInfo),
      }).format(rupeeValue);
    } catch (e) {
      // Fallback to manual formatting
      return `₹${rupeeValue.toFixed(2)}`;
    }
  }

  /**
   * Parse digits info string
   * @param digitsInfo - e.g., '1.2-2' for minimumIntegerDigits.fractionDigits-minFractionDigits
   */
  private parseDigitsInfo(digitsInfo: string): {
    minimumFractionDigits?: number;
    maximumFractionDigits?: number;
  } {
    const parts = digitsInfo.split('.');
    if (parts.length < 2) {
      return {};
    }

    const fractionParts = parts[1].split('-');
    const result: { minimumFractionDigits?: number; maximumFractionDigits?: number } = {};

    if (fractionParts.length >= 1) {
      result.minimumFractionDigits = parseInt(fractionParts[0] || '0', 10);
    }
    if (fractionParts.length >= 2) {
      result.maximumFractionDigits = parseInt(fractionParts[1], 10);
    }

    return result;
  }
}

/**
 * Simple pipe for basic INR formatting from paise.
 * Usage: {{ amountInPaise | moneySimple }}
 * Example: 150000 -> ₹1,500.00
 */
@Pipe({
  name: 'moneySimple',
  standalone: true,
  pure: true,
})
export class MoneySimplePipe implements PipeTransform {
  transform(value: number | string | null | undefined): string {
    if (value === null || value === undefined) {
      return '';
    }

    const numValue = typeof value === 'number' ? value : parseFloat(value);

    if (isNaN(numValue)) {
      return '';
    }

    const rupeeValue = numValue / 100;

    // Format with Indian numbering system (lakhs, crores)
    return `₹${this.formatIndian(rupeeValue)}`;
  }

  private formatIndian(num: number): string {
    const parts = num.toFixed(2).split('.');
    const integerPart = parts[0];
    const decimalPart = parts[1];

    let formatted = '';
    let i = integerPart.length;

    if (i <= 3) {
      formatted = integerPart;
    } else {
      let lastThree = integerPart.slice(-3);
      let remaining = integerPart.slice(0, -3);

      // Format the remaining part with commas every 2 digits
      let formattedRemaining = '';
      while (remaining.length > 2) {
        formattedRemaining = ',' + remaining.slice(-2) + formattedRemaining;
        remaining = remaining.slice(0, -2);
      }
      formattedRemaining = remaining + formattedRemaining;

      formatted = formattedRemaining + ',' + lastThree;
    }

    return `${formatted}.${decimalPart}`;
  }
}

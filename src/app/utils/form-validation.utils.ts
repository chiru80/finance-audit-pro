/**
 * Form Validation Utilities for Finance Audit Pro
 *
 * Provides validation for customer forms and collection/payment entry forms
 */

/**
 * Validation result interface
 */
export interface ValidationResult {
  valid: boolean;
  errors: string[];
}

/**
 * Customer form validation
 */
export interface CustomerFormData {
  name: string;
  phone?: string;
  email?: string;
  address?: string;
  enrollmentDate?: string; // ISO date string
  weeklyDueAmount: number; // in paise
}

/**
 * Validate customer form data
 *
 * @param data - Customer form data to validate
 * @returns Validation result
 */
export function validateCustomerForm(data: CustomerFormData): ValidationResult {
  const errors: string[] = [];

  // Name is required and must not be empty/whitespace
  if (!data.name || data.name.trim().length === 0) {
    errors.push('Customer name is required');
  } else if (data.name.trim().length < 2) {
    errors.push('Customer name must be at least 2 characters');
  }

  // Weekly due amount is required and must be positive
  if (data.weeklyDueAmount === undefined || data.weeklyDueAmount === null) {
    errors.push('Weekly due amount is required');
  } else if (data.weeklyDueAmount <= 0) {
    errors.push('Weekly due amount must be greater than 0');
  }

  // Phone validation (optional field)
  if (data.phone !== undefined && data.phone !== '') {
    const phoneErrors = validatePhoneNumber(data.phone);
    errors.push(...phoneErrors);
  }

  // Email validation (optional field)
  if (data.email !== undefined && data.email !== '') {
    const emailErrors = validateEmail(data.email);
    errors.push(...emailErrors);
  }

  // Enrollment date validation (optional field)
  if (data.enrollmentDate !== undefined && data.enrollmentDate !== '') {
    const dateErrors = validateDate(data.enrollmentDate);
    errors.push(...dateErrors);
  }

  return {
    valid: errors.length === 0,
    errors,
  };
}

/**
 * Validate phone number
 * Indian phone number format: +91 XXX XXX XXXX or XXX-XXXXXXX
 *
 * @param phone - Phone number string
 * @returns Array of error messages (empty if valid)
 */
export function validatePhoneNumber(phone: string): string[] {
  const errors: string[] = [];

  // Remove spaces and hyphens for validation
  const cleaned = phone.replace(/[\s\-]/g, '');

  // Check for valid Indian phone number patterns
  // +91 followed by 10 digits, or just 10 digits
  const validPatterns = [
    /^\+91\d{10}$/, // +91XXXXXXXXXX
    /^91\d{10}$/, // 91XXXXXXXXXX
    /^\d{10}$/, // XXXXXXXXXX
  ];

  const isValid = validPatterns.some((pattern) => pattern.test(cleaned));

  if (!isValid) {
    errors.push('Invalid phone number format (expected: +91 XXXXX XXXXX or 10 digits)');
  }

  // Check if first digit is valid (6-9 for Indian mobile numbers)
  const firstDigit = cleaned.replace(/[^0-9]/g, '')[0];
  if (firstDigit && !['6', '7', '8', '9'].includes(firstDigit)) {
    errors.push('Phone number must start with 6, 7, 8, or 9');
  }

  return errors;
}

/**
 * Validate email address
 *
 * @param email - Email string
 * @returns Array of error messages (empty if valid)
 */
export function validateEmail(email: string): string[] {
  const errors: string[] = [];

  if (email.length === 0) {
    errors.push('Email is required');
    return errors;
  }

  // Basic email regex
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

  if (!emailRegex.test(email)) {
    errors.push('Invalid email format');
  }

  if (email.length > 254) {
    errors.push('Email must be less than 254 characters');
  }

  return errors;
}

/**
 * Validate date string
 *
 * @param date - Date string (ISO format YYYY-MM-DD)
 * @returns Array of error messages (empty if valid)
 */
export function validateDate(date: string): string[] {
  const errors: string[] = [];

  // Check format YYYY-MM-DD
  const dateRegex = /^\d{4}-\d{2}-\d{2}$/;
  if (!dateRegex.test(date)) {
    errors.push('Invalid date format (expected: YYYY-MM-DD)');
    return errors;
  }

  // Check if it's a valid date
  const parsedDate = new Date(date);
  if (isNaN(parsedDate.getTime())) {
    errors.push('Invalid date');
  }

  // Check if date is not in the future
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  if (parsedDate > today) {
    errors.push('Enrollment date cannot be in the future');
  }

  return errors;
}

/**
 * Payment/Collection Entry Form Data
 */
export interface PaymentFormData {
  customerId: string;
  amount: number; // in paise
  paymentMethod: 'cash' | 'online' | 'cheque' | 'other';
  reference?: string;
  paymentDate: string; // ISO date string
  notes?: string;
  idempotencyKey?: string; // For preventing duplicates
}

/**
 * Validate payment form data
 *
 * @param data - Payment form data to validate
 * @returns Validation result
 */
export function validatePaymentForm(data: PaymentFormData): ValidationResult {
  const errors: string[] = [];

  // Customer ID is required
  if (!data.customerId || data.customerId.trim().length === 0) {
    errors.push('Customer is required');
  }

  // Amount is required and must be positive
  if (data.amount === undefined || data.amount === null) {
    errors.push('Payment amount is required');
  } else if (data.amount <= 0) {
    errors.push('Payment amount must be greater than 0');
  }

  // Payment method is required
  if (!data.paymentMethod) {
    errors.push('Payment method is required');
  }

  // Payment date is required and must be valid
  if (!data.paymentDate || data.paymentDate.trim().length === 0) {
    errors.push('Payment date is required');
  } else {
    const dateErrors = validateDate(data.paymentDate);
    errors.push(...dateErrors);
  }

  // Reference validation based on payment method
  if (data.paymentMethod === 'online' && (!data.reference || data.reference.trim().length === 0)) {
    errors.push('Transaction reference is required for online payments');
  }

  if (data.paymentMethod === 'cheque' && (!data.reference || data.reference.trim().length === 0)) {
    errors.push('Cheque number is required for cheque payments');
  }

  return {
    valid: errors.length === 0,
    errors,
  };
}

/**
 * Validate weekly schedule generation parameters
 *
 * @param weeksCount - Number of weeks to generate
 * @returns Validation result
 */
export function validateScheduleGeneration(weeksCount: number): ValidationResult {
  const errors: string[] = [];

  if (weeksCount === undefined || weeksCount === null) {
    errors.push('Number of weeks is required');
  } else if (!Number.isInteger(weeksCount)) {
    errors.push('Number of weeks must be an integer');
  } else if (weeksCount < 1) {
    errors.push('Number of weeks must be at least 1');
  } else if (weeksCount > 52) {
    errors.push('Number of weeks cannot exceed 52');
  }

  return {
    valid: errors.length === 0,
    errors,
  };
}

/**
 * Absence form validation
 */
export interface AbsenceFormData {
  customerId: string;
  weekStartDate: string; // ISO date string
  reason?: string;
}

/**
 * Validate absence form data
 *
 * @param data - Absence form data to validate
 * @returns Validation result
 */
export function validateAbsenceForm(data: AbsenceFormData): ValidationResult {
  const errors: string[] = [];

  // Customer ID is required
  if (!data.customerId || data.customerId.trim().length === 0) {
    errors.push('Customer is required');
  }

  // Week start date is required
  if (!data.weekStartDate || data.weekStartDate.trim().length === 0) {
    errors.push('Week start date is required');
  } else {
    const dateErrors = validateDate(data.weekStartDate);
    errors.push(...dateErrors);

    // Validate it's a Monday (week start)
    const date = new Date(data.weekStartDate);
    if (!isNaN(date.getTime()) && date.getDay() !== 1) {
      errors.push('Week start date must be a Monday');
    }
  }

  return {
    valid: errors.length === 0,
    errors,
  };
}

/**
 * Online payment reconciliation validation
 */
export interface OnlinePaymentReconciliationData {
  transactionId: string;
  gateway: 'razorpay' | 'paytm' | 'cashfree' | 'other';
  amount: number; // in paise
  customerId: string;
}

/**
 * Validate online payment reconciliation data
 *
 * @param data - Online payment data to validate
 * @returns Validation result
 */
export function validateOnlinePaymentReconciliation(
  data: OnlinePaymentReconciliationData,
): ValidationResult {
  const errors: string[] = [];

  // Transaction ID is required
  if (!data.transactionId || data.transactionId.trim().length === 0) {
    errors.push('Transaction ID is required');
  }

  // Gateway is required
  if (!data.gateway) {
    errors.push('Payment gateway is required');
  }

  // Amount is required and must be positive
  if (data.amount === undefined || data.amount === null) {
    errors.push('Amount is required');
  } else if (data.amount <= 0) {
    errors.push('Amount must be greater than 0');
  }

  // Customer ID is required
  if (!data.customerId || data.customerId.trim().length === 0) {
    errors.push('Customer is required');
  }

  return {
    valid: errors.length === 0,
    errors,
  };
}

/**
 * Validate amount for display (formatted)
 *
 * @param amount - Amount string to validate
 * @returns Validation result
 */
export function validateAmountString(amount: string): ValidationResult {
  const errors: string[] = [];

  if (!amount || amount.trim().length === 0) {
    errors.push('Amount is required');
    return { valid: false, errors };
  }

  // Check if it's a valid number
  const num = parseFloat(amount);
  if (isNaN(num)) {
    errors.push('Amount must be a valid number');
  }

  if (num <= 0) {
    errors.push('Amount must be greater than 0');
  }

  // Check for excessive decimal places (max 2 for currency)
  if (!isNaN(num)) {
    const decimalPlaces = amount.split('.')[1]?.length || 0;
    if (decimalPlaces > 2) {
      errors.push('Amount cannot have more than 2 decimal places');
    }
  }

  return {
    valid: errors.length === 0,
    errors,
  };
}
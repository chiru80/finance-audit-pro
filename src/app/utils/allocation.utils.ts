/**
 * Payment Allocation Utilities for Finance Audit Pro
 *
 * Business Rules (from PRODUCT_BRIEF and database schema):
 * - Store currency as integer paise
 * - Payment allocation: FIFO (Oldest unpaid week first)
 * - Partial payments ARE allowed
 * - Excess payment above total dues is held as customer credit, never discarded
 * - Weekly due amount charged regardless of absence
 * - Absence requires owner approval (status: pending/approved/rejected)
 */

/**
 * Represents a weekly schedule entry
 */
export interface WeeklySchedule {
  id: string;
  weekStartDate: Date;
  weekEndDate: Date;
  dueDate: Date;
  dueAmount: number; // in paise
  paid: boolean;
  paymentId: string | null;
  absenceRecorded: boolean;
  absenceApproved: boolean | null; // null = pending, true = approved, false = rejected
}

/**
 * Partial fields for WeeklySchedule - used in test helpers
 * Note: Use this for creating test schedules, not the full type
 */
export interface PartialWeeklySchedule {
  weekStartDate?: Date;
  weekEndDate?: Date;
  dueDate?: Date;
  dueAmount?: number;
  paid?: boolean;
  paymentId?: string | null;
  absenceRecorded?: boolean;
  absenceApproved?: boolean | null;
}

/**
 * Represents a payment allocation
 */
export interface PaymentAllocation {
  paymentId: string;
  scheduleId: string;
  amount: number; // in paise
  allocatedAt: Date;
}

/**
 * Result of payment allocation
 */
export interface AllocationResult {
  allocationCount: number;
  totalAllocated: number; // in paise
  creditAmount: number; // unspent paise held as credit
  allocations: PaymentAllocation[];
}

/**
 * FIFO Payment Allocation
 *
 * Allocates payment to unpaid weekly schedules in FIFO order (oldest first)
 * Partial payments are supported - schedules marked paid only when fully covered
 * Excess payments remain as credit
 *
 * @param paymentId - The payment being allocated
 * @param paymentAmount - Payment amount in paise
 * @param schedules - Array of weekly schedules (should be sorted by dueDate ASC)
 * @returns Allocation result with count, allocated amount, and credit
 *
 * @example
 * const schedules = [
 *   { id: 's1', dueAmount: 50000, paid: false, ... },
 *   { id: 's2', dueAmount: 50000, paid: false, ... },
 * ];
 * allocatePaymentFIFO('p1', 80000, schedules);
 * // Result: s1 fully paid (50000), s2 partially paid (30000), credit = 0
 */
export function allocatePaymentFIFO(
  paymentId: string,
  paymentAmount: number,
  schedules: WeeklySchedule[],
): AllocationResult {
  const allocations: PaymentAllocation[] = [];
  let remainingAmount = paymentAmount;
  let totalAllocated = 0;

  // Sort schedules by dueDate (oldest first) - FIFO
  const sortedSchedules = [...schedules].sort(
    (a, b) => a.dueDate.getTime() - b.dueDate.getTime(),
  );

  for (const schedule of sortedSchedules) {
    if (remainingAmount <= 0) {
      break;
    }

    // Skip already paid schedules
    if (schedule.paid) {
      continue;
    }

    // Skip schedules with zero due amount
    if (schedule.dueAmount <= 0) {
      continue;
    }

    // Calculate allocation amount for this schedule
    const allocateAmount = Math.min(remainingAmount, schedule.dueAmount);

    // Create allocation record
    allocations.push({
      paymentId,
      scheduleId: schedule.id,
      amount: allocateAmount,
      allocatedAt: new Date(),
    });

    totalAllocated += allocateAmount;
    remainingAmount -= allocateAmount;
  }

  return {
    allocationCount: allocations.length,
    totalAllocated,
    creditAmount: remainingAmount,
    allocations,
  };
}

/**
 * Calculate outstanding balance for a customer
 *
 * Balance = Total Due - Total Paid (from allocations)
 *
 * @param totalDue - Sum of all weekly due amounts in paise
 * @param paymentsPaid - Sum of all payment amounts in paise
 * @param allocationsPaid - Sum of amounts allocated to schedules in paise
 * @returns Outstanding balance in paise
 *
 * @example
 * calculateBalance(200000, 180000, 150000);
 * // Result: 50000 (200000 - 150000)
 * // Note: allocationsPaid (150000) is what matters, not total payments
 */
export function calculateBalance(
  totalDue: number,
  paymentsPaid: number,
  allocationsPaid: number,
): number {
  return totalDue - allocationsPaid;
}

/** /**
 * Calculate total outstanding for multiple schedules
 *
 * @param schedules - Array of weekly schedules
 * @returns Total outstanding in paise
 */
export function calculateTotalOutstanding(schedules: WeeklySchedule[]): number {
  return schedules
    .filter((s) => !s.paid && s.dueAmount > 0)
    .reduce((sum, s) => sum + s.dueAmount, 0);
}

/** /
 * Calculate total paid from allocations
 *
 * @param schedules - Array of weekly schedules
 * @returns Total paid in paise
 */
export function calculateTotalPaid(schedules: WeeklySchedule[]): number {
  return schedules
    .filter((s) => s.paid)
    .reduce((sum, s) => sum + s.dueAmount, 0);
}

/**
 * Calculate credit (excess payment held for future use)
 *
 * Credit = Total Payments - Allocated Amounts (for paid schedules only)
 *
 * @param totalPayments - Sum of all payments in paise
 * @param totalAllocated - Sum of allocations applied to schedules in paise
 * @returns Credit amount in paise
 *
 * @example
 * // Customer pays 80000 paise for two 50000 paise dues
 * calculateCredit(80000, 80000); // Returns 0
 *
 * // Customer pays 30000 for two 50000 paise dues
 * calculateCredit(30000, 30000); // Returns 0 (applied to oldest)
 */
export function calculateCredit(totalPayments: number, totalAllocated: number): number {
  return Math.max(0, totalPayments - totalAllocated);
}

/**
 * Process partial payment allocation
 *
 * When a customer makes a partial payment, determines which schedule is partially paid
 * and updates the outstanding amount
 *
 * @param paymentAmount - Payment amount in paise
 * @param currentOutstanding - Current outstanding balance in paise
 * @param nextDueAmount - Amount due for next most recent unpaid schedule in paise
 * @returns Remaining balance after payment
 */
export function processPartialPayment(
  paymentAmount: number,
  currentOutstanding: number,
  nextDueAmount: number,
): {
  appliedAmount: number;
  remainingBalance: number;
  newOutstandingDue: number;
} {
  const appliedAmount = Math.min(paymentAmount, currentOutstanding);
  const remainingBalance = currentOutstanding - appliedAmount;

  // Calculate how much of the next due remains unpaid
  let newOutstandingDue = nextDueAmount;
  if (paymentAmount >= nextDueAmount) {
    newOutstandingDue = 0;
  } else if (paymentAmount > 0) {
    newOutstandingDue = nextDueAmount - paymentAmount;
  }

  return {
    appliedAmount,
    remainingBalance,
    newOutstandingDue,
  };
}

/**
 * Carry forward absence for balance calculation
 *
 * Business Rules:
 * - Weekly due amount is charged regardless of absence
 * - Absence requires owner approval to waive
 * - If absence is approved, the week's due is not charged
 *
 * @param isAbsenceApproved - Whether the absence was approved
 * @param weeklyDue - The weekly due amount in paise
 * @returns Amount that should be charged (0 if absence approved, otherwise full amount)
 */
export function calculateAbsenceImpact(
  isAbsenceApproved: boolean,
  weeklyDue: number,
): number {
  // If absence is approved, no charge for that week
  return isAbsenceApproved ? 0 : weeklyDue;
}

/**
 * Calculate customer balance considering approved absences
 *
 * @param dueSchedules - Array of weekly schedules (may have absence flags)
 * @returns Net balance in paise after accounting for absences
 */
export function calculateBalanceWithAbsences(
  schedules: WeeklySchedule[],
): number {
  let totalDue = 0;

  for (const schedule of schedules) {
    if (schedule.paid) {
      continue;
    }

    // Check if this week should be charged
    // If absence recorded and approved, no charge
    const shouldCharge = !(
      schedule.absenceRecorded && schedule.absenceApproved === true
    );

    if (shouldCharge && schedule.dueAmount > 0) {
      totalDue += schedule.dueAmount;
    }
  }

  return totalDue;
}

/**
 * Validate payment allocation for integrity
 *
 * Checks that allocation doesn't exceed payment and schedules balance correctly
 *
 * @param paymentAmount - Original payment amount in paise
 * @param allocatedAmount - Total allocated amount in paise
 * @param schedules - Array of schedules for this customer
 * @returns Validation result with any errors
 */
export function validateAllocation(
  paymentAmount: number,
  allocatedAmount: number,
  schedules: WeeklySchedule[],
): { valid: boolean; errors: string[] } {
  const errors: string[] = [];

  // Allocated cannot exceed payment
  if (allocatedAmount > paymentAmount) {
    errors.push('Allocated amount cannot exceed payment amount');
  }

  // Calculated paid schedules should match schedule paid status
  const paidFromSchedules = schedules.filter((s) => s.paid).length;
  const allocatedToPaidSchedules = schedules.filter(
    (s) => s.paid && s.dueAmount > 0,
  ).length;

  // Verify each paid schedule has an allocation
  for (const schedule of schedules) {
    if (schedule.paid && schedule.dueAmount > 0) {
      // Check if there's an allocation covering this schedule
      const hasAllocation = schedule.paymentId !== null;
      if (!hasAllocation) {
        errors.push(
          `Schedule ${schedule.id} is marked paid but has no allocation`,
        );
      }
    }
  }

  return { valid: errors.length === 0, errors };
}

/**
 * Check if payment can be allocated (validates ownership, amount, etc.)
 *
 * @param customerId - Customer ID to verify ownership
 * @param paymentId - Payment ID to verify
 * @param paymentAmount - Payment amount in paise
 * @param payments - Array of payments to search
 * @returns true if payment allocation is valid
 */
export function canAllocatePayment(
  customerId: string,
  paymentId: string,
  paymentAmount: number,
  payments: Array<{ id: string; customerId: string; amount: number }>,
): boolean {
  const payment = payments.find((p) => p.id === paymentId);

  if (!payment) {
    return false;
  }

  // Verify ownership
  if (payment.customerId !== customerId) {
    return false;
  }

  // Verify amount match (prevents race conditions)
  if (payment.amount !== paymentAmount) {
    return false;
  }

  return true;
}
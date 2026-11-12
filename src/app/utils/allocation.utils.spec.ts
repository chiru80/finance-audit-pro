import { describe, it, expect, beforeEach } from 'vitest';
import {
  allocatePaymentFIFO,
  calculateBalance,
  calculateTotalOutstanding,
  calculateTotalPaid,
  calculateCredit,
  processPartialPayment,
  calculateAbsenceImpact,
  calculateBalanceWithAbsences,
  validateAllocation,
  canAllocatePayment,
  type WeeklySchedule,
} from './allocation.utils';

describe('Allocation Utilities', () => {
  describe('allocatePaymentFIFO', () => {
    let scheduleCounter = 1;
    beforeEach(() => {
      scheduleCounter = 1;
    });

    // Helper to create a weekly schedule with default values
    const createSchedule = (
      overrides: Partial<WeeklySchedule> = {},
    ): WeeklySchedule => ({
      id: overrides.id ?? `schedule-${scheduleCounter++}`,
      weekStartDate: new Date('2024-01-01'),
      weekEndDate: new Date('2024-01-07'),
      dueDate: new Date('2024-01-01'),
      dueAmount: 50000,
      paid: false,
      paymentId: null,
      absenceRecorded: false,
      absenceApproved: null,
      ...overrides,
    });

    it('should fully allocate payment to single schedule', () => {
      const schedules = [createSchedule({ dueAmount: 50000 })];
      const result = allocatePaymentFIFO('p1', 50000, schedules);

      expect(result.allocationCount).toBe(1);
      expect(result.totalAllocated).toBe(50000);
      expect(result.creditAmount).toBe(0);
      expect(result.allocations).toHaveLength(1);
    });

    it('should allocate to oldest schedule first (FIFO)', () => {
      const schedules = [
        createSchedule({ dueAmount: 50000, dueDate: new Date('2024-01-01') }),
        createSchedule({ dueAmount: 50000, dueDate: new Date('2024-01-08') }),
      ];
      const result = allocatePaymentFIFO('p1', 50000, schedules);

      expect(result.allocationCount).toBe(1);
      expect(result.allocations[0].scheduleId).toBe('schedule-1');
    });

    it('should partially allocate payment when amount is less than due', () => {
      const schedules = [createSchedule({ dueAmount: 50000 })];
      const result = allocatePaymentFIFO('p1', 30000, schedules);

      expect(result.allocationCount).toBe(1);
      expect(result.totalAllocated).toBe(30000);
      expect(result.creditAmount).toBe(0);
    });

    it('should allocate to multiple schedules in FIFO order', () => {
      const schedules = [
        createSchedule({ dueAmount: 50000 }),
        createSchedule({ dueAmount: 50000 }),
        createSchedule({ dueAmount: 50000 }),
      ];
      const result = allocatePaymentFIFO('p1', 80000, schedules);

      expect(result.allocationCount).toBe(2);
      expect(result.totalAllocated).toBe(80000);
      expect(result.creditAmount).toBe(0);
      expect(result.allocations[0].scheduleId).toBe('schedule-1');
      expect(result.allocations[1].scheduleId).toBe('schedule-2');
    });

    it('should allocate excess payment as credit (never discard)', () => {
      const schedules = [
        createSchedule({ dueAmount: 50000 }),
        createSchedule({ dueAmount: 50000 }),
        createSchedule({ dueAmount: 50000 }),
      ];
      const result = allocatePaymentFIFO('p1', 180000, schedules);

      // Total due = 150000, payment = 180000
      expect(result.allocationCount).toBe(3);
      expect(result.totalAllocated).toBe(150000);
      expect(result.creditAmount).toBe(30000); // 180000 - 150000 = 30000 credit
    });

    it('should skip already paid schedules', () => {
      const schedules = [
        createSchedule({ dueAmount: 50000, paid: true }),
        createSchedule({ dueAmount: 50000 }),
      ];
      const result = allocatePaymentFIFO('p1', 50000, schedules);

      expect(result.allocationCount).toBe(1);
      expect(result.allocations[0].scheduleId).toBe('schedule-2');
    });

    it('should skip zero due amount schedules', () => {
      const schedules = [
        createSchedule({ dueAmount: 0 }),
        createSchedule({ dueAmount: 50000 }),
      ];
      const result = allocatePaymentFIFO('p1', 50000, schedules);

      expect(result.allocationCount).toBe(1);
      expect(result.allocations[0].scheduleId).toBe('schedule-2');
    });

    it('should return zero allocations for empty schedules', () => {
      const result = allocatePaymentFIFO('p1', 50000, []);

      expect(result.allocationCount).toBe(0);
      expect(result.totalAllocated).toBe(0);
      expect(result.creditAmount).toBe(50000);
      expect(result.allocations).toHaveLength(0);
    });

    it('should return credit equal to payment when no unpaid schedules', () => {
      const schedules = [createSchedule({ dueAmount: 50000, paid: true })];
      const result = allocatePaymentFIFO('p1', 50000, schedules);

      expect(result.allocationCount).toBe(0);
      expect(result.creditAmount).toBe(50000);
    });

    it('should sort schedules by dueDate ascending (oldest first)', () => {
      const schedules = [
        createSchedule({ dueAmount: 50000, dueDate: new Date('2024-01-15') }),
        createSchedule({ dueAmount: 50000, dueDate: new Date('2024-01-01') }),
        createSchedule({ dueAmount: 50000, dueDate: new Date('2024-01-08') }),
      ];
      const result = allocatePaymentFIFO('p1', 50000, schedules);

      // First allocation should be to the oldest schedule (schedule-2, Jan 1)
      expect(result.allocations[0].scheduleId).toBe('schedule-2');
    });
  });

  describe('calculateBalance', () => {
    it('should calculate correct outstanding balance', () => {
      expect(calculateBalance(200000, 180000, 150000)).toBe(50000);
    });

    it('should return zero when fully paid', () => {
      expect(calculateBalance(150000, 150000, 150000)).toBe(0);
    });

    it('should return positive when not fully paid', () => {
      expect(calculateBalance(200000, 150000, 100000)).toBe(100000);
    });
  });

  describe('calculateTotalOutstanding', () => {
    const createSchedule = (
      overrides: Partial<{ paid: boolean; dueAmount: number }> = {},
    ): WeeklySchedule => ({
      id: 's1',
      weekStartDate: new Date(),
      weekEndDate: new Date(),
      dueDate: new Date(),
      dueAmount: 50000,
      paid: false,
      paymentId: null,
      absenceRecorded: false,
      absenceApproved: null,
      ...overrides,
    });

    it('should sum unpaid schedules with positive due amounts', () => {
      const schedules = [
        createSchedule({ dueAmount: 50000, paid: false }),
        createSchedule({ dueAmount: 30000, paid: false }),
        createSchedule({ dueAmount: 20000, paid: true }), // paid - not counted
        createSchedule({ dueAmount: 0, paid: false }), // zero due - not counted
      ];

      expect(calculateTotalOutstanding(schedules)).toBe(80000);
    });

    it('should return zero for all paid schedules', () => {
      const schedules = [
        createSchedule({ dueAmount: 50000, paid: true }),
        createSchedule({ dueAmount: 30000, paid: true }),
      ];

      expect(calculateTotalOutstanding(schedules)).toBe(0);
    });

    it('should return zero for empty schedules', () => {
      expect(calculateTotalOutstanding([])).toBe(0);
    });
  });

  describe('calculateTotalPaid', () => {
    const createSchedule = (
      overrides: Partial<{ paid: boolean; dueAmount: number }> = {},
    ): WeeklySchedule => ({
      id: 's1',
      weekStartDate: new Date(),
      weekEndDate: new Date(),
      dueDate: new Date(),
      dueAmount: 50000,
      paid: false,
      paymentId: null,
      absenceRecorded: false,
      absenceApproved: null,
      ...overrides,
    });

    it('should sum paid schedules', () => {
      const schedules = [
        createSchedule({ dueAmount: 50000, paid: true }),
        createSchedule({ dueAmount: 30000, paid: true }),
        createSchedule({ dueAmount: 20000, paid: false }), // not paid
      ];

      expect(calculateTotalPaid(schedules)).toBe(80000);
    });

    it('should return zero for all unpaid schedules', () => {
      const schedules = [
        createSchedule({ dueAmount: 50000, paid: false }),
        createSchedule({ dueAmount: 30000, paid: false }),
      ];

      expect(calculateTotalPaid(schedules)).toBe(0);
    });
  });

  describe('calculateCredit', () => {
    it('should calculate credit correctly', () => {
      // Customer pays 180000, 150000 allocated
      expect(calculateCredit(180000, 150000)).toBe(30000);
    });

    it('should return zero when no credit', () => {
      expect(calculateCredit(150000, 150000)).toBe(0);
    });

    it('should return zero (not negative) when over-allocated', () => {
      expect(calculateCredit(150000, 180000)).toBe(0);
    });

    it('should handle zero inputs', () => {
      expect(calculateCredit(0, 0)).toBe(0);
    });
  });

  describe('processPartialPayment', () => {
    it('should apply full payment when outstanding is less', () => {
      const result = processPartialPayment(30000, 20000, 50000);

      expect(result.appliedAmount).toBe(20000);
      expect(result.remainingBalance).toBe(0);
    });

    it('should apply partial payment and keep remaining balance', () => {
      const result = processPartialPayment(25000, 50000, 50000);

      expect(result.appliedAmount).toBe(25000);
      expect(result.remainingBalance).toBe(25000);
    });

    it('should calculate new outstanding due correctly', () => {
      const result = processPartialPayment(20000, 50000, 50000);

      expect(result.newOutstandingDue).toBe(30000);
    });

    it('should set outstanding due to zero when payment covers it', () => {
      const result = processPartialPayment(50000, 50000, 50000);

      expect(result.newOutstandingDue).toBe(0);
    });
  });

  describe('calculateAbsenceImpact', () => {
    it('should return zero when absence is approved', () => {
      expect(calculateAbsenceImpact(true, 50000)).toBe(0);
    });

    it('should return full due when absence is not approved', () => {
      expect(calculateAbsenceImpact(false, 50000)).toBe(50000);
    });
  });

  describe('calculateBalanceWithAbsences', () => {
    const createSchedule = (
      overrides: Partial<{
        paid: boolean;
        dueAmount: number;
        absenceRecorded: boolean;
        absenceApproved: boolean | null;
      }> = {},
    ): WeeklySchedule => ({
      id: 's1',
      weekStartDate: new Date(),
      weekEndDate: new Date(),
      dueDate: new Date(),
      dueAmount: 50000,
      paid: false,
      paymentId: null,
      absenceRecorded: false,
      absenceApproved: null,
      ...overrides,
    });

    it('should not count approved absences toward balance', () => {
      const schedules = [
        createSchedule({
          dueAmount: 50000,
          absenceRecorded: true,
          absenceApproved: true,
        }),
      ];

      expect(calculateBalanceWithAbsences(schedules)).toBe(0);
    });

    it('should count unapproved/pending absences toward balance', () => {
      const schedules = [
        createSchedule({
          dueAmount: 50000,
          absenceRecorded: true,
          absenceApproved: null, // pending
        }),
      ];

      expect(calculateBalanceWithAbsences(schedules)).toBe(50000);
    });

    it('should exclude already paid schedules', () => {
      const schedules = [
        createSchedule({ dueAmount: 50000, paid: true }),
        createSchedule({
          dueAmount: 50000,
          absenceRecorded: true,
          absenceApproved: true,
        }),
      ];

      expect(calculateBalanceWithAbsences(schedules)).toBe(0);
    });
  });

  describe('validateAllocation', () => {
    it('should validate correct allocation', () => {
      const schedules = [
        { id: 's1', paid: true, dueAmount: 50000, paymentId: 'p1' } as WeeklySchedule,
        { id: 's2', paid: false, dueAmount: 50000, paymentId: null } as WeeklySchedule,
      ];

      const result = validateAllocation(50000, 50000, schedules);
      expect(result.valid).toBe(true);
      expect(result.errors).toHaveLength(0);
    });

    it('should error when allocated exceeds payment', () => {
      const schedules: WeeklySchedule[] = [];
      const result = validateAllocation(50000, 60000, schedules);
      expect(result.valid).toBe(false);
      expect(result.errors).toContain('Allocated amount cannot exceed payment amount');
    });

    it('should error when paid schedule has no allocation', () => {
      const schedules = [
        { id: 's1', paid: true, dueAmount: 50000, paymentId: null } as WeeklySchedule,
      ];

      const result = validateAllocation(50000, 50000, schedules);
      expect(result.valid).toBe(false);
      expect(result.errors).toContain('Schedule s1 is marked paid but has no allocation');
    });
  });

  describe('canAllocatePayment', () => {
    const payments = [
      { id: 'p1', customerId: 'c1', amount: 50000 },
      { id: 'p2', customerId: 'c2', amount: 100000 },
    ];

    it('should return true for valid allocation', () => {
      expect(canAllocatePayment('c1', 'p1', 50000, payments)).toBe(true);
    });

    it('should return false when payment not found', () => {
      expect(canAllocatePayment('c1', 'p999', 50000, payments)).toBe(false);
    });

    it('should return false when customer mismatch', () => {
      expect(canAllocatePayment('c1', 'p2', 100000, payments)).toBe(false);
    });

    it('should return false when amount mismatch', () => {
      expect(canAllocatePayment('c1', 'p1', 100000, payments)).toBe(false);
    });
  });
});
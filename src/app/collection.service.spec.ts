import { describe, it, expect, vi, beforeEach } from 'vitest';
import { Injector, runInInjectionContext } from '@angular/core';
import { CollectionService } from './collection.service';
import { SupabaseService } from './supabase.service';
import { AuthService } from './auth/auth.service';

describe('CollectionService', () => {
  let mockSupabaseService: any;
  let mockAuthService: any;

  beforeEach(() => {
    vi.clearAllMocks();

    mockAuthService = {
      user: () => ({ id: 'owner-uuid-1', email: 'owner@example.com' }),
    };

    mockSupabaseService = {
      client: {
        rpc: vi.fn(),
        from: vi.fn(),
      },
    };
  });

  const createService = () => {
    const injector = Injector.create({
      providers: [
        { provide: SupabaseService, useValue: mockSupabaseService },
        { provide: AuthService, useValue: mockAuthService },
      ],
    });
    return runInInjectionContext(injector, () => new CollectionService());
  };

  describe('recordWeeklyPayment', () => {
    it('calls record_weekly_payment RPC with paise integer and returns success', async () => {
      mockSupabaseService.client.rpc.mockResolvedValueOnce({
        data: { success: true, payment_id: 'pay-123', total_allocated: 50000, remaining_credit: 0 },
        error: null,
      });

      const service = createService();
      const res = await service.recordWeeklyPayment('cust-1', 50000, 'cash', 'REC-001', 'Weekly collection');

      expect(mockSupabaseService.client.rpc).toHaveBeenCalledWith('record_weekly_payment', {
        p_customer_id: 'cust-1',
        p_amount_paise: 50000,
        p_method: 'cash',
        p_reference: 'REC-001',
        p_notes: 'Weekly collection',
      });
      expect(res.success).toBe(true);
      expect(service.success()).toBe('Payment recorded successfully');
    });

    it('handles RPC error gracefully without throwing', async () => {
      mockSupabaseService.client.rpc.mockResolvedValueOnce({
        data: null,
        error: new Error('Database RPC failure'),
      });

      const service = createService();
      const res = await service.recordWeeklyPayment('cust-1', 50000, 'cash');

      expect(res.success).toBe(false);
      expect(res.error).toBe('Database RPC failure');
    });
  });

  describe('getCustomerPaymentSummary', () => {
    it('calls get_customer_payment_summary RPC and returns financial summary', async () => {
      const summaryData = {
        success: true,
        outstanding_balance: 100000,
        total_due: 200000,
        total_paid: 100000,
        next_due_date: '2026-11-16',
        next_due_amount: 50000,
        error_message: null,
      };

      mockSupabaseService.client.rpc.mockResolvedValueOnce({
        data: summaryData,
        error: null,
      });

      const service = createService();
      const res = await service.getCustomerPaymentSummary('cust-1');

      expect(mockSupabaseService.client.rpc).toHaveBeenCalledWith('get_customer_payment_summary', {
        p_customer_id: 'cust-1',
      });
      expect(res).toEqual(summaryData);
    });
  });

  describe('getPaymentHistory', () => {
    it('queries payment_history table with allocations and schedules', async () => {
      const mockHistory = [
        { id: 'p1', amount: 50000, payment_method: 'cash', payment_date: '2026-11-10' },
      ];

      const mockOrder = vi.fn().mockResolvedValueOnce({ data: mockHistory, error: null });
      const mockEq = vi.fn().mockReturnValue({ order: mockOrder });
      const mockSelect = vi.fn().mockReturnValue({ eq: mockEq });

      mockSupabaseService.client.from.mockReturnValueOnce({ select: mockSelect });

      const service = createService();
      const res = await service.getPaymentHistory('cust-1');

      expect(mockSupabaseService.client.from).toHaveBeenCalledWith('payment_history');
      expect(mockEq).toHaveBeenCalledWith('customer_id', 'cust-1');
      expect(mockOrder).toHaveBeenCalledWith('payment_date', { ascending: false });
      expect(res).toEqual(mockHistory);
    });
  });

  describe('recordAbsence', () => {
    it('calls record_absence RPC and records customer reason', async () => {
      mockSupabaseService.client.rpc.mockResolvedValueOnce({
        data: { success: true, absence_id: 'abs-1' },
        error: null,
      });

      const service = createService();
      const res = await service.recordAbsence('cust-1', '2026-11-09', 'Customer out of town');

      expect(mockSupabaseService.client.rpc).toHaveBeenCalledWith('record_absence', {
        p_customer_id: 'cust-1',
        p_week_start: '2026-11-09',
        p_reason: 'Customer out of town',
      });
      expect(res.success).toBe(true);
      expect(service.success()).toBe('Absence recorded');
    });
  });

  describe('approveAbsence', () => {
    it('calls approve_absence RPC to approve and preserve debt under Option A', async () => {
      mockSupabaseService.client.rpc.mockResolvedValueOnce({
        data: { success: true, message: 'Absence approved' },
        error: null,
      });

      const service = createService();
      const res = await service.approveAbsence('abs-1', true);

      expect(mockSupabaseService.client.rpc).toHaveBeenCalledWith('approve_absence', {
        p_absence_id: 'abs-1',
        p_approve: true,
      });
      expect(res.success).toBe(true);
      expect(service.success()).toBe('Absence approved');
    });
  });

  describe('getCustomerAbsences', () => {
    it('queries absences table sorted by week_start_date descending', async () => {
      const mockAbsences = [
        { id: 'abs-1', week_start_date: '2026-11-09', reason: 'Medical', status: 'approved' },
      ];

      const mockOrder = vi.fn().mockResolvedValueOnce({ data: mockAbsences, error: null });
      const mockEq = vi.fn().mockReturnValue({ order: mockOrder });
      const mockSelect = vi.fn().mockReturnValue({ eq: mockEq });

      mockSupabaseService.client.from.mockReturnValueOnce({ select: mockSelect });

      const service = createService();
      const res = await service.getCustomerAbsences('cust-1');

      expect(mockSupabaseService.client.from).toHaveBeenCalledWith('absences');
      expect(mockEq).toHaveBeenCalledWith('customer_id', 'cust-1');
      expect(res).toEqual(mockAbsences);
    });
  });

  describe('getWeeklySchedules', () => {
    it('queries weekly_schedules table sorted by due_date ascending', async () => {
      const mockSchedules = [
        { id: 'sch-1', due_date: '2026-11-16', due_amount: 50000, paid: false },
      ];

      const mockOrder = vi.fn().mockResolvedValueOnce({ data: mockSchedules, error: null });
      const mockEq = vi.fn().mockReturnValue({ order: mockOrder });
      const mockSelect = vi.fn().mockReturnValue({ eq: mockEq });

      mockSupabaseService.client.from.mockReturnValueOnce({ select: mockSelect });

      const service = createService();
      const res = await service.getWeeklySchedules('cust-1');

      expect(mockSupabaseService.client.from).toHaveBeenCalledWith('weekly_schedules');
      expect(mockEq).toHaveBeenCalledWith('customer_id', 'cust-1');
      expect(res).toEqual(mockSchedules);
    });
  });
});

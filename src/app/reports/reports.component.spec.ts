import { describe, it, expect, vi, beforeEach } from 'vitest';
import { Injector, runInInjectionContext } from '@angular/core';
import { ReportsComponent } from './reports.component';
import { SupabaseService } from '../supabase.service';
import { AuthService } from '../auth/auth.service';
import { I18nPipe } from '../shared/i18n.pipe';

describe('ReportsComponent - WhatsApp', () => {
  let mockSupabaseService: any;
  let mockAuthService: any;

  beforeEach(() => {
    vi.clearAllMocks();

    mockAuthService = {
      user: () => ({ id: 'owner-uuid-1', email: 'owner@example.com' }),
    };

    const functionsMock = {
      invoke: vi.fn(),
    };

    mockSupabaseService = {
      client: {
        from: vi.fn(),
        functions: functionsMock,
      },
      functions: functionsMock, // Top-level functions getter
    };
  });

  const createComponent = () => {
    const injector = Injector.create({
      providers: [
        { provide: SupabaseService, useValue: mockSupabaseService },
        { provide: AuthService, useValue: mockAuthService },
      ],
    });
    return runInInjectionContext(injector, () => new ReportsComponent());
  };

  const setupDefaultQueries = () => {
    // Customers query - no order/limit in component for first query
    const customersChain = {
      select: vi.fn().mockReturnThis(),
      // No order, no limit - component just does .select()
    };
    customersChain.select.mockResolvedValue({
      data: [
        {
          id: 'c1',
          name: 'John Doe',
          outstanding_balance: 100000,
          total_due: 200000,
          total_paid: 100000,
          status: 'active',
        },
        {
          id: 'c2',
          name: 'Jane Smith',
          outstanding_balance: 50000,
          total_due: 100000,
          total_paid: 50000,
          status: 'active',
        },
      ],
      error: null,
    });
    mockSupabaseService.client.from.mockReturnValueOnce(customersChain);

    // Weekly schedules query
    const schedulesChain = {
      select: vi.fn().mockReturnThis(),
      eq: vi.fn().mockReturnThis(),
      gte: vi.fn().mockReturnThis(),
      lte: vi.fn().mockReturnThis(),
      then: vi.fn((resolve) => resolve({ data: [{ due_amount: 50000 }], error: null })),
    };
    mockSupabaseService.client.from.mockReturnValueOnce(schedulesChain);

    // Payments query
    const paymentsChain = {
      select: vi.fn().mockReturnThis(),
      order: vi.fn().mockReturnThis(),
      gte: vi.fn().mockReturnThis(),
      lte: vi.fn().mockReturnThis(),
      limit: vi.fn().mockResolvedValue({
        data: [
          {
            id: 'p1',
            amount: 50000,
            payment_method: 'cash',
            payment_date: '2026-11-15',
            reference: 'REF-001',
            customers: { name: 'John Doe' },
          },
        ],
        error: null,
      }),
    };
    mockSupabaseService.client.from.mockReturnValueOnce(paymentsChain);

    // Balances query
    const balancesChain = {
      select: vi.fn().mockReturnThis(),
      order: vi.fn().mockReturnThis(),
      limit: vi.fn().mockResolvedValue({
        data: [
          {
            id: 'c1',
            name: 'John Doe',
            phone: '+919876543210',
            outstanding_balance: 100000,
            total_paid: 100000,
            status: 'active',
          },
        ],
        error: null,
      }),
    };
    mockSupabaseService.client.from.mockReturnValueOnce(balancesChain);
  };

  const setupSendMocks = (invokeMock) => {
    mockSupabaseService.client.functions.invoke = invokeMock;
    mockSupabaseService.functions.invoke = invokeMock;
    setupDefaultQueries();
  };

  describe('sendToWhatsApp', () => {
    it('validates E.164 phone format before sending', async () => {
      const invokeMock = vi.fn().mockResolvedValue({
        data: { messageId: 'msg-123' },
        error: null,
      });
      setupSendMocks(invokeMock);

      const component = createComponent();
      component.recipientPhone.set('invalid-phone');

      await component.sendToWhatsApp('summary');

      expect(component.whatsappError()).toBe(
        'Please enter a valid phone number in E.164 format (e.g., +919876543210)',
      );
      expect(component.whatsappSuccess()).toBeNull();
      expect(invokeMock).not.toHaveBeenCalled();
    });

    it('accepts valid Indian E.164 phone numbers', async () => {
      const invokeMock = vi.fn().mockResolvedValue({
        data: { messageId: 'msg-123' },
        error: null,
      });
      setupSendMocks(invokeMock);

      const component = createComponent();
      component.recipientPhone.set('+919876543210');

      await component.sendToWhatsApp('summary');

      expect(invokeMock).toHaveBeenCalledWith('whatsapp-send-report', {
        body: {
          reportType: 'summary',
          recipientPhone: '+919876543210',
          startDate: undefined,
          endDate: undefined,
        },
      });
    });

    it('accepts valid US E.164 phone numbers', async () => {
      const invokeMock = vi.fn().mockResolvedValue({
        data: { messageId: 'msg-123' },
        error: null,
      });
      setupSendMocks(invokeMock);

      const component = createComponent();
      component.recipientPhone.set('+15551234567');

      await component.sendToWhatsApp('payments');

      expect(invokeMock).toHaveBeenCalledWith('whatsapp-send-report', {
        body: expect.objectContaining({
          reportType: 'payments',
          recipientPhone: '+15551234567',
        }),
      });
    });

    it('includes date filters when set', async () => {
      const invokeMock = vi.fn().mockResolvedValue({
        data: { messageId: 'msg-123' },
        error: null,
      });
      setupSendMocks(invokeMock);

      const component = createComponent();
      component.recipientPhone.set('+919876543210');
      component.startDate.set('2026-11-01');
      component.endDate.set('2026-11-15');

      await component.sendToWhatsApp('balances');

      expect(invokeMock).toHaveBeenCalledWith('whatsapp-send-report', {
        body: {
          reportType: 'balances',
          recipientPhone: '+919876543210',
          startDate: '2026-11-01',
          endDate: '2026-11-15',
        },
      });
    });

    it('sets loading state per report type during send', async () => {
      let resolveInvoke: (v: any) => void;
      const invokePromise = new Promise((r) => (resolveInvoke = r));
      const invokeMock = vi.fn().mockReturnValue(invokePromise);
      setupSendMocks(invokeMock);

      const component = createComponent();
      component.recipientPhone.set('+919876543210');

      const sendPromise = component.sendToWhatsApp('summary');
      expect(component.whatsappLoading()['summary']).toBe(true);

      resolveInvoke({ data: { messageId: 'msg-123' }, error: null });
      await sendPromise;

      expect(component.whatsappLoading()['summary']).toBe(false);
    });

    it('sets success message with messageId on successful send', async () => {
      const invokeMock = vi.fn().mockResolvedValue({
        data: { messageId: 'msg-abc-123' },
        error: null,
      });
      setupSendMocks(invokeMock);

      const component = createComponent();
      component.recipientPhone.set('+919876543210');

      await component.sendToWhatsApp('summary');

      expect(component.whatsappSuccess()).toBe(
        'Summary report sent successfully! Message ID: msg-abc-123',
      );
      expect(component.whatsappError()).toBeNull();
    });

    it('clears previous error/success before new send', async () => {
      const invokeMock = vi.fn().mockResolvedValue({
        data: { messageId: 'msg-123' },
        error: null,
      });
      setupSendMocks(invokeMock);

      const component = createComponent();
      component.recipientPhone.set('+919876543210');
      component.whatsappError.set('Previous error');
      component.whatsappSuccess.set('Previous success');

      await component.sendToWhatsApp('payments');

      expect(component.whatsappError()).toBeNull();
      expect(component.whatsappSuccess()).toContain('Payments report sent successfully');
    });

    describe('error handling', () => {
      it('maps 401/Invalid API key to user-friendly message', async () => {
        const invokeMock = vi.fn().mockRejectedValue(new Error('401 Invalid API key'));
        setupSendMocks(invokeMock);

        const component = createComponent();
        component.recipientPhone.set('+919876543210');

        await component.sendToWhatsApp('summary');

        expect(component.whatsappError()).toBe(
          'Invalid WhatsApp API key. Check Settings \u2192 WhatsApp Gateway.',
        );
      });

      it('maps 409/session not ready to session not linked message', async () => {
        const invokeMock = vi.fn().mockRejectedValue(new Error('409 session not ready'));
        setupSendMocks(invokeMock);

        const component = createComponent();
        component.recipientPhone.set('+919876543210');

        await component.sendToWhatsApp('summary');

        expect(component.whatsappError()).toBe(
          'WhatsApp session not linked. Scan QR in OpenWA dashboard.',
        );
      });

      it('maps 404/session not found to session name message', async () => {
        const invokeMock = vi.fn().mockRejectedValue(new Error('404 session not found'));
        setupSendMocks(invokeMock);

        const component = createComponent();
        component.recipientPhone.set('+919876543210');

        await component.sendToWhatsApp('summary');

        expect(component.whatsappError()).toBe(
          'Session not found. Check session name in Settings.',
        );
      });

      it('maps 429/rate limit to retry message', async () => {
        const invokeMock = vi.fn().mockRejectedValue(new Error('429 rate limit exceeded'));
        setupSendMocks(invokeMock);

        const component = createComponent();
        component.recipientPhone.set('+919876543210');

        await component.sendToWhatsApp('summary');

        expect(component.whatsappError()).toBe('Rate limited. Try again shortly.');
      });

      it('shows raw error message for unmapped errors', async () => {
        const invokeMock = vi.fn().mockRejectedValue(new Error('Network timeout'));
        setupSendMocks(invokeMock);

        const component = createComponent();
        component.recipientPhone.set('+919876543210');

        await component.sendToWhatsApp('summary');

        expect(component.whatsappError()).toBe('Network timeout');
      });

      it('handles thrown errors (not error responses)', async () => {
        const invokeMock = vi.fn().mockRejectedValue(new Error('Connection refused'));
        setupSendMocks(invokeMock);

        const component = createComponent();
        component.recipientPhone.set('+919876543210');

        await component.sendToWhatsApp('summary');

        expect(component.whatsappError()).toBe('Connection refused');
      });
    });

    describe('report types', () => {
      it('sends payments report type correctly', async () => {
        const invokeMock = vi.fn().mockResolvedValue({
          data: { messageId: 'msg-1' },
          error: null,
        });
        setupSendMocks(invokeMock);

        const component = createComponent();
        component.recipientPhone.set('+919876543210');

        await component.sendToWhatsApp('payments');

        expect(invokeMock).toHaveBeenCalledWith('whatsapp-send-report', {
          body: expect.objectContaining({ reportType: 'payments' }),
        });
        expect(component.whatsappSuccess()).toContain('Payments report sent successfully');
      });

      it('sends balances report type correctly', async () => {
        const invokeMock = vi.fn().mockResolvedValue({
          data: { messageId: 'msg-2' },
          error: null,
        });
        setupSendMocks(invokeMock);

        const component = createComponent();
        component.recipientPhone.set('+919876543210');

        await component.sendToWhatsApp('balances');

        expect(invokeMock).toHaveBeenCalledWith('whatsapp-send-report', {
          body: expect.objectContaining({ reportType: 'balances' }),
        });
        expect(component.whatsappSuccess()).toContain('Balances report sent successfully');
      });

      it('sends summary report type correctly', async () => {
        const invokeMock = vi.fn().mockResolvedValue({
          data: { messageId: 'msg-3' },
          error: null,
        });
        setupSendMocks(invokeMock);

        const component = createComponent();
        component.recipientPhone.set('+919876543210');

        await component.sendToWhatsApp('summary');

        expect(invokeMock).toHaveBeenCalledWith('whatsapp-send-report', {
          body: expect.objectContaining({ reportType: 'summary' }),
        });
        expect(component.whatsappSuccess()).toContain('Summary report sent successfully');
      });
    });
  });

  describe('loadReports', () => {
    it('loads customers, payments, balances, and schedules', async () => {
      setupDefaultQueries();

      const component = createComponent();
      await component.loadReports();

      expect(component.summary()).not.toBeNull();
      expect(component.summary()?.totalCustomers).toBe(2);
      expect(component.summary()?.totalOutstanding).toBe(150000);
    });

    it('handles errors gracefully', async () => {
      const chain = {
        select: vi.fn().mockReturnThis(),
      };
      chain.select.mockResolvedValue({ data: null, error: { message: 'DB error' } });
      mockSupabaseService.client.from.mockReturnValue(chain);

      const component = createComponent();
      await component.loadReports();

      expect(component.error()).toBe('DB error');
      expect(component.loading()).toBe(false);
    });
  });
});

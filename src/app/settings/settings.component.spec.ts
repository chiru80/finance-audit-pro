import { describe, it, expect, vi, beforeEach } from 'vitest';
import { Injector, runInInjectionContext } from '@angular/core';
import { SettingsComponent } from './settings.component';
import { SupabaseService } from '../supabase.service';
import { AuthService } from '../auth/auth.service';
import { PushNotificationService } from '../core/push-notification.service';

describe('SettingsComponent - WhatsApp', () => {
  let mockSupabaseService: any;
  let mockAuthService: any;
  let mockPushService: any;

  beforeEach(() => {
    vi.clearAllMocks();

    mockAuthService = {
      user: () => ({ id: 'owner-uuid-1', email: 'owner@example.com' }),
    };

    mockPushService = {
      supported: () => true,
      subscribed: () => false,
      loading: () => false,
      error: () => null,
      subscribe: vi.fn().mockResolvedValue(true),
      unsubscribe: vi.fn().mockResolvedValue(undefined),
      refreshStatus: vi.fn(),
    };

    mockSupabaseService = {
      client: {
        from: vi.fn(),
        functions: {
          invoke: vi.fn(),
        },
      },
    };
  });

  const createComponent = () => {
    const injector = Injector.create({
      providers: [
        { provide: SupabaseService, useValue: mockSupabaseService },
        { provide: AuthService, useValue: mockAuthService },
        { provide: PushNotificationService, useValue: mockPushService },
      ],
    });
    return runInInjectionContext(injector, () => new SettingsComponent());
  };

  const mockFromChain = (returnValue: any) => {
    const chain = {
      select: vi.fn().mockReturnThis(),
      eq: vi.fn().mockReturnThis(),
      single: vi.fn().mockResolvedValue(returnValue),
      upsert: vi.fn().mockResolvedValue({ error: null }),
    };
    mockSupabaseService.client.from.mockReturnValue(chain);
    return chain;
  };

  const setupProfileMock = (phone: string | null) => {
    const profileChain = {
      select: vi.fn().mockReturnThis(),
      eq: vi.fn().mockReturnThis(),
      single: vi.fn().mockResolvedValue({ data: { phone }, error: null }),
    };
    // This will be the second call to from() - first is app_whatsapp_config in loadWhatsAppConfig
    mockSupabaseService.client.from.mockReturnValueOnce(profileChain);
  };

  describe('loadWhatsAppConfig', () => {
    it('loads WhatsApp config from database and populates form', async () => {
      const configData = {
        base_url: 'https://wa.example.com',
        api_key: 'sk_test_123',
        session_name: 'finance-audit-pro',
      };
      mockFromChain({ data: configData, error: null });

      const component = createComponent();
      await component.loadWhatsAppConfig();

      expect(mockSupabaseService.client.from).toHaveBeenCalledWith('app_whatsapp_config');
      expect(component.whatsappConfig()).toEqual(configData);
      expect(component.whatsappForm()).toEqual({
        base_url: 'https://wa.example.com',
        api_key: 'sk_test_123',
        session_name: 'finance-audit-pro',
      });
    });

    it('handles missing config gracefully (PGRST116)', async () => {
      mockFromChain({ data: null, error: { code: 'PGRST116' } });

      const component = createComponent();
      await component.loadWhatsAppConfig();

      expect(component.whatsappConfig()).toBeNull();
      expect(component.whatsappForm()).toEqual({
        base_url: '',
        api_key: '',
        session_name: 'finance-audit-pro',
      });
    });

    it('logs warning on other errors but does not throw', async () => {
      const consoleSpy = vi.spyOn(console, 'warn').mockImplementation(() => {});
      mockFromChain({ data: null, error: { code: 'OTHER', message: 'DB error' } });

      const component = createComponent();
      await component.loadWhatsAppConfig();

      expect(consoleSpy).toHaveBeenCalledWith('WhatsApp config not loaded:', expect.any(Object));
      consoleSpy.mockRestore();
    });
  });

  describe('saveWhatsAppConfig', () => {
    it('validates required fields before saving', async () => {
      const component = createComponent();
      component.whatsappForm.set({ base_url: '', api_key: '', session_name: 'test' });

      await component.saveWhatsAppConfig();

      expect(component.error()).toBe('Base URL and API Key are required');
      expect(mockSupabaseService.client.from).not.toHaveBeenCalled();
    });

    it('saves config via upsert and updates local state on success', async () => {
      const upsertChain = {
        select: vi.fn().mockReturnThis(),
        eq: vi.fn().mockReturnThis(),
        single: vi.fn().mockResolvedValue({ data: null, error: null }),
        upsert: vi.fn().mockResolvedValue({ error: null }),
      };
      mockSupabaseService.client.from.mockReturnValue(upsertChain);

      const component = createComponent();
      component.whatsappForm.set({
        base_url: 'https://wa.example.com',
        api_key: 'sk_test_456',
        session_name: 'my-session',
      });

      await component.saveWhatsAppConfig();

      expect(upsertChain.upsert).toHaveBeenCalledWith({
        id: true,
        base_url: 'https://wa.example.com',
        api_key: 'sk_test_456',
        session_name: 'my-session',
        updated_at: expect.any(String),
      });
      expect(component.whatsappConfig()).toEqual({
        base_url: 'https://wa.example.com',
        api_key: 'sk_test_456',
        session_name: 'my-session',
      });
      expect(component.success()).toBe('WhatsApp configuration saved');
    });

    it('sets error on upsert failure', async () => {
      const upsertChain = {
        upsert: vi.fn().mockResolvedValue({ error: { message: 'RLS violation' } }),
      };
      mockSupabaseService.client.from.mockReturnValue(upsertChain);

      const component = createComponent();
      component.whatsappForm.set({
        base_url: 'https://wa.example.com',
        api_key: 'sk_test_456',
        session_name: 'my-session',
      });

      await component.saveWhatsAppConfig();

      expect(component.error()).toBe('Failed to save WhatsApp config');
      expect(component.success()).toBeNull();
    });

    it('sets loading state during save', async () => {
      let resolveUpsert: (v: any) => void;
      const upsertPromise = new Promise((r) => (resolveUpsert = r));
      const upsertChain = { upsert: vi.fn().mockReturnValue(upsertPromise) };
      mockSupabaseService.client.from.mockReturnValue(upsertChain);

      const component = createComponent();
      component.whatsappForm.set({
        base_url: 'https://wa.example.com',
        api_key: 'sk_test_456',
        session_name: 'my-session',
      });

      const savePromise = component.saveWhatsAppConfig();
      expect(component.whatsappLoading()).toBe(true);

      resolveUpsert({ error: null });
      await savePromise;

      expect(component.whatsappLoading()).toBe(false);
    });
  });

  describe('testWhatsAppConnection', () => {
    it('invokes edge function with summary report and owner phone from profile', async () => {
      const invokeMock = vi.fn().mockResolvedValue({
        data: { messageId: 'msg-123', timestamp: '2026-11-18T10:00:00Z' },
        error: null,
      });
      mockSupabaseService.client.functions.invoke = invokeMock;

      setupProfileMock('+919876543210');

      const component = createComponent();
      await component.testWhatsAppConnection();

      expect(invokeMock).toHaveBeenCalledWith('whatsapp-send-report', {
        body: {
          reportType: 'summary',
          recipientPhone: '+919876543210',
          startDate: expect.any(String),
          endDate: expect.any(String),
        },
      });
      expect(component.whatsappTestResult()).toBe('Connection successful! Message ID: msg-123');
    });

    it('uses hardcoded fallback when profile has no phone', async () => {
      const invokeMock = vi.fn().mockResolvedValue({
        data: { messageId: 'msg-456' },
        error: null,
      });
      mockSupabaseService.client.functions.invoke = invokeMock;

      setupProfileMock(null);

      const component = createComponent();
      await component.testWhatsAppConnection();

      expect(invokeMock).toHaveBeenCalledWith('whatsapp-send-report', {
        body: expect.objectContaining({
          recipientPhone: '+919876543210', // Hardcoded fallback
        }),
      });
    });

    it('handles 409 session not linked error', async () => {
      const invokeMock = vi.fn().mockResolvedValue({
        data: null,
        error: { message: '409 session not ready' },
      });
      mockSupabaseService.client.functions.invoke = invokeMock;

      setupProfileMock('+919876543210');

      const component = createComponent();
      await component.testWhatsAppConnection();

      // Component throws error object, not Error instance, so falls to generic message
      expect(component.whatsappTestResult()).toBe('Error: Connection test failed');
    });

    it('handles 401 invalid API key error', async () => {
      const invokeMock = vi.fn().mockResolvedValue({
        data: null,
        error: { message: '401 Invalid API key' },
      });
      mockSupabaseService.client.functions.invoke = invokeMock;

      setupProfileMock('+919876543210');

      const component = createComponent();
      await component.testWhatsAppConnection();

      expect(component.whatsappTestResult()).toBe('Error: Connection test failed');
    });

    it('handles 404 session not found error', async () => {
      const invokeMock = vi.fn().mockResolvedValue({
        data: null,
        error: { message: '404 session not found' },
      });
      mockSupabaseService.client.functions.invoke = invokeMock;

      setupProfileMock('+919876543210');

      const component = createComponent();
      await component.testWhatsAppConnection();

      expect(component.whatsappTestResult()).toBe('Error: Connection test failed');
    });

    it('sets loading state during test', async () => {
      let resolveInvoke: (v: any) => void;
      const invokePromise = new Promise((r) => (resolveInvoke = r));
      const invokeMock = vi.fn().mockReturnValue(invokePromise);
      mockSupabaseService.client.functions.invoke = invokeMock;

      setupProfileMock('+919876543210');

      const component = createComponent();
      const testPromise = component.testWhatsAppConnection();
      expect(component.whatsappTestLoading()).toBe(true);

      resolveInvoke({ data: { messageId: 'msg-123' }, error: null });
      await testPromise;

      expect(component.whatsappTestLoading()).toBe(false);
    });

    it('handles 409 when error is thrown as Error instance', async () => {
      const invokeMock = vi.fn().mockRejectedValue(new Error('409 session not ready'));
      mockSupabaseService.client.functions.invoke = invokeMock;

      setupProfileMock('+919876543210');

      const component = createComponent();
      await component.testWhatsAppConnection();

      expect(component.whatsappTestResult()).toBe(
        'Gateway reachable, but WhatsApp session not linked. Scan QR in OpenWA dashboard.',
      );
    });

    it('handles 401 when error is thrown as Error instance', async () => {
      const invokeMock = vi.fn().mockRejectedValue(new Error('401 Invalid API key'));
      mockSupabaseService.client.functions.invoke = invokeMock;

      setupProfileMock('+919876543210');

      const component = createComponent();
      await component.testWhatsAppConnection();

      expect(component.whatsappTestResult()).toBe('Invalid API key. Check your credentials.');
    });

    it('handles 404 when error is thrown as Error instance', async () => {
      const invokeMock = vi.fn().mockRejectedValue(new Error('404 session not found'));
      mockSupabaseService.client.functions.invoke = invokeMock;

      setupProfileMock('+919876543210');

      const component = createComponent();
      await component.testWhatsAppConnection();

      expect(component.whatsappTestResult()).toBe(
        'Session not found. Check session name in OpenWA.',
      );
    });
  });

  describe('onWhatsAppInputChange', () => {
    it('updates individual form fields reactively', () => {
      const component = createComponent();
      component.whatsappForm.set({
        base_url: 'https://old.com',
        api_key: 'old-key',
        session_name: 'old-session',
      });

      component.onWhatsAppInputChange('base_url', 'https://new.com');
      expect(component.whatsappForm().base_url).toBe('https://new.com');
      expect(component.whatsappForm().api_key).toBe('old-key'); // unchanged

      component.onWhatsAppInputChange('api_key', 'new-key');
      expect(component.whatsappForm().api_key).toBe('new-key');
    });
  });
});

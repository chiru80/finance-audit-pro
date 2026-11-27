describe('Website Button & Workflow Audit', () => {
  const OWNER_ID = '11111111-1111-4111-8111-111111111111';
  const VILLAGE_ID = '22222222-2222-4222-8222-222222222222';
  const CUSTOMER_ID = '32b3dfb8-fd2c-410d-940f-542b1a567ba1';
  const SCHEDULE_1 = '33333333-3333-4333-8333-333333333301';
  const SCHEDULE_2 = '33333333-3333-4333-8333-333333333302';
  const PAYMENT_1 = '44444444-4444-4444-8444-444444444401';
  const HIST_1 = '55555555-5555-4555-8555-555555555501';
  const ABSENCE_1 = '66666666-6666-4666-8666-666666666601';
  const ONLINE_1 = '77777777-7777-4777-8777-777777777701';

  function encodeBase64Url(obj) {
    return btoa(JSON.stringify(obj)).replace(/=/g, '').replace(/\+/g, '-').replace(/\//g, '_');
  }

  function makeSession() {
    const now = Math.floor(Date.now() / 1000);
    const jwt = `${encodeBase64Url({ alg: 'HS256', typ: 'JWT' })}.${encodeBase64Url({
      sub: OWNER_ID,
      email: 'owner@example.com',
      role: 'authenticated',
      aud: 'authenticated',
      iat: now,
      exp: now + 7200,
    })}.sig`;
    const user = {
      id: OWNER_ID,
      aud: 'authenticated',
      role: 'authenticated',
      email: 'owner@example.com',
      user_metadata: { full_name: 'Chiru Deep' },
    };
    return {
      jwt,
      user,
      session: {
        access_token: jwt,
        token_type: 'bearer',
        expires_in: 7200,
        expires_at: now + 7200,
        refresh_token: 'mock-refresh-token',
        user,
      },
    };
  }

  function createDb() {
    return {
      profiles: [
        {
          id: OWNER_ID,
          email: 'owner@example.com',
          full_name: 'Chiru Deep',
          phone: '9876543210',
          language: 'en',
          theme_mode: 'dark',
          weekly_due_day: 1,
          weekly_due_amount: 50000,
        },
      ],
      villages: [
        {
          id: VILLAGE_ID,
          profile_id: OWNER_ID,
          name: 'Kothuru',
          is_active: true,
          created_at: '2026-11-01T00:00:00Z',
          updated_at: '2026-11-01T00:00:00Z',
        },
      ],
      customers: [
        {
          id: CUSTOMER_ID,
          profile_id: OWNER_ID,
          name: 'srinu',
          phone: null,
          email: null,
          address: null,
          village_id: VILLAGE_ID,
          villages: { name: 'Kothuru' },
          loan_amount: 600000,
          amount_given: 600000,
          total_weeks: 12,
          weekly_due_amount: 50000,
          outstanding_balance: 550000,
          total_paid: 50000,
          total_due: 600000,
          credit_balance: 0,
          status: 'active',
          enrollment_date: '2026-11-01',
          enrollment_week_start: '2026-11-02',
          created_at: '2026-11-01T00:00:00Z',
        },
      ],
      weekly_schedules: [
        {
          id: SCHEDULE_1,
          customer_id: CUSTOMER_ID,
          week_start_date: '2026-11-23',
          week_end_date: '2026-11-29',
          due_date: '2026-11-23',
          due_amount: 50000,
          paid: true,
          payment_id: PAYMENT_1,
          absence_recorded: false,
          absence_approved: null,
        },
        {
          id: SCHEDULE_2,
          customer_id: CUSTOMER_ID,
          week_start_date: '2026-11-30',
          week_end_date: '2026-12-06',
          due_date: '2026-11-30',
          due_amount: 50000,
          paid: false,
          payment_id: null,
          absence_recorded: false,
          absence_approved: null,
        },
      ],
      payments: [
        {
          id: PAYMENT_1,
          customer_id: CUSTOMER_ID,
          profile_id: OWNER_ID,
          amount: 50000,
          payment_method: 'cash',
          reference: 'REC-100',
          payment_date: '2026-11-24',
          notes: 'Week 1 payment',
          created_at: '2026-11-24T10:00:00Z',
        },
      ],
      payment_history: [
        {
          id: HIST_1,
          original_payment_id: PAYMENT_1,
          customer_id: CUSTOMER_ID,
          profile_id: OWNER_ID,
          amount: 50000,
          payment_method: 'cash',
          reference: 'REC-100',
          payment_date: '2026-11-24',
          notes: 'Week 1 payment',
          reversed: false,
          reversed_reason: null,
          reversed_at: null,
          customers: { name: 'srinu', phone: null },
        },
      ],
      payment_allocations: [
        {
          id: '88888888-8888-4888-8888-888888888801',
          payment_id: PAYMENT_1,
          schedule_id: SCHEDULE_1,
          amount: 50000,
          weekly_schedules: { week_start_date: '2026-11-23', due_date: '2026-11-23' },
        },
      ],
      absences: [
        {
          id: ABSENCE_1,
          customer_id: CUSTOMER_ID,
          week_start_date: '2026-12-07',
          week_end_date: '2026-12-13',
          reason: 'Festival travel',
          status: 'pending',
          approved_by: null,
          approved_at: null,
        },
      ],
      online_payments: [
        {
          id: ONLINE_1,
          customer_id: CUSTOMER_ID,
          gateway: 'razorpay',
          transaction_id: 'pay_test_123',
          amount: 50000,
          status: 'pending',
          paid_at: null,
          created_at: '2026-11-25T10:00:00Z',
          customers: { name: 'srinu' },
        },
      ],
      settings: [
        { key: 'weekly_payments_start', value: 'true' },
        { key: 'absence_requires_approval', value: 'true' },
        { key: 'allow_partial_payments', value: 'true' },
        { key: 'payment_allocation_direction', value: 'fifo' },
        { key: 'default_weekly_due_amount', value: '50000' },
        { key: 'loan_deduction_per_1000', value: '20' },
      ],
      app_whatsapp_config: [
        {
          id: true,
          base_url: 'https://wa.example.com',
          api_key: 'test-key-123',
          session_name: 'finance-audit-pro',
        },
      ],
      audit_logs: [
        {
          id: '99999999-9999-4999-8999-999999999901',
          profile_id: OWNER_ID,
          action: 'payment_made',
          table_name: 'payments',
          record_id: PAYMENT_1,
          new_values: { amount: 50000 },
          created_at: '2026-11-24T10:00:00Z',
        },
      ],
      transactions: [
        {
          id: PAYMENT_1,
          customer_id: CUSTOMER_ID,
          customer_name: 'srinu',
          amount: 50000,
          date: '2026-11-24',
          type: 'collection',
          status: 'paid',
          description: 'REC-100',
        },
      ],
      push_subscriptions: [],
    };
  }

  function applyFilters(rows, urlObj) {
    let result = [...rows];
    for (const [key, val] of urlObj.searchParams.entries()) {
      if (['select', 'order', 'limit', 'offset', 'on_conflict'].includes(key)) continue;
      if (val.startsWith('eq.')) {
        const target = val.slice(3);
        result = result.filter((r) => String(r[key]) === target);
      } else if (val.startsWith('gt.')) {
        const target = Number(val.slice(3));
        result = result.filter((r) => Number(r[key]) > target);
      } else if (val.startsWith('gte.')) {
        const target = val.slice(4);
        result = result.filter((r) => String(r[key] ?? '') >= target);
      } else if (val.startsWith('lte.')) {
        const target = val.slice(4);
        result = result.filter((r) => String(r[key] ?? '') <= target);
      } else if (val.startsWith('in.(') && val.endsWith(')')) {
        const items = val
          .slice(4, -1)
          .split(',')
          .map((s) => s.replace(/^"|"$/g, ''));
        result = result.filter((r) => items.includes(String(r[key])));
      }
    }
    const order = urlObj.searchParams.get('order');
    if (order) {
      const [col, dir] = order.split('.');
      result.sort((a, b) => {
        const av = a[col] ?? '';
        const bv = b[col] ?? '';
        return (av > bv ? 1 : av < bv ? -1 : 0) * (dir === 'desc' ? -1 : 1);
      });
    }
    const limit = urlObj.searchParams.get('limit');
    if (limit) result = result.slice(0, Number(limit));
    return result;
  }

  function mountBackend(db) {
    const { user, session } = makeSession();
    cy.intercept('https://hlkvaxmqbzdbzcjnrrdh.supabase.co/**', (req) => {
      const url = new URL(req.url);
      const method = req.method;
      const accept = req.headers['accept'] || '';
      const isSingle = accept.includes('application/vnd.pgrst.object+json');
      const body = req.body;

      if (url.pathname.startsWith('/auth/v1/')) {
        if (url.pathname.endsWith('/user')) {
          return req.reply({ statusCode: 200, body: user });
        }
        if (url.pathname.endsWith('/logout')) {
          return req.reply({ statusCode: 204, body: '' });
        }
        return req.reply({ statusCode: 200, body: session });
      }

      if (url.pathname.startsWith('/functions/v1/')) {
        if (url.pathname.endsWith('whatsapp-send-report')) {
          if (body?.action === 'test') {
            return req.reply({ statusCode: 200, body: { ok: true, status: 'CONNECTED' } });
          }
          return req.reply({ statusCode: 200, body: { ok: true, messageId: 'wa_1' } });
        }
        return req.reply({ statusCode: 200, body: { ok: true } });
      }

      if (url.pathname.startsWith('/rest/v1/rpc/')) {
        const rpcName = url.pathname.replace('/rest/v1/rpc/', '');
        if (rpcName === 'is_app_owner') {
          return req.reply({ statusCode: 200, body: 'true', headers: { 'content-type': 'application/json' } });
        }
        if (rpcName === 'record_weekly_payment') {
          // Intentionally return the live 42703 bug so fallback is tested end-to-end
          return req.reply({
            statusCode: 400,
            body: { code: '42703', message: 'column "p_payment_id" does not exist' },
          });
        }
        if (rpcName === 'record_absence') {
          return req.reply({
            statusCode: 400,
            body: { code: '42703', message: 'column "profile_id" of relation "absences" does not exist' },
          });
        }
        if (rpcName === 'generate_weekly_schedules') {
          const count = Number(body?.p_weeks_count || 4);
          for (let i = 1; i <= count; i++) {
            const d = `2026-12-${String(Math.min(28, 7 + i * 5)).padStart(2, '0')}`;
            db.weekly_schedules.push({
              id: `33333333-3333-4333-8333-0000000000${i}${db.weekly_schedules.length}`,
              customer_id: body?.p_customer_id || CUSTOMER_ID,
              week_start_date: d,
              week_end_date: d,
              due_date: d,
              due_amount: 50000,
              paid: false,
              payment_id: null,
              absence_recorded: false,
              absence_approved: null,
            });
          }
          return req.reply({
            statusCode: 200,
            body: [{ success: true, schedules_created: count, error_message: null }],
          });
        }
        if (rpcName === 'approve_absence') {
          const ab = db.absences.find((a) => a.id === body?.p_absence_id);
          if (ab) ab.status = body?.p_approve ? 'approved' : 'rejected';
          return req.reply({
            statusCode: 200,
            body: [{ success: true, absence_id: body?.p_absence_id, error_message: null }],
          });
        }
        if (rpcName === 'reverse_payment') {
          const ph = db.payment_history.find(
            (h) => h.original_payment_id === body?.p_payment_id || h.id === body?.p_payment_id,
          );
          if (ph) {
            ph.reversed = true;
            ph.reversed_reason = body?.p_reason;
          }
          return req.reply({ statusCode: 200, body: [{ success: true, error_message: null }] });
        }
        if (rpcName === 'update_online_payment_status') {
          const op = db.online_payments.find(
            (o) => o.id === body?.p_payment_id || o.payment_id === body?.p_payment_id,
          );
          if (op) op.status = body?.p_new_status;
          return req.reply({ statusCode: 200, body: [{ success: true, error_message: null }] });
        }
        if (rpcName === 'get_customer_payment_summary') {
          return req.reply({
            statusCode: 200,
            body: [
              {
                success: true,
                outstanding_balance: 550000,
                total_due: 600000,
                total_paid: 50000,
                next_due_date: '2026-11-30',
                next_due_amount: 50000,
                error_message: null,
              },
            ],
          });
        }
        return req.reply({ statusCode: 200, body: [] });
      }

      if (url.pathname.startsWith('/rest/v1/')) {
        const table = url.pathname.replace('/rest/v1/', '');
        const rows = db[table] || [];
        if (method === 'GET' || method === 'HEAD') {
          const filtered = applyFilters(rows, url);
          if (isSingle) {
            if (!filtered.length) {
              return req.reply({ statusCode: 406, body: { code: 'PGRST116', message: '0 rows' } });
            }
            return req.reply({ statusCode: 200, body: filtered[0] });
          }
          return req.reply({ statusCode: 200, body: filtered });
        }
        if (method === 'POST') {
          const items = Array.isArray(body) ? body : [body];
          const inserted = items.map((item, idx) => {
            const rec = {
              id: item.id || `99999999-9999-4999-8999-${String(Date.now() + idx).slice(-12)}`,
              created_at: new Date().toISOString(),
              ...item,
            };
            if (table === 'customers') {
              const v = db.villages.find((vl) => vl.id === rec.village_id);
              rec.villages = v ? { name: v.name } : null;
            }
            if (table === 'online_payments') {
              const c = db.customers.find((cu) => cu.id === rec.customer_id);
              rec.customers = c ? { name: c.name } : null;
            }
            if (table === 'settings') {
              const i = rows.findIndex((r) => r.key === rec.key);
              if (i >= 0) rows[i] = { ...rows[i], ...rec };
              else rows.push(rec);
              return rec;
            }
            rows.push(rec);
            return rec;
          });
          return req.reply({ statusCode: 201, body: isSingle ? inserted[0] : inserted });
        }
        if (method === 'PATCH') {
          const targets = applyFilters(rows, url);
          const ids = new Set(targets.map((t) => t.id));
          const updated = [];
          for (const r of rows) {
            if (ids.has(r.id) || (targets.length === rows.length && !url.searchParams.get('id'))) {
              Object.assign(r, body);
              updated.push(r);
            }
          }
          return req.reply({ statusCode: 200, body: isSingle ? updated[0] || {} : updated });
        }
        if (method === 'DELETE') {
          const targets = applyFilters(rows, url);
          const ids = new Set(targets.map((t) => t.id));
          db[table] = rows.filter((r) => !ids.has(r.id));
          return req.reply({ statusCode: 200, body: targets });
        }
      }
      return req.reply({ statusCode: 200, body: {} });
    });
  }

  function visitAuthed(path, extraInit) {
    const { session } = makeSession();
    cy.visit(path, {
      onBeforeLoad(win) {
        win.localStorage.setItem('sb-hlkvaxmqbzdbzcjnrrdh-auth-token', JSON.stringify(session));
        win.print = cy.stub().as('windowPrint');
        if (win.URL) {
          win.URL.createObjectURL = cy.stub().returns('blob:mock-csv');
          win.URL.revokeObjectURL = cy.stub();
        }
        if (extraInit) extraInit(win);
      },
    });
  }

  let db;
  beforeEach(() => {
    db = createDb();
    mountBackend(db);
  });

  it('exercises Header (language switcher, theme toggle), Dashboard & Navigation buttons', () => {
    visitAuthed('/dashboard');
    cy.get('app-premium-dashboard').should('be.visible');

    // Language switcher: English -> Telugu -> English
    cy.get('app-language-switcher button').first().click();
    cy.contains('app-language-switcher button', 'తెలుగు').click();
    cy.get('app-language-switcher button').first().click();
    cy.contains('app-language-switcher button', 'English').click();

    // Theme toggle
    cy.get('app-header button[aria-label*="Switch to"]').click();
    cy.get('app-header button[aria-label*="Switch to"]').click();

    // Dashboard primary CTA links work
    cy.get('app-premium-dashboard a[href="/customers"]').click();
    cy.url().should('include', '/customers');
  });

  it('exercises Villages buttons: Add, Edit, Save/Cancel, Archive/Restore, inline Delete', () => {
    visitAuthed('/villages');
    cy.get('app-villages').should('be.visible');

    cy.get('app-villages form input').first().type('Rampuram');
    cy.get('app-villages form button[type="submit"]').click();
    cy.contains('Rampuram').should('be.visible');

    // Edit & Cancel, then Edit & Save
    cy.contains('Rampuram').parents('.fx-card, div').first();
    cy.get('app-villages button:contains("Edit")').last().click();
    cy.get('app-villages button:contains("Cancel")').click();
    cy.get('app-villages button:contains("Edit")').last().click();
    cy.get('app-villages button:contains("Save")').click();

    // Archive toggle
    cy.get('app-villages button:contains("Archive")').first().click();
    cy.contains('Archived').should('be.visible');

    // Delete inline: cancel then confirm
    cy.get('app-villages button[aria-label="Delete village"]').last().click();
    cy.get('app-villages button:contains("Cancel")').click();
    cy.get('app-villages button[aria-label="Delete village"]').last().click();
    cy.get('app-villages button:contains("Delete")').last().click();
    cy.contains('Rampuram').should('not.exist');
  });

  it('exercises Customers List filters, Customer Form (?villageId, optional phone/email) & Customer Detail buttons', () => {
    visitAuthed('/customers');
    cy.get('app-customer-list').should('be.visible');

    // Status pills
    cy.contains('app-customer-list button', 'Active').click();
    cy.contains('app-customer-list button', 'With Dues').click();
    cy.contains('app-customer-list button', 'All').click();

    // Inline delete cancel
    cy.get('app-customer-list button[aria-label="Delete customer"]').first().click();
    cy.contains('app-customer-list button', 'Cancel').click();

    // Add New Customer with village preselected
    visitAuthed(`/customers/new?villageId=${VILLAGE_ID}`);
    cy.get('app-customer-form').should('be.visible');
    cy.get('app-customer-form input[formControlName="name"]').type('Lakshmi');
    cy.get('app-customer-form input[formControlName="loan_amount"]').clear().type('10000');
    cy.contains('app-customer-form button', '21 Weeks').click();
    cy.get('app-customer-form button[type="submit"]').click();
    cy.url().should('match', /\/customers$/);
    cy.contains('Lakshmi').should('be.visible');

    // Customer Detail: absences approve + Edit Profile
    visitAuthed(`/customers/${CUSTOMER_ID}`);
    cy.get('app-customer-detail').should('be.visible');
    cy.contains('app-customer-detail button', 'Absence History').click();
    cy.contains('app-customer-detail button', 'Approve').first().click();
    cy.contains('app-customer-detail button', 'Edit Profile').click();
    cy.url().should('include', `/customers/${CUSTOMER_ID}/edit`);
  });

  it('exercises Collections payment (recovering from 42703 p_payment_id) & Weekly Tracker Mark Absent (recovering from 42703 profile_id)', () => {
    visitAuthed(`/collections?customerId=${CUSTOMER_ID}`);
    cy.get('app-collection-entry').should('be.visible');

    cy.contains('app-collection-entry button', '2 Weeks').click();
    cy.contains('app-collection-entry button', '1 Week').click();
    cy.contains('app-collection-entry label', /online/i).click();
    cy.contains('app-collection-entry label', /cash/i).click();
    cy.get('app-collection-entry button[type="submit"]').click();
    cy.contains(/Successfully recorded collection of ₹/i).should('be.visible');

    // Weekly Tracker tab
    cy.contains('button', 'Weekly Tracker').click();
    cy.get('app-weekly-tracker').should('be.visible');
    cy.contains('app-weekly-tracker button', 'Generate').first().click();
    cy.contains('app-weekly-tracker button', 'Mark Absent').first().click();
    cy.get('app-weekly-tracker input').last().type('Medical leave');
    cy.contains('app-weekly-tracker button', 'Confirm').click();
    cy.contains(/Absence recorded/i).should('be.visible');
  });

  it('exercises Ledger (CSV, Print, Refresh, Reverse), Reports, Online Payments, Outbox, Settings & Audit Log', () => {
    // Ledger
    visitAuthed('/ledger');
    cy.contains('app-ledger button', 'srinu').first().click();
    cy.contains('app-ledger button', 'Export CSV').click();
    cy.contains('app-ledger button', 'Print').click();
    cy.get('@windowPrint').should('have.been.called');
    cy.contains('app-ledger button', 'Reverse').first().click();
    cy.get('app-ledger input[placeholder*="reason" i]').type('Test reversal');
    cy.contains('app-ledger button', 'Confirm').click();
    cy.contains('Reversed').should('be.visible');

    // Reports
    visitAuthed('/reports');
    cy.contains('app-reports button', '7 Days').click();
    cy.contains('app-reports button', 'This Month').click();
    cy.contains('app-reports button', 'Apply').click();
    cy.contains('app-reports button', 'Export Payments').click();
    cy.contains('app-reports button', 'Export Balances').click();
    cy.get('app-reports input[type="tel"]').type('+919876543210');
    cy.get('app-reports glass-dropdown button').first().click();
    cy.contains('app-reports', 'Payments Report').click();
    cy.contains(/sent successfully/i).should('be.visible');

    // Online Payments
    visitAuthed('/online-payments');
    cy.get('app-online-payments select').first().select(CUSTOMER_ID);
    cy.get('app-online-payments input').eq(0).type('TXN-888');
    cy.get('app-online-payments input').eq(1).clear().type('500');
    cy.contains('app-online-payments button', 'Record').click();
    cy.contains('TXN-888').should('be.visible');
    cy.contains('app-online-payments button', 'Mark paid').first().click();

    // Outbox
    visitAuthed('/outbox', (win) => {
      const req = win.indexedDB.open('finance-audit-pro-offline', 1);
      req.onupgradeneeded = () => {
        const idb = req.result;
        if (!idb.objectStoreNames.contains('cache')) idb.createObjectStore('cache', { keyPath: 'key' });
        if (!idb.objectStoreNames.contains('outbox')) {
          const st = idb.createObjectStore('outbox', { keyPath: 'id', autoIncrement: true });
          st.createIndex('by_status', 'status', { unique: false });
          st.createIndex('by_created', 'createdAt', { unique: false });
        }
      };
      req.onsuccess = () => {
        const tx = req.result.transaction('outbox', 'readwrite');
        tx.objectStore('outbox').put({
          customerId: CUSTOMER_ID,
          customerName: 'srinu-outbox',
          amountPaise: 50000,
          method: 'cash',
          reference: 'OFF-1',
          notes: 'Offline payment',
          createdAt: Date.now(),
          attempts: 0,
          lastError: null,
          status: 'pending',
        });
      };
    });
    cy.contains('srinu-outbox').should('be.visible');
    cy.contains('app-outbox button', 'Sync now').click();
    cy.contains('srinu-outbox').should('not.exist');

    // Settings
    visitAuthed('/settings');
    cy.get('app-settings').should('be.visible');
    cy.get('app-settings glass-switch button[role="switch"]').first().click();
    cy.contains('app-settings button', 'Save').first().click();
    cy.contains('app-settings button', 'Test').click();

    // Audit Log
    visitAuthed('/audit-log');
    cy.get('app-audit-log').should('be.visible');
  });
});

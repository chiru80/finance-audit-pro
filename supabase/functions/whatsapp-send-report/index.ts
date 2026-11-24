import { serve } from 'https://deno.land/std@0.224.0/http/server.ts';
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.45.4';
import { OpenWAClient } from 'npm:@rmyndharis/openwa@0.12.1';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
};

type ReportType = 'payments' | 'balances' | 'summary';

interface SendReportPayload {
  reportType: ReportType;
  recipientPhone: string;
  recipientName?: string;
  startDate?: string;
  endDate?: string;
  messageIdempotencyKey?: string;
}

function jsonResponse(data: unknown, status = 200) {
  return new Response(JSON.stringify(data), {
    status,
    headers: { ...corsHeaders, 'Content-Type': 'application/json' },
  });
}

async function buildMessage(
  supabase: ReturnType<typeof createClient>,
  profileId: string,
  reportType: ReportType,
  startDate?: string,
  endDate?: string,
): Promise<string> {
  const { data: customers } = await supabase
    .from('customers')
    .select('id, name, phone, outstanding_balance, total_due, total_paid, status')
    .order('outstanding_balance', { ascending: false })
    .limit(50);

  const { data: payments } = await supabase
    .from('payment_history')
    .select('*, customers(name)')
    .order('payment_date', { ascending: false })
    .limit(100);

  let msg = `*Finance Audit Pro — ${reportType.toUpperCase()} Report*`;
  if (startDate || endDate) {
    msg += `\n📅 ${startDate || 'All time'} → ${endDate || 'Today'}`;
  }
  msg += '\n────────────────────';

  if (reportType === 'summary' || reportType === 'balances') {
    const totalOutstanding = customers?.reduce((s: number, c: any) => s + (c.outstanding_balance || 0), 0) || 0;
    const totalPaid = customers?.reduce((s: number, c: any) => s + (c.total_paid || 0), 0) || 0;
    const totalCustomers = customers?.length || 0;

    msg += `\n\n💼 *Portfolio Summary*`;
    msg += `\n• Customers: ${totalCustomers}`;
    msg += `\n• Outstanding: ₹${(totalOutstanding / 100).toLocaleString('en-IN', { minimumFractionDigits: 2 })}`;
    msg += `\n• Total Paid: ₹${(totalPaid / 100).toLocaleString('en-IN', { minimumFractionDigits: 2 })}`;
  }

  if (reportType === 'balances' || reportType === 'summary') {
    msg += `\n\n🔴 *Top Outstanding Balances*`;
    const top5 = customers?.slice(0, 5) || [];
    for (const c of top5) {
      msg += `\n• ${c.name} — ₹${((c.outstanding_balance || 0) / 100).toLocaleString('en-IN', { minimumFractionDigits: 2 })}`;
      if (c.phone) msg += ` (${c.phone})`;
    }
  }

  if (reportType === 'payments' || reportType === 'summary') {
    msg += `\n\n💰 *Recent Payments (${payments?.length || 0})*`;
    const recent = payments?.slice(0, 8) || [];
    for (const p of recent) {
      const amt = (p.amount || 0) / 100;
      const name = p.customers?.name || 'Unknown';
      const date = p.payment_date ? new Date(p.payment_date).toLocaleDateString('en-IN', { day: '2-digit', month: 'short' }) : '—';
      msg += `\n• ${date} — ${name}: ₹${amt.toLocaleString('en-IN', { minimumFractionDigits: 2 })} (${p.payment_method})`;
    }
  }

  msg += '\n────────────────────';
  msg += '\n_Automated report from Finance Audit Pro_';
  return msg;
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  if (req.method !== 'POST') {
    return jsonResponse({ error: 'Method not allowed' }, 405);
  }

  try {
    const authHeader = req.headers.get('Authorization');
    if (!authHeader) {
      return jsonResponse({ error: 'Missing Authorization header' }, 401);
    }

    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseAnonKey = Deno.env.get('SUPABASE_ANON_KEY')!;
    const supabase = createClient(supabaseUrl, supabaseAnonKey, {
      global: { headers: { Authorization: authHeader } },
    });

    const { data: { user }, error: userErr } = await supabase.auth.getUser();
    if (userErr || !user) {
      return jsonResponse({ error: 'Invalid or expired session' }, 401);
    }

    const profileId = user.id;

    const { data: cfg, error: cfgErr } = await supabase
      .from('app_whatsapp_config')
      .select('base_url, api_key, session_name')
      .eq('id', true)
      .single();

    if (cfgErr || !cfg) {
      return jsonResponse({ error: 'WhatsApp not configured. Set base URL and API key in Settings.' }, 400);
    }

    if (!cfg.base_url || !cfg.api_key) {
      return jsonResponse({ error: 'WhatsApp gateway URL and API key are required.' }, 400);
    }

    const body = await req.json() as SendReportPayload;
    const { reportType, recipientPhone, recipientName, startDate, endDate, messageIdempotencyKey } = body;

    if (!reportType || !['payments', 'balances', 'summary'].includes(reportType)) {
      return jsonResponse({ error: 'Invalid reportType. Must be: payments, balances, or summary.' }, 400);
    }
    if (!recipientPhone || !/^\+\d{8,15}$/.test(recipientPhone)) {
      return jsonResponse({ error: 'Invalid recipientPhone. Must be E.164 format (e.g., +919876543210).' }, 400);
    }

    const message = await buildMessage(supabase, profileId, reportType, startDate, endDate);

    const openwa = new OpenWAClient({
      baseUrl: cfg.base_url.replace(/\/$/, ''),
      apiKey: cfg.api_key,
      timeoutMs: 30000,
    });

    const result = await openwa.messages.sendText(cfg.session_name, {
      chatId: recipientPhone.replace('+', '').replace(/\D/g, '') + '@c.us',
      text: message,
    }, messageIdempotencyKey ? { headers: { 'Idempotency-Key': messageIdempotencyKey } } : undefined);

    const serviceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY');
    const auditClient = serviceKey ? createClient(supabaseUrl, serviceKey) : supabase;

    await auditClient.from('whatsapp_report_sends').insert({
      profile_id: profileId,
      recipient_phone: recipientPhone,
      recipient_name: recipientName || null,
      report_type: reportType,
      message_id: result?.messageId || null,
      delivered: !!result?.messageId,
      error: null,
    });

    return jsonResponse({
      success: true,
      messageId: result?.messageId,
      timestamp: result?.timestamp,
    });
  } catch (err) {
    console.error('whatsapp-send-report error:', err);
    const msg = err instanceof Error ? err.message : 'Unknown error';

    try {
      const authHeader = req.headers.get('Authorization');
      if (authHeader) {
        const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
        const serviceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY');
        if (serviceKey) {
          const auditClient = createClient(supabaseUrl, serviceKey);
          const { data: { user } } = await auditClient.auth.getUser(authHeader.replace('Bearer ', ''));
          if (user) {
            const body = await req.json().catch(() => ({})) as SendReportPayload;
            await auditClient.from('whatsapp_report_sends').insert({
              profile_id: user.id,
              recipient_phone: body.recipientPhone || 'unknown',
              recipient_name: body.recipientName || null,
              report_type: body.reportType || 'unknown',
              message_id: null,
              delivered: false,
              error: msg.slice(0, 500),
            });
          }
        }
      }
    } catch {
      // Ignore audit failures
    }

    if (msg.includes('401') || msg.includes('403') || msg.includes('Invalid API key')) {
      return jsonResponse({ error: 'Invalid OpenWA API key. Check Settings → WhatsApp.' }, 401);
    }
    if (msg.includes('409') || msg.includes('session not ready') || msg.includes('unlinked')) {
      return jsonResponse({ error: 'WhatsApp session not linked/ready. Scan QR or pair in OpenWA dashboard.' }, 409);
    }
    if (msg.includes('404') || msg.includes('session not found')) {
      return jsonResponse({ error: 'WhatsApp session not found. Check session name in Settings.' }, 404);
    }
    if (msg.includes('429') || msg.includes('rate limit')) {
      return jsonResponse({ error: 'Rate limited by OpenWA gateway. Try again shortly.' }, 429);
    }

    return jsonResponse({ error: msg }, 500);
  }
});

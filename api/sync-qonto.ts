import { createClient } from '@supabase/supabase-js';

// INLINED Supabase Client initialization to avoid path/import issues in Vercel Functions
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || '';
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY || '';
const supabase = createClient(supabaseUrl, supabaseServiceKey);

export default async function handler(req: any, res: any) {
  // 1. Check Env Vars
  const QONTO_SLUG = process.env.QONTO_SLUG;
  const QONTO_SECRET = process.env.QONTO_SECRET;
  const QONTO_IBAN = process.env.QONTO_IBAN;

  if (!QONTO_SLUG || !QONTO_SECRET || !QONTO_IBAN) {
    return res.status(500).json({ error: 'Missing Qonto logs' });
  }

  try {
    // 2. Qonto Fetch
    const qontoRes = await fetch(`https://thirdparty.qonto.com/v2/transactions?iban=${QONTO_IBAN}`, {
      headers: {
        'Authorization': `${QONTO_SLUG}:${QONTO_SECRET}`,
        'Accept': 'application/json',
      },
    });

    if (!qontoRes.ok) {
      const err = await qontoRes.json().catch(() => ({}));
      return res.status(qontoRes.status).json({ error: 'Qonto API error', details: err });
    }

    const data = await qontoRes.json();
    const transactions = data.transactions || [];

    if (transactions.length === 0) {
      return res.status(200).json({ success: true, count: 0 });
    }

    // 3. Supabase Upsert
    const toUpsert = transactions.map((tx: any) => ({
      qonto_transaction_id: tx.id,
      amount: tx.amount,
      label: tx.label,
      side: tx.side,
      settled_at: tx.settled_at,
    }));

    const { error } = await supabase
      .from('transactions')
      .upsert(toUpsert, { onConflict: 'qonto_transaction_id' });

    if (error) {
      return res.status(500).json({ error: 'Supabase error', details: error });
    }

    return res.status(200).json({ success: true, count: toUpsert.length });

  } catch (err: any) {
    return res.status(500).json({ error: 'Server error', message: err.message });
  }
}

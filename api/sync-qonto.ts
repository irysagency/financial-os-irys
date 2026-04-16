import { supabase } from '../services/supabase';

// Standard Vercel Serverless Function signature for Node.js
export default async function handler(req: any, res: any) {
  // Allow only GET requests (optional)
  if (req.method !== 'GET' && req.method !== 'POST') {
    return res.status(405).json({ error: 'Method Not Allowed' });
  }

  const QONTO_SLUG = process.env.QONTO_SLUG;
  const QONTO_SECRET = process.env.QONTO_SECRET;
  const QONTO_IBAN = process.env.QONTO_IBAN;

  if (!QONTO_SLUG || !QONTO_SECRET || !QONTO_IBAN) {
    return res.status(500).json({ error: 'Missing Qonto credentials in environment variables' });
  }

  try {
    // 1. Call Qonto API
    const qontoResponse = await fetch(`https://thirdparty.qonto.com/v2/transactions?iban=${QONTO_IBAN}`, {
      headers: {
        'Authorization': `${QONTO_SLUG}:${QONTO_SECRET}`,
        'Accept': 'application/json',
      },
    });

    if (!qontoResponse.ok) {
      const errorData = await qontoResponse.json();
      return res.status(qontoResponse.status).json({ error: 'Qonto API error', details: errorData });
    }

    const data = await qontoResponse.json();
    const qontoTransactions = data.transactions || [];

    if (qontoTransactions.length === 0) {
      return res.status(200).json({ success: true, count: 0, message: 'No transactions found' });
    }

    // 2. Transform data for Supabase
    const transactionsToUpsert = qontoTransactions.map((tx: any) => ({
      qonto_transaction_id: tx.id,
      amount: tx.amount,
      label: tx.label,
      side: tx.side,
      settled_at: tx.settled_at,
    }));

    // 3. Upsert into Supabase
    const { error: supabaseError } = await supabase
      .from('transactions')
      .upsert(transactionsToUpsert, { onConflict: 'qonto_transaction_id' });

    if (supabaseError) {
      console.error('Supabase Error:', supabaseError);
      return res.status(500).json({ error: 'Supabase upsert error', details: supabaseError });
    }

    return res.status(200).json({ success: true, count: transactionsToUpsert.length });

  } catch (error: any) {
    console.error('Server Internal Error:', error);
    return res.status(500).json({ error: 'Internal Server Error', message: error.message });
  }
}

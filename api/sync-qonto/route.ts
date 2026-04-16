import { supabase } from '../../services/supabase';

export async function GET() {
  const QONTO_SLUG = process.env.QONTO_SLUG;
  const QONTO_SECRET = process.env.QONTO_SECRET;
  const QONTO_IBAN = process.env.QONTO_IBAN;

  if (!QONTO_SLUG || !QONTO_SECRET || !QONTO_IBAN) {
    return new Response(JSON.stringify({ error: 'Missing Qonto credentials' }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' },
    });
  }

  try {
    // 1. Call Qonto API
    const response = await fetch(`https://thirdparty.qonto.com/v2/transactions?iban=${QONTO_IBAN}`, {
      headers: {
        'Authorization': `${QONTO_SLUG}:${QONTO_SECRET}`,
        'Accept': 'application/json',
      },
    });

    if (!response.ok) {
      const errorData = await response.json();
      return new Response(JSON.stringify({ error: 'Qonto API error', details: errorData }), {
        status: response.status,
        headers: { 'Content-Type': 'application/json' },
      });
    }

    const data = await response.json();
    const qontoTransactions = data.transactions || [];

    // 2. Transform data for Supabase
    // Table columns: qonto_transaction_id, amount, label, side, settled_at
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
      return new Response(JSON.stringify({ error: 'Supabase upsert error', details: supabaseError }), {
        status: 500,
        headers: { 'Content-Type': 'application/json' },
      });
    }

    return new Response(JSON.stringify({ success: true, count: transactionsToUpsert.length }), {
      status: 200,
      headers: { 'Content-Type': 'application/json' },
    });

  } catch (error: any) {
    return new Response(JSON.stringify({ error: 'Internal Server Error', message: error.message }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' },
    });
  }
}

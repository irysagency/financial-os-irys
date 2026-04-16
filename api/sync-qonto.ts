import { supabase } from '../services/supabase';

export default async function handler(req: any, res: any) {
  // Config
  const QONTO_SLUG = process.env.QONTO_SLUG;
  const QONTO_SECRET = process.env.QONTO_SECRET;
  const QONTO_IBAN = process.env.QONTO_IBAN;

  if (!QONTO_SLUG || !QONTO_SECRET || !QONTO_IBAN) {
    return res.status(500).json({ 
      error: 'Variables d\'environnement Qonto manquantes (SLUG, SECRET ou IBAN)' 
    });
  }

  try {
    // 1. Récupération des transactions depuis Qonto
    const qontoResponse = await fetch(`https://thirdparty.qonto.com/v2/transactions?iban=${QONTO_IBAN}`, {
      headers: {
        'Authorization': `${QONTO_SLUG}:${QONTO_SECRET}`,
        'Accept': 'application/json',
      },
    });

    if (!qontoResponse.ok) {
      const errorData = await qontoResponse.json().catch(() => ({}));
      return res.status(qontoResponse.status).json({ 
        error: 'Erreur API Qonto', 
        details: errorData 
      });
    }

    const data = await qontoResponse.json();
    const qontoTransactions = data.transactions || [];

    if (qontoTransactions.length === 0) {
      return res.status(200).json({ success: true, count: 0 });
    }

    // 2. Transformation des données pour Supabase
    // Colonnes : qonto_transaction_id, amount, label, side, settled_at
    const transactionsToUpsert = qontoTransactions.map((tx: any) => ({
      qonto_transaction_id: tx.id,
      amount: tx.amount,
      label: tx.label,
      side: tx.side,
      settled_at: tx.settled_at,
    }));

    // 3. Upsert dans Supabase (évite les doublons via qonto_transaction_id)
    const { error: supabaseError } = await supabase
      .from('transactions')
      .upsert(transactionsToUpsert, { onConflict: 'qonto_transaction_id' });

    if (supabaseError) {
      console.error('Supabase Error:', supabaseError);
      return res.status(500).json({ 
        error: 'Erreur Supabase lors de l\'insertion', 
        details: supabaseError 
      });
    }

    return res.status(200).json({ success: true, count: transactionsToUpsert.length });

  } catch (error: any) {
    console.error('Sync Error:', error);
    return res.status(500).json({ 
      error: 'Erreur interne du serveur', 
      message: error.message 
    });
  }
}

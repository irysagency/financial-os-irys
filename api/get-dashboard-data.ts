import { createClient } from '@supabase/supabase-js';

// Inlined Supabase Client
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || '';
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY || '';
const supabase = createClient(supabaseUrl, supabaseServiceKey);

export default async function handler(req: any, res: any) {
  try {
    // 1. Fetch Transactions from Supabase
    const { data: transactions, error } = await supabase
      .from('transactions')
      .select('*')
      .order('settled_at', { ascending: false });

    if (error) {
      return res.status(500).json({ error: 'Supabase Error', details: error });
    }

    // 2. Map to frontend types
    const mappedTransactions = (transactions || []).map((tx: any) => ({
      id: tx.qonto_transaction_id,
      name: tx.label || 'Sans libellé',
      type: tx.side === 'credit' ? 'Income' : 'Expense',
      amount: tx.side === 'credit' ? tx.amount : -tx.amount,
      date: tx.settled_at ? new Date(tx.settled_at).toLocaleDateString('fr-FR') : 'Date inconnue',
    }));

    // 3. Calculate KPIs
    const now = new Date();
    const currentMonth = now.getMonth();
    const currentYear = now.getFullYear();

    let totalRevenue = 0;
    let totalExpenses = 0;
    let monthlyRevenue = 0;
    let monthlyExpenses = 0;

    (transactions || []).forEach((tx: any) => {
      const txDate = new Date(tx.settled_at);
      const isCurrentMonth = txDate.getMonth() === currentMonth && txDate.getFullYear() === currentYear;

      if (tx.side === 'credit') {
        totalRevenue += tx.amount;
        if (isCurrentMonth) monthlyRevenue += tx.amount;
      } else {
        totalExpenses += tx.amount;
        if (isCurrentMonth) monthlyExpenses += tx.amount;
      }
    });

    const totalBalance = totalRevenue - totalExpenses;

    // 4. Construct Response
    // We mix real data (transactions, KPIs) with some mock data for parts not yet in Supabase
    return res.status(200).json({
      kpis: [
        { title: 'Solde Total', amount: totalBalance, trend: 12 }, // Trend mock for now
        { title: 'Revenus (Mois)', amount: monthlyRevenue, trend: 8 },
        { title: 'Dépenses (Mois)', amount: monthlyExpenses, trend: -5 },
        { title: 'Résultat Net', amount: monthlyRevenue - monthlyExpenses, trend: 15 }
      ],
      recentTransactions: mappedTransactions.slice(0, 5),
      allTransactions: mappedTransactions,
      // For now, these are still needed to avoid empty UI
      expenseDistribution: [
        { name: 'Opérations', value: 45, color: '#FF4D00' },
        { name: 'Marketing', value: 25, color: '#FF8A00' },
        { name: 'Technique', value: 20, color: '#444' },
        { name: 'Autres', value: 10, color: '#2A2A2A' }
      ]
    });

  } catch (err: any) {
    return res.status(500).json({ error: 'Internal Server Error', message: err.message });
  }
}

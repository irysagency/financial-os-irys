import { createClient } from '@supabase/supabase-js';

// Inlined Supabase Client
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || '';
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY || '';
const supabase = createClient(supabaseUrl, supabaseServiceKey);

const CATEGORY_COLORS: Record<string, string> = {
  'Marketing': '#FF4D00',
  'Technique': '#FF8A00',
  'Opérations': '#444444',
  'Frais': '#2A2A2A',
  'Autres': '#1A1A1A',
};

const CATEGORY_MAP: Record<string, string> = {
  'notion': 'Technique',
  'google': 'Technique',
  'aws': 'Technique',
  'vercel': 'Technique',
  'github': 'Technique',
  'claude': 'Technique',
  'squarespace': 'Technique',
  'adobe': 'Opérations',
  'figma': 'Technique',
  'apple': 'Opérations',
  'meta': 'Marketing',
  'facebook': 'Marketing',
  'instagram': 'Marketing',
  'linkedin': 'Marketing',
  'metricool': 'Marketing',
  'ads': 'Marketing',
  'qonto': 'Frais',
  'stripe': 'Opérations',
  'commission': 'Frais',
  'frais': 'Frais',
};

function categorize(label: string): string {
  const lowLabel = label.toLowerCase();
  for (const [key, category] of Object.entries(CATEGORY_MAP)) {
    if (lowLabel.includes(key)) return category;
  }
  return 'Autres';
}

export default async function handler(req: any, res: any) {
  const apiSecret = process.env.API_SECRET;
  if (apiSecret && req.headers['x-api-token'] !== apiSecret) {
    return res.status(401).json({ error: 'Unauthorized' });
  }

  try {
    const { data: transactions, error } = await supabase
      .from('transactions')
      .select('*')
      .order('settled_at', { ascending: false });

    if (error) return res.status(500).json({ error: 'Supabase Error', details: error });

    const now = new Date();
    const currentMonth = now.getMonth();
    const currentYear = now.getFullYear();
    const prevMonthDate = new Date(currentYear, currentMonth - 1, 1);
    const prevMonth = prevMonthDate.getMonth();
    const prevYear = prevMonthDate.getFullYear();

    // 1. Calculations
    let metrics = {
      current: { revenue: 0, expenses: 0, balance: 0 },
      previous: { revenue: 0, expenses: 0, balance: 0 },
      totalBalance: 0
    };

    const monthlyData: Record<string, { ca: number, charges: number, resultat: number, fraisBancaires: number }> = {};
    const categoryTotals: Record<string, number> = {};
    const clientData: Record<string, { total: number, months: Set<string> }> = {};
    let totalExpenseAmount = 0;

    (transactions || []).forEach((tx: any) => {
      const txDate = new Date(tx.settled_at);
      const txMonth = txDate.getMonth();
      const txYear = txDate.getFullYear();
      const monthKey = `${txYear}-${String(txMonth + 1).padStart(2, '0')}`;

      // Initialize monthly aggregation
      if (!monthlyData[monthKey]) {
        monthlyData[monthKey] = { ca: 0, charges: 0, resultat: 0, fraisBancaires: 0 };
      }

      const amount = tx.amount;
      if (tx.side === 'credit') {
        metrics.totalBalance += amount;
        monthlyData[monthKey].ca += amount;
        monthlyData[monthKey].resultat += amount;
        
        if (txMonth === currentMonth && txYear === currentYear) metrics.current.revenue += amount;
        if (txMonth === prevMonth && txYear === prevYear) metrics.previous.revenue += amount;

        // CREDIT - Client metrics
        const clientName = tx.label || 'Client Inconnu';
        if (!clientData[clientName]) clientData[clientName] = { total: 0, months: new Set() };
        clientData[clientName].total += amount;
        clientData[clientName].months.add(monthKey);
      } else {
        metrics.totalBalance -= amount;
        monthlyData[monthKey].charges += amount;
        monthlyData[monthKey].resultat -= amount;

        const cat = categorize(tx.label || '');
        if (cat === 'Frais' || (tx.label || '').toLowerCase().includes('qonto')) {
          monthlyData[monthKey].fraisBancaires += amount;
        }

        if (txMonth === currentMonth && txYear === currentYear) metrics.current.expenses += amount;
        if (txMonth === prevMonth && txYear === prevYear) metrics.previous.expenses += amount;

        categoryTotals[cat] = (categoryTotals[cat] || 0) + amount;
        totalExpenseAmount += amount;
      }
    });

    // Client KPIs
    const uniqueClients = Object.keys(clientData);
    const clientsCount = uniqueClients.length;
    const avgPanierMoyen = clientsCount ? Object.values(clientData).reduce((s, c) => s + c.total, 0) / clientsCount : 0;
    const avgLifetimeMonths = clientsCount ? Object.values(clientData).reduce((s, c) => s + c.months.size, 0) / clientsCount : 0;

    // 2. Trends
    const calcTrend = (curr: number, prev: number) => {
      if (prev === 0) return curr > 0 ? 100 : 0;
      return Math.round(((curr - prev) / prev) * 100);
    };

    const kpis = [
      { title: 'Solde Total', amount: metrics.totalBalance, trend: 0 }, // Trend for total balance is tricky, let's keep 0
      { title: 'Revenus (Mois)', amount: metrics.current.revenue, trend: calcTrend(metrics.current.revenue, metrics.previous.revenue) },
      { title: 'Dépenses (Mois)', amount: metrics.current.expenses, trend: calcTrend(metrics.current.expenses, metrics.previous.expenses) },
      { title: 'Résultat Net', amount: metrics.current.revenue - metrics.current.expenses, trend: calcTrend(metrics.current.revenue - metrics.current.expenses, metrics.previous.revenue - metrics.previous.expenses) }
    ];

    // 3. Chart Data (Current year Jan–Dec) + PnL history (all available months)
    const chartData = [];
    for (let m = 0; m < 12; m++) {
      const key = `${currentYear}-${String(m + 1).padStart(2, '0')}`;
      const data = monthlyData[key] || { ca: 0, charges: 0, resultat: 0, fraisBancaires: 0 };
      const d = new Date(currentYear, m, 1);
      chartData.push({
        mois: key,
        label: d.toLocaleDateString('fr-FR', { month: 'short', year: '2-digit' }),
        ca: data.ca,
        charges: data.charges,
        resultat: data.resultat,
        fraisBancaires: data.fraisBancaires,
        hasData: !!monthlyData[key]
      });
    }

    const pnlHistory = Object.keys(monthlyData).sort().map(key => {
      const data = monthlyData[key];
      const [y, m] = key.split('-').map(Number);
      const d = new Date(y, m - 1, 1);
      return {
        mois: key,
        label: d.toLocaleDateString('fr-FR', { month: 'short', year: '2-digit' }),
        ca: data.ca,
        charges: data.charges,
        resultat: data.resultat,
        fraisBancaires: data.fraisBancaires,
        hasData: true
      };
    });

    // 4. Expense Distribution
    const expenseDistribution = Object.entries(categoryTotals).map(([name, value]) => ({
      name,
      value: Math.round((value / totalExpenseAmount) * 100),
      color: CATEGORY_COLORS[name] || CATEGORY_COLORS['Autres']
    })).sort((a, b) => b.value - a.value);

    // 5. Subscription Detection (Improved with strict Whitelist)
    const SUBSCRIPTION_WHITELIST = ['Notion', 'Metricool', 'Squarespace', 'Claude', 'Anthropic', 'Google', 'Adobe', 'Figma', 'Slack', 'ChatGPT', 'Stripe'];
    
    // Transactions are ordered DESC (newest first), so first encounter = most recent
    const labelCounts: Record<string, { count: number, amounts: number[], mostRecentDate: string, officialName: string }> = {};
    (transactions || []).forEach(tx => {
      if (tx.side === 'debit') {
        const label = tx.label || '';
        const matchedProvider = SUBSCRIPTION_WHITELIST.find(p => label.toLowerCase().includes(p.toLowerCase()));

        if (matchedProvider) {
          if (!labelCounts[matchedProvider]) {
            // First encounter = most recent transaction (DESC order)
            labelCounts[matchedProvider] = { count: 0, amounts: [], mostRecentDate: tx.settled_at, officialName: matchedProvider };
          }
          const entry = labelCounts[matchedProvider];
          entry.count++;
          entry.amounts.push(tx.amount);
        }
      }
    });

    const subscriptions = Object.values(labelCounts)
      .map((data) => {
        // Compute next future payment date: most recent + 1 month, advance until in future
        const lastPaid = new Date(data.mostRecentDate);
        const next = new Date(lastPaid.getFullYear(), lastPaid.getMonth() + 1, lastPaid.getDate());
        const nowDate = new Date();
        while (next < nowDate) next.setMonth(next.getMonth() + 1);
        return {
          id: data.officialName,
          nom: data.officialName,
          montantHT: data.amounts[0], // Most recent amount (DESC order)
          frequence: 'Mensuel',
          statut: 'Actif',
          prochaineDate: next.toISOString().split('T')[0]
        };
      })
      .sort((a, b) => b.montantHT - a.montantHT);

    return res.status(200).json({
      kpis,
      chartData,
      expenseDistribution,
      subscriptions,
      recentTransactions: (transactions || []).slice(0, 100).map((tx: any) => ({
        id: tx.qonto_transaction_id,
        name: tx.label || 'Sans libellé',
        type: tx.side === 'credit' ? 'Income' : 'Expense',
        amount: tx.side === 'credit' ? tx.amount : -tx.amount,
        date: new Date(tx.settled_at).toLocaleDateString('fr-FR'),
      })),
      pnl: {
        history: pnlHistory,
        clientMetrics: {
          count: clientsCount,
          panierMoyen: avgPanierMoyen,
          ltv: avgPanierMoyen * avgLifetimeMonths,
          avgLifetime: avgLifetimeMonths
        }
      }
    });

  } catch (err: any) {
    return res.status(500).json({ error: 'Server Error', message: err.message });
  }
}

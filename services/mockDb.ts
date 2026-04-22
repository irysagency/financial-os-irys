import { KPIS, CASH_FLOW_DATA, RECENT_TRANSACTIONS, ANALYTICS_DATA, EXPENSE_DISTRIBUTION, MONTHLY_PNL, ABONNEMENTS_INITIALS, QONTO_PRESTATIONS } from '../constants/data';
import { User } from '../types';

const CURRENT_USER: User = {
  id: 'usr_001',
  email: 'contact@irysagency.com',
  fullName: 'Quentin Deleu',
  username: '@irysagency',
  avatarUrl: 'https://i.pravatar.cc/150?u=irysagency'
};

export const mockDb = {
  getUser: async (): Promise<User> => {
    return new Promise(resolve => setTimeout(() => resolve(CURRENT_USER), 300));
  },

  getDashboardData: async () => {
    // Derive pnl.history from MONTHLY_PNL
    const history = MONTHLY_PNL.map(m => ({
      mois: m.mois,
      label: m.label,
      ca: m.caHT,
      charges: m.totalChargesHT + m.fraisBanc,
      resultat: m.resultatNet,
      fraisBancaires: m.fraisBanc,
      hasData: true,
    }));

    // Derive clientMetrics from QONTO_PRESTATIONS
    const clientMonths = new Map<string, Set<string>>();
    const clientTotals = new Map<string, number>();
    for (const p of QONTO_PRESTATIONS) {
      const month = p.dateDebut.slice(0, 7);
      if (!clientMonths.has(p.client)) clientMonths.set(p.client, new Set());
      clientMonths.get(p.client)!.add(month);
      clientTotals.set(p.client, (clientTotals.get(p.client) || 0) + p.montantHT);
    }
    const count = clientMonths.size;
    const totalCA = Array.from(clientTotals.values()).reduce((s, v) => s + v, 0);
    const panierMoyen = count > 0 ? totalCA / count : 0;
    const totalMonthsSum = Array.from(clientMonths.values()).reduce((s, set) => s + set.size, 0);
    const avgLifetime = count > 0 ? totalMonthsSum / count : 0;
    const ltv = panierMoyen * avgLifetime;

    const payload = {
      kpis: KPIS,
      cashFlow: CASH_FLOW_DATA,
      subscriptions: ABONNEMENTS_INITIALS,
      recentTransactions: RECENT_TRANSACTIONS,
      expenseDistribution: EXPENSE_DISTRIBUTION,
      pnl: {
        history,
        clientMetrics: { count, panierMoyen, ltv, avgLifetime },
      },
    };

    return new Promise(resolve => setTimeout(() => resolve(payload), 300));
  },

  getAnalyticsData: async () => {
    return new Promise(resolve => setTimeout(() => resolve({
      chart: ANALYTICS_DATA,
    }), 200));
  },
};

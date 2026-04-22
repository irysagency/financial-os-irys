import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { User, StatCardData, Transaction, ChartDataPoint, AbonnementItem } from '../types';
import { mockDb } from '../services/mockDb';

interface AppState {
  user: User | null;
  isLoading: boolean;
  kpis: StatCardData[];
  cashFlow: any[]; // shape { mois, label, ca, charges, resultat, fraisBancaires, hasData }
  subscriptions: AbonnementItem[];
  recentTransactions: Transaction[];
  expenseDistribution: any[];
  analyticsData: ChartDataPoint[];
  pnl: any | null;
  refreshData: () => void;
}

const AppContext = createContext<AppState | undefined>(undefined);

export const AppProvider = ({ children }: { children: ReactNode }) => {
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  const [kpis, setKpis] = useState<StatCardData[]>([]);
  const [cashFlow, setCashFlow] = useState<any[]>([]);
  const [subscriptions, setSubscriptions] = useState<AbonnementItem[]>([]);
  const [recentTransactions, setRecentTransactions] = useState<Transaction[]>([]);
  const [expenseDistribution, setExpenseDistribution] = useState<any[]>([]);
  const [analyticsData, setAnalyticsData] = useState<ChartDataPoint[]>([]);
  const [pnl, setPnl] = useState<any | null>(null);

  const applyMockDashboard = async () => {
    const dashboard: any = await mockDb.getDashboardData();
    setKpis(dashboard.kpis);
    setCashFlow(dashboard.cashFlow);
    setSubscriptions(dashboard.subscriptions);
    setRecentTransactions(dashboard.recentTransactions);
    setExpenseDistribution(dashboard.expenseDistribution);
    setPnl(dashboard.pnl);
  };

  const loadData = async () => {
    setIsLoading(true);
    try {
      const u = await mockDb.getUser();
      setUser(u);

      // Try the real API route (works in Vercel production).
      let usedApi = false;
      try {
        const response = await fetch('/api/get-dashboard-data');
        if (response.ok) {
          try {
            const dashboard = await response.json();
            // Guard against dev server returning index.html parsed as something unexpected.
            if (dashboard && Array.isArray(dashboard.kpis)) {
              setKpis(dashboard.kpis || []);
              setCashFlow(dashboard.chartData || []);
              const apiSubs: AbonnementItem[] = dashboard.subscriptions || [];
              setSubscriptions(apiSubs);
              setRecentTransactions(dashboard.recentTransactions || []);
              setExpenseDistribution(dashboard.expenseDistribution || []);
              setPnl(dashboard.pnl || null);
              usedApi = true;
              // Sync API-detected subscriptions into localStorage so Abonnements page stays in sync
              try {
                const stored: AbonnementItem[] = JSON.parse(localStorage.getItem('irys_abonnements') || '[]');
                const merged = [...stored];
                for (const apiSub of apiSubs) {
                  const apiKey = apiSub.nom.toLowerCase().replace(/[^a-z]/g, '');
                  const idx = merged.findIndex(s => {
                    const sKey = s.nom.toLowerCase().replace(/[^a-z]/g, '');
                    return sKey.includes(apiKey) || apiKey.includes(sKey);
                  });
                  if (idx === -1) {
                    merged.push(apiSub);
                  } else {
                    merged[idx].prochaineDate = apiSub.prochaineDate;
                  }
                }
                localStorage.setItem('irys_abonnements', JSON.stringify(merged));
              } catch { /* ignore localStorage errors */ }
            }
          } catch (jsonErr) {
            // Body was not JSON (e.g. dev server returned index.html). Fall back.
            console.warn('Dashboard API returned non-JSON, falling back to mockDb.', jsonErr);
          }
        }
      } catch (fetchErr) {
        console.warn('Dashboard API fetch failed, falling back to mockDb.', fetchErr);
      }

      if (!usedApi) {
        await applyMockDashboard();
      }

      const analytics: any = await mockDb.getAnalyticsData();
      setAnalyticsData(analytics.chart);
    } catch (error) {
      console.error('Error loading data:', error);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  const refreshData = () => {
    loadData();
  };

  return (
    <AppContext.Provider value={{
      user,
      isLoading,
      kpis,
      cashFlow,
      subscriptions,
      recentTransactions,
      expenseDistribution,
      analyticsData,
      pnl,
      refreshData,
    }}>
      {children}
    </AppContext.Provider>
  );
};

export const useApp = () => {
  const context = useContext(AppContext);
  if (!context) throw new Error("useApp must be used within AppProvider");
  return context;
};

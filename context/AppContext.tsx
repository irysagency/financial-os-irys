import React, { createContext, useContext, useState, useEffect, useCallback, ReactNode } from 'react';
import {
  User, StatCardData, Transaction, ChartDataPoint,
  AbonnementItem, PnlSummary, CashFlowDataPoint, ExpenseDistributionItem,
} from '../types';
import { mockDb } from '../services/mockDb';

interface AppState {
  user: User | null;
  isLoading: boolean;
  kpis: StatCardData[];
  cashFlow: CashFlowDataPoint[];
  subscriptions: AbonnementItem[];
  recentTransactions: Transaction[];
  expenseDistribution: ExpenseDistributionItem[];
  analyticsData: ChartDataPoint[];
  pnl: PnlSummary | null;
  refreshData: () => void;
}

const AppContext = createContext<AppState | undefined>(undefined);

export const AppProvider = ({ children }: { children: ReactNode }) => {
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  const [kpis, setKpis] = useState<StatCardData[]>([]);
  const [cashFlow, setCashFlow] = useState<CashFlowDataPoint[]>([]);
  const [subscriptions, setSubscriptions] = useState<AbonnementItem[]>([]);
  const [recentTransactions, setRecentTransactions] = useState<Transaction[]>([]);
  const [expenseDistribution, setExpenseDistribution] = useState<ExpenseDistributionItem[]>([]);
  const [analyticsData, setAnalyticsData] = useState<ChartDataPoint[]>([]);
  const [pnl, setPnl] = useState<PnlSummary | null>(null);

  const applyMockDashboard = async () => {
    const dashboard = await mockDb.getDashboardData() as {
      kpis: StatCardData[];
      cashFlow: CashFlowDataPoint[];
      subscriptions: AbonnementItem[];
      recentTransactions: Transaction[];
      expenseDistribution: ExpenseDistributionItem[];
      pnl: PnlSummary;
    };
    setKpis(dashboard.kpis);
    setCashFlow(dashboard.cashFlow);
    setSubscriptions(dashboard.subscriptions);
    setRecentTransactions(dashboard.recentTransactions);
    setExpenseDistribution(dashboard.expenseDistribution);
    setPnl(dashboard.pnl);
  };

  const loadData = useCallback(async () => {
    setIsLoading(true);
    try {
      const u = await mockDb.getUser();
      setUser(u);

      let usedApi = false;
      try {
        const apiToken = (import.meta as any).env?.VITE_API_TOKEN as string | undefined;
        const response = await fetch('/api/get-dashboard-data', {
          headers: apiToken ? { 'x-api-token': apiToken } : {},
        });
        if (response.ok) {
          try {
            const dashboard = await response.json();
            if (dashboard && Array.isArray(dashboard.kpis)) {
              setKpis(dashboard.kpis || []);
              setCashFlow(dashboard.chartData || []);
              const apiSubs: AbonnementItem[] = dashboard.subscriptions || [];
              setSubscriptions(apiSubs);
              setRecentTransactions(dashboard.recentTransactions || []);
              setExpenseDistribution(dashboard.expenseDistribution || []);
              setPnl(dashboard.pnl || null);
              usedApi = true;
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
            console.warn('Dashboard API returned non-JSON, falling back to mockDb.', jsonErr);
          }
        }
      } catch (fetchErr) {
        console.warn('Dashboard API fetch failed, falling back to mockDb.', fetchErr);
      }

      if (!usedApi) {
        await applyMockDashboard();
      }

      const analytics = await mockDb.getAnalyticsData() as { chart: ChartDataPoint[] };
      setAnalyticsData(analytics.chart);
    } catch (error) {
      console.error('Error loading data:', error);
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    loadData();
  }, [loadData]);

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
      refreshData: loadData,
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

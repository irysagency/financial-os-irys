import React, { createContext, useContext, ReactNode } from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import {
  StatCardData, Transaction, ChartDataPoint,
  AbonnementItem, PnlSummary, CashFlowDataPoint, ExpenseDistributionItem, User,
} from '../types';
import { useApiClient } from '../hooks/useApiClient';

interface DashboardResponse {
  kpis: StatCardData[];
  cashFlow: CashFlowDataPoint[];
  recentTransactions: Transaction[];
  subscriptions: AbonnementItem[];
  expenseDistribution: ExpenseDistributionItem[];
}

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

const EMPTY_DASHBOARD: DashboardResponse = {
  kpis: [
    { title: 'CA (Mois)', amount: 0, trend: 0 },
    { title: 'Dépenses (Mois)', amount: 0, trend: 0 },
    { title: 'Bénéfice Net', amount: 0, trend: 0 },
    { title: 'CA en attente', amount: 0, trend: 0 },
  ],
  cashFlow: [],
  recentTransactions: [],
  subscriptions: [],
  expenseDistribution: [],
};

export const AppProvider = ({ children }: { children: ReactNode }) => {
  const api = useApiClient();
  const queryClient = useQueryClient();

  const { data: dashboard, isLoading } = useQuery<DashboardResponse>({
    queryKey: ['dashboard'],
    queryFn: () => api.get<DashboardResponse>('/dashboard'),
    placeholderData: EMPTY_DASHBOARD,
  });

  const d = dashboard ?? EMPTY_DASHBOARD;

  return (
    <AppContext.Provider value={{
      user: null,
      isLoading,
      kpis: d.kpis,
      cashFlow: d.cashFlow,
      subscriptions: d.subscriptions,
      recentTransactions: d.recentTransactions,
      expenseDistribution: d.expenseDistribution,
      analyticsData: [],
      pnl: null,
      refreshData: () => queryClient.invalidateQueries({ queryKey: ['dashboard'] }),
    }}>
      {children}
    </AppContext.Provider>
  );
};

export const useApp = () => {
  const context = useContext(AppContext);
  if (!context) throw new Error('useApp must be used within AppProvider');
  return context;
};

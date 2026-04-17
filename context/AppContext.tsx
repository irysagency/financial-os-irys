import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { User, StatCardData, Subscription, Transaction, ChartDataPoint, Project, Client, Organization } from '../types';
import { mockDb } from '../services/mockDb';

interface AppState {
  user: User | null;
  isLoading: boolean;
  kpis: StatCardData[];
  cashFlow: ChartDataPoint[];
  subscriptions: Subscription[];
  recentTransactions: Transaction[];
  expenseDistribution: any[];
  analyticsData: ChartDataPoint[];
  pnl: any | null;
  projects: Project[];
  clients: Client[];
  currentOrg: Organization | null;
  
  refreshData: () => void;
  addSubscription: (sub: Subscription) => void;
}

const AppContext = createContext<AppState | undefined>(undefined);

export const AppProvider = ({ children }: { children: ReactNode }) => {
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  
  const [kpis, setKpis] = useState<StatCardData[]>([]);
  const [cashFlow, setCashFlow] = useState<ChartDataPoint[]>([]);
  const [subscriptions, setSubscriptions] = useState<Subscription[]>([]);
  const [recentTransactions, setRecentTransactions] = useState<Transaction[]>([]);
  const [expenseDistribution, setExpenseDistribution] = useState<any[]>([]);
  const [analyticsData, setAnalyticsData] = useState<ChartDataPoint[]>([]);
  const [pnl, setPnl] = useState<any | null>(null);
  
  const [projects, setProjects] = useState<Project[]>([]);
  const [clients, setClients] = useState<Client[]>([]);
  const [currentOrg, setCurrentOrg] = useState<Organization | null>(null);

  const loadData = async () => {
    setIsLoading(true);
    try {
      const u = await mockDb.getUser();
      setUser(u);

      // Fetch real data from our new API route
      const response = await fetch('/api/get-dashboard-data');
      if (response.ok) {
        const dashboard = await response.json();
        setKpis(dashboard.kpis || []);
        setCashFlow(dashboard.chartData || []);
        setSubscriptions(dashboard.subscriptions || []);
        setRecentTransactions(dashboard.recentTransactions || []);
        setExpenseDistribution(dashboard.expenseDistribution || []);
        setPnl(dashboard.pnl || null);
      } else {
        console.error('Failed to fetch real dashboard data, falling back to mock');
        const dashboard = await mockDb.getDashboardData();
        setKpis(dashboard.kpis);
        setCashFlow(dashboard.cashFlow);
        setSubscriptions(dashboard.subscriptions);
        setRecentTransactions(dashboard.recentTransactions);
        setExpenseDistribution(dashboard.expenseDistribution);
      }

      const analytics = await mockDb.getAnalyticsData();
      setAnalyticsData(analytics.chart);

      const projectsData = await mockDb.getProjectsData();
      setProjects(projectsData.projects);
      setClients(projectsData.clients);
      setCurrentOrg(projectsData.org);
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

  const addSubscription = async (sub: Subscription) => {
    await mockDb.addSubscription(sub);
    setSubscriptions(prev => [...prev, sub]);
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
      projects,
      clients,
      currentOrg,
      refreshData,
      addSubscription
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

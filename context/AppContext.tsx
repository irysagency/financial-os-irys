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
  
  const [projects, setProjects] = useState<Project[]>([]);
  const [clients, setClients] = useState<Client[]>([]);
  const [currentOrg, setCurrentOrg] = useState<Organization | null>(null);

  const loadData = async () => {
    setIsLoading(true);
    const u = await mockDb.getUser();
    setUser(u);

    const dashboard = await mockDb.getDashboardData();
    // @ts-ignore
    setKpis(dashboard.kpis);
    // @ts-ignore
    setCashFlow(dashboard.cashFlow);
    // @ts-ignore
    setSubscriptions(dashboard.subscriptions);
    // @ts-ignore
    setRecentTransactions(dashboard.recentTransactions);
    // @ts-ignore
    setExpenseDistribution(dashboard.expenseDistribution);

    const analytics = await mockDb.getAnalyticsData();
    // @ts-ignore
    setAnalyticsData(analytics.chart);

    const projectsData = await mockDb.getProjectsData();
    // @ts-ignore
    setProjects(projectsData.projects);
    // @ts-ignore
    setClients(projectsData.clients);
    // @ts-ignore
    setCurrentOrg(projectsData.org);

    setIsLoading(false);
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

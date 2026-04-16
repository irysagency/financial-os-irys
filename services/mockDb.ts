import { KPIS, CASH_FLOW_DATA, SUBSCRIPTIONS, RECENT_TRANSACTIONS, ANALYTICS_DATA, EXPENSE_DISTRIBUTION, PROJECTS, CLIENTS, CURRENT_ORG } from '../constants/data';
import { User, Subscription } from '../types';

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
    return new Promise(resolve => setTimeout(() => resolve({
      kpis: KPIS,
      cashFlow: CASH_FLOW_DATA,
      subscriptions: SUBSCRIPTIONS,
      recentTransactions: RECENT_TRANSACTIONS,
      expenseDistribution: EXPENSE_DISTRIBUTION
    }), 500));
  },

  getAnalyticsData: async () => {
     return new Promise(resolve => setTimeout(() => resolve({
      chart: ANALYTICS_DATA
     }), 300));
  },

  getProjectsData: async () => {
    return new Promise(resolve => setTimeout(() => resolve({
      projects: PROJECTS,
      clients: CLIENTS,
      org: CURRENT_ORG
    }), 300));
  },
  
  addSubscription: async (sub: Subscription) => {
    SUBSCRIPTIONS.push(sub);
    return true;
  }
};

// ------------------------------------------------------------------
// EQUOTA TYPE DEFINITIONS
// ------------------------------------------------------------------

export interface User {
  id: string;
  email: string;
  fullName: string;
  username: string;
  avatarUrl: string;
}

export interface StatCardData {
  title: string;
  amount: number;
  trend: number; // Percentage
  trendLabel?: string;
}

export interface Subscription {
  id: string;
  name: string;
  amount: number;
  frequency: 'Monthly' | 'Yearly';
  category: string;
  status: 'Active' | 'Inactive';
  nextPaymentDate: string;
  icon?: string; // For mock logos
}

export interface Transaction {
  id: string;
  name: string;
  type: 'Income' | 'Expense' | 'Transfer' | 'Withdrawal';
  amount: number;
  date: string;
  avatar?: string;
}

export interface ChartDataPoint {
  name: string;
  value: number;
  income?: number;
  expense?: number;
}

export type ProjectStatus = 'LEAD' | 'SIGNED' | 'IN_PROGRESS' | 'COMPLETED' | 'PAID';

export interface Project {
  id: string;
  name: string;
  clientId: string;
  status: ProjectStatus;
  budget: number;
  expenses: number;
  startDate: string;
}

export interface Client {
  id: string;
  name: string;
}

export interface Organization {
  id: string;
  name: string;
  currency: string;
}

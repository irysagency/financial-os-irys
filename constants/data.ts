import { StatCardData, Subscription, Transaction, ChartDataPoint, Project, Client, Organization } from '../types';

// KPIs mis à jour avec données Qonto (Irys Agency) — au 16/04/2026
// Monthly = dernier mois complet (Mars 2026). Trend = vs Février 2026.
export const KPIS: StatCardData[] = [
  { title: "Total Balance", amount: 6378.36, trend: 0 },
  { title: "Monthly Income", amount: 4458.44, trend: 4.7 },
  { title: "Monthly Expense", amount: 646.64, trend: -75.0 },
  { title: "Monthly Savings", amount: 3811.80, trend: 127.8 },
];

// Cash flow net mensuel 2026 (revenus - dépenses). Source : Qonto export au 16/04/2026.
// Mai–Déc : pas encore de données (valeur 0).
export const CASH_FLOW_DATA: ChartDataPoint[] = [
  { name: 'Jan', value: 166.20 },
  { name: 'Feb', value: 1673.31 },
  { name: 'Mar', value: 3811.80 },
  { name: 'Apr', value: 491.15 }, // Mois en cours (partiel)
  { name: 'May', value: 0 },
  { name: 'Jun', value: 0 },
  { name: 'Jul', value: 0 },
  { name: 'Aug', value: 0 },
  { name: 'Sep', value: 0 },
  { name: 'Oct', value: 0 },
  { name: 'Nov', value: 0 },
  { name: 'Dec', value: 0 },
];

// Données analytiques mensuelles 2026 (revenus et dépenses bruts). Source : Qonto au 16/04/2026.
export const ANALYTICS_DATA: ChartDataPoint[] = [
  { name: 'Jan', income: 909.00,   expense: 742.80,   value: 0 },
  { name: 'Feb', income: 4257.33,  expense: 2584.02,  value: 0 },
  { name: 'Mar', income: 4458.44,  expense: 646.64,   value: 0 },
  { name: 'Apr', income: 616.42,   expense: 125.27,   value: 0 }, // Mois en cours (partiel)
  { name: 'May', income: 0,        expense: 0,        value: 0 },
  { name: 'Jun', income: 0,        expense: 0,        value: 0 },
  { name: 'Jul', income: 0,        expense: 0,        value: 0 },
  { name: 'Aug', income: 0,        expense: 0,        value: 0 },
  { name: 'Sep', income: 0,        expense: 0,        value: 0 },
  { name: 'Oct', income: 0,        expense: 0,        value: 0 },
  { name: 'Nov', income: 0,        expense: 0,        value: 0 },
  { name: 'Dec', income: 0,        expense: 0,        value: 0 },
];

export const SUBSCRIPTIONS: Subscription[] = [
  { 
    id: 'sub1', 
    name: 'Netflix subscription', 
    amount: 25.00, 
    frequency: 'Monthly', 
    category: 'Entertainment', 
    status: 'Active', 
    nextPaymentDate: 'Aug 15, 2024' 
  },
  { 
    id: 'sub2', 
    name: 'Spotify subscription', 
    amount: 25.00, 
    frequency: 'Monthly', 
    category: 'Entertainment', 
    status: 'Active', 
    nextPaymentDate: 'Aug 15, 2024' 
  }
];

// 10 dernières transactions Qonto (Irys Agency) — source : export du 16/04/2026.
export const RECENT_TRANSACTIONS: Transaction[] = [
  { id: 'tx1',  name: 'SQSP* DOMAIN#230410544',         type: 'Expense',  amount: -21.60,   date: '14 Apr 2026' },
  { id: 'tx2',  name: 'Ines Lassini',                   type: 'Income',   amount: 600.00,   date: '13 Apr 2026' },
  { id: 'tx3',  name: 'Qonto',                          type: 'Expense',  amount: -0.52,    date: '9 Apr 2026'  },
  { id: 'tx4',  name: 'BEACONS.AI* SUBS BEACO',         type: 'Expense',  amount: -25.94,   date: '9 Apr 2026'  },
  { id: 'tx5',  name: 'CLAUDE.AI SUBSCRIPTION',         type: 'Expense',  amount: -18.00,   date: '5 Apr 2026'  },
  { id: 'tx6',  name: 'Qonto',                          type: 'Expense',  amount: -59.21,   date: '3 Apr 2026'  },
  { id: 'tx7',  name: 'Stripe Technology Europe Ltd',   type: 'Income',   amount: 16.42,    date: '1 Apr 2026'  },
  { id: 'tx8',  name: 'CLICTEUR THOMAS',                type: 'Transfer', amount: -378.00,  date: '30 Mar 2026' },
  { id: 'tx9',  name: 'hostinger.com',                  type: 'Income',   amount: 36.38,    date: '30 Mar 2026' },
  { id: 'tx10', name: 'hostinger.com',                  type: 'Income',   amount: 26.06,    date: '30 Mar 2026' },
];

// Répartition des dépenses par catégorie (% sur total débits Qonto, export 16/04/2026).
export const EXPENSE_DISTRIBUTION = [
  { name: 'Opérationnelles',  value: 33, color: '#FF4D00' }, // 1 470,71 EUR
  { name: 'Personnel',        value: 29, color: '#FF8800' }, // 1 315,00 EUR
  { name: 'Technologies',     value: 27, color: '#FFAA00' }, // 1 205,49 EUR
  { name: 'Non catégorisé',   value: 10, color: '#FFD700' }, //   440,44 EUR
  { name: 'Frais bancaires',   value: 1, color: '#FF6633' }, //    68,56 EUR
];

export const PROJECTS: Project[] = [
  {
    id: 'p1',
    name: 'Website Redesign',
    clientId: 'c1',
    status: 'IN_PROGRESS',
    budget: 5000,
    expenses: 1200,
    startDate: '2023-10-01'
  },
  {
    id: 'p2',
    name: 'Mobile App Development',
    clientId: 'c2',
    status: 'SIGNED',
    budget: 15000,
    expenses: 500,
    startDate: '2023-11-15'
  },
  {
    id: 'p3',
    name: 'Marketing Campaign',
    clientId: 'c1',
    status: 'COMPLETED',
    budget: 8000,
    expenses: 2000,
    startDate: '2023-08-01'
  }
];

export const CLIENTS: Client[] = [
  { id: 'c1', name: 'Acme Corp' },
  { id: 'c2', name: 'Globex Inc.' }
];

export const CURRENT_ORG: Organization = {
  id: 'o1',
  name: 'Irys Agency',
  currency: 'EUR'
};

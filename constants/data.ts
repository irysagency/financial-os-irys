import { StatCardData, Subscription, Transaction, ChartDataPoint, Project, Client, Organization, Prestation, PnlMonthData, AbonnementItem, VirementHistorique } from '../types';

// KPIs mis à jour avec données Qonto (Irys Agency) — au 16/04/2026
// Monthly = dernier mois complet (Mars 2026). Trend = vs Février 2026.
export const KPIS: StatCardData[] = [
  { title: "Solde actuel",        amount: 6378.36,  trend: 0 },
  { title: "Revenus (Mar 2026)",  amount: 4458.44,  trend: 4.7 },
  { title: "Dépenses (Mar 2026)", amount: 646.64,   trend: -75.0 },
  { title: "Épargne (Mar 2026)",  amount: 3811.80,  trend: 127.8 },
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

// ------------------------------------------------------------------
// DONNÉES QONTO — Prestations (CA encaissé)
// Source : export 16/04/2026 — catégorie "Chiffre d'affaires"
// ------------------------------------------------------------------
export const QONTO_PRESTATIONS: Prestation[] = [
  { id:'qp-da29d7', client:'Ines Lassini',                 description:'', montantHT:500.00,  tva:100.00, montantTTC:600.00,  dateEmission:'2026-04-13', dateEcheance:'2026-04-13', statut:'Payé', source:'qonto' },
  { id:'qp-7960c8', client:'Stripe Technology Europe Ltd',  description:'', montantHT:13.68,   tva:2.74,   montantTTC:16.42,   dateEmission:'2026-04-01', dateEcheance:'2026-04-01', statut:'Payé', source:'qonto' },
  { id:'qp-b69265', client:'CECCA INVEST',                  description:'', montantHT:2955.00, tva:591.00, montantTTC:3546.00, dateEmission:'2026-03-27', dateEcheance:'2026-03-27', statut:'Payé', source:'qonto' },
  { id:'qp-39fed1', client:'MAISON FRED MANDELIEU',         description:'', montantHT:208.33,  tva:41.67,  montantTTC:250.00,  dateEmission:'2026-03-25', dateEcheance:'2026-03-25', statut:'Payé', source:'qonto' },
  { id:'qp-38bb5f', client:'CECCA LYON',                    description:'', montantHT:500.00,  tva:100.00, montantTTC:600.00,  dateEmission:'2026-03-25', dateEcheance:'2026-03-25', statut:'Payé', source:'qonto' },
  { id:'qp-0b08ec', client:'CECCA INVEST',                  description:'', montantHT:3500.00, tva:700.00, montantTTC:4200.00, dateEmission:'2026-02-16', dateEcheance:'2026-02-16', statut:'Payé', source:'qonto' },
  { id:'qp-5e1040', client:'Stripe Technology Europe Ltd',  description:'', montantHT:37.19,   tva:7.44,   montantTTC:44.63,   dateEmission:'2026-02-02', dateEcheance:'2026-02-02', statut:'Payé', source:'qonto' },
  { id:'qp-20d41c', client:'MME LASSINI INES',              description:'', montantHT:500.00,  tva:100.00, montantTTC:600.00,  dateEmission:'2026-01-15', dateEcheance:'2026-01-15', statut:'Payé', source:'qonto' },
  { id:'qp-8b818f', client:'Kilian Adam',                   description:'', montantHT:257.50,  tva:51.50,  montantTTC:309.00,  dateEmission:'2026-01-02', dateEcheance:'2026-01-02', statut:'Payé', source:'qonto' },
  { id:'qp-107c9b', client:'Ines Lassini',                  description:'', montantHT:250.00,  tva:50.00,  montantTTC:300.00,  dateEmission:'2025-12-04', dateEcheance:'2025-12-04', statut:'Payé', source:'qonto' },
  { id:'qp-58c82e', client:'Stripe Technology Europe Ltd',  description:'', montantHT:69.20,   tva:13.84,  montantTTC:83.04,   dateEmission:'2025-12-01', dateEcheance:'2025-12-01', statut:'Payé', source:'qonto' },
  { id:'qp-247145', client:'Stripe Technology Europe Ltd',  description:'', montantHT:129.07,  tva:25.82,  montantTTC:154.89,  dateEmission:'2025-11-03', dateEcheance:'2025-11-03', statut:'Payé', source:'qonto' },
  { id:'qp-87127e', client:'FOUREZ Quentin',                description:'', montantHT:83.33,   tva:16.67,  montantTTC:100.00,  dateEmission:'2025-10-01', dateEcheance:'2025-10-01', statut:'Payé', source:'qonto' },
];

// P&L mensuel — calculé depuis export Qonto (oct 2025 → avr 2026).
// totalChargesHT = chOpsHT + chTechHT + chPersHT + chMktHT
// margeHT        = caHT - chOpsHT (marge brute)
// resultatNet    = caHT - totalChargesHT - fraisBanc
export const MONTHLY_PNL: PnlMonthData[] = [
  { mois:'2025-10', label:'Oct 25', caHT:83.33,   chOpsHT:0,       chTechHT:75.47,  chPersHT:0,      chMktHT:8.57,  fraisBanc:0.90,  totalChargesHT:84.04,   margeHT:83.33,   resultatNet:-1.61,   tvaCollectee:16.67,  tvaDeductible:16.80, tvaNette:-0.13 },
  { mois:'2025-11', label:'Nov 25', caHT:129.07,  chOpsHT:3.93,    chTechHT:100.34, chPersHT:0,      chMktHT:0,     fraisBanc:0.62,  totalChargesHT:104.27,  margeHT:125.14,  resultatNet:24.18,   tvaCollectee:25.82,  tvaDeductible:20.86, tvaNette:4.96 },
  { mois:'2025-12', label:'Déc 25', caHT:319.20,  chOpsHT:91.45,   chTechHT:59.95,  chPersHT:0,      chMktHT:0,     fraisBanc:2.60,  totalChargesHT:151.40,  margeHT:227.75,  resultatNet:165.20,  tvaCollectee:63.84,  tvaDeductible:30.27, tvaNette:33.57 },
  { mois:'2026-01', label:'Jan 26', caHT:757.50,  chOpsHT:44.93,   chTechHT:322.92, chPersHT:300.00, chMktHT:0,     fraisBanc:1.60,  totalChargesHT:667.85,  margeHT:712.57,  resultatNet:88.05,   tvaCollectee:151.50, tvaDeductible:73.35, tvaNette:78.15 },
  { mois:'2026-02', label:'Fév 26', caHT:3537.19, chOpsHT:1040.00, chTechHT:316.88, chPersHT:955.00, chMktHT:0,     fraisBanc:0.77,  totalChargesHT:2311.88, margeHT:2497.19, resultatNet:1224.54, tvaCollectee:707.44, tvaDeductible:271.37,tvaNette:436.07 },
  { mois:'2026-03', label:'Mar 26', caHT:3663.33, chOpsHT:45.30,   chTechHT:74.58,  chPersHT:50.00,  chMktHT:0,     fraisBanc:2.34,  totalChargesHT:169.88,  margeHT:3618.03, resultatNet:3491.11, tvaCollectee:732.67, tvaDeductible:33.98, tvaNette:698.69 },
  { mois:'2026-04', label:'Avr 26', caHT:513.68,  chOpsHT:0,       chTechHT:54.62,  chPersHT:0,      chMktHT:0,     fraisBanc:59.73, totalChargesHT:54.62,   margeHT:513.68,  resultatNet:399.33,  tvaCollectee:102.74, tvaDeductible:10.92, tvaNette:91.82 },
];

// Abonnements récurrents détectés (contreparties apparaissant ≥2x en débit).
export const ABONNEMENTS_INITIALS: AbonnementItem[] = [
  { id:'ab1',  nom:'Metricool',             categorie:'Marketing / SaaS', montantHT:18.00,  frequence:'Mensuel', prochaineDate:'2026-05-14', statut:'Actif' },
  { id:'ab2',  nom:'Notion',                categorie:'Productivité',      montantHT:9.58,   frequence:'Mensuel', prochaineDate:'2026-04-30', statut:'Actif' },
  { id:'ab3',  nom:'Beacons.ai',            categorie:'Marketing / SaaS', montantHT:21.53,  frequence:'Mensuel', prochaineDate:'2026-05-09', statut:'Actif' },
  { id:'ab4',  nom:'Claude.ai',             categorie:'IA / Logiciels',    montantHT:15.00,  frequence:'Mensuel', prochaineDate:'2026-05-05', statut:'Actif' },
  { id:'ab5',  nom:'OpenAI ChatGPT',        categorie:'IA / Logiciels',    montantHT:19.17,  frequence:'Mensuel', prochaineDate:'2026-05-01', statut:'Actif' },
  { id:'ab6',  nom:'Squarespace Workspace', categorie:'Hébergement',       montantHT:16.00,  frequence:'Mensuel', prochaineDate:'2026-05-10', statut:'Actif' },
  { id:'ab7',  nom:'Squarespace Domain',    categorie:'Hébergement',       montantHT:18.00,  frequence:'Annuel',  prochaineDate:'2027-04-14', statut:'Actif' },
  { id:'ab8',  nom:'Monis Rent',            categorie:'Opérationnel',      montantHT:37.12,  frequence:'Mensuel', prochaineDate:'2026-05-01', statut:'Actif' },
];

// 5 derniers virements sortants (méthode "Transférer"). Source : Qonto export.
export const DERNIERS_VIREMENTS: VirementHistorique[] = [
  { id:'v1', beneficiaire:'CLICTEUR THOMAS', montant:-378.00, date:'2026-03-30', reference:'20260330 01' },
  { id:'v2', beneficiaire:'KILIAN ADAM',     montant:-309.00, date:'2026-02-25', reference:'Avance achat micros Fnac' },
  { id:'v3', beneficiaire:'CLICTEUR THOMAS', montant:-180.00, date:'2026-02-16', reference:'20260210 03' },
  { id:'v4', beneficiaire:'CLICTEUR THOMAS', montant:-225.00, date:'2026-02-16', reference:'20260210 02' },
  { id:'v5', beneficiaire:'CLICTEUR THOMAS', montant:-550.00, date:'2026-02-16', reference:'20260210 01' },
];

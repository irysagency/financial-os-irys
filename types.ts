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

// ------------------------------------------------------------------
// NOUVEAUX TYPES — Financial OS Irys
// ------------------------------------------------------------------

export type PrestationStatus = 'Signé' | 'En attente' | 'Payé';

export interface CoutPrestation {
  id: string;
  description: string;
  montantHT: number;
}

export interface Prestation {
  id: string;
  client: string;
  prestation: string;        // description de la prestation
  montantHT: number;
  tva: number;
  montantTTC: number;
  dateDebut: string;         // ISO YYYY-MM-DD — date de début de projet
  statut: PrestationStatus;
  source: 'qonto' | 'manual';
  couts: CoutPrestation[];   // coûts liés (prestataires, achats, transport…)
  // legacy fields kept for backward compat with old localStorage data
  description?: string;
  dateEmission?: string;
}

export interface PnlMonthData {
  mois: string;            // YYYY-MM
  label: string;           // ex: "Mar 26"
  caHT: number;
  chOpsHT: number;         // Dépenses opérationnelles
  chTechHT: number;        // Dépenses technologies
  chPersHT: number;        // Frais de personnel
  chMktHT: number;         // Marketing
  fraisBanc: number;       // Frais bancaires
  totalChargesHT: number;  // chOps + chTech + chPers + chMkt
  margeHT: number;         // caHT - chOpsHT (marge brute)
  resultatNet: number;     // caHT - totalChargesHT - fraisBanc
  tvaCollectee: number;
  tvaDeductible: number;
  tvaNette: number;
}

export type AbonnementFrequence = 'Mensuel' | 'Annuel';
export type AbonnementStatut = 'Actif' | 'Pausé' | 'Annulé';

export interface PnlSummary {
  history: {
    mois: string;
    label: string;
    ca: number;
    charges: number;
    resultat: number;
    fraisBancaires: number;
    hasData: boolean;
  }[];
  clientMetrics: {
    count: number;
    panierMoyen: number;
    ltv: number;
    avgLifetime: number;
  };
}

export interface AbonnementItem {
  id: string;
  nom: string;
  categorie: string;
  montantHT: number;
  frequence: AbonnementFrequence;
  prochaineDate: string;  // ISO YYYY-MM-DD
  statut: AbonnementStatut;
}

export interface SubscriptionMonthlyLog {
  id: string;
  subscription_id: string;
  user_id: string;
  month: string;       // YYYY-MM
  taken: boolean;
  created_at: string;
}

export interface VirementHistorique {
  id: string;
  beneficiaire: string;
  montant: number;    // négatif
  date: string;       // ISO YYYY-MM-DD
  reference: string;
}

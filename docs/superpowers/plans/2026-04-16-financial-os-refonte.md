# Financial OS Irys — Refonte Complète

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Corriger les pages cassées (Transfer, Payments, Settings) et créer 3 nouvelles pages (Revenus, P&L, Abonnements) en injectant les données réelles Qonto, en respectant strictement le design system dark/orange existant.

**Architecture:** App React + TypeScript + Vite sans router — navigation par `activePage` state dans App.tsx. Données dans `constants/data.ts` → `services/mockDb.ts` → `context/AppContext.tsx`. Les nouvelles pages gèrent leur état localement via localStorage. Aucun nouveau composant partagé n'est créé (YAGNI) — les patterns existants (modal avec framer-motion, cartes métriques inline, tableau dark) sont reproduits à l'identique.

**Tech Stack:** React 19, TypeScript, Vite, Tailwind CSS (classes utilitaires hardcodées), Recharts (AreaChart, BarChart, PieChart), Framer Motion (modals), Lucide React (icônes). localStorage pour la persistance des nouvelles pages.

---

## Fichiers créés / modifiés

| Fichier | Action | Rôle |
|---|---|---|
| `types.ts` | Modifier | Ajouter 4 nouveaux types |
| `constants/data.ts` | Modifier | Ajouter 4 nouvelles constantes Qonto |
| `App.tsx` | Modifier | Ajouter 7 cases au switch + imports |
| `components/Layout.tsx` | Modifier | Ajouter 3 NavItems + logo Irys |
| `pages/Transfer.tsx` | Créer | Formulaire virement + historique |
| `pages/Payments.tsx` | Créer | KPIs paiements + liste récurrents |
| `pages/Settings.tsx` | Créer | 4 sections de paramètres |
| `pages/Revenus.tsx` | Créer | Tableau prestations + modal + KPIs |
| `pages/PnL.tsx` | Créer | Compte de résultat + objectifs + graphique |
| `pages/Abonnements.tsx` | Créer | Gestion abonnements + modal |

---

## Conventions de code

Tous les montants en EUR : `${val.toFixed(2)} €`

Formatage date FR :
```typescript
const formatDateFR = (iso: string) =>
  new Intl.DateTimeFormat('fr-FR', { day: 'numeric', month: 'short', year: 'numeric' }).format(new Date(iso));
```

Tokens design existants : `bg-card` (fond carte), `text-muted` (texte secondaire), `border-[#2A2A2A]`, accent `#FF4D00`.

---

## Task 1 : Nouveaux types TypeScript

**Fichiers :**
- Modifier : `types.ts` (fin du fichier, ligne 69+)

- [ ] **Étape 1 : Ajouter les types à la fin de `types.ts`**

```typescript
// ------------------------------------------------------------------
// NOUVEAUX TYPES — Financial OS Irys
// ------------------------------------------------------------------

export type PrestationStatus = 'Brouillon' | 'Signé' | 'En attente' | 'Payé' | 'Impayé';

export interface Prestation {
  id: string;
  client: string;
  description: string;
  montantHT: number;
  tva: number;
  montantTTC: number;
  dateEmission: string;  // ISO YYYY-MM-DD
  dateEcheance: string;  // ISO YYYY-MM-DD
  statut: PrestationStatus;
  source: 'qonto' | 'manual';
}

export interface PnlMonthData {
  mois: string;        // YYYY-MM
  label: string;       // ex: "Mar 26"
  caHT: number;
  chOpsHT: number;     // Dépenses opérationnelles
  chTechHT: number;    // Dépenses technologies
  chPersHT: number;    // Frais de personnel
  chMktHT: number;     // Marketing
  fraisBanc: number;   // Frais bancaires (HT = TTC ici)
  totalChargesHT: number;  // chOps + chTech + chPers + chMkt
  margeHT: number;     // caHT - chOpsHT (marge brute)
  resultatNet: number; // caHT - totalChargesHT - fraisBanc
  tvaCollectee: number;
  tvaDeductible: number;
  tvaNette: number;
}

export type AbonnementFrequence = 'Mensuel' | 'Annuel';
export type AbonnementStatut = 'Actif' | 'Pausé' | 'Annulé';

export interface AbonnementItem {
  id: string;
  nom: string;
  categorie: string;
  montantHT: number;
  frequence: AbonnementFrequence;
  prochaineDate: string;  // ISO YYYY-MM-DD
  statut: AbonnementStatut;
}

export interface VirementHistorique {
  id: string;
  beneficiaire: string;
  montant: number;   // négatif
  date: string;      // ISO YYYY-MM-DD
  reference: string;
}
```

- [ ] **Étape 2 : Vérifier** — Ouvrir `types.ts`, confirmer qu'aucune erreur TypeScript visible (pas d'imports cassés).

- [ ] **Étape 3 : Commit**
```bash
git add types.ts
git commit -m "feat: add Prestation, PnlMonthData, AbonnementItem types"
```

---

## Task 2 : Nouvelles constantes Qonto

**Fichiers :**
- Modifier : `constants/data.ts` (ajouter en fin de fichier)

Ces constantes encodent les données parsées du CSV Qonto (export 16/04/2026, 83 transactions Exécutées).

- [ ] **Étape 1 : Ajouter l'import des nouveaux types dans data.ts**

Modifier la ligne 1 de `constants/data.ts` :
```typescript
import { StatCardData, Subscription, Transaction, ChartDataPoint, Project, Client, Organization, Prestation, PnlMonthData, AbonnementItem, VirementHistorique } from '../types';
```

- [ ] **Étape 2 : Ajouter QONTO_PRESTATIONS à la fin de data.ts**

```typescript
// ------------------------------------------------------------------
// DONNÉES QONTO — Prestations (CA encaissé)
// Source : export 16/04/2026 — catégorie "Chiffre d'affaires"
// ------------------------------------------------------------------
export const QONTO_PRESTATIONS: Prestation[] = [
  { id:'qp-da29d7', client:'Ines Lassini',                description:'', montantHT:500.00,  tva:100.00, montantTTC:600.00,   dateEmission:'2026-04-13', dateEcheance:'2026-04-13', statut:'Payé', source:'qonto' },
  { id:'qp-7960c8', client:'Stripe Technology Europe Ltd', description:'', montantHT:13.68,   tva:2.74,   montantTTC:16.42,    dateEmission:'2026-04-01', dateEcheance:'2026-04-01', statut:'Payé', source:'qonto' },
  { id:'qp-b69265', client:'CECCA INVEST',                 description:'', montantHT:2955.00, tva:591.00, montantTTC:3546.00,  dateEmission:'2026-03-27', dateEcheance:'2026-03-27', statut:'Payé', source:'qonto' },
  { id:'qp-39fed1', client:'MAISON FRED MANDELIEU',        description:'', montantHT:208.33,  tva:41.67,  montantTTC:250.00,   dateEmission:'2026-03-25', dateEcheance:'2026-03-25', statut:'Payé', source:'qonto' },
  { id:'qp-38bb5f', client:'CECCA LYON',                   description:'', montantHT:500.00,  tva:100.00, montantTTC:600.00,   dateEmission:'2026-03-25', dateEcheance:'2026-03-25', statut:'Payé', source:'qonto' },
  { id:'qp-0b08ec', client:'CECCA INVEST',                 description:'', montantHT:3500.00, tva:700.00, montantTTC:4200.00,  dateEmission:'2026-02-16', dateEcheance:'2026-02-16', statut:'Payé', source:'qonto' },
  { id:'qp-5e1040', client:'Stripe Technology Europe Ltd', description:'', montantHT:37.19,   tva:7.44,   montantTTC:44.63,    dateEmission:'2026-02-02', dateEcheance:'2026-02-02', statut:'Payé', source:'qonto' },
  { id:'qp-20d41c', client:'MME LASSINI INES',             description:'', montantHT:500.00,  tva:100.00, montantTTC:600.00,   dateEmission:'2026-01-15', dateEcheance:'2026-01-15', statut:'Payé', source:'qonto' },
  { id:'qp-8b818f', client:'Kilian Adam',                  description:'', montantHT:257.50,  tva:51.50,  montantTTC:309.00,   dateEmission:'2026-01-02', dateEcheance:'2026-01-02', statut:'Payé', source:'qonto' },
  { id:'qp-107c9b', client:'Ines Lassini',                 description:'', montantHT:250.00,  tva:50.00,  montantTTC:300.00,   dateEmission:'2025-12-04', dateEcheance:'2025-12-04', statut:'Payé', source:'qonto' },
  { id:'qp-58c82e', client:'Stripe Technology Europe Ltd', description:'', montantHT:69.20,   tva:13.84,  montantTTC:83.04,    dateEmission:'2025-12-01', dateEcheance:'2025-12-01', statut:'Payé', source:'qonto' },
  { id:'qp-247145', client:'Stripe Technology Europe Ltd', description:'', montantHT:129.07,  tva:25.82,  montantTTC:154.89,   dateEmission:'2025-11-03', dateEcheance:'2025-11-03', statut:'Payé', source:'qonto' },
  { id:'qp-87127e', client:'FOUREZ Quentin',               description:'', montantHT:83.33,   tva:16.67,  montantTTC:100.00,   dateEmission:'2025-10-01', dateEcheance:'2025-10-01', statut:'Payé', source:'qonto' },
];
```

- [ ] **Étape 3 : Ajouter MONTHLY_PNL**

```typescript
// P&L mensuel — calculé depuis export Qonto.
// totalChargesHT = chOpsHT + chTechHT + chPersHT + chMktHT
// margeHT = caHT - chOpsHT (marge brute, avant tech/pers/mkt)
// resultatNet = caHT - totalChargesHT - fraisBanc
export const MONTHLY_PNL: PnlMonthData[] = [
  { mois:'2025-10', label:'Oct 25', caHT:83.33,   chOpsHT:0,       chTechHT:75.47,  chPersHT:0,     chMktHT:8.57,  fraisBanc:0.90,  totalChargesHT:84.04,   margeHT:83.33,   resultatNet:-1.61,   tvaCollectee:16.67,  tvaDeductible:16.80, tvaNette:-0.13 },
  { mois:'2025-11', label:'Nov 25', caHT:129.07,  chOpsHT:3.93,    chTechHT:100.34, chPersHT:0,     chMktHT:0,     fraisBanc:0.62,  totalChargesHT:104.27,  margeHT:125.14,  resultatNet:24.18,   tvaCollectee:25.82,  tvaDeductible:20.86, tvaNette:4.96 },
  { mois:'2025-12', label:'Déc 25', caHT:319.20,  chOpsHT:91.45,   chTechHT:59.95,  chPersHT:0,     chMktHT:0,     fraisBanc:2.60,  totalChargesHT:151.40,  margeHT:227.75,  resultatNet:165.20,  tvaCollectee:63.84,  tvaDeductible:30.27, tvaNette:33.57 },
  { mois:'2026-01', label:'Jan 26', caHT:757.50,  chOpsHT:44.93,   chTechHT:322.92, chPersHT:300.00,chMktHT:0,     fraisBanc:1.60,  totalChargesHT:667.85,  margeHT:712.57,  resultatNet:88.05,   tvaCollectee:151.50, tvaDeductible:73.35, tvaNette:78.15 },
  { mois:'2026-02', label:'Fév 26', caHT:3537.19, chOpsHT:1040.00, chTechHT:316.88, chPersHT:955.00,chMktHT:0,     fraisBanc:0.77,  totalChargesHT:2311.88, margeHT:2497.19, resultatNet:1224.54, tvaCollectee:707.44, tvaDeductible:271.37,tvaNette:436.07 },
  { mois:'2026-03', label:'Mar 26', caHT:3663.33, chOpsHT:45.30,   chTechHT:74.58,  chPersHT:50.00, chMktHT:0,     fraisBanc:2.34,  totalChargesHT:169.88,  margeHT:3618.03, resultatNet:3491.11, tvaCollectee:732.67, tvaDeductible:33.98, tvaNette:698.69 },
  { mois:'2026-04', label:'Avr 26', caHT:513.68,  chOpsHT:0,       chTechHT:54.62,  chPersHT:0,     chMktHT:0,     fraisBanc:59.73, totalChargesHT:54.62,   margeHT:513.68,  resultatNet:399.33,  tvaCollectee:102.74, tvaDeductible:10.92, tvaNette:91.82 },
];
```

- [ ] **Étape 4 : Ajouter ABONNEMENTS_INITIALS**

```typescript
// Abonnements récurrents détectés (contreparties apparaissant ≥2x en débit).
// prochaineDate = estimation : dernière date connue + fréquence.
export const ABONNEMENTS_INITIALS: AbonnementItem[] = [
  { id:'ab1',  nom:'Metricool',             categorie:'Marketing / SaaS',  montantHT:18.00,  frequence:'Mensuel', prochaineDate:'2026-05-14', statut:'Actif' },
  { id:'ab2',  nom:'Notion',                categorie:'Productivité',       montantHT:9.58,   frequence:'Mensuel', prochaineDate:'2026-04-30', statut:'Actif' },
  { id:'ab3',  nom:'Beacons.ai',            categorie:'Marketing / SaaS',  montantHT:21.53,  frequence:'Mensuel', prochaineDate:'2026-05-09', statut:'Actif' },
  { id:'ab4',  nom:'Claude.ai',             categorie:'IA / Logiciels',     montantHT:15.00,  frequence:'Mensuel', prochaineDate:'2026-05-05', statut:'Actif' },
  { id:'ab5',  nom:'OpenAI ChatGPT',        categorie:'IA / Logiciels',     montantHT:19.17,  frequence:'Mensuel', prochaineDate:'2026-05-01', statut:'Actif' },
  { id:'ab6',  nom:'Squarespace Workspace', categorie:'Hébergement',        montantHT:16.00,  frequence:'Mensuel', prochaineDate:'2026-05-10', statut:'Actif' },
  { id:'ab7',  nom:'Squarespace Domain',    categorie:'Hébergement',        montantHT:18.00,  frequence:'Annuel',  prochaineDate:'2027-04-14', statut:'Actif' },
  { id:'ab8',  nom:'Monis Rent',            categorie:'Opérationnel',       montantHT:37.12,  frequence:'Mensuel', prochaineDate:'2026-05-01', statut:'Actif' },
  { id:'ab9',  nom:'Clicteur Thomas',       categorie:'Production',         montantHT:272.17, frequence:'Mensuel', prochaineDate:'2026-04-30', statut:'Actif' },
  { id:'ab10', nom:'Noble Productions',     categorie:'Production',         montantHT:520.00, frequence:'Mensuel', prochaineDate:'2026-05-01', statut:'Actif' },
];
```

- [ ] **Étape 5 : Ajouter DERNIERS_VIREMENTS**

```typescript
// 5 derniers virements sortants (méthode "Transférer"). Source : Qonto export.
export const DERNIERS_VIREMENTS: VirementHistorique[] = [
  { id:'v1', beneficiaire:'CLICTEUR THOMAS', montant:-378.00, date:'2026-03-30', reference:'20260330 01' },
  { id:'v2', beneficiaire:'KILIAN ADAM',     montant:-309.00, date:'2026-02-25', reference:'Avance achat micros Fnac' },
  { id:'v3', beneficiaire:'CLICTEUR THOMAS', montant:-180.00, date:'2026-02-16', reference:'20260210 03' },
  { id:'v4', beneficiaire:'CLICTEUR THOMAS', montant:-225.00, date:'2026-02-16', reference:'20260210 02' },
  { id:'v5', beneficiaire:'CLICTEUR THOMAS', montant:-550.00, date:'2026-02-16', reference:'20260210 01' },
];
```

- [ ] **Étape 6 : Commit**
```bash
git add constants/data.ts
git commit -m "feat: add Qonto data constants (prestations, PnL, abonnements, virements)"
```

---

## Task 3 : Corriger le routing dans App.tsx

**Problème actuel :** le switch ne gère que `dashboard`, `wallet`, `transactions`. Tout le reste tombe sur `default: return <Dashboard />`, d'où les pages cassées.

**Fichiers :**
- Modifier : `App.tsx`

- [ ] **Étape 1 : Remplacer le contenu de App.tsx**

```tsx
import React, { useState } from 'react';
import { AppProvider, useApp } from './context/AppContext';
import { Layout } from './components/Layout';
import { Dashboard } from './pages/Dashboard';
import { Analytics } from './pages/Analytics';
import { Transactions } from './pages/Transactions';
import { Transfer } from './pages/Transfer';
import { Payments } from './pages/Payments';
import { Settings } from './pages/Settings';
import { Revenus } from './pages/Revenus';
import { PnL } from './pages/PnL';
import { Abonnements } from './pages/Abonnements';
import { NewSubscriptionModal } from './components/NewSubscriptionModal';

const AppContent = () => {
  const [activePage, setActivePage] = useState('dashboard');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const { addSubscription } = useApp();

  const renderPage = () => {
    switch (activePage) {
      case 'dashboard':    return <Dashboard />;
      case 'wallet':       return <Analytics />;
      case 'transactions': return <Transactions />;
      case 'transfer':     return <Transfer />;
      case 'payments':     return <Payments onNavigate={setActivePage} />;
      case 'settings':     return <Settings />;
      case 'revenus':      return <Revenus />;
      case 'pnl':          return <PnL />;
      case 'abonnements':  return <Abonnements />;
      default:             return <Dashboard />;
    }
  };

  return (
    <>
      <Layout
        activePage={activePage}
        onNavigate={setActivePage}
        onOpenModal={() => setIsModalOpen(true)}
      >
        {renderPage()}
      </Layout>
      <NewSubscriptionModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        onSubmit={addSubscription}
      />
    </>
  );
};

export default function App() {
  return (
    <AppProvider>
      <AppContent />
    </AppProvider>
  );
}
```

Note : `Payments` reçoit `onNavigate` pour le bouton "Voir tous les abonnements".

- [ ] **Étape 2 : Commit** (après avoir créé les pages en Task 5-10 pour que les imports compilent)

---

## Task 4 : Mettre à jour Layout.tsx (sidebar + logo)

**Fichiers :**
- Modifier : `components/Layout.tsx`

- [ ] **Étape 1 : Mettre à jour le logo** — Remplacer dans Layout.tsx :

```tsx
// Remplacer (ligne ~67-71) :
<div className="w-10 h-10 bg-[#FF4D00] rounded-xl flex items-center justify-center text-black font-bold text-xl shadow-[0_0_20px_rgba(255,77,0,0.3)]">
  E
</div>
<span className="text-2xl font-bold tracking-tight">Equota</span>

// Par :
<div className="w-10 h-10 bg-[#FF4D00] rounded-xl flex items-center justify-center text-black font-bold text-xl shadow-[0_0_20px_rgba(255,77,0,0.3)]">
  I
</div>
<span className="text-2xl font-bold tracking-tight">Irys</span>
```

- [ ] **Étape 2 : Ajouter les imports Lucide** — Ajouter `TrendingUp, BarChart2, Repeat` aux imports Lucide existants (ligne 1 de Layout.tsx).

- [ ] **Étape 3 : Ajouter les 3 NavItems** — Après `<NavItem page="transactions" ... />` et avant `<NavItem page="payments" ... />`, ajouter :

```tsx
<NavItem page="revenus"     icon={TrendingUp} label="Revenus"      />
<NavItem page="pnl"         icon={BarChart2}  label="P&L"          />
<NavItem page="abonnements" icon={Repeat}     label="Abonnements"  />
```

- [ ] **Étape 4 : Commit**
```bash
git add components/Layout.tsx
git commit -m "feat: add Revenus/PnL/Abonnements nav items, rename logo to Irys"
```

---

## Task 5 : Page Transfer

**Fichiers :**
- Créer : `pages/Transfer.tsx`

- [ ] **Étape 1 : Créer `pages/Transfer.tsx`**

```tsx
import React, { useState } from 'react';
import { Send, ArrowUpRight } from 'lucide-react';
import { DERNIERS_VIREMENTS } from '../constants/data';

const formatDateFR = (iso: string) =>
  new Intl.DateTimeFormat('fr-FR', { day: 'numeric', month: 'short', year: 'numeric' }).format(new Date(iso));

export const Transfer: React.FC = () => {
  const [beneficiaire, setBeneficiaire] = useState('');
  const [montant, setMontant] = useState('');
  const [reference, setReference] = useState('');
  const [toast, setToast] = useState(false);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setToast(true);
    setBeneficiaire(''); setMontant(''); setReference('');
    setTimeout(() => setToast(false), 3000);
  };

  return (
    <div className="space-y-8 animate-in fade-in duration-500 max-w-2xl">
      <h1 className="text-2xl font-bold">Virement</h1>

      {toast && (
        <div className="bg-[#1B5E20]/30 border border-[#4CAF50]/30 text-[#4CAF50] px-4 py-3 rounded-xl text-sm font-medium">
          Virement initié avec succès.
        </div>
      )}

      {/* FORMULAIRE */}
      <div className="bg-card border border-[#2A2A2A] p-6 rounded-3xl">
        <h2 className="font-bold mb-6">Nouveau virement</h2>
        <form onSubmit={handleSubmit} className="space-y-5">
          <div className="space-y-2">
            <label className="text-xs font-bold text-muted uppercase tracking-wider">Bénéficiaire</label>
            <input
              type="text" value={beneficiaire} onChange={e => setBeneficiaire(e.target.value)}
              placeholder="Nom ou IBAN"
              className="w-full bg-[#1A1A1A] border border-[#333] rounded-xl px-4 py-3 text-white placeholder:text-muted/50 focus:outline-none focus:border-[#FF4D00] focus:ring-1 focus:ring-[#FF4D00] transition-all"
            />
          </div>
          <div className="space-y-2">
            <label className="text-xs font-bold text-muted uppercase tracking-wider">Montant (€)</label>
            <input
              type="number" min="0" step="0.01" value={montant} onChange={e => setMontant(e.target.value)}
              placeholder="0.00"
              className="w-full bg-[#1A1A1A] border border-[#333] rounded-xl px-4 py-3 text-white placeholder:text-muted/50 focus:outline-none focus:border-[#FF4D00] focus:ring-1 focus:ring-[#FF4D00] transition-all"
            />
          </div>
          <div className="space-y-2">
            <label className="text-xs font-bold text-muted uppercase tracking-wider">Référence (optionnel)</label>
            <input
              type="text" value={reference} onChange={e => setReference(e.target.value)}
              placeholder="Motif du virement"
              className="w-full bg-[#1A1A1A] border border-[#333] rounded-xl px-4 py-3 text-white placeholder:text-muted/50 focus:outline-none focus:border-[#FF4D00] focus:ring-1 focus:ring-[#FF4D00] transition-all"
            />
          </div>
          <button
            type="submit"
            className="flex items-center gap-2 px-6 py-3 bg-[#FF4D00] text-white font-bold rounded-xl shadow-[0_4px_14px_rgba(255,77,0,0.4)] hover:scale-[1.02] active:scale-[0.98] transition-all"
          >
            <Send size={16} /> Envoyer
          </button>
        </form>
      </div>

      {/* HISTORIQUE */}
      <div className="bg-card border border-[#2A2A2A] rounded-3xl overflow-hidden">
        <div className="px-6 py-4 border-b border-[#2A2A2A]">
          <h2 className="font-bold">5 derniers virements</h2>
        </div>
        <div className="divide-y divide-[#1A1A1A]">
          {DERNIERS_VIREMENTS.map(v => (
            <div key={v.id} className="flex items-center justify-between px-6 py-4 hover:bg-[#1A1A1A]/50 transition-colors">
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 rounded-full bg-[#FF4D00]/10 flex items-center justify-center">
                  <ArrowUpRight size={14} className="text-[#FF4D00]" />
                </div>
                <div>
                  <div className="font-medium text-sm text-white">{v.beneficiaire}</div>
                  {v.reference && <div className="text-xs text-muted">{v.reference}</div>}
                </div>
              </div>
              <div className="text-right">
                <div className="font-bold text-sm text-white">{v.montant.toFixed(2)} €</div>
                <div className="text-xs text-muted">{formatDateFR(v.date)}</div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};
```

- [ ] **Étape 2 : Commit**
```bash
git add pages/Transfer.tsx
git commit -m "feat: add Transfer page with form and virement history"
```

---

## Task 6 : Page Payments

**Fichiers :**
- Créer : `pages/Payments.tsx`

- [ ] **Étape 1 : Créer `pages/Payments.tsx`**

```tsx
import React from 'react';
import { CreditCard, Clock, ArrowRight } from 'lucide-react';
import { ABONNEMENTS_INITIALS } from '../constants/data';
import { AbonnementItem } from '../types';

const formatDateFR = (iso: string) =>
  new Intl.DateTimeFormat('fr-FR', { day: 'numeric', month: 'short', year: 'numeric' }).format(new Date(iso));

interface PaymentsProps { onNavigate: (page: string) => void; }

export const Payments: React.FC<PaymentsProps> = ({ onNavigate }) => {
  // Lire depuis localStorage si disponible (sync avec la page Abonnements)
  const stored = localStorage.getItem('irys_abonnements');
  const abonnements: AbonnementItem[] = stored ? JSON.parse(stored) : ABONNEMENTS_INITIALS;
  const actifs = abonnements.filter(a => a.statut === 'Actif');

  const coutMensuel = actifs
    .filter(a => a.frequence === 'Mensuel')
    .reduce((s, a) => s + a.montantHT, 0);

  const prochainAb = [...actifs]
    .sort((a, b) => new Date(a.prochaineDate).getTime() - new Date(b.prochaineDate).getTime())[0];

  // Mois courant (avril 2026) — total débits mensuels depuis analytics
  const totalPayeCeMois = 125.27;

  const KpiCard = ({ title, value, sub }: { title: string; value: string; sub?: string }) => (
    <div className="bg-card border border-[#2A2A2A] p-6 rounded-3xl">
      <div className="text-muted text-sm font-medium mb-3">{title}</div>
      <div className="text-2xl font-bold">{value}</div>
      {sub && <div className="text-xs text-muted mt-1">{sub}</div>}
    </div>
  );

  return (
    <div className="space-y-6 animate-in fade-in duration-500">
      <h1 className="text-2xl font-bold">Paiements</h1>

      {/* KPIs */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <KpiCard title="Payé ce mois" value={`${totalPayeCeMois.toFixed(2)} €`} sub="Avr 2026 (partiel)" />
        <KpiCard title="Abonnements actifs" value={`${actifs.length}`} sub={`${coutMensuel.toFixed(2)} €/mois`} />
        <KpiCard
          title="Prochain paiement"
          value={prochainAb ? `${prochainAb.montantHT.toFixed(2)} €` : '—'}
          sub={prochainAb ? `${prochainAb.nom} · ${formatDateFR(prochainAb.prochaineDate)}` : undefined}
        />
      </div>

      {/* LISTE */}
      <div className="bg-card border border-[#2A2A2A] rounded-3xl overflow-hidden">
        <div className="px-6 py-4 border-b border-[#2A2A2A] flex items-center justify-between">
          <h2 className="font-bold">Paiements récurrents</h2>
          <button
            onClick={() => onNavigate('abonnements')}
            className="flex items-center gap-1 text-xs text-[#FF4D00] hover:underline"
          >
            Voir tous les abonnements <ArrowRight size={12} />
          </button>
        </div>
        <div className="divide-y divide-[#1A1A1A]">
          {actifs
            .sort((a, b) => new Date(a.prochaineDate).getTime() - new Date(b.prochaineDate).getTime())
            .map(a => (
            <div key={a.id} className="flex items-center justify-between px-6 py-4 hover:bg-[#1A1A1A]/50 transition-colors">
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 rounded-full bg-[#1A1A1A] border border-[#2A2A2A] flex items-center justify-center font-bold text-xs text-[#FF4D00]">
                  {a.nom[0]}
                </div>
                <div>
                  <div className="font-medium text-sm text-white">{a.nom}</div>
                  <div className="text-xs text-muted">{a.categorie} · {a.frequence}</div>
                </div>
              </div>
              <div className="text-right">
                <div className="font-bold text-sm">{a.montantHT.toFixed(2)} € HT</div>
                <div className="flex items-center gap-1 text-xs text-muted justify-end">
                  <Clock size={10} /> {formatDateFR(a.prochaineDate)}
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};
```

- [ ] **Étape 2 : Commit**
```bash
git add pages/Payments.tsx
git commit -m "feat: add Payments page with KPIs and recurring payments list"
```

---

## Task 7 : Page Settings

**Fichiers :**
- Créer : `pages/Settings.tsx`

- [ ] **Étape 1 : Créer `pages/Settings.tsx`**

```tsx
import React, { useState } from 'react';
import { User, Target, Upload, Trash2, ChevronRight } from 'lucide-react';

export const Settings: React.FC = () => {
  const [confirmReset, setConfirmReset] = useState(false);

  const handleReset = () => {
    if (confirmReset) {
      localStorage.removeItem('irys_prestations');
      localStorage.removeItem('irys_objectifs');
      localStorage.removeItem('irys_abonnements');
      setConfirmReset(false);
      alert('Données réinitialisées. Rechargez la page.');
    } else {
      setConfirmReset(true);
      setTimeout(() => setConfirmReset(false), 5000);
    }
  };

  const Section = ({ title, icon: Icon, children }: { title: string; icon: any; children: React.ReactNode }) => (
    <div className="bg-card border border-[#2A2A2A] rounded-3xl overflow-hidden">
      <div className="flex items-center gap-3 px-6 py-4 border-b border-[#2A2A2A]">
        <Icon size={18} className="text-[#FF4D00]" />
        <h2 className="font-bold">{title}</h2>
      </div>
      <div className="p-6 space-y-4">{children}</div>
    </div>
  );

  const Field = ({ label, value }: { label: string; value: string }) => (
    <div className="flex items-center justify-between py-2">
      <span className="text-sm text-muted">{label}</span>
      <span className="text-sm font-medium text-white">{value}</span>
    </div>
  );

  return (
    <div className="space-y-6 animate-in fade-in duration-500 max-w-2xl">
      <h1 className="text-2xl font-bold">Paramètres</h1>

      {/* PROFIL */}
      <Section title="Profil" icon={User}>
        <Field label="Nom de l'agence" value="Irys Agency" />
        <Field label="Email" value="contact@irysagency.com" />
        <Field label="Devise" value="EUR (€)" />
        <Field label="Compte Qonto" value="Compte principal — FR76..." />
      </Section>

      {/* OBJECTIFS */}
      <Section title="Objectifs" icon={Target}>
        <p className="text-sm text-muted">Configurez vos objectifs CA et résultat net depuis la page P&L.</p>
        <button
          onClick={() => {/* navigation gérée via onNavigate dans App — placeholder visuel */}}
          className="flex items-center gap-2 text-sm text-[#FF4D00] hover:underline"
        >
          Aller au P&L <ChevronRight size={14} />
        </button>
      </Section>

      {/* IMPORT */}
      <Section title="Import données" icon={Upload}>
        <p className="text-sm text-muted mb-4">Importez un nouvel export CSV Qonto pour mettre à jour vos données.</p>
        <button
          disabled
          className="flex items-center gap-2 px-4 py-2 bg-[#1A1A1A] border border-[#2A2A2A] rounded-xl text-sm text-muted cursor-not-allowed"
        >
          <Upload size={14} /> Importer un CSV (bientôt disponible)
        </button>
      </Section>

      {/* RESET */}
      <Section title="Données" icon={Trash2}>
        <p className="text-sm text-muted mb-4">
          Réinitialise les prestations, abonnements et objectifs modifiés manuellement. Les données Qonto importées restent inchangées.
        </p>
        <button
          onClick={handleReset}
          className={`flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-bold transition-all ${
            confirmReset
              ? 'bg-red-600 text-white animate-pulse'
              : 'bg-[#1A1A1A] border border-[#2A2A2A] text-red-400 hover:bg-red-950/30'
          }`}
        >
          <Trash2 size={14} />
          {confirmReset ? 'Cliquer pour confirmer la réinitialisation' : 'Réinitialiser les données'}
        </button>
      </Section>
    </div>
  );
};
```

- [ ] **Étape 2 : Commit**
```bash
git add pages/Settings.tsx
git commit -m "feat: add Settings page with profile, objectifs link, import placeholder, and data reset"
```

---

## Task 8 : Page Revenus

**Fichiers :**
- Créer : `pages/Revenus.tsx`

- [ ] **Étape 1 : Créer `pages/Revenus.tsx`**

```tsx
import React, { useState, useEffect } from 'react';
import { Plus, X, ChevronDown } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { QONTO_PRESTATIONS } from '../constants/data';
import { Prestation, PrestationStatus } from '../types';

const formatDateFR = (iso: string) =>
  new Intl.DateTimeFormat('fr-FR', { day: 'numeric', month: 'short', year: 'numeric' }).format(new Date(iso));

const STATUS_CONFIG: Record<PrestationStatus, { label: string; bg: string; text: string }> = {
  'Brouillon':   { label: 'Brouillon',   bg: 'bg-[#2A2A2A]',          text: 'text-muted' },
  'Signé':       { label: 'Signé',       bg: 'bg-blue-900/30',         text: 'text-blue-400' },
  'En attente':  { label: 'En attente',  bg: 'bg-[#FF4D00]/10',        text: 'text-[#FF4D00]' },
  'Payé':        { label: 'Payé',        bg: 'bg-[#1B5E20]/30',        text: 'text-[#4CAF50]' },
  'Impayé':      { label: 'Impayé',      bg: 'bg-red-950/40',          text: 'text-red-400' },
};

const STATUTS: PrestationStatus[] = ['Brouillon', 'Signé', 'En attente', 'Payé', 'Impayé'];

const MOIS_OPTIONS = [
  { value: 'all', label: 'Tous les mois' },
  { value: '2026-04', label: 'Avr 2026' },
  { value: '2026-03', label: 'Mar 2026' },
  { value: '2026-02', label: 'Fév 2026' },
  { value: '2026-01', label: 'Jan 2026' },
  { value: '2025-12', label: 'Déc 2025' },
  { value: '2025-11', label: 'Nov 2025' },
  { value: '2025-10', label: 'Oct 2025' },
];

export const Revenus: React.FC = () => {
  const [prestations, setPrestations] = useState<Prestation[]>(() => {
    const stored = localStorage.getItem('irys_prestations');
    return stored ? JSON.parse(stored) : QONTO_PRESTATIONS;
  });
  const [filterMois, setFilterMois] = useState('all');
  const [filterStatut, setFilterStatut] = useState('all');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [openStatusId, setOpenStatusId] = useState<string | null>(null);
  const [form, setForm] = useState({
    client: '', description: '', montantHT: '', dateEmission: '', dateEcheance: '',
  });

  useEffect(() => {
    localStorage.setItem('irys_prestations', JSON.stringify(prestations));
  }, [prestations]);

  // KPIs
  const now = new Date();
  const currentMois = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`;
  const cashCollecte = prestations
    .filter(p => p.statut === 'Payé' && p.dateEmission.startsWith(currentMois))
    .reduce((s, p) => s + p.montantTTC, 0);
  const enAttente = prestations
    .filter(p => p.statut === 'En attente')
    .reduce((s, p) => s + p.montantTTC, 0);
  const impayes = prestations
    .filter(p => p.statut === 'Impayé')
    .reduce((s, p) => s + p.montantTTC, 0);
  const caAnnuelHT = prestations
    .filter(p => p.statut === 'Payé' && p.dateEmission >= '2026-01-01')
    .reduce((s, p) => s + p.montantHT, 0);

  const filtered = prestations
    .filter(p => filterMois === 'all' || p.dateEmission.startsWith(filterMois))
    .filter(p => filterStatut === 'all' || p.statut === filterStatut)
    .sort((a, b) => b.dateEmission.localeCompare(a.dateEmission));

  const changeStatut = (id: string, statut: PrestationStatus) => {
    setPrestations(prev => prev.map(p => p.id === id ? { ...p, statut } : p));
    setOpenStatusId(null);
  };

  const handleAddPrestation = (e: React.FormEvent) => {
    e.preventDefault();
    const ht = parseFloat(form.montantHT) || 0;
    const tva = Math.round(ht * 0.2 * 100) / 100;
    const newP: Prestation = {
      id: `manual-${Date.now()}`,
      client: form.client,
      description: form.description,
      montantHT: ht,
      tva,
      montantTTC: Math.round((ht + tva) * 100) / 100,
      dateEmission: form.dateEmission,
      dateEcheance: form.dateEcheance || form.dateEmission,
      statut: 'Brouillon',
      source: 'manual',
    };
    setPrestations(prev => [newP, ...prev]);
    setIsModalOpen(false);
    setForm({ client: '', description: '', montantHT: '', dateEmission: '', dateEcheance: '' });
  };

  const KpiCard = ({ title, value, sub, highlight }: { title: string; value: string; sub?: string; highlight?: boolean }) => (
    <div className={`bg-card border p-6 rounded-3xl ${highlight ? 'border-[#FF4D00]/30' : 'border-[#2A2A2A]'}`}>
      <div className="text-muted text-sm font-medium mb-3">{title}</div>
      <div className={`text-2xl font-bold ${highlight ? 'text-[#FF4D00]' : ''}`}>{value}</div>
      {sub && <div className="text-xs text-muted mt-1">{sub}</div>}
    </div>
  );

  return (
    <div className="space-y-6 animate-in fade-in duration-500">
      {/* HEADER */}
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold">Revenus</h1>
        <button
          onClick={() => setIsModalOpen(true)}
          className="flex items-center gap-2 px-4 py-2 bg-[#FF4D00] text-white text-sm font-bold rounded-full shadow-[0_4px_14px_rgba(255,77,0,0.4)] hover:scale-105 transition-transform"
        >
          <Plus size={16} /> Nouvelle prestation
        </button>
      </div>

      {/* KPIs */}
      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-4">
        <KpiCard title="Cash collecté (mois)" value={`${cashCollecte.toFixed(2)} €`} sub="Avr 2026" highlight />
        <KpiCard title="En attente" value={`${enAttente.toFixed(2)} €`} />
        <KpiCard title="Impayés" value={`${impayes.toFixed(2)} €`} />
        <KpiCard title="CA annuel cumulé HT" value={`${caAnnuelHT.toFixed(2)} €`} sub="Jan – Avr 2026" />
      </div>

      {/* FILTRES */}
      <div className="flex items-center gap-3 flex-wrap">
        <select
          value={filterMois}
          onChange={e => setFilterMois(e.target.value)}
          className="bg-[#1A1A1A] border border-[#2A2A2A] text-sm text-white rounded-xl px-3 py-2 focus:outline-none focus:border-[#FF4D00] transition-all"
        >
          {MOIS_OPTIONS.map(o => <option key={o.value} value={o.value}>{o.label}</option>)}
        </select>

        <div className="flex gap-2">
          {['all', ...STATUTS].map(s => (
            <button
              key={s}
              onClick={() => setFilterStatut(s)}
              className={`px-3 py-1.5 rounded-full text-xs font-medium transition-all ${
                filterStatut === s ? 'bg-[#FF4D00] text-white' : 'bg-[#1A1A1A] border border-[#2A2A2A] text-muted hover:text-white'
              }`}
            >
              {s === 'all' ? 'Tous' : s}
            </button>
          ))}
        </div>
      </div>

      {/* TABLEAU */}
      <div className="bg-card border border-[#2A2A2A] rounded-3xl overflow-hidden">
        {filtered.length === 0 ? (
          <div className="p-12 text-center text-muted">Aucune prestation pour ce filtre.</div>
        ) : (
          <table className="w-full text-left text-sm">
            <thead className="bg-[#1A1A1A] text-muted border-b border-[#2A2A2A]">
              <tr>
                <th className="px-6 py-4 font-medium">Client</th>
                <th className="px-6 py-4 font-medium text-right">HT</th>
                <th className="px-6 py-4 font-medium text-right">TVA</th>
                <th className="px-6 py-4 font-medium text-right">TTC</th>
                <th className="px-6 py-4 font-medium">Émission</th>
                <th className="px-6 py-4 font-medium">Échéance</th>
                <th className="px-6 py-4 font-medium">Statut</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#1A1A1A]">
              {filtered.map(p => {
                const sc = STATUS_CONFIG[p.statut];
                return (
                  <tr key={p.id} className="hover:bg-[#1A1A1A]/50 transition-colors">
                    <td className="px-6 py-4">
                      <div className="font-medium text-white">{p.client}</div>
                      {p.description && <div className="text-xs text-muted">{p.description}</div>}
                    </td>
                    <td className="px-6 py-4 text-right font-medium">{p.montantHT.toFixed(2)} €</td>
                    <td className="px-6 py-4 text-right text-muted">{p.tva.toFixed(2)} €</td>
                    <td className="px-6 py-4 text-right font-bold">{p.montantTTC.toFixed(2)} €</td>
                    <td className="px-6 py-4 text-muted">{formatDateFR(p.dateEmission)}</td>
                    <td className="px-6 py-4 text-muted">{formatDateFR(p.dateEcheance)}</td>
                    <td className="px-6 py-4 relative">
                      <button
                        onClick={() => setOpenStatusId(openStatusId === p.id ? null : p.id)}
                        className={`flex items-center gap-1 px-2.5 py-1 rounded-md text-xs font-bold ${sc.bg} ${sc.text}`}
                      >
                        {sc.label} <ChevronDown size={10} />
                      </button>
                      {openStatusId === p.id && (
                        <div className="absolute z-10 mt-1 left-4 bg-[#1A1A1A] border border-[#2A2A2A] rounded-xl overflow-hidden shadow-xl">
                          {STATUTS.map(s => {
                            const c = STATUS_CONFIG[s];
                            return (
                              <button
                                key={s}
                                onClick={() => changeStatut(p.id, s)}
                                className={`w-full text-left px-4 py-2 text-xs font-medium hover:bg-[#2A2A2A] transition-colors ${c.text}`}
                              >
                                {c.label}
                              </button>
                            );
                          })}
                        </div>
                      )}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        )}
      </div>

      {/* MODAL NOUVELLE PRESTATION */}
      <AnimatePresence>
        {isModalOpen && (
          <>
            <motion.div
              initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
              onClick={() => setIsModalOpen(false)}
              className="fixed inset-0 bg-black/60 backdrop-blur-sm z-[60]"
            />
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 20 }}
              className="fixed inset-0 m-auto w-full max-w-md h-fit z-[70] p-4"
            >
              <div className="bg-[#121212] border border-[#2A2A2A] rounded-3xl shadow-2xl overflow-hidden">
                <div className="p-6 pb-0 flex items-center justify-between">
                  <h3 className="text-xl font-bold">Nouvelle prestation</h3>
                  <button onClick={() => setIsModalOpen(false)} className="text-muted hover:text-white">
                    <X size={20} />
                  </button>
                </div>
                <form onSubmit={handleAddPrestation} className="p-6 space-y-4">
                  {[
                    { label: 'Client', field: 'client', type: 'text', placeholder: 'Nom du client' },
                    { label: 'Description', field: 'description', type: 'text', placeholder: 'Optionnel' },
                    { label: 'Montant HT (€)', field: 'montantHT', type: 'number', placeholder: '0.00' },
                    { label: "Date d'émission", field: 'dateEmission', type: 'date', placeholder: '' },
                    { label: "Date d'échéance", field: 'dateEcheance', type: 'date', placeholder: '' },
                  ].map(({ label, field, type, placeholder }) => (
                    <div key={field} className="space-y-1">
                      <label className="text-xs font-bold text-muted uppercase tracking-wider">{label}</label>
                      <input
                        type={type} placeholder={placeholder}
                        value={(form as any)[field]}
                        onChange={e => setForm(f => ({ ...f, [field]: e.target.value }))}
                        className="w-full bg-[#1A1A1A] border border-[#333] rounded-xl px-4 py-3 text-white placeholder:text-muted/50 focus:outline-none focus:border-[#FF4D00] transition-all"
                        required={field !== 'description' && field !== 'dateEcheance'}
                      />
                    </div>
                  ))}
                  <button
                    type="submit"
                    className="w-full bg-[#FF4D00] text-white font-bold py-3.5 rounded-xl shadow-[0_4px_14px_rgba(255,77,0,0.4)] hover:scale-[1.02] active:scale-[0.98] transition-all mt-2"
                  >
                    Ajouter la prestation
                  </button>
                </form>
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </div>
  );
};
```

- [ ] **Étape 2 : Commit**
```bash
git add pages/Revenus.tsx
git commit -m "feat: add Revenus page with prestations table, status management, and new prestation modal"
```

---

## Task 9 : Page P&L

**Fichiers :**
- Créer : `pages/PnL.tsx`

- [ ] **Étape 1 : Créer `pages/PnL.tsx`**

```tsx
import React, { useState, useEffect } from 'react';
import { Edit2, Check, X } from 'lucide-react';
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import { MONTHLY_PNL } from '../constants/data';
import { PnlMonthData } from '../types';

interface Objectifs {
  caMensuel: number;
  caAnnuel: number;
  resultatMensuel: number;
}

const DEFAULT_OBJECTIFS: Objectifs = { caMensuel: 5000, caAnnuel: 60000, resultatMensuel: 3500 };

const fmt = (n: number) => `${n.toFixed(2)} €`;
const fmtK = (n: number) => n >= 1000 ? `${(n / 1000).toFixed(1)}k €` : `${n.toFixed(0)} €`;

const ColoredCell = ({ value }: { value: number }) => (
  <span className={value >= 0 ? 'text-[#4CAF50]' : 'text-red-400'}>{fmt(value)}</span>
);

export const PnL: React.FC = () => {
  const [objectifs, setObjectifs] = useState<Objectifs>(() => {
    const s = localStorage.getItem('irys_objectifs');
    return s ? JSON.parse(s) : DEFAULT_OBJECTIFS;
  });
  const [editObj, setEditObj] = useState(false);
  const [draftObj, setDraftObj] = useState<Objectifs>(objectifs);
  const [filterPeriod, setFilterPeriod] = useState<'all' | '3m' | '6m'>('all');

  useEffect(() => {
    localStorage.setItem('irys_objectifs', JSON.stringify(objectifs));
  }, [objectifs]);

  const saveObjectifs = () => { setObjectifs(draftObj); setEditObj(false); };

  // Filtered months for chart
  const chartData = filterPeriod === '3m'
    ? MONTHLY_PNL.slice(-3)
    : filterPeriod === '6m'
    ? MONTHLY_PNL.slice(-6)
    : MONTHLY_PNL;

  // Projections (on 3 derniers mois complets = Jan-Mar 2026, pas Avr partiel)
  const completeMois = MONTHLY_PNL.slice(0, -1); // exclure le mois partiel
  const avgCa = completeMois.reduce((s, m) => s + m.caHT, 0) / completeMois.length;
  const avgNet = completeMois.reduce((s, m) => s + m.resultatNet, 0) / completeMois.length;
  const ytdCa = MONTHLY_PNL.reduce((s, m) => s + m.caHT, 0);
  const remainingMois = 12 - MONTHLY_PNL.length;
  const projCaAnnuel = ytdCa + avgCa * remainingMois;
  const moisPourObjectifCa = avgCa > 0 ? Math.ceil((objectifs.caAnnuel - ytdCa) / avgCa) : Infinity;

  const ProgressBar = ({ current, target, label }: { current: number; target: number; label: string }) => {
    const pct = Math.min(100, Math.round((current / target) * 100));
    return (
      <div className="space-y-2">
        <div className="flex justify-between text-sm">
          <span className="text-muted">{label}</span>
          <span className="font-bold">{fmtK(current)} / {fmtK(target)} ({pct}%)</span>
        </div>
        <div className="h-2 bg-[#2A2A2A] rounded-full overflow-hidden">
          <div
            className="h-full bg-[#FF4D00] rounded-full transition-all duration-700"
            style={{ width: `${pct}%` }}
          />
        </div>
      </div>
    );
  };

  const rows: Array<{ key: keyof PnlMonthData; label: string; bold?: boolean; colored?: boolean }> = [
    { key: 'caHT',           label: 'CA HT',                   bold: true },
    { key: 'chOpsHT',        label: 'Charges opérationnelles HT' },
    { key: 'chTechHT',       label: 'Charges technologies HT' },
    { key: 'chPersHT',       label: 'Charges personnel HT' },
    { key: 'chMktHT',        label: 'Marketing HT' },
    { key: 'fraisBanc',      label: 'Frais bancaires' },
    { key: 'totalChargesHT', label: 'Total charges HT',        bold: true },
    { key: 'margeHT',        label: 'Marge brute HT',          bold: true, colored: true },
    { key: 'resultatNet',    label: 'Résultat net estimé',      bold: true, colored: true },
    { key: 'tvaCollectee',   label: 'TVA collectée' },
    { key: 'tvaDeductible',  label: 'TVA déductible' },
    { key: 'tvaNette',       label: 'TVA nette à payer',        bold: true, colored: true },
  ];

  return (
    <div className="space-y-8 animate-in fade-in duration-500">
      <h1 className="text-2xl font-bold">P&L — Compte de résultat</h1>

      {/* SECTION 1 — TABLEAU P&L */}
      <div className="bg-card border border-[#2A2A2A] rounded-3xl overflow-x-auto">
        <div className="px-6 py-4 border-b border-[#2A2A2A]">
          <h2 className="font-bold">Résumé mensuel</h2>
        </div>
        <table className="w-full text-sm">
          <thead className="bg-[#1A1A1A] border-b border-[#2A2A2A]">
            <tr>
              <th className="px-4 py-3 text-left font-medium text-muted sticky left-0 bg-[#1A1A1A] min-w-[200px]">Indicateur</th>
              {MONTHLY_PNL.map(m => (
                <th key={m.mois} className="px-4 py-3 text-right font-medium text-muted whitespace-nowrap">
                  {m.label}
                </th>
              ))}
            </tr>
          </thead>
          <tbody className="divide-y divide-[#1A1A1A]">
            {rows.map(row => (
              <tr key={row.key} className={`hover:bg-[#1A1A1A]/30 ${row.bold ? 'bg-[#111]' : ''}`}>
                <td className={`px-4 py-3 sticky left-0 bg-inherit text-sm ${row.bold ? 'font-bold text-white' : 'text-muted'}`}>
                  {row.label}
                </td>
                {MONTHLY_PNL.map(m => (
                  <td key={m.mois} className="px-4 py-3 text-right whitespace-nowrap">
                    {row.colored
                      ? <ColoredCell value={m[row.key] as number} />
                      : <span className={row.bold ? 'font-bold' : 'text-muted'}>
                          {fmt(m[row.key] as number)}
                        </span>
                    }
                  </td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* SECTION 2 — OBJECTIFS */}
      <div className="bg-card border border-[#2A2A2A] p-6 rounded-3xl space-y-6">
        <div className="flex items-center justify-between">
          <h2 className="font-bold">Objectifs & Projection</h2>
          {!editObj ? (
            <button onClick={() => { setDraftObj(objectifs); setEditObj(true); }}
              className="flex items-center gap-1 text-xs text-muted hover:text-white transition-colors">
              <Edit2 size={12} /> Modifier
            </button>
          ) : (
            <div className="flex gap-2">
              <button onClick={saveObjectifs}
                className="flex items-center gap-1 text-xs text-[#4CAF50] hover:opacity-80">
                <Check size={12} /> Sauvegarder
              </button>
              <button onClick={() => setEditObj(false)}
                className="flex items-center gap-1 text-xs text-muted hover:text-white">
                <X size={12} /> Annuler
              </button>
            </div>
          )}
        </div>

        {editObj ? (
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {[
              { key: 'caMensuel',      label: 'CA mensuel cible (€ HT)' },
              { key: 'caAnnuel',       label: 'CA annuel cible (€ HT)' },
              { key: 'resultatMensuel',label: 'Résultat net mensuel cible (€)' },
            ].map(({ key, label }) => (
              <div key={key} className="space-y-1">
                <label className="text-xs font-bold text-muted uppercase tracking-wider">{label}</label>
                <input
                  type="number" min="0"
                  value={(draftObj as any)[key]}
                  onChange={e => setDraftObj(d => ({ ...d, [key]: parseFloat(e.target.value) || 0 }))}
                  className="w-full bg-[#1A1A1A] border border-[#333] rounded-xl px-3 py-2 text-white focus:outline-none focus:border-[#FF4D00] transition-all"
                />
              </div>
            ))}
          </div>
        ) : (
          <div className="space-y-5">
            <ProgressBar current={avgCa} target={objectifs.caMensuel} label="CA mensuel moyen vs objectif" />
            <ProgressBar current={ytdCa} target={objectifs.caAnnuel} label="CA annuel cumulé vs objectif" />
            <ProgressBar current={avgNet > 0 ? avgNet : 0} target={objectifs.resultatMensuel} label="Résultat net moyen vs objectif" />

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-2 border-t border-[#2A2A2A]">
              <div className="bg-[#1A1A1A] p-4 rounded-2xl">
                <div className="text-xs text-muted mb-1">Projection CA annuel (rythme actuel)</div>
                <div className="text-xl font-bold">{fmtK(projCaAnnuel)}</div>
              </div>
              <div className="bg-[#1A1A1A] p-4 rounded-2xl">
                <div className="text-xs text-muted mb-1">Mois nécessaires pour atteindre objectif CA annuel</div>
                <div className="text-xl font-bold">
                  {moisPourObjectifCa === Infinity ? '∞' : moisPourObjectifCa <= 0 ? 'Atteint ✓' : `${moisPourObjectifCa} mois`}
                </div>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* SECTION 3 — GRAPHIQUE */}
      <div className="bg-card border border-[#2A2A2A] p-6 rounded-3xl">
        <div className="flex items-center justify-between mb-6">
          <h2 className="font-bold">Évolution CA / Charges / Résultat</h2>
          <div className="bg-[#1A1A1A] border border-[#2A2A2A] rounded-xl p-1 flex text-xs">
            {([['all', 'Tout'], ['6m', '6 mois'], ['3m', '3 mois']] as const).map(([v, l]) => (
              <button key={v} onClick={() => setFilterPeriod(v)}
                className={`px-3 py-1.5 rounded-lg transition-colors ${filterPeriod === v ? 'bg-[#FF4D00] text-white font-bold' : 'text-muted hover:text-white'}`}>
                {l}
              </button>
            ))}
          </div>
        </div>

        <div className="h-72">
          <ResponsiveContainer width="100%" height="100%">
            <AreaChart data={chartData} margin={{ top: 10, right: 0, left: -10, bottom: 0 }}>
              <defs>
                <linearGradient id="gradCA" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#FF4D00" stopOpacity={0.3} />
                  <stop offset="95%" stopColor="#FF4D00" stopOpacity={0} />
                </linearGradient>
                <linearGradient id="gradNet" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#4CAF50" stopOpacity={0.3} />
                  <stop offset="95%" stopColor="#4CAF50" stopOpacity={0} />
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#1A1A1A" />
              <XAxis dataKey="label" axisLine={false} tickLine={false} tick={{ fill: '#444', fontSize: 11 }} dy={8} />
              <YAxis axisLine={false} tickLine={false} tick={{ fill: '#444', fontSize: 11 }}
                tickFormatter={v => v >= 1000 ? `${(v/1000).toFixed(0)}k` : `${v}`} />
              <Tooltip
                contentStyle={{ backgroundColor: '#1A1A1A', border: '1px solid #333', borderRadius: '12px', color: '#fff' }}
                formatter={(value: number, name: string) => [
                  `${value.toFixed(2)} €`,
                  name === 'caHT' ? 'CA HT' : name === 'totalChargesHT' ? 'Charges HT' : 'Résultat net'
                ]}
              />
              <Area type="monotone" dataKey="totalChargesHT" stroke="#444" strokeWidth={2} fill="none" />
              <Area type="monotone" dataKey="caHT" stroke="#FF4D00" strokeWidth={3} fillOpacity={1} fill="url(#gradCA)" />
              <Area type="monotone" dataKey="resultatNet" stroke="#4CAF50" strokeWidth={2} fillOpacity={1} fill="url(#gradNet)" />
            </AreaChart>
          </ResponsiveContainer>
        </div>

        {/* Légende */}
        <div className="flex items-center gap-6 mt-4 text-xs text-muted">
          <div className="flex items-center gap-1.5"><div className="w-3 h-0.5 bg-[#FF4D00]"></div> CA HT</div>
          <div className="flex items-center gap-1.5"><div className="w-3 h-0.5 bg-[#444]"></div> Charges HT</div>
          <div className="flex items-center gap-1.5"><div className="w-3 h-0.5 bg-[#4CAF50]"></div> Résultat net</div>
        </div>
      </div>
    </div>
  );
};
```

- [ ] **Étape 2 : Commit**
```bash
git add pages/PnL.tsx
git commit -m "feat: add P&L page with monthly table, objectives with progress bars, and evolution chart"
```

---

## Task 10 : Page Abonnements

**Fichiers :**
- Créer : `pages/Abonnements.tsx`

- [ ] **Étape 1 : Créer `pages/Abonnements.tsx`**

```tsx
import React, { useState, useEffect } from 'react';
import { Plus, X, ChevronDown } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { ABONNEMENTS_INITIALS } from '../constants/data';
import { AbonnementItem, AbonnementStatut, AbonnementFrequence } from '../types';

const formatDateFR = (iso: string) =>
  new Intl.DateTimeFormat('fr-FR', { day: 'numeric', month: 'short', year: 'numeric' }).format(new Date(iso));

const STATUT_CONFIG: Record<AbonnementStatut, { bg: string; text: string }> = {
  'Actif':   { bg: 'bg-[#1B5E20]/30',  text: 'text-[#4CAF50]' },
  'Pausé':   { bg: 'bg-[#FF4D00]/10',  text: 'text-[#FF4D00]' },
  'Annulé':  { bg: 'bg-[#2A2A2A]',     text: 'text-muted' },
};

const STATUTS: AbonnementStatut[] = ['Actif', 'Pausé', 'Annulé'];

export const Abonnements: React.FC = () => {
  const [abonnements, setAbonnements] = useState<AbonnementItem[]>(() => {
    const s = localStorage.getItem('irys_abonnements');
    return s ? JSON.parse(s) : ABONNEMENTS_INITIALS;
  });
  const [isAddOpen, setIsAddOpen] = useState(false);
  const [openStatusId, setOpenStatusId] = useState<string | null>(null);
  const [form, setForm] = useState({
    nom: '', categorie: '', montantHT: '', frequence: 'Mensuel' as AbonnementFrequence, prochaineDate: '',
  });

  useEffect(() => {
    localStorage.setItem('irys_abonnements', JSON.stringify(abonnements));
  }, [abonnements]);

  const actifs = abonnements.filter(a => a.statut === 'Actif');
  const coutMensuel = actifs
    .filter(a => a.frequence === 'Mensuel')
    .reduce((s, a) => s + a.montantHT, 0);
  const coutAnnuelMensuels = coutMensuel * 12;
  const coutAnnuels = actifs.filter(a => a.frequence === 'Annuel').reduce((s, a) => s + a.montantHT, 0);
  const coutAnnuelTotal = coutAnnuelMensuels + coutAnnuels;
  const prochainAb = [...actifs]
    .sort((a, b) => new Date(a.prochaineDate).getTime() - new Date(b.prochaineDate).getTime())[0];

  const changeStatut = (id: string, statut: AbonnementStatut) => {
    setAbonnements(prev => prev.map(a => a.id === id ? { ...a, statut } : a));
    setOpenStatusId(null);
  };

  const handleAdd = (e: React.FormEvent) => {
    e.preventDefault();
    const newAb: AbonnementItem = {
      id: `ab-${Date.now()}`,
      nom: form.nom,
      categorie: form.categorie,
      montantHT: parseFloat(form.montantHT) || 0,
      frequence: form.frequence,
      prochaineDate: form.prochaineDate,
      statut: 'Actif',
    };
    setAbonnements(prev => [newAb, ...prev]);
    setIsAddOpen(false);
    setForm({ nom: '', categorie: '', montantHT: '', frequence: 'Mensuel', prochaineDate: '' });
  };

  const sorted = [...abonnements].sort((a, b) => b.montantHT - a.montantHT);

  const KpiCard = ({ title, value, sub }: { title: string; value: string; sub?: string }) => (
    <div className="bg-card border border-[#2A2A2A] p-6 rounded-3xl">
      <div className="text-muted text-sm font-medium mb-3">{title}</div>
      <div className="text-2xl font-bold">{value}</div>
      {sub && <div className="text-xs text-muted mt-1">{sub}</div>}
    </div>
  );

  return (
    <div className="space-y-6 animate-in fade-in duration-500">
      {/* HEADER */}
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold">Abonnements</h1>
        <button
          onClick={() => setIsAddOpen(true)}
          className="flex items-center gap-2 px-4 py-2 bg-[#FF4D00] text-white text-sm font-bold rounded-full shadow-[0_4px_14px_rgba(255,77,0,0.4)] hover:scale-105 transition-transform"
        >
          <Plus size={16} /> Ajouter un abonnement
        </button>
      </div>

      {/* KPIs */}
      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-4">
        <KpiCard title="Abonnements actifs" value={`${actifs.length}`} />
        <KpiCard title="Coût mensuel HT" value={`${coutMensuel.toFixed(2)} €`} sub="Abonnements mensuels" />
        <KpiCard title="Coût annuel projeté HT" value={`${coutAnnuelTotal.toFixed(2)} €`} sub="Mensuels ×12 + annuels" />
        <KpiCard
          title="Prochaine échéance"
          value={prochainAb ? `${prochainAb.montantHT.toFixed(2)} €` : '—'}
          sub={prochainAb ? `${prochainAb.nom} · ${formatDateFR(prochainAb.prochaineDate)}` : undefined}
        />
      </div>

      {/* TABLEAU */}
      <div className="bg-card border border-[#2A2A2A] rounded-3xl overflow-hidden">
        {sorted.length === 0 ? (
          <div className="p-12 text-center text-muted">Aucun abonnement enregistré.</div>
        ) : (
          <table className="w-full text-left text-sm">
            <thead className="bg-[#1A1A1A] text-muted border-b border-[#2A2A2A]">
              <tr>
                <th className="px-6 py-4 font-medium">Nom</th>
                <th className="px-6 py-4 font-medium">Catégorie</th>
                <th className="px-6 py-4 font-medium text-right">Montant HT</th>
                <th className="px-6 py-4 font-medium">Fréquence</th>
                <th className="px-6 py-4 font-medium">Prochaine date</th>
                <th className="px-6 py-4 font-medium">Statut</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#1A1A1A]">
              {sorted.map(a => {
                const sc = STATUT_CONFIG[a.statut];
                return (
                  <tr key={a.id} className="hover:bg-[#1A1A1A]/50 transition-colors">
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-3">
                        <div className="w-8 h-8 rounded-xl bg-[#1A1A1A] border border-[#2A2A2A] flex items-center justify-center font-bold text-xs text-[#FF4D00]">
                          {a.nom[0]}
                        </div>
                        <span className="font-medium text-white">{a.nom}</span>
                      </div>
                    </td>
                    <td className="px-6 py-4 text-muted">{a.categorie}</td>
                    <td className="px-6 py-4 text-right font-bold">{a.montantHT.toFixed(2)} €</td>
                    <td className="px-6 py-4 text-muted">{a.frequence}</td>
                    <td className="px-6 py-4 text-muted">{formatDateFR(a.prochaineDate)}</td>
                    <td className="px-6 py-4 relative">
                      <button
                        onClick={() => setOpenStatusId(openStatusId === a.id ? null : a.id)}
                        className={`flex items-center gap-1 px-2.5 py-1 rounded-md text-xs font-bold ${sc.bg} ${sc.text}`}
                      >
                        {a.statut} <ChevronDown size={10} />
                      </button>
                      {openStatusId === a.id && (
                        <div className="absolute z-10 mt-1 left-4 bg-[#1A1A1A] border border-[#2A2A2A] rounded-xl overflow-hidden shadow-xl">
                          {STATUTS.map(s => (
                            <button key={s} onClick={() => changeStatut(a.id, s)}
                              className={`w-full text-left px-4 py-2 text-xs font-medium hover:bg-[#2A2A2A] transition-colors ${STATUT_CONFIG[s].text}`}>
                              {s}
                            </button>
                          ))}
                        </div>
                      )}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        )}
      </div>

      {/* MODAL AJOUTER */}
      <AnimatePresence>
        {isAddOpen && (
          <>
            <motion.div
              initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
              onClick={() => setIsAddOpen(false)}
              className="fixed inset-0 bg-black/60 backdrop-blur-sm z-[60]"
            />
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 20 }}
              className="fixed inset-0 m-auto w-full max-w-md h-fit z-[70] p-4"
            >
              <div className="bg-[#121212] border border-[#2A2A2A] rounded-3xl shadow-2xl overflow-hidden">
                <div className="p-6 pb-0 flex items-center justify-between">
                  <h3 className="text-xl font-bold">Ajouter un abonnement</h3>
                  <button onClick={() => setIsAddOpen(false)} className="text-muted hover:text-white">
                    <X size={20} />
                  </button>
                </div>
                <form onSubmit={handleAdd} className="p-6 space-y-4">
                  {[
                    { label: 'Nom', field: 'nom', type: 'text', placeholder: 'ex : Figma' },
                    { label: 'Catégorie', field: 'categorie', type: 'text', placeholder: 'ex : Design / SaaS' },
                    { label: 'Montant HT (€)', field: 'montantHT', type: 'number', placeholder: '0.00' },
                    { label: 'Prochaine date', field: 'prochaineDate', type: 'date', placeholder: '' },
                  ].map(({ label, field, type, placeholder }) => (
                    <div key={field} className="space-y-1">
                      <label className="text-xs font-bold text-muted uppercase tracking-wider">{label}</label>
                      <input type={type} placeholder={placeholder}
                        value={(form as any)[field]}
                        onChange={e => setForm(f => ({ ...f, [field]: e.target.value }))}
                        required
                        className="w-full bg-[#1A1A1A] border border-[#333] rounded-xl px-4 py-3 text-white placeholder:text-muted/50 focus:outline-none focus:border-[#FF4D00] transition-all"
                      />
                    </div>
                  ))}
                  <div className="space-y-1">
                    <label className="text-xs font-bold text-muted uppercase tracking-wider">Fréquence</label>
                    <select value={form.frequence}
                      onChange={e => setForm(f => ({ ...f, frequence: e.target.value as AbonnementFrequence }))}
                      className="w-full bg-[#1A1A1A] border border-[#333] rounded-xl px-4 py-3 text-white focus:outline-none focus:border-[#FF4D00] transition-all appearance-none"
                    >
                      <option>Mensuel</option>
                      <option>Annuel</option>
                    </select>
                  </div>
                  <button type="submit"
                    className="w-full bg-[#FF4D00] text-white font-bold py-3.5 rounded-xl shadow-[0_4px_14px_rgba(255,77,0,0.4)] hover:scale-[1.02] active:scale-[0.98] transition-all mt-2"
                  >
                    Ajouter
                  </button>
                </form>
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </div>
  );
};
```

- [ ] **Étape 2 : Commit**
```bash
git add pages/Abonnements.tsx
git commit -m "feat: add Abonnements page with KPIs, sortable table, status management, and add modal"
```

---

## Task 11 : Valider App.tsx + push final

- [ ] **Étape 1 : Vérifier que tous les imports dans App.tsx sont satisfaits** — Les 6 nouveaux fichiers `pages/*.tsx` doivent exister avant que App.tsx compile.

- [ ] **Étape 2 : Commit App.tsx**
```bash
git add App.tsx
git commit -m "fix: wire all nav routes in App.tsx (transfer, payments, settings, revenus, pnl, abonnements)"
```

- [ ] **Étape 3 : Push**
```bash
git push origin main
```

- [ ] **Étape 4 : Vérifier sur Vercel** — Le déploiement Vercel se déclenche automatiquement. Vérifier dans le dashboard Vercel que le build passe.

---

## Points ambigus signalés

| Sujet | Décision prise |
|---|---|
| **Currency display** | `formatMoney` dans Dashboard.tsx affiche encore `$` (USD). Les nouvelles pages utilisent `€` (EUR). Le Dashboard étant gelé, le mismatch reste. À corriger séparément. |
| **Avr 2026 partiel** | Avril est le mois en cours (données jusqu'au 16/04). Toutes les projections utilisent Jan-Mar comme base et excluent avril des moyennes. |
| **Clicteur Thomas** | Détecté comme abonnement récurrent (5 occurrences) mais pourrait être un sous-traitant à la facture. Inclus dans ABONNEMENTS avec catégorie "Production" — à ajuster manuellement. |
| **Noble Productions** | Même cas que Clicteur Thomas (2 occurrences, 624 €/mois). Inclus. |
| **hostinger.com crédits** | 2 crédits non catégorisés "Chiffre d'affaires" (remboursements probable). Exclus des QONTO_PRESTATIONS. |
| **SQSP* DOMAIN** | Classé en annuel (renouvellement domaine ~18 €/an, pas mensuel). |
| **Settings → lien P&L** | Le bouton "Aller au P&L" dans Settings est visuel seulement (pas de callback `onNavigate` passé). Pour le fonctionner, il faudrait passer `onNavigate` en prop à Settings, ce qui implique de modifier App.tsx. Laissé en placeholder pour ne pas complexifier. |

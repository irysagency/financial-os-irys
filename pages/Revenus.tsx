import React, { useState, useEffect } from 'react';
import { Plus, X, ChevronDown } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { useApp } from '../context/AppContext';
import { Prestation, PrestationStatus } from '../types';

const formatDateFR = (iso: string) =>
  new Intl.DateTimeFormat('fr-FR', { day: 'numeric', month: 'short', year: 'numeric' }).format(new Date(iso));

const STATUS_CONFIG: Record<PrestationStatus, { label: string; bg: string; text: string }> = {
  Brouillon:   { label: 'Brouillon',  bg: 'bg-[#2A2A2A]',      text: 'text-muted' },
  Signé:       { label: 'Signé',      bg: 'bg-blue-900/30',     text: 'text-blue-400' },
  'En attente':{ label: 'En attente', bg: 'bg-[#FF4D00]/10',    text: 'text-[#FF4D00]' },
  Payé:        { label: 'Payé',       bg: 'bg-[#1B5E20]/30',    text: 'text-[#4CAF50]' },
  Impayé:      { label: 'Impayé',     bg: 'bg-red-950/40',      text: 'text-red-400' },
};

const ALL_STATUTS: PrestationStatus[] = ['Brouillon', 'Signé', 'En attente', 'Payé', 'Impayé'];

const MOIS_OPTIONS = [
  { value: 'all',     label: 'Tous les mois' },
  { value: '2026-04', label: 'Avr 2026' },
  { value: '2026-03', label: 'Mar 2026' },
  { value: '2026-02', label: 'Fév 2026' },
  { value: '2026-01', label: 'Jan 2026' },
  { value: '2025-12', label: 'Déc 2025' },
  { value: '2025-11', label: 'Nov 2025' },
  { value: '2025-10', label: 'Oct 2025' },
];

const EMPTY_FORM = { client: '', description: '', montantHT: '', dateEmission: '', dateEcheance: '' };

export const Revenus: React.FC = () => {
  const { pnl, recentTransactions } = useApp();
  const [prestations, setPrestations] = useState<Prestation[]>(() => {
    const stored = localStorage.getItem('irys_prestations');
    return stored ? JSON.parse(stored) : [];
  });
  const [filterMois, setFilterMois] = useState('all');
  const [filterStatut, setFilterStatut] = useState('all');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [openStatusId, setOpenStatusId] = useState<string | null>(null);
  const [form, setForm] = useState(EMPTY_FORM);

  useEffect(() => {
    localStorage.setItem('irys_prestations', JSON.stringify(prestations));
  }, [prestations]);

  // KPIs from Real Data (PnL API)
  const currentMonthData = pnl?.history?.slice(-1)[0] || { ca: 0 };
  const history2026 = pnl?.history?.filter((m: any) => m.mois >= '2026-01') || [];
  
  const cashCollecte = currentMonthData.ca;
  
  const enAttente = prestations
    .filter(p => p.statut === 'En attente')
    .reduce((s, p) => s + p.montantTTC, 0);

  const impayes = prestations
    .filter(p => p.statut === 'Impayé')
    .reduce((s, p) => s + p.montantTTC, 0);

  const caAnnuelHT = history2026.reduce((s: number, m: any) => s + m.ca, 0);

  // Merge Manual Invoices with Real Paid Transactions
  const realPaidTransactions: Prestation[] = (recentTransactions || [])
    .filter(tx => tx.amount > 0)
    .map(tx => ({
      id: tx.id,
      client: tx.name,
      description: 'Paiement reçu (Qonto)',
      montantHT: tx.amount,
      tva: 0, // Simplified
      montantTTC: tx.amount,
      dateEmission: new Date(tx.date.split('/').reverse().join('-')).toISOString().split('T')[0],
      dateEcheance: new Date(tx.date.split('/').reverse().join('-')).toISOString().split('T')[0],
      statut: 'Payé',
      source: 'qonto'
    }));

  const allFiltered = [...prestations, ...realPaidTransactions]
    .filter(p => filterMois === 'all' || p.dateEmission.startsWith(filterMois))
    .filter(p => filterStatut === 'all' || p.statut === filterStatut)
    .sort((a, b) => b.dateEmission.localeCompare(a.dateEmission));

  const changeStatut = (id: string, statut: PrestationStatus) => {
    setPrestations(prev => prev.map(p => (p.id === id ? { ...p, statut } : p)));
    setOpenStatusId(null);
  };

  const handleAdd = (e: React.FormEvent) => {
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
    setForm(EMPTY_FORM);
  };

  const KpiCard = ({
    title,
    value,
    sub,
    highlight,
  }: {
    title: string;
    value: string;
    sub?: string;
    highlight?: boolean;
  }) => (
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
          {MOIS_OPTIONS.map(o => (
            <option key={o.value} value={o.value}>
              {o.label}
            </option>
          ))}
        </select>

        <div className="flex gap-2 flex-wrap">
          {(['all', ...ALL_STATUTS] as const).map(s => (
            <button
              key={s}
              onClick={() => setFilterStatut(s)}
              className={`px-3 py-1.5 rounded-full text-xs font-medium transition-all ${
                filterStatut === s
                  ? 'bg-[#FF4D00] text-white'
                  : 'bg-[#1A1A1A] border border-[#2A2A2A] text-muted hover:text-white'
              }`}
            >
              {s === 'all' ? 'Tous' : s}
            </button>
          ))}
        </div>
      </div>

      {/* TABLEAU */}
      <div className="bg-card border border-[#2A2A2A] rounded-3xl overflow-hidden">
        {allFiltered.length === 0 ? (
          <div className="p-12 text-center text-muted">Aucune prestation pour ce filtre.</div>
        ) : (
          <div className="overflow-x-auto">
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
                {allFiltered.map(p => {
                  const sc = STATUS_CONFIG[p.statut];
                  return (
                    <tr key={p.id} className="hover:bg-[#1A1A1A]/50 transition-colors">
                      <td className="px-6 py-4">
                        <div className="font-medium text-white">{p.client}</div>
                        {p.description && <div className="text-xs text-muted">{p.description}</div>}
                      </td>
                      <td className="px-6 py-4 text-right font-medium whitespace-nowrap">
                        {p.montantHT.toFixed(2)} €
                      </td>
                      <td className="px-6 py-4 text-right text-muted whitespace-nowrap">
                        {p.tva.toFixed(2)} €
                      </td>
                      <td className="px-6 py-4 text-right font-bold whitespace-nowrap">
                        {p.montantTTC.toFixed(2)} €
                      </td>
                      <td className="px-6 py-4 text-muted whitespace-nowrap">{formatDateFR(p.dateEmission)}</td>
                      <td className="px-6 py-4 text-muted whitespace-nowrap">{formatDateFR(p.dateEcheance)}</td>
                      <td className="px-6 py-4 relative">
                        <button
                          onClick={() => setOpenStatusId(openStatusId === p.id ? null : p.id)}
                          className={`flex items-center gap-1 px-2.5 py-1 rounded-md text-xs font-bold ${sc.bg} ${sc.text}`}
                        >
                          {sc.label} <ChevronDown size={10} />
                        </button>
                        {openStatusId === p.id && (
                          <div className="absolute z-10 mt-1 left-4 bg-[#1A1A1A] border border-[#2A2A2A] rounded-xl overflow-hidden shadow-xl min-w-[120px]">
                            {ALL_STATUTS.map(s => {
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
          </div>
        )}
      </div>

      {/* MODAL NOUVELLE PRESTATION */}
      <AnimatePresence>
        {isModalOpen && (
          <>
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
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
                  <button
                    onClick={() => setIsModalOpen(false)}
                    className="text-muted hover:text-white transition-colors"
                  >
                    <X size={20} />
                  </button>
                </div>
                <form onSubmit={handleAdd} className="p-6 space-y-4">
                  {[
                    { label: 'Client',            field: 'client',        type: 'text',   placeholder: 'Nom du client', required: true },
                    { label: 'Description',        field: 'description',   type: 'text',   placeholder: 'Optionnel',     required: false },
                    { label: 'Montant HT (€)',     field: 'montantHT',     type: 'number', placeholder: '0.00',          required: true },
                    { label: "Date d'émission",    field: 'dateEmission',  type: 'date',   placeholder: '',              required: true },
                    { label: "Date d'échéance",    field: 'dateEcheance',  type: 'date',   placeholder: '',              required: false },
                  ].map(({ label, field, type, placeholder, required }) => (
                    <div key={field} className="space-y-1">
                      <label className="text-xs font-bold text-muted uppercase tracking-wider">{label}</label>
                      <input
                        type={type}
                        placeholder={placeholder}
                        value={(form as Record<string, string>)[field]}
                        onChange={e => setForm(f => ({ ...f, [field]: e.target.value }))}
                        required={required}
                        className="w-full bg-[#1A1A1A] border border-[#333] rounded-xl px-4 py-3 text-white placeholder:text-muted/50 focus:outline-none focus:border-[#FF4D00] focus:ring-1 focus:ring-[#FF4D00] transition-all"
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

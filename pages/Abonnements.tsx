import React, { useState } from 'react';
import { Plus, X, ChevronDown, ChevronLeft, ChevronRight } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { AbonnementItem, AbonnementStatut, AbonnementFrequence } from '../types';
import { useSubscriptionMonthlyLogs } from '../hooks/useSubscriptionMonthlyLogs';
import { useApiClient } from '../hooks/useApiClient';

import { formatDateFR } from '../utils/format';

const formatMonthFR = (month: string): string => {
  const [year, m] = month.split('-');
  const date = new Date(parseInt(year), parseInt(m) - 1, 1);
  const s = new Intl.DateTimeFormat('fr-FR', { month: 'long', year: 'numeric' }).format(date);
  return s.charAt(0).toUpperCase() + s.slice(1);
};

const getCurrentMonth = (): string => {
  const now = new Date();
  return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`;
};

const shiftMonth = (month: string, delta: number): string => {
  const [year, m] = month.split('-').map(Number);
  const d = new Date(year, m - 1 + delta, 1);
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`;
};

const STATUT_CONFIG: Record<AbonnementStatut, { bg: string; text: string }> = {
  Actif:   { bg: 'bg-[#1B5E20]/30', text: 'text-[#4CAF50]' },
  Pausé:   { bg: 'bg-[#FF4D00]/10', text: 'text-[#FF4D00]' },
  Annulé:  { bg: 'bg-[#2A2A2A]',    text: 'text-muted'     },
};

const ALL_STATUTS: AbonnementStatut[] = ['Actif', 'Pausé', 'Annulé'];

const EMPTY_FORM = {
  nom: '',
  montantHT: '',
  frequence: 'Mensuel' as AbonnementFrequence,
  prochaineDate: '',
  statut: 'Actif' as AbonnementStatut,
};

export const Abonnements: React.FC = () => {
  const api = useApiClient();
  const queryClient = useQueryClient();

  const { data: abonnements = [], isLoading: dataLoading } = useQuery<AbonnementItem[]>({
    queryKey: ['abonnements'],
    queryFn: () => api.get<AbonnementItem[]>('/abonnements'),
  });

  const createMutation = useMutation({
    mutationFn: (body: unknown) => api.post('/abonnements', body),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['abonnements'] }),
  });

  const updateMutation = useMutation({
    mutationFn: ({ id, body }: { id: string; body: unknown }) => api.patch(`/abonnements/${id}`, body),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['abonnements'] }),
  });

  const [isAddOpen, setIsAddOpen] = useState(false);
  const [openStatusId, setOpenStatusId] = useState<string | null>(null);
  const [form, setForm] = useState(EMPTY_FORM);
  const [selectedMonth, setSelectedMonth] = useState<string>(getCurrentMonth);
  const [formError, setFormError] = useState<string | null>(null);

  const { logs, isLoading: logsLoading, errorMsg, toggleLog } = useSubscriptionMonthlyLogs(selectedMonth);

  const currentMonth = getCurrentMonth();
  const isNextDisabled = selectedMonth >= currentMonth;

  // KPIs basés sur les logs du mois sélectionné
  const pris = abonnements.filter(a => logs[a.id] === true);

  const coutMensuelReel = pris
    .filter(a => a.frequence === 'Mensuel')
    .reduce((s, a) => s + a.montantHT, 0);

  const coutAnnuelsPris = pris
    .filter(a => a.frequence === 'Annuel')
    .reduce((s, a) => s + a.montantHT, 0);

  const coutAnnuelProjeté = coutMensuelReel * 12 + coutAnnuelsPris;

  // Prochaine échéance : inchangée, basée sur le statut des abonnements
  const actifs = abonnements.filter(a => a.statut === 'Actif');
  const prochainAb = [...actifs].sort(
    (a, b) => new Date(a.prochaineDate).getTime() - new Date(b.prochaineDate).getTime()
  )[0];

  const changeStatut = (id: string, statut: AbonnementStatut) => {
    updateMutation.mutate({ id, body: { actif: statut === 'Actif' } });
    setOpenStatusId(null);
  };

  const handleAdd = (e: React.FormEvent) => {
    e.preventDefault();
    const ht = parseFloat(form.montantHT);
    if (!ht || ht <= 0) {
      setFormError('Le montant HT doit être un nombre positif.');
      return;
    }
    createMutation.mutate({
      nom: form.nom,
      montantHT: ht,
      frequence: form.frequence,
      prochaineDate: form.prochaineDate,
    });
    setIsAddOpen(false);
    setFormError(null);
    setForm(EMPTY_FORM);
  };

  if (dataLoading) return <div className="h-full flex items-center justify-center text-[#FF4D00]">Chargement…</div>;

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
      {/* Error toast */}
      <AnimatePresence>
        {errorMsg && (
          <motion.div
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 16 }}
            className="fixed bottom-6 right-6 z-50 bg-[#1A1A1A] border border-[#FF4D00]/40 text-[#FF4D00] text-sm px-4 py-3 rounded-xl shadow-xl"
          >
            {errorMsg}
          </motion.div>
        )}
      </AnimatePresence>

      {/* HEADER */}
      <div className="flex items-center justify-between flex-wrap gap-3">
        <h1 className="text-2xl font-bold">Abonnements</h1>
        <div className="flex items-center gap-3">
          {/* Sélecteur de mois */}
          <div className="flex items-center gap-1.5 bg-[#1A1A1A] border border-[#2A2A2A] rounded-2xl px-3 py-2">
            <button
              onClick={() => setSelectedMonth(shiftMonth(selectedMonth, -1))}
              className="text-muted hover:text-white transition-colors p-0.5 rounded-lg hover:bg-[#2A2A2A]"
              aria-label="Mois précédent"
            >
              <ChevronLeft size={15} />
            </button>
            <span className="text-sm font-semibold min-w-[116px] text-center select-none">
              {formatMonthFR(selectedMonth)}
            </span>
            <button
              onClick={() => setSelectedMonth(shiftMonth(selectedMonth, 1))}
              disabled={isNextDisabled}
              className="text-muted hover:text-white transition-colors p-0.5 rounded-lg hover:bg-[#2A2A2A] disabled:opacity-30 disabled:cursor-not-allowed disabled:hover:bg-transparent"
              aria-label="Mois suivant"
            >
              <ChevronRight size={15} />
            </button>
          </div>

          <button
            onClick={() => setIsAddOpen(true)}
            className="flex items-center gap-2 px-4 py-2 bg-[#FF4D00] text-white text-sm font-bold rounded-full shadow-[0_4px_14px_rgba(255,77,0,0.4)] hover:scale-105 transition-transform"
          >
            <Plus size={16} /> Ajouter un abonnement
          </button>
        </div>
      </div>

      {/* KPIs */}
      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-4">
        <KpiCard
          title="Pris ce mois"
          value={logsLoading ? '—' : `${pris.length}`}
          sub={logsLoading ? 'Chargement…' : `sur ${abonnements.length} abonnement${abonnements.length > 1 ? 's' : ''}`}
        />
        <KpiCard
          title="Coût mensuel réel HT"
          value={logsLoading ? '—' : `${coutMensuelReel.toFixed(2)} €`}
          sub="Abonnements pris ce mois"
        />
        <KpiCard
          title="Coût annuel projeté HT"
          value={logsLoading ? '—' : `${coutAnnuelProjeté.toFixed(2)} €`}
          sub="Mensuels ×12 + annuels pris"
        />
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
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm">
              <thead className="bg-[#1A1A1A] text-muted border-b border-[#2A2A2A]">
                <tr>
                  <th className="px-6 py-4 font-medium">Nom</th>
                  <th className="px-6 py-4 font-medium">Catégorie</th>
                  <th className="px-6 py-4 font-medium text-right">Montant HT</th>
                  <th className="px-6 py-4 font-medium">Fréquence</th>
                  <th className="px-6 py-4 font-medium">Prochaine date</th>
                  <th className="px-6 py-4 font-medium">Statut</th>
                  <th className="px-6 py-4 font-medium text-center">Ce mois</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#1A1A1A]">
                {sorted.map(a => {
                  const sc = STATUT_CONFIG[a.statut];
                  const isTaken = logs[a.id] === true;
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
                      <td className="px-6 py-4 text-right font-bold whitespace-nowrap">
                        {a.montantHT.toFixed(2)} €
                      </td>
                      <td className="px-6 py-4 text-muted">{a.frequence}</td>
                      <td className="px-6 py-4 text-muted whitespace-nowrap">
                        {formatDateFR(a.prochaineDate)}
                      </td>
                      <td className="px-6 py-4 relative">
                        <button
                          onClick={() => setOpenStatusId(openStatusId === a.id ? null : a.id)}
                          className={`flex items-center gap-1 px-2.5 py-1 rounded-md text-xs font-bold ${sc.bg} ${sc.text}`}
                        >
                          {a.statut} <ChevronDown size={10} />
                        </button>
                        {openStatusId === a.id && (
                          <div className="absolute z-10 mt-1 left-4 bg-[#1A1A1A] border border-[#2A2A2A] rounded-xl overflow-hidden shadow-xl min-w-[100px]">
                            {ALL_STATUTS.map(s => (
                              <button
                                key={s}
                                onClick={() => changeStatut(a.id, s)}
                                className={`w-full text-left px-4 py-2 text-xs font-medium hover:bg-[#2A2A2A] transition-colors ${STATUT_CONFIG[s].text}`}
                              >
                                {s}
                              </button>
                            ))}
                          </div>
                        )}
                      </td>
                      {/* Toggle "Ce mois" */}
                      <td className="px-6 py-4">
                        <div className="flex justify-center">
                          <button
                            onClick={() => toggleLog(a.id, !isTaken)}
                            disabled={logsLoading}
                            title={isTaken ? 'Pris ce mois — cliquer pour retirer' : 'Pas pris ce mois — cliquer pour marquer'}
                            className={`relative inline-flex h-5 w-9 shrink-0 cursor-pointer items-center rounded-full transition-colors duration-200 focus:outline-none disabled:opacity-40 disabled:cursor-not-allowed ${
                              isTaken ? 'bg-[#FF4D00]' : 'bg-[#2A2A2A]'
                            }`}
                          >
                            <span
                              className={`inline-block h-3.5 w-3.5 transform rounded-full bg-white shadow-sm transition-transform duration-200 ${
                                isTaken ? 'translate-x-[18px]' : 'translate-x-[3px]'
                              }`}
                            />
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* MODAL AJOUTER */}
      <AnimatePresence>
        {isAddOpen && (
          <>
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
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
                  <button
                    onClick={() => setIsAddOpen(false)}
                    className="text-muted hover:text-white transition-colors"
                  >
                    <X size={20} />
                  </button>
                </div>
                <form onSubmit={handleAdd} className="p-6 space-y-4">
                  {[
                    { label: 'Nom',             field: 'nom',           type: 'text',   placeholder: 'ex : Figma' },
                    { label: 'Montant HT (€)',   field: 'montantHT',     type: 'number', placeholder: '0.00' },
                    { label: 'Prochaine date',   field: 'prochaineDate', type: 'date',   placeholder: '' },
                  ].map(({ label, field, type, placeholder }) => (
                    <div key={field} className="space-y-1">
                      <label className="text-xs font-bold text-muted uppercase tracking-wider">
                        {label}
                      </label>
                      <input
                        type={type}
                        placeholder={placeholder}
                        value={(form as Record<string, string>)[field]}
                        onChange={e => setForm(f => ({ ...f, [field]: e.target.value }))}
                        required
                        className="w-full bg-[#1A1A1A] border border-[#333] rounded-xl px-4 py-3 text-white placeholder:text-muted/50 focus:outline-none focus:border-[#FF4D00] focus:ring-1 focus:ring-[#FF4D00] transition-all"
                      />
                    </div>
                  ))}
                  <div className="space-y-1">
                    <label className="text-xs font-bold text-muted uppercase tracking-wider">
                      Fréquence
                    </label>
                    <select
                      value={form.frequence}
                      onChange={e => setForm(f => ({ ...f, frequence: e.target.value as AbonnementFrequence }))}
                      className="w-full bg-[#1A1A1A] border border-[#333] rounded-xl px-4 py-3 text-white focus:outline-none focus:border-[#FF4D00] transition-all appearance-none"
                    >
                      <option>Mensuel</option>
                      <option>Annuel</option>
                    </select>
                  </div>
                  <div className="space-y-1">
                    <label className="text-xs font-bold text-muted uppercase tracking-wider">Statut</label>
                    <div className="flex gap-2">
                      {ALL_STATUTS.map(s => (
                        <button
                          key={s}
                          type="button"
                          onClick={() => setForm(f => ({ ...f, statut: s }))}
                          className={`flex-1 py-2.5 rounded-xl text-xs font-bold border transition-all ${
                            form.statut === s
                              ? `${STATUT_CONFIG[s].bg} ${STATUT_CONFIG[s].text} border-transparent ring-1 ring-current`
                              : 'bg-[#1A1A1A] text-muted border-[#2A2A2A] hover:text-white'
                          }`}
                        >
                          {s}
                        </button>
                      ))}
                    </div>
                  </div>
                  {formError && (
                    <p className="text-xs text-red-400 text-center">{formError}</p>
                  )}
                  <button
                    type="submit"
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

import React, { useState, useEffect } from 'react';
import { Plus, X, ChevronDown } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { ABONNEMENTS_INITIALS } from '../constants/data';
import { AbonnementItem, AbonnementStatut, AbonnementFrequence } from '../types';

const formatDateFR = (iso: string) =>
  new Intl.DateTimeFormat('fr-FR', { day: 'numeric', month: 'short', year: 'numeric' }).format(new Date(iso));

const STATUT_CONFIG: Record<AbonnementStatut, { bg: string; text: string }> = {
  Actif:   { bg: 'bg-[#1B5E20]/30',  text: 'text-[#4CAF50]' },
  Pausé:   { bg: 'bg-[#FF4D00]/10',  text: 'text-[#FF4D00]' },
  Annulé:  { bg: 'bg-[#2A2A2A]',     text: 'text-muted' },
};

const ALL_STATUTS: AbonnementStatut[] = ['Actif', 'Pausé', 'Annulé'];

const EMPTY_FORM = {
  nom: '',
  categorie: '',
  montantHT: '',
  frequence: 'Mensuel' as AbonnementFrequence,
  prochaineDate: '',
  statut: 'Actif' as AbonnementStatut,
};

export const Abonnements: React.FC = () => {
  const [abonnements, setAbonnements] = useState<AbonnementItem[]>(() => {
    const s = localStorage.getItem('irys_abonnements');
    return s ? JSON.parse(s) : ABONNEMENTS_INITIALS;
  });
  const [isAddOpen, setIsAddOpen] = useState(false);
  const [openStatusId, setOpenStatusId] = useState<string | null>(null);
  const [form, setForm] = useState(EMPTY_FORM);

  useEffect(() => {
    localStorage.setItem('irys_abonnements', JSON.stringify(abonnements));
  }, [abonnements]);

  const actifs = abonnements.filter(a => a.statut === 'Actif');

  const coutMensuel = actifs
    .filter(a => a.frequence === 'Mensuel')
    .reduce((s, a) => s + a.montantHT, 0);

  const coutAnnuels = actifs
    .filter(a => a.frequence === 'Annuel')
    .reduce((s, a) => s + a.montantHT, 0);

  const coutAnnuelTotal = coutMensuel * 12 + coutAnnuels;

  const prochainAb = [...actifs].sort(
    (a, b) => new Date(a.prochaineDate).getTime() - new Date(b.prochaineDate).getTime()
  )[0];

  const changeStatut = (id: string, statut: AbonnementStatut) => {
    setAbonnements(prev => prev.map(a => (a.id === id ? { ...a, statut } : a)));
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
      statut: form.statut,
    };
    setAbonnements(prev => [newAb, ...prev]);
    setIsAddOpen(false);
    setForm(EMPTY_FORM);
  };

  // Trié par montant décroissant
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
        <KpiCard
          title="Coût mensuel HT"
          value={`${coutMensuel.toFixed(2)} €`}
          sub="Abonnements mensuels"
        />
        <KpiCard
          title="Coût annuel projeté HT"
          value={`${coutAnnuelTotal.toFixed(2)} €`}
          sub="Mensuels ×12 + annuels"
        />
        <KpiCard
          title="Prochaine échéance"
          value={prochainAb ? `${prochainAb.montantHT.toFixed(2)} €` : '—'}
          sub={
            prochainAb
              ? `${prochainAb.nom} · ${formatDateFR(prochainAb.prochaineDate)}`
              : undefined
          }
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
                      <td className="px-6 py-4 text-right font-bold whitespace-nowrap">
                        {a.montantHT.toFixed(2)} €
                      </td>
                      <td className="px-6 py-4 text-muted">{a.frequence}</td>
                      <td className="px-6 py-4 text-muted whitespace-nowrap">
                        {formatDateFR(a.prochaineDate)}
                      </td>
                      <td className="px-6 py-4 relative">
                        <button
                          onClick={() =>
                            setOpenStatusId(openStatusId === a.id ? null : a.id)
                          }
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
                    { label: 'Nom',          field: 'nom',          type: 'text',   placeholder: 'ex : Figma' },
                    { label: 'Catégorie',    field: 'categorie',    type: 'text',   placeholder: 'ex : Design / SaaS' },
                    { label: 'Montant HT (€)', field: 'montantHT', type: 'number', placeholder: '0.00' },
                    { label: 'Prochaine date', field: 'prochaineDate', type: 'date', placeholder: '' },
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
                      onChange={e =>
                        setForm(f => ({ ...f, frequence: e.target.value as AbonnementFrequence }))
                      }
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

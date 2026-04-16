import React from 'react';
import { Clock, ArrowRight } from 'lucide-react';
import { ABONNEMENTS_INITIALS } from '../constants/data';
import { AbonnementItem } from '../types';

const formatDateFR = (iso: string) =>
  new Intl.DateTimeFormat('fr-FR', { day: 'numeric', month: 'short', year: 'numeric' }).format(new Date(iso));

interface PaymentsProps {
  onNavigate: (page: string) => void;
}

export const Payments: React.FC<PaymentsProps> = ({ onNavigate }) => {
  const stored = localStorage.getItem('irys_abonnements');
  const abonnements: AbonnementItem[] = stored ? JSON.parse(stored) : ABONNEMENTS_INITIALS;
  const actifs = abonnements.filter(a => a.statut === 'Actif');

  const coutMensuel = actifs
    .filter(a => a.frequence === 'Mensuel')
    .reduce((s, a) => s + a.montantHT, 0);

  const prochainAb = [...actifs].sort(
    (a, b) => new Date(a.prochaineDate).getTime() - new Date(b.prochaineDate).getTime()
  )[0];

  // Total débits du mois courant (Avr 2026, partiel) — valeur fixe depuis données Qonto
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
        <KpiCard
          title="Payé ce mois"
          value={`${totalPayeCeMois.toFixed(2)} €`}
          sub="Avr 2026 (partiel)"
        />
        <KpiCard
          title="Abonnements actifs"
          value={`${actifs.length}`}
          sub={`${coutMensuel.toFixed(2)} €/mois HT`}
        />
        <KpiCard
          title="Prochain paiement"
          value={prochainAb ? `${prochainAb.montantHT.toFixed(2)} €` : '—'}
          sub={prochainAb ? `${prochainAb.nom} · ${formatDateFR(prochainAb.prochaineDate)}` : undefined}
        />
      </div>

      {/* LISTE PAIEMENTS RÉCURRENTS */}
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
        {actifs.length === 0 ? (
          <div className="p-12 text-center text-muted">Aucun abonnement actif.</div>
        ) : (
          <div className="divide-y divide-[#1A1A1A]">
            {[...actifs]
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
        )}
      </div>
    </div>
  );
};

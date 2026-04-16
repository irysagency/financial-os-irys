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
    setBeneficiaire('');
    setMontant('');
    setReference('');
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
              type="text"
              value={beneficiaire}
              onChange={e => setBeneficiaire(e.target.value)}
              placeholder="Nom ou IBAN"
              required
              className="w-full bg-[#1A1A1A] border border-[#333] rounded-xl px-4 py-3 text-white placeholder:text-muted/50 focus:outline-none focus:border-[#FF4D00] focus:ring-1 focus:ring-[#FF4D00] transition-all"
            />
          </div>
          <div className="space-y-2">
            <label className="text-xs font-bold text-muted uppercase tracking-wider">Montant (€)</label>
            <input
              type="number"
              min="0"
              step="0.01"
              value={montant}
              onChange={e => setMontant(e.target.value)}
              placeholder="0.00"
              required
              className="w-full bg-[#1A1A1A] border border-[#333] rounded-xl px-4 py-3 text-white placeholder:text-muted/50 focus:outline-none focus:border-[#FF4D00] focus:ring-1 focus:ring-[#FF4D00] transition-all"
            />
          </div>
          <div className="space-y-2">
            <label className="text-xs font-bold text-muted uppercase tracking-wider">Référence (optionnel)</label>
            <input
              type="text"
              value={reference}
              onChange={e => setReference(e.target.value)}
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

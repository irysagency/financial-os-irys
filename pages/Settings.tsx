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

  const Section = ({
    title,
    icon: Icon,
    children,
  }: {
    title: string;
    icon: React.ElementType;
    children: React.ReactNode;
  }) => (
    <div className="bg-card border border-[#2A2A2A] rounded-3xl overflow-hidden">
      <div className="flex items-center gap-3 px-6 py-4 border-b border-[#2A2A2A]">
        <Icon size={18} className="text-[#FF4D00]" />
        <h2 className="font-bold">{title}</h2>
      </div>
      <div className="p-6 space-y-4">{children}</div>
    </div>
  );

  const Field = ({ label, value }: { label: string; value: string }) => (
    <div className="flex items-center justify-between py-2 border-b border-[#1A1A1A] last:border-0">
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
        <p className="text-sm text-muted">
          Configurez vos objectifs CA et résultat net depuis la page P&L.
        </p>
        <button className="flex items-center gap-2 text-sm text-[#FF4D00] hover:underline">
          Aller au P&L <ChevronRight size={14} />
        </button>
      </Section>

      {/* IMPORT */}
      <Section title="Import données" icon={Upload}>
        <p className="text-sm text-muted mb-2">
          Importez un nouvel export CSV Qonto pour mettre à jour vos données.
        </p>
        <button
          disabled
          className="flex items-center gap-2 px-4 py-2 bg-[#1A1A1A] border border-[#2A2A2A] rounded-xl text-sm text-muted cursor-not-allowed"
        >
          <Upload size={14} /> Importer un CSV (bientôt disponible)
        </button>
      </Section>

      {/* RESET */}
      <Section title="Données" icon={Trash2}>
        <p className="text-sm text-muted">
          Réinitialise les prestations, abonnements et objectifs modifiés manuellement.
          Les données Qonto importées restent inchangées.
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
          {confirmReset
            ? 'Cliquer pour confirmer la réinitialisation'
            : 'Réinitialiser les données'}
        </button>
      </Section>
    </div>
  );
};

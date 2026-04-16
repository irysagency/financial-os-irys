import React, { useState } from 'react';
import { useApp } from '../context/AppContext';
import { MoreHorizontal, RefreshCw } from 'lucide-react';
import {
  ComposedChart, Bar, Line, XAxis, YAxis, Tooltip,
  ResponsiveContainer, CartesianGrid, Cell,
} from 'recharts';
import { ABONNEMENTS_INITIALS, MONTHLY_PNL } from '../constants/data';

const fmtEur = (n: number) =>
  new Intl.NumberFormat('fr-FR', {
    style: 'currency',
    currency: 'EUR',
    minimumFractionDigits: 2,
  }).format(n);

const SUBSCRIPTIONS_WHITELIST = ['Notion', 'Squarespace', 'Claude', 'Metricool'];

// Données annuelles 2026 : réel pour les mois disponibles, 0 pour les autres
const CHART_DATA_2026 = [
  { name: 'Jan', ...(() => { const m = MONTHLY_PNL.find(x => x.mois === '2026-01'); return { ca: m?.caHT ?? 0, charges: m?.totalChargesHT ?? 0, resultat: m?.resultatNet ?? 0, hasData: !!m }; })() },
  { name: 'Fév', ...(() => { const m = MONTHLY_PNL.find(x => x.mois === '2026-02'); return { ca: m?.caHT ?? 0, charges: m?.totalChargesHT ?? 0, resultat: m?.resultatNet ?? 0, hasData: !!m }; })() },
  { name: 'Mar', ...(() => { const m = MONTHLY_PNL.find(x => x.mois === '2026-03'); return { ca: m?.caHT ?? 0, charges: m?.totalChargesHT ?? 0, resultat: m?.resultatNet ?? 0, hasData: !!m }; })() },
  { name: 'Avr', ...(() => { const m = MONTHLY_PNL.find(x => x.mois === '2026-04'); return { ca: m?.caHT ?? 0, charges: m?.totalChargesHT ?? 0, resultat: m?.resultatNet ?? 0, hasData: !!m }; })() },
  { name: 'Mai',  ca: 0, charges: 0, resultat: 0, hasData: false },
  { name: 'Juin', ca: 0, charges: 0, resultat: 0, hasData: false },
  { name: 'Juil', ca: 0, charges: 0, resultat: 0, hasData: false },
  { name: 'Août', ca: 0, charges: 0, resultat: 0, hasData: false },
  { name: 'Sep',  ca: 0, charges: 0, resultat: 0, hasData: false },
  { name: 'Oct',  ca: 0, charges: 0, resultat: 0, hasData: false },
  { name: 'Nov',  ca: 0, charges: 0, resultat: 0, hasData: false },
  { name: 'Déc',  ca: 0, charges: 0, resultat: 0, hasData: false },
];

export const Dashboard: React.FC = () => {
  const { kpis, recentTransactions, expenseDistribution, isLoading, refreshData } = useApp();

  const [showCA,       setShowCA]       = useState(true);
  const [showCharges,  setShowCharges]  = useState(true);
  const [showResultat, setShowResultat] = useState(true);
  const [isSyncing, setIsSyncing] = useState(false);
  const [syncMessage, setSyncMessage] = useState<{ text: string, type: 'success' | 'error' } | null>(null);

  const handleSync = async () => {
    setIsSyncing(true);
    setSyncMessage(null);
    try {
      const response = await fetch('/api/sync-qonto');
      const data = await response.json();
      
      if (response.ok) {
        setSyncMessage({ text: `Synchronisation réussie (${data.count} transactions)`, type: 'success' });
        // Refresh the global state with new data from Supabase
        refreshData();
      } else {
        setSyncMessage({ text: `Erreur: ${data.error}`, type: 'error' });
      }
    } catch (error) {
      setSyncMessage({ text: 'Erreur de connexion à l\'API', type: 'error' });
    } finally {
      setIsSyncing(false);
      setTimeout(() => setSyncMessage(null), 5000);
    }
  };

  const subscriptions = ABONNEMENTS_INITIALS.filter(a =>
    a.statut === 'Actif' &&
    SUBSCRIPTIONS_WHITELIST.some(w => a.nom.toLowerCase().includes(w.toLowerCase()))
  ).sort((a, b) => a.prochaineDate.localeCompare(b.prochaineDate));

  const monthlyCost = subscriptions
    .filter(a => a.frequence === 'Mensuel')
    .reduce((s, a) => s + a.montantHT, 0);

  if (isLoading) {
    return <div className="h-full flex items-center justify-center text-[#FF4D00]">Chargement…</div>;
  }

  return (
    <div className="space-y-6 animate-in fade-in duration-500 pb-20">

      {/* HEADER */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <h2 className="text-2xl font-bold">Overview</h2>
          <div className="bg-[#1A1A1A] border border-[#2A2A2A] px-3 py-1.5 rounded-lg text-sm text-white flex items-center gap-2">
            <span className="w-4 h-3 bg-[#FF4D00] rounded-sm"></span>
            Irys Agency · Qonto
          </div>
          <button
            onClick={handleSync}
            disabled={isSyncing}
            className={`flex items-center gap-2 px-4 py-1.5 rounded-lg text-sm font-medium transition-all ${
              isSyncing 
                ? 'bg-[#1A1A1A] text-muted cursor-not-allowed' 
                : 'bg-[#FF4D00] text-white hover:bg-[#FF4D00]/80 active:scale-95'
            }`}
          >
            <RefreshCw size={14} className={isSyncing ? 'animate-spin' : ''} />
            {isSyncing ? 'Synchronisation...' : 'Synchroniser mes finances'}
          </button>
          {syncMessage && (
            <div className={`text-xs px-3 py-1.5 rounded-lg animate-in slide-in-from-left-2 duration-300 ${
              syncMessage.type === 'success' ? 'bg-[#4CAF50]/10 text-[#4CAF50]' : 'bg-[#FF4D00]/10 text-[#FF4D00]'
            }`}>
              {syncMessage.text}
            </div>
          )}
        </div>
      </div>

      {/* KPI GRID */}
      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-4">
        {kpis.map((kpi, index) => (
          <div
            key={index}
            className="bg-card border border-[#2A2A2A] p-6 rounded-3xl hover:border-[#FF4D00]/30 transition-colors group"
          >
            <div className="flex justify-between items-start mb-4">
              <span className="text-muted text-sm font-medium">{kpi.title}</span>
              <button className="text-muted hover:text-white">
                <MoreHorizontal size={18} />
              </button>
            </div>
            <div className="flex items-end justify-between">
              <div className="text-2xl font-bold">{fmtEur(kpi.amount)}</div>
              {kpi.trend !== 0 && (
                <div className={`px-2 py-1 rounded-full text-xs font-bold ${
                  kpi.trend > 0
                    ? 'bg-[#FF4D00] text-white'
                    : 'bg-[#FF4D00]/10 text-[#FF4D00]'
                }`}>
                  {kpi.trend > 0 ? '+' : ''}{kpi.trend}%
                </div>
              )}
            </div>
          </div>
        ))}
      </div>

      {/* CASH FLOW + ABONNEMENTS */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">

        {/* CHART */}
        <div className="lg:col-span-2 bg-card border border-[#2A2A2A] p-6 rounded-3xl">
          <div className="flex justify-between items-center mb-6">
            <div>
              <h3 className="text-muted text-sm font-medium mb-1">Cash Flow 2026</h3>
              <div className="text-2xl font-bold">{fmtEur(kpis[0]?.amount ?? 0)}</div>
            </div>
            {/* Series toggles */}
            <div className="flex items-center gap-1 bg-[#1A1A1A] border border-[#2A2A2A] rounded-xl p-1">
              <button
                onClick={() => setShowCA(v => !v)}
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium transition-all ${showCA ? 'bg-[#FF4D00] text-white' : 'text-muted hover:text-white'}`}
              >
                Revenus
              </button>
              <button
                onClick={() => setShowCharges(v => !v)}
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium transition-all ${showCharges ? 'bg-[#444] text-white' : 'text-muted hover:text-white'}`}
              >
                Dépenses
              </button>
              <button
                onClick={() => setShowResultat(v => !v)}
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium transition-all ${showResultat ? 'bg-[#1B5E20] text-[#4CAF50]' : 'text-muted hover:text-white'}`}
              >
                Résultat
              </button>
            </div>
          </div>

          <div className="h-64 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <ComposedChart data={CHART_DATA_2026} margin={{ top: 5, right: 5, left: -10, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#1A1A1A" />
                <XAxis
                  dataKey="name"
                  axisLine={false}
                  tickLine={false}
                  tick={{ fill: '#444', fontSize: 12 }}
                  dy={10}
                />
                <YAxis
                  axisLine={false}
                  tickLine={false}
                  tick={{ fill: '#444', fontSize: 11 }}
                  tickFormatter={v => v >= 1000 ? `${(v / 1000).toFixed(0)}k` : `${v}`}
                />
                <Tooltip
                  cursor={{ fill: '#ffffff05' }}
                  contentStyle={{
                    backgroundColor: '#1A1A1A',
                    border: '1px solid #333',
                    borderRadius: '12px',
                    color: '#fff',
                  }}
                  formatter={(value: number, name: string) => [
                    fmtEur(value),
                    name === 'ca' ? 'Revenus HT' : name === 'charges' ? 'Dépenses HT' : 'Résultat net',
                  ]}
                />
                {showCA && (
                  <Bar dataKey="ca" radius={[6, 6, 0, 0]} maxBarSize={28}>
                    {CHART_DATA_2026.map((entry, i) => (
                      <Cell
                        key={`ca-${i}`}
                        fill="#FF4D00"
                        fillOpacity={entry.hasData ? 0.85 : 0.12}
                      />
                    ))}
                  </Bar>
                )}
                {showCharges && (
                  <Bar dataKey="charges" radius={[6, 6, 0, 0]} maxBarSize={28}>
                    {CHART_DATA_2026.map((entry, i) => (
                      <Cell
                        key={`ch-${i}`}
                        fill="#444444"
                        fillOpacity={entry.hasData ? 0.85 : 0.12}
                      />
                    ))}
                  </Bar>
                )}
                {showResultat && (
                  <Line
                    dataKey="resultat"
                    stroke="#4CAF50"
                    strokeWidth={2}
                    dot={(props: any) => {
                      const { cx, cy, payload } = props;
                      if (!payload.hasData) return <g key={`dot-${props.index}`} />;
                      return (
                        <circle
                          key={`dot-${props.index}`}
                          cx={cx} cy={cy} r={3}
                          fill="#4CAF50"
                        />
                      );
                    }}
                    connectNulls={false}
                  />
                )}
              </ComposedChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* ABONNEMENTS */}
        <div className="bg-card border border-[#2A2A2A] p-6 rounded-3xl flex flex-col">
          <div className="flex justify-between items-center mb-6">
            <h3 className="font-bold">Abonnements</h3>
            <div className="text-right">
              <span className="text-sm font-bold">{fmtEur(monthlyCost)}</span>
              <span className="text-xs text-muted"> /mois</span>
            </div>
          </div>

          <div className="space-y-4 flex-1">
            {subscriptions.map(ab => (
              <div
                key={ab.id}
                className="bg-[#1A1A1A] p-4 rounded-2xl flex items-center justify-between group border border-transparent hover:border-[#FF4D00]/50 transition-all"
              >
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-xl bg-[#2A2A2A] border border-[#333] flex items-center justify-center font-bold text-sm text-[#FF4D00]">
                    {ab.nom[0]}
                  </div>
                  <div>
                    <div className="font-bold text-sm">{ab.nom}</div>
                    <div className="text-xs text-muted">
                      {new Date(ab.prochaineDate).toLocaleDateString('fr-FR', { day: 'numeric', month: 'short' })}
                    </div>
                  </div>
                </div>
                <div className="flex flex-col items-end">
                  <div className="font-bold text-sm">{fmtEur(ab.montantHT)}</div>
                  <div className="text-[10px] text-muted">{ab.frequence}</div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* BOTTOM: EXPENSE DONUT + RECENT TRANSACTIONS */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">

        {/* EXPENSE DISTRIBUTION */}
        <div className="bg-card border border-[#2A2A2A] p-6 rounded-3xl">
          <h3 className="font-bold mb-6">Répartition des dépenses</h3>
          <div className="space-y-3">
            {expenseDistribution.map((item: any) => (
              <div key={item.name}>
                <div className="flex justify-between text-sm mb-1">
                  <div className="flex items-center gap-2">
                    <div className="w-2 h-2 rounded-full" style={{ backgroundColor: item.color }} />
                    <span className="text-muted">{item.name}</span>
                  </div>
                  <span className="font-bold">{item.value}%</span>
                </div>
                <div className="h-1.5 bg-[#2A2A2A] rounded-full overflow-hidden">
                  <div
                    className="h-full rounded-full"
                    style={{ width: `${item.value}%`, backgroundColor: item.color }}
                  />
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* RECENT TRANSACTIONS */}
        <div className="lg:col-span-2 bg-card border border-[#2A2A2A] p-6 rounded-3xl">
          <div className="flex justify-between items-center mb-6">
            <h3 className="font-bold">Dernières transactions</h3>
          </div>

          <div className="space-y-4">
            {recentTransactions.map(tx => (
              <div
                key={tx.id}
                className="flex items-center justify-between py-2 border-b border-[#1A1A1A] last:border-0 hover:bg-[#1A1A1A] rounded-xl px-2 -mx-2 transition-colors"
              >
                <div className="flex items-center gap-4">
                  <div className="w-10 h-10 rounded-full bg-[#1A1A1A] border border-[#2A2A2A] flex items-center justify-center">
                    <div className="text-[#FF4D00] font-bold">{tx.name[0]}</div>
                  </div>
                  <div>
                    <div className="font-bold text-sm text-white">{tx.name}</div>
                    <div className="text-xs text-muted">{tx.type}</div>
                  </div>
                </div>

                <div className="flex items-center gap-8">
                  <div className={`text-sm font-bold w-24 text-right ${tx.amount > 0 ? 'text-[#4CAF50]' : ''}`}>
                    {tx.amount > 0 ? '+' : ''}{fmtEur(tx.amount)}
                  </div>
                  <div className="text-xs text-muted hidden sm:block w-32 text-right">{tx.date}</div>
                  <button className="text-muted hover:text-white">
                    <MoreHorizontal size={16} />
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};

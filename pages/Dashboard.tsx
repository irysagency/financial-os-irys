import React, { useState } from 'react';
import { useApp } from '../context/AppContext';
import { MoreHorizontal, RefreshCw } from 'lucide-react';
import {
  AreaChart, Area, XAxis, YAxis, Tooltip,
  ResponsiveContainer, CartesianGrid,
  PieChart, Pie, Cell,
} from 'recharts';

const fmtEur = (n: number) =>
  new Intl.NumberFormat('fr-FR', {
    style: 'currency',
    currency: 'EUR',
    minimumFractionDigits: 2,
  }).format(n);

interface DashboardProps {
  onNavigate?: (page: string) => void;
}

export const Dashboard: React.FC<DashboardProps> = ({ onNavigate }) => {
  const { kpis, recentTransactions, expenseDistribution, cashFlow, subscriptions, isLoading, refreshData } = useApp();

  const [showCA,       setShowCA]       = useState(true);
  const [showCharges,  setShowCharges]  = useState(true);
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

  const monthlyCost = subscriptions
    .filter(a => a.frequence === 'Mensuel')
    .reduce((s, a) => s + a.montantHT, 0);

  // Total expenses for the donut center
  const totalExpenses = kpis.find(k => k.title === 'Dépenses (Mois)')?.amount || 0;

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
            </div>
          </div>

          <div className="h-72 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={cashFlow} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                <defs>
                  <linearGradient id="colorCa" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#FF4D00" stopOpacity={0.3}/>
                    <stop offset="95%" stopColor="#FF4D00" stopOpacity={0}/>
                  </linearGradient>
                  <linearGradient id="colorCharges" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#444444" stopOpacity={0.3}/>
                    <stop offset="95%" stopColor="#444444" stopOpacity={0}/>
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#1A1A1A" />
                <XAxis
                  dataKey="name"
                  axisLine={false}
                  tickLine={false}
                  tick={{ fill: '#666', fontSize: 12 }}
                  dy={10}
                />
                <YAxis
                  axisLine={false}
                  tickLine={false}
                  tick={{ fill: '#666', fontSize: 11 }}
                  tickFormatter={v => v >= 1000 ? `${(v / 1000).toFixed(0)}k` : `${v}`}
                />
                <Tooltip
                  cursor={{ stroke: '#333', strokeWidth: 1 }}
                  contentStyle={{
                    backgroundColor: '#1A1A1A',
                    border: '1px solid #333',
                    borderRadius: '16px',
                    color: '#fff',
                    boxShadow: '0 10px 15px -3px rgba(0, 0, 0, 0.5)'
                  }}
                  itemStyle={{ fontSize: '13px', padding: '2px 0' }}
                  labelStyle={{ fontWeight: 'bold', marginBottom: '4px', color: '#FF4D00' }}
                  formatter={(value: number, name: string) => [
                    fmtEur(value),
                    name === 'ca' ? 'Revenus' : 'Dépenses',
                  ]}
                />
                {showCA && (
                  <Area
                    type="monotone"
                    dataKey="ca"
                    stroke="#FF4D00"
                    strokeWidth={3}
                    fillOpacity={1}
                    fill="url(#colorCa)"
                    animationDuration={1500}
                  />
                )}
                {showCharges && (
                  <Area
                    type="monotone"
                    dataKey="charges"
                    stroke="#444444"
                    strokeWidth={3}
                    fillOpacity={1}
                    fill="url(#colorCharges)"
                    animationDuration={1500}
                  />
                )}
              </AreaChart>
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

        {/* EXPENSE DISTRIBUTION (DONUT CHART) */}
        <div className="bg-card border border-[#2A2A2A] p-6 rounded-3xl flex flex-col">
          <h3 className="font-bold mb-4">Répartition des dépenses</h3>
          
          <div className="relative h-64 w-full flex-1">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={expenseDistribution}
                  cx="50%"
                  cy="50%"
                  innerRadius={60}
                  outerRadius={85}
                  paddingAngle={5}
                  dataKey="value"
                  animationBegin={0}
                  animationDuration={1500}
                >
                  {expenseDistribution.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.color} stroke="none" />
                  ))}
                </Pie>
                <Tooltip 
                  contentStyle={{ backgroundColor: '#1A1A1A', border: '1px solid #333', borderRadius: '12px' }}
                  itemStyle={{ color: '#fff' }}
                />
              </PieChart>
            </ResponsiveContainer>
            
            {/* Center Label */}
            <div className="absolute inset-0 flex flex-col items-center justify-center pt-2">
              <span className="text-[10px] text-muted uppercase tracking-wider font-medium">Dépenses</span>
              <span className="text-lg font-bold">{fmtEur(totalExpenses).replace(',00', '')}</span>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3 mt-4">
            {expenseDistribution.map((item: any) => (
              <div key={item.name} className="flex items-center gap-2 bg-[#1A1A1A] p-2 rounded-xl border border-[#2A2A2A]">
                <div className="w-1.5 h-1.5 rounded-full shrink-0" style={{ backgroundColor: item.color }} />
                <div className="flex-1 min-w-0">
                  <div className="text-[10px] text-muted truncate">{item.name}</div>
                  <div className="text-xs font-bold">{item.value}%</div>
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

          <button
            onClick={() => onNavigate?.('transactions')}
            className="w-full mt-6 py-3 rounded-2xl border border-[#2A2A2A] text-sm font-medium text-muted hover:text-white hover:border-[#FF4D00]/50 hover:bg-[#FF4D00]/5 transition-all active:scale-[0.98]"
          >
            Voir toutes les transactions
          </button>
        </div>
      </div>
    </div>
  );
};

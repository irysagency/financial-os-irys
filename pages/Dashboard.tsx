import React, { useState, useMemo } from 'react';
import { useApp } from '../context/AppContext';
import { MoreHorizontal, ChevronLeft, ChevronRight } from 'lucide-react';
import {
  ComposedChart, Bar, Line, XAxis, YAxis, Tooltip,
  ResponsiveContainer, CartesianGrid, Cell,
} from 'recharts';
import { ABONNEMENTS_INITIALS, MONTHLY_PNL } from '../constants/data';

/* ─── helpers ──────────────────────────────────────────────── */

const fmtEur = (n: number) =>
  new Intl.NumberFormat('fr-FR', {
    style: 'currency',
    currency: 'EUR',
    minimumFractionDigits: 2,
  }).format(n);

const IS_RATE   = 0.15;   // taux réduit IS PME (≤ 42 500 €/an)
const PFU_RATE  = 0.30;   // flat tax PFU dividendes

type Filter = '3m' | '6m' | 'all';

/* ─── sub-components ────────────────────────────────────────── */

const KpiCard: React.FC<{
  title: string; value: string; sub?: string; accent?: string;
}> = ({ title, value, sub, accent }) => (
  <div className="bg-card border border-[#2A2A2A] p-6 rounded-3xl hover:border-[#FF4D00]/20 transition-colors">
    <div className="text-muted text-sm font-medium mb-3">{title}</div>
    <div className="text-2xl font-bold" style={accent ? { color: accent } : undefined}>{value}</div>
    {sub && <div className="text-xs text-muted mt-1.5">{sub}</div>}
  </div>
);

const SeriesBtn: React.FC<{
  active: boolean; onClick: () => void; color: string; label: string;
}> = ({ active, onClick, color, label }) => (
  <button
    onClick={onClick}
    className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg text-xs font-medium transition-all"
    style={{
      backgroundColor: active ? `${color}22` : 'transparent',
      color: active ? color : '#555',
      opacity: active ? 1 : 0.6,
    }}
  >
    <span className="w-2 h-2 rounded-full" style={{ backgroundColor: color }} />
    {label}
  </button>
);

const BenefitRow: React.FC<{
  label: string; value: number; reference: number; color: string;
}> = ({ label, value, reference, color }) => {
  const pct = reference > 0 ? Math.min(100, Math.round((value / reference) * 100)) : 0;
  return (
    <div>
      <div className="flex justify-between text-sm mb-1.5">
        <span className="text-muted">{label}</span>
        <span className="font-bold" style={{ color }}>{fmtEur(value)}</span>
      </div>
      <div className="h-1.5 bg-[#2A2A2A] rounded-full overflow-hidden">
        <div
          className="h-full rounded-full transition-all duration-700"
          style={{ width: `${pct}%`, backgroundColor: color }}
        />
      </div>
      <div className="text-right text-[10px] text-muted mt-0.5">{pct}%</div>
    </div>
  );
};

/* ─── main component ────────────────────────────────────────── */

export const Dashboard: React.FC = () => {
  const { kpis, recentTransactions, isLoading } = useApp();

  const [filter,        setFilter]        = useState<Filter>('all');
  const [showRevenu,    setShowRevenu]    = useState(true);
  const [showDepense,   setShowDepense]   = useState(true);
  const [showResultat,  setShowResultat]  = useState(true);

  /* ── computed metrics ──────────────────────────────────────── */

  // Mois complets de référence : Jan–Mar 2026 (Apr = partiel)
  const completeMois = MONTHLY_PNL.filter(
    m => m.mois >= '2026-01' && m.mois <= '2026-03'
  );
  const avgCaHT       = completeMois.reduce((s, m) => s + m.caHT, 0)            / completeMois.length;
  const avgChargesHT  = completeMois.reduce((s, m) => s + m.totalChargesHT, 0)  / completeMois.length;
  const avgResultatNet = completeMois.reduce((s, m) => s + m.resultatNet, 0)    / completeMois.length;

  // TVA nette à payer (somme des TVA positives non encore décaissées)
  const totalTvaNette = MONTHLY_PNL.reduce((s, m) => s + Math.max(0, m.tvaNette), 0);

  const soldeBrut  = kpis[0]?.amount ?? 6378.36;
  const balanceHT  = soldeBrut - totalTvaNette;

  const apresIS          = avgResultatNet * (1 - IS_RATE);
  const apresDividendes  = apresIS        * (1 - PFU_RATE);

  /* ── chart data : réel + prévision ────────────────────────── */

  const fullChartData = useMemo(() => {
    const real = MONTHLY_PNL.map(m => ({
      label:      m.label,
      caHT:       m.caHT,
      chargesHT:  m.totalChargesHT,
      resultat:   m.resultatNet,
      isForecast: false,
    }));

    const forecastLabels = [
      'Mai 26', 'Juin 26', 'Juil 26', 'Août 26',
      'Sep 26', 'Oct 26',  'Nov 26',  'Déc 26',
    ];
    const forecast = forecastLabels.map(label => ({
      label,
      caHT:       avgCaHT,
      chargesHT:  avgChargesHT,
      resultat:   avgResultatNet,
      isForecast: true,
    }));

    return [...real, ...forecast];
  }, [avgCaHT, avgChargesHT, avgResultatNet]);

  const chartData = useMemo(() => {
    const realOnly = fullChartData.filter(d => !d.isForecast);
    if (filter === '3m') return realOnly.slice(-3);
    if (filter === '6m') return realOnly.slice(-6);
    return fullChartData; // all = réel + prévision
  }, [fullChartData, filter]);

  /* ── abonnements ───────────────────────────────────────────── */

  const subscriptions = [...ABONNEMENTS_INITIALS]
    .filter(a => a.statut === 'Actif')
    .sort((a, b) => a.prochaineDate.localeCompare(b.prochaineDate));

  const monthlyCost = subscriptions
    .filter(a => a.frequence === 'Mensuel')
    .reduce((s, a) => s + a.montantHT, 0);

  /* ── render ────────────────────────────────────────────────── */

  if (isLoading) {
    return (
      <div className="h-full flex items-center justify-center text-[#FF4D00]">
        Chargement…
      </div>
    );
  }

  return (
    <div className="space-y-6 animate-in fade-in duration-500 pb-8">

      {/* HEADER */}
      <div className="flex items-center justify-between">
        <h2 className="text-2xl font-bold">Dashboard</h2>
        <span className="text-xs text-muted px-3 py-1.5 bg-[#1A1A1A] border border-[#2A2A2A] rounded-full">
          Qonto · 16 avr. 2026
        </span>
      </div>

      {/* ── KPI GRID ─────────────────────────────────────────── */}
      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-4">
        <KpiCard
          title="Solde disponible HT"
          value={fmtEur(balanceHT)}
          sub="Solde Qonto − TVA nette due"
        />
        <KpiCard
          title="CA moyen mensuel HT"
          value={fmtEur(avgCaHT)}
          sub="Moy. Jan – Mar 2026"
          accent="#4CAF50"
        />
        <KpiCard
          title="Charges moyennes HT"
          value={fmtEur(avgChargesHT)}
          sub="Moy. Jan – Mar 2026"
          accent="#FF8800"
        />
        <KpiCard
          title="TVA nette à payer"
          value={fmtEur(totalTvaNette)}
          sub="Cumul estimé (non décaissé)"
          accent="#FFAA00"
        />
      </div>

      {/* ── CHART + ABONNEMENTS ──────────────────────────────── */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">

        {/* CHART */}
        <div className="lg:col-span-2 bg-card border border-[#2A2A2A] p-6 rounded-3xl">

          {/* Chart header */}
          <div className="flex flex-wrap items-start justify-between gap-3 mb-5">
            <div>
              <h3 className="font-bold">Cash Flow & Prévisionnel 2026</h3>
              <p className="text-xs text-muted mt-0.5">
                Réel (Oct 25 – Avr 26) + prévisions basées sur Jan – Mar 2026
              </p>
            </div>
            <div className="flex flex-wrap items-center gap-2">
              {/* Series toggles */}
              <div className="flex items-center bg-[#0D0D0D] border border-[#2A2A2A] rounded-xl p-1 gap-0.5">
                <SeriesBtn active={showRevenu}   onClick={() => setShowRevenu(v => !v)}   color="#FF4D00" label="Revenus"   />
                <SeriesBtn active={showDepense}  onClick={() => setShowDepense(v => !v)}  color="#555555" label="Dépenses"  />
                <SeriesBtn active={showResultat} onClick={() => setShowResultat(v => !v)} color="#4CAF50" label="Résultat"  />
              </div>
              {/* Period filter */}
              <div className="bg-[#1A1A1A] border border-[#2A2A2A] rounded-xl p-1 flex text-xs">
                {(['3m', '6m', 'all'] as Filter[]).map(f => (
                  <button
                    key={f}
                    onClick={() => setFilter(f)}
                    className={`px-3 py-1.5 rounded-lg transition-colors ${
                      filter === f ? 'bg-[#FF4D00] text-white font-bold' : 'text-muted hover:text-white'
                    }`}
                  >
                    {f === '3m' ? '3M' : f === '6m' ? '6M' : 'Tout'}
                  </button>
                ))}
              </div>
            </div>
          </div>

          {/* Chart */}
          <div className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <ComposedChart data={chartData} margin={{ top: 5, right: 5, left: -10, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#1A1A1A" />
                <XAxis
                  dataKey="label"
                  axisLine={false}
                  tickLine={false}
                  tick={{ fill: '#444', fontSize: 10 }}
                  dy={8}
                />
                <YAxis
                  axisLine={false}
                  tickLine={false}
                  tick={{ fill: '#444', fontSize: 10 }}
                  tickFormatter={v => v >= 1000 ? `${(v / 1000).toFixed(0)}k` : `${v}`}
                />
                <Tooltip
                  contentStyle={{
                    backgroundColor: '#1A1A1A',
                    border: '1px solid #333',
                    borderRadius: '12px',
                    color: '#fff',
                    fontSize: 12,
                  }}
                  formatter={(value: number, name: string) => [
                    fmtEur(value),
                    name === 'caHT'      ? 'Revenus HT'   :
                    name === 'chargesHT' ? 'Dépenses HT'  : 'Résultat net',
                  ]}
                  labelFormatter={(label: string, payload: any[]) => {
                    const isForecast = payload?.[0]?.payload?.isForecast;
                    return isForecast ? `${label} (prévision)` : `${label}`;
                  }}
                />

                {showRevenu && (
                  <Bar dataKey="caHT" radius={[4, 4, 0, 0]} maxBarSize={24}>
                    {chartData.map((entry, i) => (
                      <Cell
                        key={`r-${i}`}
                        fill="#FF4D00"
                        fillOpacity={entry.isForecast ? 0.28 : 0.85}
                      />
                    ))}
                  </Bar>
                )}
                {showDepense && (
                  <Bar dataKey="chargesHT" radius={[4, 4, 0, 0]} maxBarSize={24}>
                    {chartData.map((entry, i) => (
                      <Cell
                        key={`d-${i}`}
                        fill="#444444"
                        fillOpacity={entry.isForecast ? 0.28 : 0.85}
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
                      return (
                        <circle
                          key={`dot-${props.index}`}
                          cx={cx}
                          cy={cy}
                          r={payload.isForecast ? 2 : 3}
                          fill="#4CAF50"
                          opacity={payload.isForecast ? 0.45 : 1}
                        />
                      );
                    }}
                  />
                )}
              </ComposedChart>
            </ResponsiveContainer>
          </div>

          {/* Legend */}
          <div className="flex items-center gap-5 mt-3 text-xs text-muted">
            <div className="flex items-center gap-1.5">
              <div className="w-3 h-2.5 rounded-sm bg-[#FF4D00]/30 border border-[#FF4D00]/30" />
              Prévision (barres claires)
            </div>
            <div className="flex items-center gap-1.5">
              <div className="w-4 h-0.5 bg-[#4CAF50]/50" />
              Résultat net (points clairs = prév.)
            </div>
          </div>
        </div>

        {/* ABONNEMENTS */}
        <div className="bg-card border border-[#2A2A2A] p-6 rounded-3xl flex flex-col">
          <div className="flex justify-between items-start mb-5">
            <h3 className="font-bold">Abonnements</h3>
            <div className="text-right">
              <div className="text-sm font-bold text-[#FF4D00]">{fmtEur(monthlyCost)}</div>
              <div className="text-[11px] text-muted">/ mois HT</div>
            </div>
          </div>

          <div className="space-y-3 flex-1 overflow-y-auto">
            {subscriptions.map(ab => (
              <div key={ab.id} className="flex items-center justify-between py-1">
                <div className="flex items-center gap-2.5 min-w-0">
                  <div className="w-8 h-8 rounded-lg bg-[#1A1A1A] border border-[#2A2A2A] flex items-center justify-center text-xs font-bold text-[#FF4D00] shrink-0">
                    {ab.nom[0]}
                  </div>
                  <div className="min-w-0">
                    <div className="text-sm font-medium leading-tight truncate">{ab.nom}</div>
                    <div className="text-[11px] text-muted truncate">{ab.categorie}</div>
                  </div>
                </div>
                <div className="text-right shrink-0 ml-2">
                  <div className="text-sm font-bold">{fmtEur(ab.montantHT)}</div>
                  <div className="text-[11px] text-muted">{ab.frequence}</div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* ── BÉNÉFICE NET + TRANSACTIONS ──────────────────────── */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">

        {/* BENEFIT CASCADE */}
        <div className="bg-card border border-[#2A2A2A] p-6 rounded-3xl">
          <h3 className="font-bold mb-1">Bénéfice net estimé</h3>
          <p className="text-xs text-muted mb-5">
            Basé sur le résultat net moyen Jan – Mar 2026
          </p>

          <div className="space-y-4">
            <BenefitRow
              label="Résultat net moyen"
              value={avgResultatNet}
              reference={avgResultatNet}
              color="#FF4D00"
            />
            <BenefitRow
              label="Après IS −15% (taux réduit PME)"
              value={apresIS}
              reference={avgResultatNet}
              color="#FFAA00"
            />
            <BenefitRow
              label="Après PFU dividendes −30%"
              value={apresDividendes}
              reference={avgResultatNet}
              color="#4CAF50"
            />
          </div>

          <div className="mt-6 pt-4 border-t border-[#2A2A2A] flex justify-between items-end">
            <div>
              <div className="text-xs text-muted">Revenu net disponible / mois</div>
              <div className="text-[10px] text-muted mt-0.5 opacity-60">IS 15% + PFU 30%</div>
            </div>
            <div className="text-2xl font-bold text-[#4CAF50]">{fmtEur(apresDividendes)}</div>
          </div>
        </div>

        {/* RECENT TRANSACTIONS */}
        <div className="lg:col-span-2 bg-card border border-[#2A2A2A] p-6 rounded-3xl">
          <div className="flex justify-between items-center mb-5">
            <h3 className="font-bold">Dernières transactions</h3>
          </div>

          <div className="space-y-1">
            {recentTransactions.map(tx => (
              <div
                key={tx.id}
                className="flex items-center justify-between py-2.5 border-b border-[#1A1A1A] last:border-0 hover:bg-[#1A1A1A] rounded-xl px-2 -mx-2 transition-colors"
              >
                <div className="flex items-center gap-3 min-w-0">
                  <div className="w-9 h-9 rounded-full bg-[#1A1A1A] border border-[#2A2A2A] flex items-center justify-center shrink-0">
                    <span className="text-[#FF4D00] font-bold text-sm">{tx.name[0]}</span>
                  </div>
                  <div className="min-w-0">
                    <div className="font-medium text-sm text-white leading-tight truncate">{tx.name}</div>
                    <div className="text-xs text-muted">{tx.type}</div>
                  </div>
                </div>

                <div className="flex items-center gap-6 shrink-0">
                  <div className={`text-sm font-bold w-24 text-right ${tx.amount > 0 ? 'text-[#4CAF50]' : ''}`}>
                    {tx.amount > 0 ? '+' : ''}{fmtEur(tx.amount)}
                  </div>
                  <div className="text-xs text-muted hidden sm:block w-28 text-right">{tx.date}</div>
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

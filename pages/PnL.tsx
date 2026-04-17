import React, { useState, useEffect, useMemo } from 'react';
import { Edit2, Check, X } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  ComposedChart, Area, XAxis, YAxis, CartesianGrid, Tooltip,
  ResponsiveContainer, ReferenceLine,
} from 'recharts';
import { MONTHLY_PNL, QONTO_PRESTATIONS } from '../constants/data';

/* ── helpers ─────────────────────────────────────────────────── */

const fmtEur = (n: number) =>
  new Intl.NumberFormat('fr-FR', {
    style: 'currency', currency: 'EUR', minimumFractionDigits: 2,
  }).format(n);

const IS_RATE  = 0.15;
const PFU_RATE = 0.30;
const CURRENT_MONTH = '2026-04';

const FORECAST_MONTHS = [
  { mois: '2026-05', label: 'Mai 26'  },
  { mois: '2026-06', label: 'Juin 26' },
  { mois: '2026-07', label: 'Juil 26' },
  { mois: '2026-08', label: 'Août 26' },
  { mois: '2026-09', label: 'Sep 26'  },
  { mois: '2026-10', label: 'Oct 26'  },
  { mois: '2026-11', label: 'Nov 26'  },
  { mois: '2026-12', label: 'Déc 26'  },
];

/* ── component ───────────────────────────────────────────────── */

export const PnL: React.FC = () => {

  /* state */
  const [objCA, setObjCA] = useState<number>(() =>
    parseInt(localStorage.getItem('irys_objectif_ca_annuel') ?? '60000') || 60000
  );
  const [objResultat, setObjResultat] = useState<number>(() =>
    parseInt(localStorage.getItem('irys_objectif_resultat_annuel') ?? '42000') || 42000
  );
  const [previsions, setPrevisions] = useState<Record<string, number>>(() => {
    try { return JSON.parse(localStorage.getItem('irys_previsions') ?? '{}'); }
    catch { return {}; }
  });
  const [filterPeriod, setFilterPeriod] = useState<'all' | '3m' | '6m'>('all');
  const [modalCA,       setModalCA]       = useState(false);
  const [modalResultat, setModalResultat] = useState(false);
  const [draftCA,       setDraftCA]       = useState(objCA);
  const [draftResultat, setDraftResultat] = useState(objResultat);
  const [editingMonth,  setEditingMonth]  = useState<string | null>(null);
  const [forecastDraft, setForecastDraft] = useState('');

  /* persist */
  useEffect(() => { localStorage.setItem('irys_objectif_ca_annuel',      String(objCA));       }, [objCA]);
  useEffect(() => { localStorage.setItem('irys_objectif_resultat_annuel', String(objResultat)); }, [objResultat]);
  useEffect(() => { localStorage.setItem('irys_previsions', JSON.stringify(previsions));        }, [previsions]);

  /* ── computed metrics ────────────────────────────────────────── */

  const mois2026     = MONTHLY_PNL.filter(m => m.mois >= '2026-01');
  const ytdCA        = mois2026.reduce((s, m) => s + m.caHT,       0);
  const ytdResultat  = mois2026.reduce((s, m) => s + m.resultatNet, 0);

  /* averages on Jan-Mar 2026 (complete months) */
  const complete = MONTHLY_PNL.filter(m => m.mois >= '2026-01' && m.mois <= '2026-03');
  const avgCaHT       = complete.reduce((s, m) => s + m.caHT,            0) / complete.length;
  const avgChargesHT  = complete.reduce((s, m) => s + m.totalChargesHT,  0) / complete.length;
  const avgFraisBanc  = complete.reduce((s, m) => s + m.fraisBanc,       0) / complete.length;
  const avgResultatNet = complete.reduce((s, m) => s + m.resultatNet,    0) / complete.length;

  const objCaMensuel      = Math.round(objCA / 12);
  const objResultatMensuel = Math.round(objResultat / 12);

  /* client KPIs */
  const paid         = QONTO_PRESTATIONS.filter(p => p.statut === 'Payé');
  const uniqueClients = [...new Set(paid.map(p => p.client))];
  const panierMoyen  = uniqueClients.length
    ? paid.reduce((s, p) => s + p.montantHT, 0) / uniqueClients.length
    : 0;
  const clientMonths: Record<string, Set<string>> = {};
  paid.forEach(p => {
    const mk = p.dateEmission.substring(0, 7);
    if (!clientMonths[p.client]) clientMonths[p.client] = new Set();
    clientMonths[p.client].add(mk);
  });
  const avgDureeVie = uniqueClients.length
    ? uniqueClients.reduce((s, c) => s + (clientMonths[c]?.size ?? 1), 0) / uniqueClients.length
    : 0;
  const ltv = panierMoyen * avgDureeVie;

  /* net benefit */
  const apresIS         = avgResultatNet * (1 - IS_RATE);
  const apresDividendes = apresIS        * (1 - PFU_RATE);

  /* ── chart data ──────────────────────────────────────────────── */

  const allChartData = useMemo(() => {
    const lastIdx = MONTHLY_PNL.length - 1;

    const realData = MONTHLY_PNL.map((m, i) => ({
      label:        m.label,
      mois:         m.mois,
      caHT:         m.caHT,
      chargesHT:    m.totalChargesHT,
      resultat:     m.resultatNet,
      /* connection point: last real month appears in both series */
      caHT_fc:      i === lastIdx ? m.caHT            : null,
      chargesHT_fc: i === lastIdx ? m.totalChargesHT  : null,
      resultat_fc:  i === lastIdx ? m.resultatNet      : null,
      isReal: true,
    }));

    const forecastData = FORECAST_MONTHS.map(fm => {
      const fcCA      = previsions[fm.mois] ?? avgCaHT;
      const fcRes     = fcCA - avgChargesHT - avgFraisBanc;
      return {
        label:        fm.label,
        mois:         fm.mois,
        caHT:         null as number | null,
        chargesHT:    null as number | null,
        resultat:     null as number | null,
        caHT_fc:      fcCA,
        chargesHT_fc: avgChargesHT,
        resultat_fc:  fcRes,
        isReal: false,
      };
    });

    return [...realData, ...forecastData];
  }, [previsions, avgCaHT, avgChargesHT, avgFraisBanc]);

  const chartData = useMemo(() => {
    const realOnly = allChartData.filter(d => d.isReal);
    if (filterPeriod === '3m') return realOnly.slice(-3);
    if (filterPeriod === '6m') return realOnly.slice(-6);
    return allChartData;
  }, [allChartData, filterPeriod]);

  const lastRealLabel = MONTHLY_PNL[MONTHLY_PNL.length - 1]?.label ?? '';

  /* handlers */
  const handleChartClick = (data: any) => {
    if (!data?.activePayload?.length) return;
    const pt = data.activePayload[0]?.payload;
    if (pt && !pt.isReal) {
      setEditingMonth(pt.mois);
      setForecastDraft(String(Math.round(previsions[pt.mois] ?? avgCaHT)));
    }
  };

  const saveForecast = () => {
    if (!editingMonth) return;
    setPrevisions(p => ({ ...p, [editingMonth]: parseFloat(forecastDraft) || 0 }));
    setEditingMonth(null);
  };

  /* ── render ──────────────────────────────────────────────────── */

  return (
    <div className="space-y-8 animate-in fade-in duration-500">
      <h1 className="text-2xl font-bold">P&L — Compte de résultat</h1>

      {/* ── S1 HERO OBJECTIVES ─────────────────────────────────── */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">

        {/* CA annuel */}
        <div className="bg-card border border-[#2A2A2A] p-6 rounded-3xl">
          <div className="flex justify-between items-start mb-5">
            <div>
              <div className="text-xs font-semibold text-muted uppercase tracking-wider mb-2">
                Objectif CA annuel
              </div>
              <div className="flex items-baseline gap-2 flex-wrap">
                <span className="text-3xl font-bold text-[#FF4D00]">{fmtEur(ytdCA)}</span>
                <span className="text-muted text-sm">/ {fmtEur(objCA)}</span>
              </div>
            </div>
            <button
              onClick={() => { setDraftCA(objCA); setModalCA(true); }}
              className="p-2 rounded-xl bg-[#1A1A1A] border border-[#2A2A2A] text-muted hover:text-white transition-colors"
            >
              <Edit2 size={14} />
            </button>
          </div>
          <div className="h-2 bg-[#2A2A2A] rounded-full overflow-hidden mb-2">
            <div
              className="h-full bg-[#FF4D00] rounded-full transition-all duration-700"
              style={{ width: `${Math.min(100, (ytdCA / objCA) * 100)}%` }}
            />
          </div>
          <div className="flex justify-between items-center">
            <span className="text-xs text-muted">→ objectif mensuel : {fmtEur(objCaMensuel)}/mois</span>
            <span className="text-xs font-bold text-[#FF4D00]">
              {Math.min(100, Math.round((ytdCA / objCA) * 100))}%
            </span>
          </div>
        </div>

        {/* Résultat net annuel */}
        <div className="bg-card border border-[#2A2A2A] p-6 rounded-3xl">
          <div className="flex justify-between items-start mb-5">
            <div>
              <div className="text-xs font-semibold text-muted uppercase tracking-wider mb-2">
                Objectif résultat net annuel
              </div>
              <div className="flex items-baseline gap-2 flex-wrap">
                <span className="text-3xl font-bold text-[#4ade80]">{fmtEur(ytdResultat)}</span>
                <span className="text-muted text-sm">/ {fmtEur(objResultat)}</span>
              </div>
            </div>
            <button
              onClick={() => { setDraftResultat(objResultat); setModalResultat(true); }}
              className="p-2 rounded-xl bg-[#1A1A1A] border border-[#2A2A2A] text-muted hover:text-white transition-colors"
            >
              <Edit2 size={14} />
            </button>
          </div>
          <div className="h-2 bg-[#2A2A2A] rounded-full overflow-hidden mb-2">
            <div
              className="h-full bg-[#4ade80] rounded-full transition-all duration-700"
              style={{ width: `${Math.min(100, (ytdResultat / objResultat) * 100)}%` }}
            />
          </div>
          <div className="flex justify-between items-center">
            <span className="text-xs text-muted">→ objectif mensuel : {fmtEur(objResultatMensuel)}/mois</span>
            <span className="text-xs font-bold text-[#4ade80]">
              {Math.min(100, Math.round((ytdResultat / objResultat) * 100))}%
            </span>
          </div>
        </div>
      </div>

      {/* ── S2 GRAPHIQUE PRÉVISIONNEL ───────────────────────────── */}
      <div className="bg-card border border-[#2A2A2A] p-6 rounded-3xl">

        <div className="flex flex-wrap items-start justify-between gap-3 mb-2">
          <div>
            <h2 className="font-bold">Évolution & Projection CA</h2>
            <p className="text-xs text-muted mt-0.5">
              Réel (trait plein) · Prévisionnel (pointillé) — cliquer sur un mois futur pour saisir un CA manuel
            </p>
          </div>
          <div className="bg-[#1A1A1A] border border-[#2A2A2A] rounded-xl p-1 flex text-xs">
            {(['all', '6m', '3m'] as const).map(f => (
              <button
                key={f}
                onClick={() => setFilterPeriod(f)}
                className={`px-3 py-1.5 rounded-lg transition-colors ${
                  filterPeriod === f ? 'bg-[#FF4D00] text-white font-bold' : 'text-muted hover:text-white'
                }`}
              >
                {f === 'all' ? 'Tout' : f === '6m' ? '6 mois' : '3 mois'}
              </button>
            ))}
          </div>
        </div>

        <div className="h-72">
          <ResponsiveContainer width="100%" height="100%">
            <ComposedChart
              data={chartData}
              margin={{ top: 10, right: 70, left: -10, bottom: 0 }}
              onClick={handleChartClick}
              style={{ cursor: filterPeriod === 'all' ? 'pointer' : 'default' }}
            >
              <defs>
                <linearGradient id="gCA" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%"  stopColor="#FF4D00" stopOpacity={0.25} />
                  <stop offset="95%" stopColor="#FF4D00" stopOpacity={0} />
                </linearGradient>
                <linearGradient id="gCH" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%"  stopColor="#888" stopOpacity={0.15} />
                  <stop offset="95%" stopColor="#888" stopOpacity={0} />
                </linearGradient>
                <linearGradient id="gRES" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%"  stopColor="#4ade80" stopOpacity={0.2} />
                  <stop offset="95%" stopColor="#4ade80" stopOpacity={0} />
                </linearGradient>
              </defs>

              <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#1A1A1A" />
              <XAxis dataKey="label" axisLine={false} tickLine={false} tick={{ fill: '#444', fontSize: 11 }} dy={8} />
              <YAxis axisLine={false} tickLine={false} tick={{ fill: '#444', fontSize: 11 }}
                tickFormatter={v => v >= 1000 ? `${(v / 1000).toFixed(0)}k` : `${v}`}
              />
              <Tooltip
                contentStyle={{ backgroundColor: '#1A1A1A', border: '1px solid #333', borderRadius: '12px', color: '#fff', fontSize: 12 }}
                formatter={(value: number, name: string) => [
                  fmtEur(value),
                  name.startsWith('caHT')      ? 'CA HT'       :
                  name.startsWith('chargesHT') ? 'Charges HT'  : 'Résultat net',
                ]}
                labelFormatter={(label: string, payload: any[]) =>
                  payload?.[0]?.payload?.isReal === false ? `${label} (prévision)` : `${label}`
                }
              />

              {/* Ligne objectif mensuel */}
              {filterPeriod === 'all' && (
                <ReferenceLine
                  y={objCaMensuel}
                  stroke="#FF4D00"
                  strokeDasharray="4 4"
                  strokeOpacity={0.35}
                  label={{ value: `obj. ${Math.round(objCaMensuel / 1000)}k`, position: 'right', fill: '#FF4D00', fontSize: 10, opacity: 0.7 }}
                />
              )}

              {/* Séparateur réel / prévision */}
              {filterPeriod === 'all' && (
                <ReferenceLine
                  x={lastRealLabel}
                  stroke="#333"
                  strokeWidth={1.5}
                  label={{ value: 'réel | prév.', position: 'insideTopRight', fill: '#444', fontSize: 9 }}
                />
              )}

              {/* RÉEL */}
              <Area type="monotone" dataKey="chargesHT"
                stroke="#666" strokeWidth={2} fill="url(#gCH)" fillOpacity={1} connectNulls={false} dot={false} />
              <Area type="monotone" dataKey="caHT"
                stroke="#FF4D00" strokeWidth={2.5} fill="url(#gCA)" fillOpacity={1} connectNulls={false} dot={false} />
              <Area type="monotone" dataKey="resultat"
                stroke="#4ade80" strokeWidth={2} fill="url(#gRES)" fillOpacity={1} connectNulls={false} dot={false} />

              {/* PRÉVISION (pointillé) */}
              {filterPeriod === 'all' && (
                <>
                  <Area type="monotone" dataKey="chargesHT_fc"
                    stroke="#666" strokeWidth={1.5} strokeDasharray="5 4" strokeOpacity={0.45}
                    fill="#888" fillOpacity={0.04} connectNulls={false} dot={false} />
                  <Area type="monotone" dataKey="caHT_fc"
                    stroke="#FF4D00" strokeWidth={1.5} strokeDasharray="5 4" strokeOpacity={0.5}
                    fill="#FF4D00" fillOpacity={0.07} connectNulls={false} dot={false} />
                  <Area type="monotone" dataKey="resultat_fc"
                    stroke="#4ade80" strokeWidth={1.5} strokeDasharray="5 4" strokeOpacity={0.5}
                    fill="#4ade80" fillOpacity={0.05} connectNulls={false} dot={false} />
                </>
              )}
            </ComposedChart>
          </ResponsiveContainer>
        </div>

        {/* Légende */}
        <div className="flex flex-wrap items-center gap-5 mt-3 text-xs text-muted">
          <div className="flex items-center gap-1.5"><div className="w-3 h-0.5 bg-[#FF4D00]" /> CA HT</div>
          <div className="flex items-center gap-1.5"><div className="w-3 h-0.5 bg-[#666]" /> Charges HT</div>
          <div className="flex items-center gap-1.5"><div className="w-3 h-0.5 bg-[#4ade80]" /> Résultat net</div>
          {filterPeriod === 'all' && (
            <div className="flex items-center gap-1.5 ml-auto">
              <div className="w-5 border-t border-dashed border-[#FF4D00]/40" />
              Prévisionnel (cliquer pour modifier)
            </div>
          )}
        </div>

        {/* Panneau édition mois prévisionnel */}
        {filterPeriod === 'all' && editingMonth && (
          <div className="mt-4 pt-4 border-t border-[#2A2A2A] flex flex-wrap items-center gap-3">
            <span className="text-xs text-muted">
              CA prévisionnel —{' '}
              <span className="text-white font-medium">
                {FORECAST_MONTHS.find(f => f.mois === editingMonth)?.label}
              </span>
            </span>
            <input
              type="number"
              value={forecastDraft}
              onChange={e => setForecastDraft(e.target.value)}
              onKeyDown={e => e.key === 'Enter' && saveForecast()}
              autoFocus
              className="bg-[#1A1A1A] border border-[#FF4D00] rounded-xl px-3 py-1.5 text-white text-sm w-36 focus:outline-none"
            />
            <span className="text-xs text-muted">€ HT</span>
            <button onClick={saveForecast} className="flex items-center gap-1 text-xs text-[#4ade80] hover:opacity-80">
              <Check size={14} /> Enregistrer
            </button>
            <button onClick={() => setEditingMonth(null)} className="flex items-center gap-1 text-xs text-muted hover:text-white">
              <X size={14} /> Annuler
            </button>
          </div>
        )}

        {/* Overrides en cours */}
        {filterPeriod === 'all' && Object.keys(previsions).length > 0 && (
          <div className="mt-3 flex flex-wrap gap-2">
            {Object.entries(previsions).map(([mois, val]) => {
              const fm = FORECAST_MONTHS.find(f => f.mois === mois);
              if (!fm) return null;
              return (
                <div key={mois} className="flex items-center gap-1.5 bg-[#1A1A1A] border border-[#2A2A2A] rounded-lg px-2.5 py-1 text-xs">
                  <span className="text-muted">{fm.label} :</span>
                  <span className="font-bold text-[#FF4D00]">{fmtEur(val)}</span>
                  <button
                    onClick={() => setPrevisions(p => { const n = { ...p }; delete n[mois]; return n; })}
                    className="text-muted hover:text-[#FF4D00] ml-1 transition-colors"
                  >
                    <X size={10} />
                  </button>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* ── S3 KPIs CLIENTS ────────────────────────────────────── */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="bg-card border border-[#2A2A2A] p-6 rounded-3xl">
          <div className="text-xs font-semibold text-muted uppercase tracking-wider mb-3">Panier moyen / client</div>
          <div className="text-3xl font-bold text-[#FF4D00]">{fmtEur(panierMoyen)}</div>
          <div className="text-xs text-muted mt-2">HT / client actif · {uniqueClients.length} clients</div>
        </div>
        <div className="bg-card border border-[#2A2A2A] p-6 rounded-3xl">
          <div className="text-xs font-semibold text-muted uppercase tracking-wider mb-3">Durée de vie moyenne</div>
          <div className="text-3xl font-bold">{avgDureeVie.toFixed(1)} mois</div>
          <div className="text-xs text-muted mt-2">par client en moyenne</div>
        </div>
        <div className="bg-card border border-[#2A2A2A] p-6 rounded-3xl">
          <div className="text-xs font-semibold text-muted uppercase tracking-wider mb-3">LTV estimée</div>
          <div className="text-3xl font-bold text-[#4ade80]">{fmtEur(ltv)}</div>
          <div className="text-xs text-muted mt-2">lifetime value estimée</div>
        </div>
      </div>

      {/* ── S4 TABLEAU CONDENSÉ ─────────────────────────────────── */}
      <div className="bg-card border border-[#2A2A2A] rounded-3xl overflow-hidden">
        <div className="px-6 py-4 border-b border-[#2A2A2A]">
          <h2 className="font-bold">Résumé mensuel condensé</h2>
          <p className="text-xs text-muted mt-0.5">Oct 2025 → Avr 2026 (partiel)</p>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="bg-[#1A1A1A] border-b border-[#2A2A2A]">
              <tr>
                <th className="px-5 py-3 text-left font-medium text-muted sticky left-0 bg-[#1A1A1A] min-w-[140px]">
                  Indicateur
                </th>
                {MONTHLY_PNL.map(m => (
                  <th key={m.mois}
                    className={`px-4 py-3 text-right font-medium whitespace-nowrap ${
                      m.mois === CURRENT_MONTH ? 'text-[#FF4D00]' : 'text-muted'
                    }`}
                  >
                    {m.label}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-[#1A1A1A]">
              <tr className="hover:bg-[#1A1A1A]/30 transition-colors">
                <td className="px-5 py-3 sticky left-0 bg-inherit font-bold text-white">CA HT</td>
                {MONTHLY_PNL.map(m => (
                  <td key={m.mois}
                    className={`px-4 py-3 text-right font-bold text-[#FF4D00] whitespace-nowrap ${m.mois === CURRENT_MONTH ? 'bg-[#FF4D00]/5' : ''}`}
                  >
                    {fmtEur(m.caHT)}
                  </td>
                ))}
              </tr>
              <tr className="hover:bg-[#1A1A1A]/30 transition-colors">
                <td className="px-5 py-3 sticky left-0 bg-inherit text-muted">Charges HT</td>
                {MONTHLY_PNL.map(m => (
                  <td key={m.mois}
                    className={`px-4 py-3 text-right text-muted whitespace-nowrap ${m.mois === CURRENT_MONTH ? 'bg-[#FF4D00]/5' : ''}`}
                  >
                    {fmtEur(m.totalChargesHT)}
                  </td>
                ))}
              </tr>
              <tr className="hover:bg-[#1A1A1A]/30 transition-colors bg-[#111]">
                <td className="px-5 py-3 sticky left-0 bg-inherit font-bold text-white">Résultat net</td>
                {MONTHLY_PNL.map(m => (
                  <td key={m.mois}
                    className={`px-4 py-3 text-right font-bold whitespace-nowrap ${m.mois === CURRENT_MONTH ? 'bg-[#FF4D00]/5' : ''}`}
                  >
                    <span className={m.resultatNet >= 0 ? 'text-[#4ade80]' : 'text-red-400'}>
                      {fmtEur(m.resultatNet)}
                    </span>
                  </td>
                ))}
              </tr>
              <tr className="hover:bg-[#1A1A1A]/30 transition-colors">
                <td className="px-5 py-3 sticky left-0 bg-inherit text-muted text-xs">vs objectif</td>
                {MONTHLY_PNL.map(m => {
                  const delta = objCaMensuel > 0 ? ((m.caHT - objCaMensuel) / objCaMensuel) * 100 : 0;
                  return (
                    <td key={m.mois}
                      className={`px-4 py-3 text-right text-xs font-bold whitespace-nowrap ${m.mois === CURRENT_MONTH ? 'bg-[#FF4D00]/5' : ''}`}
                    >
                      <span className={delta >= 0 ? 'text-[#4ade80]' : 'text-red-400'}>
                        {delta >= 0 ? '+' : ''}{delta.toFixed(0)}%
                      </span>
                    </td>
                  );
                })}
              </tr>
            </tbody>
          </table>
        </div>
      </div>

      {/* ── S5 BÉNÉFICE NET ─────────────────────────────────────── */}
      <div className="bg-card border border-[#2A2A2A] p-6 rounded-3xl">
        <div className="flex items-start justify-between mb-6">
          <div>
            <h2 className="font-bold">Bénéfice net estimé</h2>
            <p className="text-xs text-muted mt-0.5">
              Basé sur le résultat net moyen des mois complets (Jan – Mar 2026)
            </p>
          </div>
          <div className="text-right">
            <div className="text-xs text-muted mb-1">Revenu net / mois</div>
            <div className="text-2xl font-bold text-[#4ade80]">{fmtEur(apresDividendes)}</div>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div>
            <div className="text-xs text-muted uppercase tracking-wider mb-2">Résultat brut moyen</div>
            <div className="text-2xl font-bold text-[#FF4D00] mb-2">{fmtEur(avgResultatNet)}</div>
            <div className="h-1.5 bg-[#2A2A2A] rounded-full overflow-hidden">
              <div className="h-full w-full bg-[#FF4D00] rounded-full" />
            </div>
            <div className="text-right text-xs text-muted mt-1">100%</div>
          </div>
          <div>
            <div className="text-xs text-muted uppercase tracking-wider mb-2">Après IS −15%</div>
            <div className="text-2xl font-bold text-[#FFAA00] mb-2">{fmtEur(apresIS)}</div>
            <div className="h-1.5 bg-[#2A2A2A] rounded-full overflow-hidden">
              <div className="h-full bg-[#FFAA00] rounded-full transition-all duration-700" style={{ width: '85%' }} />
            </div>
            <div className="flex justify-between text-xs text-muted mt-1">
              <span>IS = −{fmtEur(avgResultatNet * IS_RATE)}</span>
              <span>85%</span>
            </div>
          </div>
          <div>
            <div className="text-xs text-muted uppercase tracking-wider mb-2">Après PFU dividendes −30%</div>
            <div className="text-2xl font-bold text-[#4ade80] mb-2">{fmtEur(apresDividendes)}</div>
            <div className="h-1.5 bg-[#2A2A2A] rounded-full overflow-hidden">
              <div className="h-full bg-[#4ade80] rounded-full transition-all duration-700" style={{ width: '60%' }} />
            </div>
            <div className="flex justify-between text-xs text-muted mt-1">
              <span>PFU = −{fmtEur(apresIS * PFU_RATE)}</span>
              <span>60%</span>
            </div>
          </div>
        </div>

        <div className="mt-5 pt-4 border-t border-[#2A2A2A] grid grid-cols-3 gap-4 text-center text-xs text-muted">
          <div>Résultat brut mensuel moyen</div>
          <div>IS 15% taux réduit PME</div>
          <div>PFU 30% flat tax dividendes</div>
        </div>
      </div>

      {/* ── MODALS OBJECTIFS ────────────────────────────────────── */}
      <AnimatePresence>
        {(modalCA || modalResultat) && (
          <>
            <motion.div
              initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
              onClick={() => { setModalCA(false); setModalResultat(false); }}
              className="fixed inset-0 bg-black/60 backdrop-blur-sm z-[60]"
            />
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 20 }}
              className="fixed inset-0 m-auto w-full max-w-sm h-fit z-[70] p-4"
            >
              <div className="bg-[#121212] border border-[#2A2A2A] rounded-3xl shadow-2xl p-6">
                <div className="flex items-center justify-between mb-5">
                  <h3 className="font-bold text-lg">
                    {modalCA ? 'Objectif CA annuel' : 'Objectif résultat net annuel'}
                  </h3>
                  <button onClick={() => { setModalCA(false); setModalResultat(false); }}
                    className="text-muted hover:text-white transition-colors">
                    <X size={20} />
                  </button>
                </div>
                <div className="space-y-2 mb-5">
                  <label className="text-xs font-bold text-muted uppercase tracking-wider">
                    {modalCA ? 'CA annuel cible (€ HT)' : 'Résultat net annuel cible (€ HT)'}
                  </label>
                  <input
                    type="number" autoFocus
                    value={modalCA ? draftCA : draftResultat}
                    onChange={e => modalCA
                      ? setDraftCA(parseFloat(e.target.value) || 0)
                      : setDraftResultat(parseFloat(e.target.value) || 0)
                    }
                    className="w-full bg-[#1A1A1A] border border-[#333] rounded-xl px-4 py-3 text-white text-lg font-bold focus:outline-none focus:border-[#FF4D00] transition-all"
                  />
                  <p className="text-xs text-muted">
                    → mensuel : {fmtEur(Math.round((modalCA ? draftCA : draftResultat) / 12))}/mois
                  </p>
                </div>
                <button
                  onClick={() => {
                    if (modalCA) setObjCA(draftCA);
                    else setObjResultat(draftResultat);
                    setModalCA(false);
                    setModalResultat(false);
                  }}
                  className="w-full bg-[#FF4D00] text-white font-bold py-3 rounded-xl shadow-[0_4px_14px_rgba(255,77,0,0.4)] hover:scale-[1.02] active:scale-[0.98] transition-all"
                >
                  Enregistrer
                </button>
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </div>
  );
};

import React, { useState, useEffect, useMemo } from 'react';
import { Edit2, X, ChevronLeft, ChevronRight } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  ComposedChart, Area, XAxis, YAxis, CartesianGrid, Tooltip,
  ResponsiveContainer, ReferenceLine,
} from 'recharts';
import { useApp } from '../context/AppContext';

/* ── helpers ─────────────────────────────────────────────────── */

const fmtEur = (n: number) =>
  new Intl.NumberFormat('fr-FR', {
    style: 'currency', currency: 'EUR', minimumFractionDigits: 2,
  }).format(n);

const IS_RATE  = 0.15;
const PFU_RATE = 0.30;

/* Dynamic current month */
const _now = new Date();
const CURRENT_YEAR_ACTUAL = _now.getFullYear();
const CURRENT_MONTH = `${CURRENT_YEAR_ACTUAL}-${String(_now.getMonth() + 1).padStart(2, '0')}`;

/* ── component ───────────────────────────────────────────────── */

export const PnL: React.FC = () => {

  const { pnl } = useApp();

  /* state */
  const [selectedYear, setSelectedYear] = useState(CURRENT_YEAR_ACTUAL);
  const [objCA, setObjCA] = useState<number>(() =>
    parseInt(localStorage.getItem('irys_objectif_ca_annuel') ?? '60000') || 60000
  );
  const [objResultat, setObjResultat] = useState<number>(() =>
    parseInt(localStorage.getItem('irys_objectif_resultat_annuel') ?? '42000') || 42000
  );
  const [modalCA,       setModalCA]       = useState(false);
  const [modalResultat, setModalResultat] = useState(false);
  const [draftCA,       setDraftCA]       = useState(objCA);
  const [draftResultat, setDraftResultat] = useState(objResultat);

  /* persist */
  useEffect(() => { localStorage.setItem('irys_objectif_ca_annuel',      String(objCA));       }, [objCA]);
  useEffect(() => { localStorage.setItem('irys_objectif_resultat_annuel', String(objResultat)); }, [objResultat]);

  /* ── local prestations from Revenus page ─────────────────────── */
  const localPrestations = useMemo(() => {
    try {
      const raw = localStorage.getItem('irys_prestations');
      return raw ? (JSON.parse(raw) as Array<{ montantHT: number; dateEmission: string; statut: string }>) : [];
    } catch { return []; }
  }, []);

  /* ── real history from API ───────────────────────────────────── */

  const history = useMemo(() => {
    if (!pnl?.history) return [];
    return pnl.history.map((m: any) => ({
      mois:           m.mois,
      label:          m.label,
      caHT:           m.ca,
      totalChargesHT: m.charges,
      fraisBanc:      m.fraisBancaires,
      resultatNet:    m.resultat,
    }));
  }, [pnl]);

  /* ── available years from data ───────────────────────────────── */

  const availableYears = useMemo(() => {
    const years = new Set(history.map(m => parseInt(m.mois.split('-')[0])));
    years.add(CURRENT_YEAR_ACTUAL);
    return [...years].sort();
  }, [history]);

  /* ── all 12 months for selected year ─────────────────────────── */

  const yearMonths = useMemo(() =>
    Array.from({ length: 12 }, (_, i) => {
      const month = i + 1;
      const mois  = `${selectedYear}-${String(month).padStart(2, '0')}`;
      const d     = new Date(selectedYear, i, 1);
      return {
        mois,
        label: d.toLocaleDateString('fr-FR', { month: 'short', year: '2-digit' }),
      };
    }),
    [selectedYear]
  );

  /* ── history lookup map ──────────────────────────────────────── */

  const historyByMois = useMemo(() =>
    Object.fromEntries(history.map(m => [m.mois, m])),
    [history]
  );

  /* ── data for selected year ──────────────────────────────────── */

  const moisYear = useMemo(() =>
    history.filter(m => m.mois.startsWith(`${selectedYear}-`)),
    [history, selectedYear]
  );

  const ytdCA       = moisYear.reduce((s, m) => s + m.caHT,       0);
  const ytdResultat = moisYear.reduce((s, m) => s + m.resultatNet, 0);

  /* ── averages on last 3 complete months ──────────────────────── */

  const complete = history.filter(m => m.caHT > 0).slice(-4, -1);
  const refMonths = complete.length > 0 ? complete : history.filter(m => m.caHT > 0).slice(-3);

  const avgCaHT       = refMonths.length ? refMonths.reduce((s, m) => s + m.caHT,            0) / refMonths.length : 0;
  const avgChargesHT  = refMonths.length ? refMonths.reduce((s, m) => s + m.totalChargesHT,  0) / refMonths.length : 0;
  const avgFraisBanc  = refMonths.length ? refMonths.reduce((s, m) => s + m.fraisBanc,        0) / refMonths.length : 0;
  const avgResultatNet = refMonths.length ? refMonths.reduce((s, m) => s + m.resultatNet,     0) / refMonths.length : 0;

  const objCaMensuel       = Math.round(objCA / 12);
  const objResultatMensuel = Math.round(objResultat / 12);

  /* ── client KPIs from API ────────────────────────────────────── */

  const panierMoyen        = pnl?.clientMetrics?.panierMoyen  ?? 0;
  const avgDureeVie        = pnl?.clientMetrics?.avgLifetime  ?? 0;
  const ltv                = pnl?.clientMetrics?.ltv          ?? 0;
  const uniqueClientsCount = pnl?.clientMetrics?.count        ?? 0;

  /* ── net benefit ─────────────────────────────────────────────── */

  const apresIS         = avgResultatNet * (1 - IS_RATE);
  const apresDividendes = apresIS        * (1 - PFU_RATE);

  /* ── prestations par mois (pour injecter dans le prévisionnel) ── */

  const prestationsByMois = useMemo(() => {
    const map: Record<string, number> = {};
    for (const p of localPrestations) {
      if (!p.dateEmission || p.statut === 'Impayé') continue;
      const mois = p.dateEmission.slice(0, 7); // YYYY-MM
      map[mois] = (map[mois] ?? 0) + (p.montantHT ?? 0);
    }
    return map;
  }, [localPrestations]);

  /* ── projection annuelle complète (réel + mois futurs estimés) ── */

  const projectedYearCA = useMemo(() => {
    if (selectedYear !== CURRENT_YEAR_ACTUAL) return ytdCA;
    const futureMois = yearMonths.filter(({ mois }) => mois > CURRENT_MONTH);
    const futurePrestations = futureMois.reduce(
      (s, { mois }) => s + (prestationsByMois[mois] ?? 0), 0
    );
    return ytdCA + avgCaHT * futureMois.length + futurePrestations;
  }, [ytdCA, avgCaHT, yearMonths, prestationsByMois, selectedYear]);

  const projectedYearResultat = useMemo(() => {
    if (selectedYear !== CURRENT_YEAR_ACTUAL) return ytdResultat;
    const futureMoisCount = yearMonths.filter(({ mois }) => mois > CURRENT_MONTH).length;
    return ytdResultat + avgResultatNet * futureMoisCount;
  }, [ytdResultat, avgResultatNet, yearMonths, selectedYear]);

  /* ── chart data — full year (real + projection auto) ─────────── */

  const chartData = useMemo(() => {
    const isCurrentYear = selectedYear === CURRENT_YEAR_ACTUAL;

    return yearMonths.map(({ mois, label }) => {
      const real           = historyByMois[mois];
      const isFuture       = mois > CURRENT_MONTH;
      const isConnectionPt = mois === CURRENT_MONTH && isCurrentYear;

      /* real data point */
      if (real && !isFuture) {
        return {
          label, mois,
          caHT:         real.caHT,
          chargesHT:    real.totalChargesHT,
          resultat:     real.resultatNet,
          caHT_fc:      isConnectionPt ? real.caHT           : null,
          chargesHT_fc: isConnectionPt ? real.totalChargesHT : null,
          resultat_fc:  isConnectionPt ? real.resultatNet    : null,
          isReal: true,
          prestationsExtra: 0,
        };
      }

      /* forecast point — automatic: moyenne + prestations planifiées */
      if (isFuture && isCurrentYear) {
        const extra = prestationsByMois[mois] ?? 0;
        const fcCA  = avgCaHT + extra;
        const fcRes = fcCA - avgChargesHT - avgFraisBanc;
        return {
          label, mois,
          caHT: null, chargesHT: null, resultat: null,
          caHT_fc:      fcCA,
          chargesHT_fc: avgChargesHT,
          resultat_fc:  fcRes,
          isReal: false,
          prestationsExtra: extra,
        };
      }

      /* past year — no data available */
      return {
        label, mois,
        caHT:      real?.caHT           ?? 0,
        chargesHT: real?.totalChargesHT ?? 0,
        resultat:  real?.resultatNet    ?? 0,
        caHT_fc: null, chargesHT_fc: null, resultat_fc: null,
        isReal: true,
        prestationsExtra: 0,
      };
    });
  }, [yearMonths, historyByMois, prestationsByMois, avgCaHT, avgChargesHT, avgFraisBanc, selectedYear]);

  const lastRealLabel = [...moisYear]
    .filter(m => m.mois <= CURRENT_MONTH)
    .pop()?.label ?? '';

  const isCurrentYear = selectedYear === CURRENT_YEAR_ACTUAL;

  /* ── render ──────────────────────────────────────────────────── */

  return (
    <div className="space-y-8 animate-in fade-in duration-500">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold">P&L — Compte de résultat</h1>

        {/* Year selector — flèches + année uniquement */}
        <div className="flex items-center gap-2 bg-[#1A1A1A] border border-[#2A2A2A] rounded-xl px-3 py-1.5">
          <button
            onClick={() => {
              const idx = availableYears.indexOf(selectedYear);
              if (idx > 0) setSelectedYear(availableYears[idx - 1]);
            }}
            disabled={availableYears.indexOf(selectedYear) === 0}
            className="text-muted hover:text-white disabled:opacity-30 transition-colors"
          >
            <ChevronLeft size={16} />
          </button>
          <span className="text-sm font-bold text-white w-10 text-center">{selectedYear}</span>
          <button
            onClick={() => {
              const idx = availableYears.indexOf(selectedYear);
              if (idx < availableYears.length - 1) setSelectedYear(availableYears[idx + 1]);
            }}
            disabled={availableYears.indexOf(selectedYear) === availableYears.length - 1}
            className="text-muted hover:text-white disabled:opacity-30 transition-colors"
          >
            <ChevronRight size={16} />
          </button>
        </div>
      </div>

      {/* ── S1 HERO OBJECTIVES ─────────────────────────────────── */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">

        {/* CA annuel */}
        <div className="bg-card border border-[#2A2A2A] p-6 rounded-3xl">
          <div className="flex justify-between items-start mb-5">
            <div>
              <div className="text-xs font-semibold text-muted uppercase tracking-wider mb-2">
                Objectif CA annuel {selectedYear}
              </div>
              <div className="flex items-baseline gap-2 flex-wrap">
                <span className="text-3xl font-bold text-[#FF4D00]">{fmtEur(projectedYearCA)}</span>
                <span className="text-muted text-sm">/ {fmtEur(objCA)}</span>
              </div>
              {isCurrentYear && ytdCA < projectedYearCA && (
                <div className="text-xs text-muted mt-1">
                  Réalisé : {fmtEur(ytdCA)} · Projeté fin {selectedYear}
                </div>
              )}
            </div>
            <button
              onClick={() => { setDraftCA(objCA); setModalCA(true); }}
              className="p-2 rounded-xl bg-[#1A1A1A] border border-[#2A2A2A] text-muted hover:text-white transition-colors"
            >
              <Edit2 size={14} />
            </button>
          </div>
          <div className="h-2 bg-[#2A2A2A] rounded-full overflow-hidden mb-2">
            <div className="h-full rounded-full transition-all duration-700 relative overflow-hidden"
              style={{ width: `${Math.min(100, (projectedYearCA / objCA) * 100)}%`, background: '#FF4D00' }}>
              {isCurrentYear && (
                <div className="absolute inset-0 bg-[#FF4D00]/40" style={{ left: `${Math.min(100, (ytdCA / projectedYearCA) * 100)}%` }} />
              )}
            </div>
          </div>
          <div className="flex justify-between items-center">
            <span className="text-xs text-muted">→ objectif mensuel : {fmtEur(objCaMensuel)}/mois</span>
            <span className="text-xs font-bold text-[#FF4D00]">
              {Math.min(100, Math.round((projectedYearCA / objCA) * 100))}%
            </span>
          </div>
        </div>

        {/* Résultat net annuel */}
        <div className="bg-card border border-[#2A2A2A] p-6 rounded-3xl">
          <div className="flex justify-between items-start mb-5">
            <div>
              <div className="text-xs font-semibold text-muted uppercase tracking-wider mb-2">
                Objectif résultat net {selectedYear}
              </div>
              <div className="flex items-baseline gap-2 flex-wrap">
                <span className="text-3xl font-bold text-[#4ade80]">{fmtEur(projectedYearResultat)}</span>
                <span className="text-muted text-sm">/ {fmtEur(objResultat)}</span>
              </div>
              {isCurrentYear && ytdResultat < projectedYearResultat && (
                <div className="text-xs text-muted mt-1">
                  Réalisé : {fmtEur(ytdResultat)} · Projeté fin {selectedYear}
                </div>
              )}
            </div>
            <button
              onClick={() => { setDraftResultat(objResultat); setModalResultat(true); }}
              className="p-2 rounded-xl bg-[#1A1A1A] border border-[#2A2A2A] text-muted hover:text-white transition-colors"
            >
              <Edit2 size={14} />
            </button>
          </div>
          <div className="h-2 bg-[#2A2A2A] rounded-full overflow-hidden mb-2">
            <div className="h-full rounded-full transition-all duration-700 relative overflow-hidden"
              style={{ width: `${Math.min(100, (projectedYearResultat / objResultat) * 100)}%`, background: '#4ade80' }}>
              {isCurrentYear && (
                <div className="absolute inset-0 bg-[#4ade80]/40" style={{ left: `${Math.min(100, (ytdResultat / projectedYearResultat) * 100)}%` }} />
              )}
            </div>
          </div>
          <div className="flex justify-between items-center">
            <span className="text-xs text-muted">→ objectif mensuel : {fmtEur(objResultatMensuel)}/mois</span>
            <span className="text-xs font-bold text-[#4ade80]">
              {Math.min(100, Math.round((projectedYearResultat / objResultat) * 100))}%
            </span>
          </div>
        </div>
      </div>

      {/* ── S2 GRAPHIQUE ANNUEL ─────────────────────────────────── */}
      <div className="bg-card border border-[#2A2A2A] p-6 rounded-3xl">

        <div className="flex flex-wrap items-start justify-between gap-3 mb-2">
          <div>
            <h2 className="font-bold">Évolution & Projection CA — {selectedYear}</h2>
            <p className="text-xs text-muted mt-0.5">
              {isCurrentYear
                ? 'Réel (trait plein) · Prévisionnel automatique (pointillé) — moyenne glissante + prestations planifiées'
                : `Vue annuelle ${selectedYear}`}
            </p>
          </div>
          {isCurrentYear && (
            <div className="text-xs text-muted flex items-center gap-1.5">
              <div className="w-5 border-t border-dashed border-[#FF4D00]/50" />
              Prévisionnel
            </div>
          )}
        </div>

        <div className="h-72">
          <ResponsiveContainer width="100%" height="100%">
            <ComposedChart
              data={chartData}
              margin={{ top: 10, right: 70, left: -10, bottom: 0 }}
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
              <ReferenceLine
                y={objCaMensuel}
                stroke="#FF4D00"
                strokeDasharray="4 4"
                strokeOpacity={0.35}
                label={{ value: `obj. ${Math.round(objCaMensuel / 1000)}k`, position: 'right', fill: '#FF4D00', fontSize: 10, opacity: 0.7 }}
              />

              {/* Séparateur réel / prévision */}
              {isCurrentYear && lastRealLabel && (
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

              {/* PRÉVISION (pointillé) — toujours visible pour l'année en cours */}
              {isCurrentYear && (
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
        </div>

        {/* Prestations planifiées actives sur les mois futurs */}
        {isCurrentYear && Object.keys(prestationsByMois).some(m => m > CURRENT_MONTH) && (
          <div className="mt-3 flex flex-wrap gap-2">
            {Object.entries(prestationsByMois)
              .filter(([mois]) => mois > CURRENT_MONTH)
              .map(([mois, val]) => {
                const label = new Date(mois + '-01').toLocaleDateString('fr-FR', { month: 'short', year: '2-digit' });
                return (
                  <div key={mois} className="flex items-center gap-1.5 bg-[#1A1A1A] border border-[#2A2A2A] rounded-lg px-2.5 py-1 text-xs">
                    <span className="text-muted">{label} :</span>
                    <span className="font-bold text-[#FF4D00]">+{fmtEur(val as number)}</span>
                    <span className="text-muted">planifié</span>
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
          <div className="text-xs text-muted mt-2">HT / client actif · {uniqueClientsCount} clients</div>
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
          <p className="text-xs text-muted mt-0.5">
            {moisYear.length > 0
              ? `Données réelles — ${moisYear[0].label} → ${moisYear[moisYear.length - 1].label}`
              : `Aucune donnée pour ${selectedYear}`}
          </p>
        </div>
        {moisYear.length > 0 ? (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="bg-[#1A1A1A] border-b border-[#2A2A2A]">
                <tr>
                  <th className="px-5 py-3 text-left font-medium text-muted sticky left-0 bg-[#1A1A1A] min-w-[140px]">
                    Indicateur
                  </th>
                  {moisYear.map(m => (
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
                  {moisYear.map(m => (
                    <td key={m.mois}
                      className={`px-4 py-3 text-right font-bold text-[#FF4D00] whitespace-nowrap ${m.mois === CURRENT_MONTH ? 'bg-[#FF4D00]/5' : ''}`}
                    >
                      {fmtEur(m.caHT)}
                    </td>
                  ))}
                </tr>
                <tr className="hover:bg-[#1A1A1A]/30 transition-colors">
                  <td className="px-5 py-3 sticky left-0 bg-inherit text-muted">Charges HT</td>
                  {moisYear.map(m => (
                    <td key={m.mois}
                      className={`px-4 py-3 text-right text-muted whitespace-nowrap ${m.mois === CURRENT_MONTH ? 'bg-[#FF4D00]/5' : ''}`}
                    >
                      {fmtEur(m.totalChargesHT)}
                    </td>
                  ))}
                </tr>
                <tr className="hover:bg-[#1A1A1A]/30 transition-colors bg-[#111]">
                  <td className="px-5 py-3 sticky left-0 bg-inherit font-bold text-white">Résultat net</td>
                  {moisYear.map(m => (
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
                  {moisYear.map(m => {
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
        ) : (
          <div className="px-6 py-12 text-center text-muted text-sm">
            Aucune donnée disponible pour {selectedYear}
          </div>
        )}
      </div>

      {/* ── S5 BÉNÉFICE NET ─────────────────────────────────────── */}
      <div className="bg-card border border-[#2A2A2A] p-6 rounded-3xl">
        <div className="flex items-start justify-between mb-6">
          <div>
            <h2 className="font-bold">Bénéfice net estimé</h2>
            <p className="text-xs text-muted mt-0.5">
              Basé sur le résultat net moyen des derniers mois complets
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

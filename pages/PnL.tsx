import React, { useState, useEffect } from 'react';
import { Edit2, Check, X } from 'lucide-react';
import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from 'recharts';
import { MONTHLY_PNL } from '../constants/data';
import { PnlMonthData } from '../types';

interface Objectifs {
  caMensuel: number;
  caAnnuel: number;
  resultatMensuel: number;
}

const DEFAULT_OBJECTIFS: Objectifs = {
  caMensuel: 5000,
  caAnnuel: 60000,
  resultatMensuel: 3500,
};

const fmt = (n: number) => `${n.toFixed(2)} €`;
const fmtK = (n: number) => (n >= 1000 ? `${(n / 1000).toFixed(1)}k €` : `${n.toFixed(0)} €`);

const ColoredCell = ({ value }: { value: number }) => (
  <span className={value >= 0 ? 'text-[#4CAF50]' : 'text-red-400'}>{fmt(value)}</span>
);

const TABLE_ROWS: Array<{
  key: keyof PnlMonthData;
  label: string;
  bold?: boolean;
  colored?: boolean;
}> = [
  { key: 'caHT',           label: 'CA HT',                     bold: true },
  { key: 'chOpsHT',        label: 'Charges opérationnelles HT' },
  { key: 'chTechHT',       label: 'Charges technologies HT' },
  { key: 'chPersHT',       label: 'Charges personnel HT' },
  { key: 'chMktHT',        label: 'Marketing HT' },
  { key: 'fraisBanc',      label: 'Frais bancaires' },
  { key: 'totalChargesHT', label: 'Total charges HT',           bold: true },
  { key: 'margeHT',        label: 'Marge brute HT',             bold: true, colored: true },
  { key: 'resultatNet',    label: 'Résultat net estimé',         bold: true, colored: true },
  { key: 'tvaCollectee',   label: 'TVA collectée' },
  { key: 'tvaDeductible',  label: 'TVA déductible' },
  { key: 'tvaNette',       label: 'TVA nette à payer',           bold: true, colored: true },
];

export const PnL: React.FC = () => {
  const [objectifs, setObjectifs] = useState<Objectifs>(() => {
    const s = localStorage.getItem('irys_objectifs');
    return s ? JSON.parse(s) : DEFAULT_OBJECTIFS;
  });
  const [editObj, setEditObj] = useState(false);
  const [draftObj, setDraftObj] = useState<Objectifs>(objectifs);
  const [filterPeriod, setFilterPeriod] = useState<'all' | '3m' | '6m'>('all');

  useEffect(() => {
    localStorage.setItem('irys_objectifs', JSON.stringify(objectifs));
  }, [objectifs]);

  const saveObjectifs = () => {
    setObjectifs(draftObj);
    setEditObj(false);
  };

  const chartData =
    filterPeriod === '3m'
      ? MONTHLY_PNL.slice(-3)
      : filterPeriod === '6m'
      ? MONTHLY_PNL.slice(-6)
      : MONTHLY_PNL;

  // Projections : on exclut le dernier mois (partiel = Avr 2026)
  const completeMois = MONTHLY_PNL.slice(0, -1);
  const avgCa = completeMois.reduce((s, m) => s + m.caHT, 0) / completeMois.length;
  const avgNet = completeMois.reduce((s, m) => s + m.resultatNet, 0) / completeMois.length;
  const ytdCa = MONTHLY_PNL.reduce((s, m) => s + m.caHT, 0);
  const remainingMois = 12 - MONTHLY_PNL.length;
  const projCaAnnuel = ytdCa + avgCa * remainingMois;
  const moisPourObjectifCa =
    avgCa > 0 ? Math.ceil((objectifs.caAnnuel - ytdCa) / avgCa) : Infinity;

  const ProgressBar = ({
    current,
    target,
    label,
  }: {
    current: number;
    target: number;
    label: string;
  }) => {
    const pct = Math.min(100, Math.round((current / target) * 100));
    return (
      <div className="space-y-2">
        <div className="flex justify-between text-sm">
          <span className="text-muted">{label}</span>
          <span className="font-bold">
            {fmtK(current)} / {fmtK(target)} ({pct}%)
          </span>
        </div>
        <div className="h-2 bg-[#2A2A2A] rounded-full overflow-hidden">
          <div
            className="h-full bg-[#FF4D00] rounded-full transition-all duration-700"
            style={{ width: `${pct}%` }}
          />
        </div>
      </div>
    );
  };

  return (
    <div className="space-y-8 animate-in fade-in duration-500">
      <h1 className="text-2xl font-bold">P&L — Compte de résultat</h1>

      {/* SECTION 1 — TABLEAU P&L */}
      <div className="bg-card border border-[#2A2A2A] rounded-3xl overflow-hidden">
        <div className="px-6 py-4 border-b border-[#2A2A2A]">
          <h2 className="font-bold">Résumé mensuel</h2>
          <p className="text-xs text-muted mt-0.5">Oct 2025 → Avr 2026 (partiel)</p>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="bg-[#1A1A1A] border-b border-[#2A2A2A]">
              <tr>
                <th className="px-4 py-3 text-left font-medium text-muted sticky left-0 bg-[#1A1A1A] min-w-[210px]">
                  Indicateur
                </th>
                {MONTHLY_PNL.map(m => (
                  <th
                    key={m.mois}
                    className="px-4 py-3 text-right font-medium text-muted whitespace-nowrap"
                  >
                    {m.label}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-[#1A1A1A]">
              {TABLE_ROWS.map(row => (
                <tr
                  key={row.key}
                  className={`hover:bg-[#1A1A1A]/30 transition-colors ${row.bold ? 'bg-[#111]' : ''}`}
                >
                  <td
                    className={`px-4 py-3 sticky left-0 bg-inherit text-sm ${
                      row.bold ? 'font-bold text-white' : 'text-muted'
                    }`}
                  >
                    {row.label}
                  </td>
                  {MONTHLY_PNL.map(m => (
                    <td key={m.mois} className="px-4 py-3 text-right whitespace-nowrap">
                      {row.colored ? (
                        <ColoredCell value={m[row.key] as number} />
                      ) : (
                        <span className={row.bold ? 'font-bold' : 'text-muted'}>
                          {fmt(m[row.key] as number)}
                        </span>
                      )}
                    </td>
                  ))}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* SECTION 2 — OBJECTIFS */}
      <div className="bg-card border border-[#2A2A2A] p-6 rounded-3xl space-y-6">
        <div className="flex items-center justify-between">
          <h2 className="font-bold">Objectifs & Projection</h2>
          {!editObj ? (
            <button
              onClick={() => { setDraftObj(objectifs); setEditObj(true); }}
              className="flex items-center gap-1 text-xs text-muted hover:text-white transition-colors"
            >
              <Edit2 size={12} /> Modifier
            </button>
          ) : (
            <div className="flex gap-3">
              <button
                onClick={saveObjectifs}
                className="flex items-center gap-1 text-xs text-[#4CAF50] hover:opacity-80"
              >
                <Check size={12} /> Sauvegarder
              </button>
              <button
                onClick={() => setEditObj(false)}
                className="flex items-center gap-1 text-xs text-muted hover:text-white"
              >
                <X size={12} /> Annuler
              </button>
            </div>
          )}
        </div>

        {editObj ? (
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {[
              { key: 'caMensuel',       label: 'CA mensuel cible (€ HT)' },
              { key: 'caAnnuel',        label: 'CA annuel cible (€ HT)' },
              { key: 'resultatMensuel', label: 'Résultat net mensuel cible (€)' },
            ].map(({ key, label }) => (
              <div key={key} className="space-y-1">
                <label className="text-xs font-bold text-muted uppercase tracking-wider">{label}</label>
                <input
                  type="number"
                  min="0"
                  value={(draftObj as Record<string, number>)[key]}
                  onChange={e =>
                    setDraftObj(d => ({ ...d, [key]: parseFloat(e.target.value) || 0 }))
                  }
                  className="w-full bg-[#1A1A1A] border border-[#333] rounded-xl px-3 py-2 text-white focus:outline-none focus:border-[#FF4D00] transition-all"
                />
              </div>
            ))}
          </div>
        ) : (
          <div className="space-y-5">
            <ProgressBar
              current={avgCa}
              target={objectifs.caMensuel}
              label="CA mensuel moyen vs objectif"
            />
            <ProgressBar
              current={ytdCa}
              target={objectifs.caAnnuel}
              label="CA annuel cumulé vs objectif"
            />
            <ProgressBar
              current={avgNet > 0 ? avgNet : 0}
              target={objectifs.resultatMensuel}
              label="Résultat net moyen vs objectif"
            />

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-4 border-t border-[#2A2A2A]">
              <div className="bg-[#1A1A1A] p-4 rounded-2xl">
                <div className="text-xs text-muted mb-1">Projection CA annuel (rythme actuel)</div>
                <div className="text-xl font-bold">{fmtK(projCaAnnuel)}</div>
              </div>
              <div className="bg-[#1A1A1A] p-4 rounded-2xl">
                <div className="text-xs text-muted mb-1">
                  Mois pour atteindre l'objectif CA annuel
                </div>
                <div className="text-xl font-bold">
                  {moisPourObjectifCa === Infinity
                    ? '∞'
                    : moisPourObjectifCa <= 0
                    ? 'Atteint ✓'
                    : `${moisPourObjectifCa} mois`}
                </div>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* SECTION 3 — GRAPHIQUE */}
      <div className="bg-card border border-[#2A2A2A] p-6 rounded-3xl">
        <div className="flex items-center justify-between mb-6">
          <h2 className="font-bold">Évolution CA / Charges / Résultat</h2>
          <div className="bg-[#1A1A1A] border border-[#2A2A2A] rounded-xl p-1 flex text-xs">
            {(
              [
                ['all', 'Tout'],
                ['6m', '6 mois'],
                ['3m', '3 mois'],
              ] as const
            ).map(([v, l]) => (
              <button
                key={v}
                onClick={() => setFilterPeriod(v)}
                className={`px-3 py-1.5 rounded-lg transition-colors ${
                  filterPeriod === v
                    ? 'bg-[#FF4D00] text-white font-bold'
                    : 'text-muted hover:text-white'
                }`}
              >
                {l}
              </button>
            ))}
          </div>
        </div>

        <div className="h-72">
          <ResponsiveContainer width="100%" height="100%">
            <AreaChart data={chartData} margin={{ top: 10, right: 0, left: -10, bottom: 0 }}>
              <defs>
                <linearGradient id="gradCA" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#FF4D00" stopOpacity={0.3} />
                  <stop offset="95%" stopColor="#FF4D00" stopOpacity={0} />
                </linearGradient>
                <linearGradient id="gradNet" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#4CAF50" stopOpacity={0.3} />
                  <stop offset="95%" stopColor="#4CAF50" stopOpacity={0} />
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#1A1A1A" />
              <XAxis
                dataKey="label"
                axisLine={false}
                tickLine={false}
                tick={{ fill: '#444', fontSize: 11 }}
                dy={8}
              />
              <YAxis
                axisLine={false}
                tickLine={false}
                tick={{ fill: '#444', fontSize: 11 }}
                tickFormatter={v => (v >= 1000 ? `${(v / 1000).toFixed(0)}k` : `${v}`)}
              />
              <Tooltip
                contentStyle={{
                  backgroundColor: '#1A1A1A',
                  border: '1px solid #333',
                  borderRadius: '12px',
                  color: '#fff',
                }}
                formatter={(value: number, name: string) => [
                  `${value.toFixed(2)} €`,
                  name === 'caHT'
                    ? 'CA HT'
                    : name === 'totalChargesHT'
                    ? 'Charges HT'
                    : 'Résultat net',
                ]}
              />
              <Area
                type="monotone"
                dataKey="totalChargesHT"
                stroke="#444"
                strokeWidth={2}
                fill="none"
              />
              <Area
                type="monotone"
                dataKey="caHT"
                stroke="#FF4D00"
                strokeWidth={3}
                fillOpacity={1}
                fill="url(#gradCA)"
              />
              <Area
                type="monotone"
                dataKey="resultatNet"
                stroke="#4CAF50"
                strokeWidth={2}
                fillOpacity={1}
                fill="url(#gradNet)"
              />
            </AreaChart>
          </ResponsiveContainer>
        </div>

        {/* Légende */}
        <div className="flex items-center gap-6 mt-4 text-xs text-muted">
          <div className="flex items-center gap-1.5">
            <div className="w-3 h-0.5 bg-[#FF4D00]" /> CA HT
          </div>
          <div className="flex items-center gap-1.5">
            <div className="w-3 h-0.5 bg-[#444]" /> Charges HT
          </div>
          <div className="flex items-center gap-1.5">
            <div className="w-3 h-0.5 bg-[#4CAF50]" /> Résultat net
          </div>
        </div>
      </div>
    </div>
  );
};

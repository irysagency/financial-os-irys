import React, { useState, useEffect, useMemo } from 'react';
import { Plus, X, ChevronDown, ChevronRight, Trash2 } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { Prestation, PrestationStatus, CoutPrestation } from '../types';
import { QONTO_PRESTATIONS } from '../constants/data';

/* ── helpers ─────────────────────────────────────────────────── */

import { fmtEur, formatDateFR } from '../utils/format';

/* ── config ──────────────────────────────────────────────────── */

const STATUTS: PrestationStatus[] = ['Signé', 'En attente', 'Payé'];

const STATUS_CFG: Record<PrestationStatus, { label: string; bg: string; text: string }> = {
  'Signé':      { label: 'Signé',      bg: 'bg-blue-900/30',  text: 'text-blue-400' },
  'En attente': { label: 'En attente', bg: 'bg-[#FF4D00]/10', text: 'text-[#FF4D00]' },
  'Payé':       { label: 'Payé',       bg: 'bg-[#1B5E20]/30', text: 'text-[#4CAF50]' },
};

const MONTH_LABELS = ['Jan', 'Fév', 'Mar', 'Avr', 'Mai', 'Jun', 'Jul', 'Aoû', 'Sep', 'Oct', 'Nov', 'Déc'];
const NOW          = new Date();
const CUR_YEAR     = NOW.getFullYear();
const CUR_MONTH_I  = NOW.getMonth(); // 0-indexed

const EMPTY_S1 = { client: '', prestation: '', montantHT: '', dateDebut: '', statut: 'Signé' as PrestationStatus };

/* resolve date field: new model (dateDebut) or legacy (dateEmission) */
const getDate = (p: Prestation) => p.dateDebut || (p as any).dateEmission || '';

/* ── component ───────────────────────────────────────────────── */

export const Revenus: React.FC = () => {

  /* ── data ── */
  const [prestations, setPrestations] = useState<Prestation[]>(() => {
    try {
      const raw = localStorage.getItem('irys_prestations');
      if (!raw) return QONTO_PRESTATIONS; // seed on first visit
      const parsed = JSON.parse(raw) as any[];
      // normalize legacy entries
      return parsed.map(p => ({
        ...p,
        prestation: p.prestation ?? p.description ?? '',
        dateDebut:  p.dateDebut  ?? p.dateEmission ?? '',
        couts:      p.couts ?? [],
        statut:     (['Signé','En attente','Payé'].includes(p.statut) ? p.statut : 'Payé') as PrestationStatus,
      }));
    } catch { return QONTO_PRESTATIONS; }
  });

  useEffect(() => {
    localStorage.setItem('irys_prestations', JSON.stringify(prestations));
    window.dispatchEvent(new CustomEvent('irys:prestations-updated'));
  }, [prestations]);

  /* ── period filter ── */
  const [selYear,  setSelYear]  = useState(CUR_YEAR);
  const [selMonth, setSelMonth] = useState<number | null>(null);

  /* ── status filter ── */
  const [filterSt, setFilterSt] = useState<'all' | PrestationStatus>('all');

  /* ── status dropdown ── */
  const [openStId, setOpenStId] = useState<string | null>(null);

  /* ── click-outside to close status dropdown ── */
  useEffect(() => {
    if (!openStId) return;
    const handler = (e: MouseEvent) => {
      const target = e.target as HTMLElement | null;
      if (!target || !target.closest('.status-dropdown')) {
        setOpenStId(null);
      }
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, [openStId]);

  /* ── modal ── */
  const [modalOpen, setModalOpen] = useState(false);
  const [step,      setStep]      = useState<1 | 2>(1);
  const [s1,        setS1]        = useState(EMPTY_S1);
  const [couts,     setCouts]     = useState<{ description: string; montantHT: string }[]>([]);
  const [showDrop,  setShowDrop]  = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [confirmDeleteId, setConfirmDeleteId] = useState<string | null>(null);
  const [modalError, setModalError] = useState<string | null>(null);

  /* ── client autocomplete ── */
  const allClients = useMemo(() => {
    const set = new Set(prestations.map(p => p.client).filter(Boolean));
    return [...set].sort();
  }, [prestations]);

  const filteredClients = allClients.filter(c =>
    c.toLowerCase().includes(s1.client.toLowerCase()) && c !== s1.client
  );

  /* ── available months for selected year ── */
  const availableMonths = useMemo(() => {
    if (selYear === CUR_YEAR) {
      return Array.from({ length: CUR_MONTH_I + 1 }, (_, i) => i);
    }
    const monthsNumbers: number[] = prestations
      .filter(p => getDate(p).startsWith(String(selYear)))
      .map(p => parseInt(getDate(p).slice(5, 7), 10) - 1);
    const uniqueMonths: number[] = Array.from(new Set<number>(monthsNumbers));
    return uniqueMonths.sort((a: number, b: number) => a - b);
  }, [prestations, selYear]);

  /* ── period-filtered data (ignoring status filter, for KPIs) ── */
  const periodFiltered = useMemo(() =>
    prestations.filter(p => {
      const d = getDate(p);
      if (!d) return false;
      if (parseInt(d.slice(0, 4)) !== selYear) return false;
      if (selMonth !== null && parseInt(d.slice(5, 7)) - 1 !== selMonth) return false;
      return true;
    }),
    [prestations, selYear, selMonth]
  );

  /* ── table rows (status filter applied) ── */
  const tableRows = useMemo(() =>
    [...periodFiltered]
      .filter(p => filterSt === 'all' || p.statut === filterSt)
      .sort((a, b) => getDate(b).localeCompare(getDate(a))),
    [periodFiltered, filterSt]
  );

  /* ── KPIs ── */
  const kpis = useMemo(() => {
    const sumCouts = (p: Prestation) => (p.couts || []).reduce((sc: number, c) => sc + (c.montantHT as number), 0);
    const caTotal     = periodFiltered.reduce((s: number, p) => s + p.montantHT, 0);
    const payees      = periodFiltered.filter(p => p.statut === 'Payé');
    const cashEnc     = payees.reduce((s: number, p) => s + p.montantHT, 0);
    const fraisTotal  = periodFiltered.reduce((s: number, p) => s + sumCouts(p), 0);
    const fraisPayees = payees.reduce((s: number, p) => s + sumCouts(p), 0);
    const enAtt       = periodFiltered.filter(p => p.statut === 'Signé' || p.statut === 'En attente').reduce((s: number, p) => s + p.montantHT, 0);
    const marge       = cashEnc > 0 ? ((cashEnc - fraisPayees) / cashEnc) * 100 : null;
    return { caTotal, cashEnc, fraisTotal, enAtt, marge };
  }, [periodFiltered]);

  const periodLabel = selMonth !== null
    ? `${MONTH_LABELS[selMonth]} ${selYear}`
    : String(selYear);

  /* ── handlers ── */
  const changeStatut = (id: string, statut: PrestationStatus) => {
    setPrestations(prev => prev.map(p => p.id === id ? { ...p, statut } : p));
    setOpenStId(null);
  };

  const openModal = () => {
    setStep(1); setS1(EMPTY_S1); setCouts([]); setEditingId(null); setModalOpen(true);
  };

  const openEdit = (p: Prestation) => {
    setEditingId(p.id);
    setS1({
      client:     p.client,
      prestation: p.prestation || (p as any).description || '',
      montantHT:  String(p.montantHT ?? ''),
      dateDebut:  getDate(p),
      statut:     p.statut,
    });
    setCouts(
      (p.couts || []).map(c => ({
        description: c.description,
        montantHT:   String(c.montantHT ?? ''),
      }))
    );
    setStep(1);
    setModalOpen(true);
  };

  const closeModal = () => {
    setModalOpen(false);
    setEditingId(null);
    setModalError(null);
  };

  const handleDelete = (id: string) => {
    if (confirmDeleteId === id) {
      setPrestations(prev => prev.filter(p => p.id !== id));
      setConfirmDeleteId(null);
    } else {
      setConfirmDeleteId(id);
      // auto-reset confirmation after 3s
      setTimeout(() => setConfirmDeleteId(cur => (cur === id ? null : cur)), 3000);
    }
  };

  const goStep2 = (e: React.FormEvent) => {
    e.preventDefault();
    const ht = parseFloat(s1.montantHT);
    if (!ht || ht <= 0) {
      setModalError('Le montant HT doit être un nombre positif.');
      return;
    }
    setModalError(null);
    setStep(2);
  };

  const handleSave = () => {
    const ht  = parseFloat(s1.montantHT) || 0;
    const mappedCouts: CoutPrestation[] = couts
      .filter(c => c.description.trim() || c.montantHT)
      .map((c, i): CoutPrestation => ({
        id:          `cout-${Date.now()}-${i}`,
        description: c.description,
        montantHT:   parseFloat(c.montantHT) || 0,
      }));

    if (editingId) {
      setPrestations(prev => prev.map(p =>
        p.id === editingId
          ? {
              ...p,
              client:     s1.client,
              prestation: s1.prestation,
              montantHT:  ht,
              tva:        Math.round(ht * 0.2 * 100) / 100,
              montantTTC: Math.round(ht * 1.2 * 100) / 100,
              dateDebut:  s1.dateDebut,
              statut:     s1.statut,
              couts:      mappedCouts,
            }
          : p
      ));
    } else {
      const newP: Prestation = {
        id:         `manual-${Date.now()}`,
        client:     s1.client,
        prestation: s1.prestation,
        montantHT:  ht,
        tva:        Math.round(ht * 0.2 * 100) / 100,
        montantTTC: Math.round(ht * 1.2 * 100) / 100,
        dateDebut:  s1.dateDebut,
        statut:     s1.statut,
        source:     'manual',
        couts:      mappedCouts,
      };
      setPrestations(prev => [newP, ...prev]);
    }
    closeModal();
  };

  const addCout    = () => setCouts(p => [...p, { description: '', montantHT: '' }]);
  const removeCout = (i: number) => setCouts(p => p.filter((_, idx) => idx !== i));
  const updCout    = (i: number, f: 'description' | 'montantHT', v: string) =>
    setCouts(p => p.map((c, idx) => idx === i ? { ...c, [f]: v } : c));

  /* ── render ── */
  return (
    <div className="space-y-6 animate-in fade-in duration-500 pb-10">

      {/* HEADER */}
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold">Revenus</h1>
        <button
          onClick={openModal}
          className="flex items-center gap-2 px-4 py-2 bg-[#FF4D00] text-white text-sm font-bold rounded-full shadow-[0_4px_14px_rgba(255,77,0,0.4)] hover:scale-105 transition-transform"
        >
          <Plus size={16} /> Nouvelle prestation
        </button>
      </div>

      {/* PERIOD SELECTOR */}
      <div className="flex items-center gap-3 flex-wrap">
        {/* Year tabs */}
        <div className="flex bg-[#1A1A1A] border border-[#2A2A2A] rounded-xl p-1 gap-1">
          {[2025, 2026].map(y => (
            <button
              key={y}
              onClick={() => { setSelYear(y); setSelMonth(null); }}
              className={`px-4 py-1.5 rounded-lg text-sm font-bold transition-colors ${
                selYear === y ? 'bg-[#FF4D00] text-white' : 'text-muted hover:text-white'
              }`}
            >
              {y}
            </button>
          ))}
        </div>

        {/* Month pills */}
        <div className="flex gap-1.5 flex-wrap">
          <button
            onClick={() => setSelMonth(null)}
            className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-colors border ${
              selMonth === null
                ? 'bg-[#FF4D00]/15 text-[#FF4D00] border-[#FF4D00]/30'
                : 'bg-[#1A1A1A] border-[#2A2A2A] text-muted hover:text-white'
            }`}
          >
            Tout
          </button>
          {availableMonths.map(m => (
            <button
              key={m}
              onClick={() => setSelMonth(m)}
              className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-colors border ${
                selMonth === m
                  ? 'bg-[#FF4D00]/15 text-[#FF4D00] border-[#FF4D00]/30'
                  : 'bg-[#1A1A1A] border-[#2A2A2A] text-muted hover:text-white'
              }`}
            >
              {MONTH_LABELS[m]}
            </button>
          ))}
        </div>
      </div>

      {/* 5 KPI CARDS */}
      <div className="grid grid-cols-2 xl:grid-cols-5 gap-3">
        {([
          { key: 'ca',      title: 'CA Total HT (Facturé)',        value: fmtEur(kpis.caTotal),   hi: true  },
          { key: 'cash',    title: 'Cash encaissé HT',             value: fmtEur(kpis.cashEnc),   hi: false },
          { key: 'frais',   title: 'Frais Totaux',                 value: fmtEur(kpis.fraisTotal), hi: false },
          { key: 'att',     title: 'En attente d\'encaissement',   value: fmtEur(kpis.enAtt),     hi: false },
          { key: 'marge',   title: 'Marge nette',
            value: kpis.marge !== null ? `${kpis.marge.toFixed(1)}%` : '—',
            sub: kpis.marge !== null ? `sur encaissé · ${periodLabel}` : `Aucun encaissement`,
            green: kpis.marge !== null && kpis.marge >= 0,
            hi: false },
        ] as const).map(card => (
          <div
            key={card.key}
            className={`bg-card border p-4 rounded-3xl ${(card as any).hi ? 'border-[#FF4D00]/30' : 'border-[#2A2A2A]'}`}
          >
            <div className="text-muted text-[11px] font-medium mb-2 leading-tight">{card.title}</div>
            <div className={`text-xl font-bold ${(card as any).hi ? 'text-[#FF4D00]' : (card as any).green ? 'text-[#4ade80]' : ''}`}>
              {card.value}
            </div>
            {(card as any).sub && (
              <div className="text-[10px] text-muted mt-1">{(card as any).sub}</div>
            )}
          </div>
        ))}
      </div>

      {/* STATUS FILTER */}
      <div className="flex gap-2 flex-wrap">
        {(['all', ...STATUTS] as const).map(s => (
          <button
            key={s}
            onClick={() => setFilterSt(s)}
            className={`px-3 py-1.5 rounded-full text-xs font-medium transition-all ${
              filterSt === s ? 'bg-[#FF4D00] text-white' : 'bg-[#1A1A1A] border border-[#2A2A2A] text-muted hover:text-white'
            }`}
          >
            {s === 'all' ? 'Tous' : s}
          </button>
        ))}
      </div>

      {/* TABLE */}
      <div className="bg-card border border-[#2A2A2A] rounded-3xl overflow-hidden">
        {tableRows.length === 0 ? (
          <div className="p-12 text-center text-muted">Aucune prestation sur cette période.</div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm">
              <thead className="bg-[#1A1A1A] text-muted border-b border-[#2A2A2A]">
                <tr>
                  <th className="px-6 py-4 font-medium">Client</th>
                  <th className="px-6 py-4 font-medium">Prestation</th>
                  <th className="px-6 py-4 font-medium text-right">Montant HT</th>
                  <th className="px-6 py-4 font-medium text-right">Frais</th>
                  <th className="px-6 py-4 font-medium text-right">Marge</th>
                  <th className="px-6 py-4 font-medium">Date début</th>
                  <th className="px-6 py-4 font-medium">Statut</th>
                  <th className="px-6 py-4 font-medium w-10"></th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#1A1A1A]">
                {tableRows.map(p => {
                  const sc    = STATUS_CFG[p.statut] ?? STATUS_CFG['Signé'];
                  const frais = (p.couts || []).reduce((s, c) => s + c.montantHT, 0);
                  const marge = p.montantHT > 0 ? ((p.montantHT - frais) / p.montantHT) * 100 : null;
                  return (
                    <tr
                      key={p.id}
                      onClick={() => openEdit(p)}
                      className="hover:bg-[#1A1A1A]/50 transition-colors cursor-pointer"
                    >
                      <td className="px-6 py-4 font-medium text-white whitespace-nowrap">{p.client}</td>
                      <td className="px-6 py-4 text-muted max-w-[180px] truncate">
                        {p.prestation || (p as any).description || '—'}
                      </td>
                      <td className="px-6 py-4 text-right font-bold whitespace-nowrap">{fmtEur(p.montantHT)}</td>
                      <td className="px-6 py-4 text-right text-muted whitespace-nowrap">
                        {frais > 0 ? fmtEur(frais) : '—'}
                      </td>
                      <td className="px-6 py-4 text-right font-bold whitespace-nowrap">
                        {marge !== null && frais > 0 ? (
                          <span className={marge >= 50 ? 'text-[#4ade80]' : marge >= 20 ? 'text-yellow-400' : 'text-red-400'}>
                            {marge.toFixed(0)}%
                          </span>
                        ) : <span className="text-muted">—</span>}
                      </td>
                      <td className="px-6 py-4 text-muted whitespace-nowrap">
                        {getDate(p) ? formatDateFR(getDate(p)) : '—'}
                      </td>
                      <td className="px-6 py-4 relative">
                        <div className="status-dropdown relative inline-block" onClick={e => e.stopPropagation()}>
                          <button
                            onClick={() => setOpenStId(openStId === p.id ? null : p.id)}
                            className={`flex items-center gap-1 px-2.5 py-1 rounded-md text-xs font-bold ${sc.bg} ${sc.text}`}
                          >
                            {sc.label} <ChevronDown size={10} />
                          </button>
                          {openStId === p.id && (
                            <div className="absolute z-10 mt-1 left-0 bg-[#1A1A1A] border border-[#2A2A2A] rounded-xl overflow-hidden shadow-xl min-w-[120px]">
                              {STATUTS.map(s => (
                                <button
                                  key={s}
                                  onClick={() => changeStatut(p.id, s)}
                                  className={`w-full text-left px-4 py-2 text-xs font-medium hover:bg-[#2A2A2A] transition-colors ${STATUS_CFG[s].text}`}
                                >
                                  {STATUS_CFG[s].label}
                                </button>
                              ))}
                            </div>
                          )}
                        </div>
                      </td>
                      <td className="px-4 py-4 text-right" onClick={e => e.stopPropagation()}>
                        <button
                          onClick={() => handleDelete(p.id)}
                          className={`p-2 rounded-lg transition-colors ${
                            confirmDeleteId === p.id
                              ? 'bg-red-500/20 text-red-400'
                              : 'text-muted hover:text-red-400 hover:bg-red-500/10'
                          }`}
                          title={confirmDeleteId === p.id ? 'Cliquer pour confirmer' : 'Supprimer'}
                        >
                          <Trash2 size={14} />
                        </button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* ── MODAL 2 ÉTAPES ──────────────────────────────────────── */}
      <AnimatePresence>
        {modalOpen && (
          <>
            <motion.div
              initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
              onClick={closeModal}
              className="fixed inset-0 bg-black/60 backdrop-blur-sm z-[60]"
            />
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 20 }}
              className="fixed inset-0 m-auto w-full max-w-lg h-fit z-[70] p-4"
              style={{ maxHeight: '90vh', overflowY: 'auto' }}
            >
              <div className="bg-[#121212] border border-[#2A2A2A] rounded-3xl shadow-2xl overflow-hidden">

                {/* Modal header */}
                <div className="p-6 pb-4 flex items-start justify-between border-b border-[#2A2A2A]">
                  <div>
                    <h3 className="text-xl font-bold">{editingId ? 'Modifier la prestation' : 'Nouvelle prestation'}</h3>
                    <div className="flex items-center gap-2 mt-2">
                      {([1, 2] as const).map(s => (
                        <React.Fragment key={s}>
                          <div className={`w-2 h-2 rounded-full transition-colors ${step === s ? 'bg-[#FF4D00]' : step > s ? 'bg-[#4ade80]' : 'bg-[#2A2A2A]'}`} />
                          <span className={`text-xs transition-colors ${step === s ? 'text-[#FF4D00]' : step > s ? 'text-[#4ade80]' : 'text-muted'}`}>
                            {s === 1 ? 'Informations' : 'Coûts liés'}
                          </span>
                          {s < 2 && <ChevronRight size={10} className="text-muted" />}
                        </React.Fragment>
                      ))}
                    </div>
                  </div>
                  <button onClick={closeModal} className="text-muted hover:text-white transition-colors mt-1">
                    <X size={20} />
                  </button>
                </div>

                {/* ── ÉTAPE 1 ── */}
                {step === 1 && (
                  <form onSubmit={goStep2} className="p-6 space-y-4">

                    {/* Client avec dropdown */}
                    <div className="space-y-1 relative">
                      <label className="text-xs font-bold text-muted uppercase tracking-wider">Client</label>
                      <input
                        type="text"
                        placeholder="Saisir ou choisir un client"
                        value={s1.client}
                        onChange={e => { setS1(f => ({ ...f, client: e.target.value })); setShowDrop(true); }}
                        onFocus={() => setShowDrop(true)}
                        onBlur={() => setTimeout(() => setShowDrop(false), 150)}
                        required
                        className="w-full bg-[#1A1A1A] border border-[#333] rounded-xl px-4 py-3 text-white placeholder:text-muted/50 focus:outline-none focus:border-[#FF4D00] transition-all"
                      />
                      {showDrop && filteredClients.length > 0 && (
                        <div className="absolute z-20 w-full mt-1 bg-[#1A1A1A] border border-[#2A2A2A] rounded-xl overflow-hidden shadow-2xl">
                          {filteredClients.map(c => (
                            <button
                              key={c}
                              type="button"
                              onMouseDown={() => { setS1(f => ({ ...f, client: c })); setShowDrop(false); }}
                              className="w-full text-left px-4 py-2.5 text-sm text-white hover:bg-[#2A2A2A] transition-colors"
                            >
                              {c}
                            </button>
                          ))}
                        </div>
                      )}
                    </div>

                    {/* Prestation */}
                    <div className="space-y-1">
                      <label className="text-xs font-bold text-muted uppercase tracking-wider">Prestation</label>
                      <input
                        type="text"
                        placeholder="Ex : Shooting photo, Identité visuelle, Vidéo..."
                        value={s1.prestation}
                        onChange={e => setS1(f => ({ ...f, prestation: e.target.value }))}
                        required
                        className="w-full bg-[#1A1A1A] border border-[#333] rounded-xl px-4 py-3 text-white placeholder:text-muted/50 focus:outline-none focus:border-[#FF4D00] transition-all"
                      />
                    </div>

                    {/* Montant HT */}
                    <div className="space-y-1">
                      <label className="text-xs font-bold text-muted uppercase tracking-wider">Montant HT (€)</label>
                      <input
                        type="number" min="0" step="0.01"
                        placeholder="0.00"
                        value={s1.montantHT}
                        onChange={e => setS1(f => ({ ...f, montantHT: e.target.value }))}
                        required
                        className="w-full bg-[#1A1A1A] border border-[#333] rounded-xl px-4 py-3 text-white placeholder:text-muted/50 focus:outline-none focus:border-[#FF4D00] transition-all"
                      />
                    </div>

                    {/* Date début */}
                    <div className="space-y-1">
                      <label className="text-xs font-bold text-muted uppercase tracking-wider">Date début de projet</label>
                      <input
                        type="date"
                        value={s1.dateDebut}
                        onChange={e => setS1(f => ({ ...f, dateDebut: e.target.value }))}
                        required
                        className="w-full bg-[#1A1A1A] border border-[#333] rounded-xl px-4 py-3 text-white focus:outline-none focus:border-[#FF4D00] transition-all"
                      />
                    </div>

                    {/* Statut */}
                    <div className="space-y-1">
                      <label className="text-xs font-bold text-muted uppercase tracking-wider">Statut</label>
                      <div className="flex gap-2">
                        {STATUTS.map(s => (
                          <button
                            key={s}
                            type="button"
                            onClick={() => setS1(f => ({ ...f, statut: s }))}
                            className={`flex-1 py-2.5 rounded-xl text-xs font-bold border transition-all ${
                              s1.statut === s
                                ? `${STATUS_CFG[s].bg} ${STATUS_CFG[s].text} border-transparent ring-1 ring-current`
                                : 'bg-[#1A1A1A] text-muted border-[#2A2A2A] hover:text-white'
                            }`}
                          >
                            {s}
                          </button>
                        ))}
                      </div>
                    </div>

                    {modalError && (
                      <p className="text-xs text-red-400 text-center">{modalError}</p>
                    )}
                    <button
                      type="submit"
                      className="w-full bg-[#FF4D00] text-white font-bold py-3.5 rounded-xl shadow-[0_4px_14px_rgba(255,77,0,0.4)] hover:scale-[1.02] active:scale-[0.98] transition-all flex items-center justify-center gap-2"
                    >
                      Suivant — Ajouter les coûts <ChevronRight size={16} />
                    </button>
                  </form>
                )}

                {/* ── ÉTAPE 2 ── */}
                {step === 2 && (
                  <div className="p-6 space-y-5">

                    {/* Récap step 1 */}
                    <div className="bg-[#1A1A1A] border border-[#2A2A2A] rounded-2xl p-4 flex items-start justify-between">
                      <div>
                        <div className="font-bold text-sm">{s1.client}</div>
                        <div className="text-xs text-muted mt-0.5">{s1.prestation}</div>
                      </div>
                      <div className="text-right shrink-0 ml-4">
                        <div className="font-bold text-[#FF4D00]">{fmtEur(parseFloat(s1.montantHT) || 0)}</div>
                        <div className={`text-xs mt-0.5 ${STATUS_CFG[s1.statut].text}`}>{s1.statut}</div>
                      </div>
                    </div>

                    {/* Coûts */}
                    <div>
                      <div className="flex items-center justify-between mb-3">
                        <label className="text-xs font-bold text-muted uppercase tracking-wider">Coûts liés</label>
                        <button
                          onClick={addCout}
                          type="button"
                          className="flex items-center gap-1 text-xs text-[#FF4D00] hover:opacity-75 transition-opacity"
                        >
                          <Plus size={12} /> Ajouter
                        </button>
                      </div>

                      {couts.length === 0 ? (
                        <button
                          onClick={addCout}
                          type="button"
                          className="w-full border border-dashed border-[#2A2A2A] rounded-2xl py-6 text-sm text-muted hover:border-[#FF4D00]/40 hover:text-[#FF4D00]/60 transition-all"
                        >
                          + Prestataire, transport, achat de droits, musique…
                        </button>
                      ) : (
                        <div className="space-y-2">
                          {couts.map((c, i) => (
                            <div key={i} className="flex gap-2 items-center">
                              <input
                                type="text"
                                placeholder="Ex : Clicteur Thomas, transport…"
                                value={c.description}
                                onChange={e => updCout(i, 'description', e.target.value)}
                                className="flex-1 bg-[#1A1A1A] border border-[#333] rounded-xl px-3 py-2.5 text-white text-sm placeholder:text-muted/40 focus:outline-none focus:border-[#FF4D00] transition-all"
                              />
                              <div className="flex items-center gap-1 shrink-0">
                                <input
                                  type="number" min="0" step="0.01"
                                  placeholder="0.00"
                                  value={c.montantHT}
                                  onChange={e => updCout(i, 'montantHT', e.target.value)}
                                  className="w-24 bg-[#1A1A1A] border border-[#333] rounded-xl px-3 py-2.5 text-white text-sm placeholder:text-muted/40 focus:outline-none focus:border-[#FF4D00] transition-all"
                                />
                                <span className="text-xs text-muted">€</span>
                              </div>
                              <button
                                onClick={() => removeCout(i)}
                                type="button"
                                className="text-muted hover:text-red-400 transition-colors shrink-0"
                              >
                                <Trash2 size={14} />
                              </button>
                            </div>
                          ))}
                        </div>
                      )}

                      {/* Marge preview */}
                      {couts.some(c => parseFloat(c.montantHT) > 0) && (
                        <div className="mt-3 bg-[#0D0D0D] border border-[#2A2A2A] rounded-xl px-4 py-3 flex items-center justify-between text-sm">
                          <span className="text-muted">Marge estimée</span>
                          <span className="font-bold text-[#4ade80]">
                            {(() => {
                              const totalF = couts.reduce((s, c) => s + (parseFloat(c.montantHT) || 0), 0);
                              const ht     = parseFloat(s1.montantHT) || 0;
                              if (ht === 0) return '—';
                              const m = ((ht - totalF) / ht) * 100;
                              return `${m.toFixed(1)}% · ${fmtEur(ht - totalF)} net`;
                            })()}
                          </span>
                        </div>
                      )}
                    </div>

                    {/* Actions */}
                    <div className="flex gap-3 pt-1">
                      <button
                        onClick={() => setStep(1)}
                        type="button"
                        className="flex-1 border border-[#2A2A2A] text-muted rounded-xl py-3 text-sm font-medium hover:text-white hover:border-[#444] transition-all"
                      >
                        Retour
                      </button>
                      <button
                        onClick={handleSave}
                        type="button"
                        className="flex-1 bg-[#FF4D00] text-white font-bold py-3 rounded-xl shadow-[0_4px_14px_rgba(255,77,0,0.4)] hover:scale-[1.02] active:scale-[0.98] transition-all"
                      >
                        Enregistrer
                      </button>
                    </div>
                  </div>
                )}

              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </div>
  );
};

import React, { useState } from 'react';
import { Search, Plus, Trash2, X } from 'lucide-react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useApiClient } from '../hooks/useApiClient';
import { fmtEur } from '../utils/format';
import { motion, AnimatePresence } from 'framer-motion';

interface ApiTransaction {
  id: string;
  name: string;
  type: string;
  amount: number;
  date: string;
  category: string | null;
  source: string;
}

const getStatusBadge = (type: string) => {
  switch (type) {
    case 'Income':
    case 'Virement reçu':
      return { label: 'Reçu', className: 'text-[#4CAF50] bg-[#1B5E20]/30' };
    case 'Expense':
    case 'Prélèvement':
      return { label: 'Payé', className: 'text-muted bg-[#1A1A1A] border border-[#2A2A2A]' };
    case 'Transfer':
    case 'Virement':
      return { label: 'Virement', className: 'text-[#FF4D00] bg-[#FF4D00]/10' };
    default:
      return { label: type, className: 'text-muted bg-[#1A1A1A] border border-[#2A2A2A]' };
  }
};

const EMPTY_FORM = { name: '', amount: '', type: 'Virement reçu', date: '', category: '' };

export const Transactions: React.FC = () => {
  const api = useApiClient();
  const queryClient = useQueryClient();
  const [search, setSearch] = useState('');
  const [isAddOpen, setIsAddOpen] = useState(false);
  const [form, setForm] = useState(EMPTY_FORM);
  const [confirmDeleteId, setConfirmDeleteId] = useState<string | null>(null);

  const { data: transactions = [], isLoading } = useQuery<ApiTransaction[]>({
    queryKey: ['transactions'],
    queryFn: () => api.get<ApiTransaction[]>('/transactions'),
  });

  const createMutation = useMutation({
    mutationFn: (body: unknown) => api.post('/transactions', body),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['transactions'] });
      queryClient.invalidateQueries({ queryKey: ['dashboard'] });
    },
  });

  const deleteMutation = useMutation({
    mutationFn: (id: string) => api.del(`/transactions/${id}`),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['transactions'] });
      queryClient.invalidateQueries({ queryKey: ['dashboard'] });
    },
  });

  const handleAdd = (e: React.FormEvent) => {
    e.preventDefault();
    const amount = parseFloat(form.amount);
    if (!amount) return;
    createMutation.mutate({
      name: form.name,
      amount,
      type: form.type,
      date: form.date,
      category: form.category || undefined,
      source: 'manual',
    });
    setIsAddOpen(false);
    setForm(EMPTY_FORM);
  };

  const handleDelete = (id: string) => {
    if (confirmDeleteId === id) {
      deleteMutation.mutate(id);
      setConfirmDeleteId(null);
    } else {
      setConfirmDeleteId(id);
      setTimeout(() => setConfirmDeleteId(cur => (cur === id ? null : cur)), 3000);
    }
  };

  const filtered = transactions.filter(tx =>
    tx.name.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="space-y-6 animate-in fade-in duration-500">

      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <h1 className="text-2xl font-bold">Transactions</h1>
        <div className="flex items-center gap-3">
          <div className="relative">
            <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-muted" />
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Rechercher…"
              className="bg-[#1A1A1A] border border-[#2A2A2A] text-sm text-white rounded-lg pl-9 pr-4 py-2 focus:outline-none focus:border-[#FF4D00] transition-all placeholder:text-muted/50"
            />
          </div>
          <button
            onClick={() => setIsAddOpen(true)}
            className="flex items-center gap-2 px-4 py-2 bg-[#FF4D00] text-white text-sm font-bold rounded-full shadow-[0_4px_14px_rgba(255,77,0,0.4)] hover:scale-105 transition-transform"
          >
            <Plus size={16} /> Ajouter
          </button>
        </div>
      </div>

      <div className="bg-card border border-[#2A2A2A] rounded-3xl overflow-hidden">
        {isLoading ? (
          <div className="py-20 text-center text-muted text-sm">Chargement…</div>
        ) : filtered.length === 0 ? (
          <div className="py-20 text-center text-muted text-sm">
            {transactions.length === 0 ? 'Aucune transaction. Ajoutez votre première transaction.' : 'Aucune transaction trouvée'}
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm">
              <thead className="bg-[#1A1A1A] text-muted border-b border-[#2A2A2A]">
                <tr>
                  <th className="px-6 py-4 font-medium">Nom</th>
                  <th className="px-6 py-4 font-medium">Date</th>
                  <th className="px-6 py-4 font-medium">Type</th>
                  <th className="px-6 py-4 font-medium text-right">Montant</th>
                  <th className="px-6 py-4 font-medium text-right">Statut</th>
                  <th className="px-6 py-4 font-medium w-10"></th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#1A1A1A]">
                {filtered.map((tx) => {
                  const badge = getStatusBadge(tx.type);
                  return (
                    <tr key={tx.id} className="hover:bg-[#1A1A1A]/50 transition-colors">
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-3">
                          <div className="w-8 h-8 rounded-full bg-[#222] flex items-center justify-center font-bold text-xs">
                            {tx.name[0]}
                          </div>
                          <span className="font-medium text-white">{tx.name}</span>
                        </div>
                      </td>
                      <td className="px-6 py-4 text-muted">{tx.date}</td>
                      <td className="px-6 py-4">
                        <span className="px-2.5 py-1 rounded-md bg-[#1A1A1A] text-white text-xs font-medium border border-[#2A2A2A]">
                          {tx.type}
                        </span>
                      </td>
                      <td className={`px-6 py-4 text-right font-bold ${tx.amount > 0 ? 'text-[#4CAF50]' : 'text-white'}`}>
                        {tx.amount > 0 ? '+' : ''}{fmtEur(tx.amount)}
                      </td>
                      <td className="px-6 py-4 text-right">
                        <span className={`text-xs font-bold px-2 py-1 rounded-md ${badge.className}`}>
                          {badge.label}
                        </span>
                      </td>
                      <td className="px-4 py-4">
                        <button
                          onClick={() => handleDelete(tx.id)}
                          className={`p-2 rounded-lg transition-colors ${
                            confirmDeleteId === tx.id
                              ? 'bg-red-500/20 text-red-400'
                              : 'text-muted hover:text-red-400 hover:bg-red-500/10'
                          }`}
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

      {/* ADD MODAL */}
      <AnimatePresence>
        {isAddOpen && (
          <>
            <motion.div
              initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
              onClick={() => setIsAddOpen(false)}
              className="fixed inset-0 bg-black/60 backdrop-blur-sm z-[60]"
            />
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 20 }}
              className="fixed inset-0 m-auto w-full max-w-md h-fit z-[70] p-4"
            >
              <div className="bg-[#121212] border border-[#2A2A2A] rounded-3xl shadow-2xl overflow-hidden">
                <div className="p-6 pb-0 flex items-center justify-between">
                  <h3 className="text-xl font-bold">Nouvelle transaction</h3>
                  <button onClick={() => setIsAddOpen(false)} className="text-muted hover:text-white">
                    <X size={20} />
                  </button>
                </div>
                <form onSubmit={handleAdd} className="p-6 space-y-4">
                  {[
                    { label: 'Libellé', field: 'name', type: 'text', placeholder: 'Ex : Paiement client' },
                    { label: 'Montant (€)', field: 'amount', type: 'number', placeholder: '0.00 (négatif = dépense)' },
                    { label: 'Date', field: 'date', type: 'date', placeholder: '' },
                    { label: 'Catégorie', field: 'category', type: 'text', placeholder: 'Ex : Prestation, Logiciels…' },
                  ].map(({ label, field, type, placeholder }) => (
                    <div key={field} className="space-y-1">
                      <label className="text-xs font-bold text-muted uppercase tracking-wider">{label}</label>
                      <input
                        type={type}
                        placeholder={placeholder}
                        value={(form as Record<string, string>)[field]}
                        onChange={e => setForm(f => ({ ...f, [field]: e.target.value }))}
                        required={field !== 'category'}
                        className="w-full bg-[#1A1A1A] border border-[#333] rounded-xl px-4 py-3 text-white placeholder:text-muted/50 focus:outline-none focus:border-[#FF4D00] transition-all"
                      />
                    </div>
                  ))}
                  <div className="space-y-1">
                    <label className="text-xs font-bold text-muted uppercase tracking-wider">Type</label>
                    <select
                      value={form.type}
                      onChange={e => setForm(f => ({ ...f, type: e.target.value }))}
                      className="w-full bg-[#1A1A1A] border border-[#333] rounded-xl px-4 py-3 text-white focus:outline-none focus:border-[#FF4D00] transition-all appearance-none"
                    >
                      <option>Virement reçu</option>
                      <option>Prélèvement</option>
                      <option>Virement</option>
                      <option>Autre</option>
                    </select>
                  </div>
                  <button
                    type="submit"
                    className="w-full bg-[#FF4D00] text-white font-bold py-3.5 rounded-xl shadow-[0_4px_14px_rgba(255,77,0,0.4)] hover:scale-[1.02] active:scale-[0.98] transition-all mt-2"
                  >
                    Enregistrer
                  </button>
                </form>
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </div>
  );
};

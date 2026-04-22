import React, { useState } from 'react';
import { useApp } from '../context/AppContext';
import { Search } from 'lucide-react';

const fmtEur = (n: number) =>
  new Intl.NumberFormat('fr-FR', {
    style: 'currency',
    currency: 'EUR',
    minimumFractionDigits: 2,
  }).format(n);

const getStatusBadge = (type: string) => {
  switch (type) {
    case 'Income':
      return { label: 'Reçu', className: 'text-[#4CAF50] bg-[#1B5E20]/30' };
    case 'Expense':
      return { label: 'Payé', className: 'text-muted bg-[#1A1A1A] border border-[#2A2A2A]' };
    case 'Transfer':
      return { label: 'Virement', className: 'text-[#FF4D00] bg-[#FF4D00]/10' };
    case 'Withdrawal':
      return { label: 'Retrait', className: 'text-muted bg-[#1A1A1A] border border-[#2A2A2A]' };
    default:
      return { label: type, className: 'text-muted bg-[#1A1A1A] border border-[#2A2A2A]' };
  }
};

export const Transactions: React.FC = () => {
  const { recentTransactions } = useApp();
  const [search, setSearch] = useState('');

  const filtered = recentTransactions.filter(tx =>
    tx.name.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="space-y-6 animate-in fade-in duration-500">

      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <h1 className="text-2xl font-bold">Transactions History</h1>
        <div className="flex items-center gap-2">
           <div className="relative">
              <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-muted" />
              <input
                type="text"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Search history..."
                className="bg-[#1A1A1A] border border-[#2A2A2A] text-sm text-white rounded-lg pl-9 pr-4 py-2 focus:outline-none focus:border-[#FF4D00] transition-all placeholder:text-muted/50"
              />
            </div>
        </div>
      </div>

      <div className="bg-card border border-[#2A2A2A] rounded-3xl overflow-hidden">
        {filtered.length === 0 ? (
          <div className="py-20 text-center text-muted text-sm">
            Aucune transaction trouvée
          </div>
        ) : (
          <table className="w-full text-left text-sm">
            <thead className="bg-[#1A1A1A] text-muted border-b border-[#2A2A2A]">
              <tr>
                <th className="px-6 py-4 font-medium">Name</th>
                <th className="px-6 py-4 font-medium">Date</th>
                <th className="px-6 py-4 font-medium">Type</th>
                <th className="px-6 py-4 font-medium text-right">Amount</th>
                <th className="px-6 py-4 font-medium text-right">Status</th>
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
                  </tr>
                );
              })}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
};

import React from 'react';
import { useApp } from '../context/AppContext';
import { Filter, Download, Search } from 'lucide-react';

export const Transactions: React.FC = () => {
  const { recentTransactions } = useApp();

  return (
    <div className="space-y-6 animate-in fade-in duration-500">
      
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <h1 className="text-2xl font-bold">Transactions History</h1>
        <div className="flex items-center gap-2">
           <div className="relative">
              <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-muted" />
              <input 
                type="text" 
                placeholder="Search history..." 
                className="bg-[#1A1A1A] border border-[#2A2A2A] text-sm text-white rounded-lg pl-9 pr-4 py-2 focus:outline-none focus:border-[#FF4D00] transition-all placeholder:text-muted/50"
              />
            </div>
          <button className="flex items-center gap-2 px-3 py-2 bg-[#1A1A1A] border border-[#2A2A2A] rounded-lg text-sm font-medium text-white hover:bg-[#222]">
            <Filter size={16} /> Filter
          </button>
          <button className="flex items-center gap-2 px-3 py-2 bg-[#1A1A1A] border border-[#2A2A2A] rounded-lg text-sm font-medium text-white hover:bg-[#222]">
            <Download size={16} /> Export
          </button>
        </div>
      </div>

      <div className="bg-[#121212] border border-[#2A2A2A] rounded-3xl overflow-hidden">
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
            {recentTransactions.map((tx) => (
              <tr key={tx.id} className="hover:bg-[#1A1A1A]/50 transition-colors">
                <td className="px-6 py-4">
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 rounded-full bg-[#222] flex items-center justify-center font-bold text-xs">
                      {tx.avatar ? <img src={tx.avatar} className="w-full h-full rounded-full object-cover"/> : tx.name[0]}
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
                  {tx.amount > 0 ? '+' : ''}{new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' }).format(tx.amount)}
                </td>
                <td className="px-6 py-4 text-right">
                  <span className="text-xs font-bold text-[#4CAF50] bg-[#1B5E20]/30 px-2 py-1 rounded-md">Completed</span>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
};

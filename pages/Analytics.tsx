import React from 'react';
import { useApp } from '../context/AppContext';
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import { Calendar } from 'lucide-react';

export const Analytics: React.FC = () => {
  const { analyticsData, isLoading } = useApp();

  if (isLoading) return null;

  return (
    <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
      
      {/* HEADER CONTROLS */}
      <div className="flex items-center justify-between">
        <h1 className="text-3xl font-bold">Cash Flow</h1>
        
        <div className="flex items-center gap-4">
          <div className="bg-[#121212] border border-[#2A2A2A] rounded-xl p-1 flex">
            <button className="px-6 py-2 rounded-lg bg-[#FF4D00] text-white text-sm font-bold shadow-lg">
              Income
            </button>
            <button className="px-6 py-2 rounded-lg text-muted hover:text-white text-sm font-medium transition-colors">
              Expense
            </button>
          </div>

          <button className="bg-[#121212] border border-[#2A2A2A] text-white px-4 py-2.5 rounded-xl text-sm font-medium flex items-center gap-2 hover:border-[#FF4D00] transition-colors">
            <Calendar size={16} className="text-[#FF4D00]" />
            2026
          </button>
        </div>
      </div>

      {/* ANALYSIS CARD */}
      <div className="bg-card border border-[#2A2A2A] p-8 rounded-[32px] shadow-2xl">
        <div className="mb-8">
          <h2 className="text-xl font-bold mb-1">Analysis & Comparison</h2>
          <p className="text-muted text-sm">Track your income trends over the fiscal year.</p>
        </div>

        <div className="h-[400px] w-full">
          <ResponsiveContainer width="100%" height="100%">
            <AreaChart data={analyticsData} margin={{ top: 10, right: 0, left: -20, bottom: 0 }}>
              <defs>
                <linearGradient id="colorIncome" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#FF4D00" stopOpacity={0.4}/>
                  <stop offset="95%" stopColor="#FF4D00" stopOpacity={0}/>
                </linearGradient>
                <linearGradient id="colorExpense" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#888" stopOpacity={0.2}/>
                  <stop offset="95%" stopColor="#888" stopOpacity={0}/>
                </linearGradient>
              </defs>
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
                tick={{ fill: '#444', fontSize: 12 }} 
                tickFormatter={(value) => `$${value/1000}k`}
              />
              <Tooltip 
                contentStyle={{ backgroundColor: '#1A1A1A', border: '1px solid #333', borderRadius: '12px', color: '#fff' }}
              />
              <Area 
                type="monotone" 
                dataKey="expense" 
                stroke="#444" 
                strokeWidth={2}
                fillOpacity={1} 
                fill="url(#colorExpense)" 
              />
              <Area 
                type="monotone" 
                dataKey="income" 
                stroke="#FF4D00" 
                strokeWidth={3}
                fillOpacity={1} 
                fill="url(#colorIncome)" 
              />
            </AreaChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* SUMMARY */}
      <div className="grid grid-cols-3 gap-6">
        <div className="bg-[#121212] border border-[#2A2A2A] p-6 rounded-2xl">
          <div className="text-muted text-sm mb-2">Total Income</div>
          <div className="text-2xl font-bold">$12,400.00</div>
        </div>
        <div className="bg-[#121212] border border-[#2A2A2A] p-6 rounded-2xl">
          <div className="text-muted text-sm mb-2">Total Expense</div>
          <div className="text-2xl font-bold">$4,200.00</div>
        </div>
         <div className="bg-[#121212] border border-[#2A2A2A] p-6 rounded-2xl">
          <div className="text-muted text-sm mb-2">Net Savings</div>
          <div className="text-2xl font-bold text-[#FF4D00]">$8,200.00</div>
        </div>
      </div>
    </div>
  );
};

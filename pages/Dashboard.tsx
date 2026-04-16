import React from 'react';
import { useApp } from '../context/AppContext';
import { MoreHorizontal, Plus, ArrowUpRight, ArrowDownLeft } from 'lucide-react';
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, Cell, PieChart, Pie } from 'recharts';

const formatMoney = (amount: number) => {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
    minimumFractionDigits: 2,
  }).format(amount);
};

export const Dashboard: React.FC = () => {
  const { kpis, cashFlow, subscriptions, recentTransactions, expenseDistribution, isLoading } = useApp();

  if (isLoading) {
    return <div className="h-full flex items-center justify-center text-[#FF4D00]">Loading...</div>;
  }

  return (
    <div className="space-y-6 animate-in fade-in duration-500 pb-20">
      
      {/* HEADER: OVERVIEW */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <h2 className="text-2xl font-bold">Overview</h2>
          <div className="bg-[#1A1A1A] border border-[#2A2A2A] px-3 py-1.5 rounded-lg text-sm text-white flex items-center gap-2">
            <span className="w-4 h-3 bg-red-500 rounded-sm"></span>
            **** **** 3025
          </div>
        </div>
        <div className="flex items-center gap-3">
          <button className="flex items-center gap-2 px-4 py-2 rounded-full border border-[#2A2A2A] text-sm text-white hover:bg-[#1A1A1A] transition-colors">
            <span className="text-muted">@</span> Manage
          </button>
          <button className="flex items-center gap-2 px-4 py-2 rounded-full bg-[#FF4D00] text-sm font-bold text-white shadow-lg shadow-[#FF4D00]/20 hover:scale-105 transition-transform">
            <Plus size={16} /> Add Funds
          </button>
        </div>
      </div>

      {/* KPI GRID */}
      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-4">
        {kpis.map((kpi, index) => (
          <div key={index} className="bg-card border border-[#2A2A2A] p-6 rounded-3xl hover:border-[#FF4D00]/30 transition-colors group">
            <div className="flex justify-between items-start mb-4">
              <span className="text-muted text-sm font-medium">{kpi.title}</span>
              <button className="text-muted hover:text-white"><MoreHorizontal size={18} /></button>
            </div>
            <div className="flex items-end justify-between">
              <div className="text-2xl font-bold">{formatMoney(kpi.amount)}</div>
              <div className={`px-2 py-1 rounded-full text-xs font-bold ${kpi.trend > 0 ? 'bg-[#FF4D00] text-white' : 'bg-[#FF4D00]/10 text-[#FF4D00]'}`}>
                {kpi.trend > 0 ? '+' : ''}{kpi.trend}%
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* MAIN CONTENT GRID */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        
        {/* CASH FLOW CHART (2/3 width) */}
        <div className="lg:col-span-2 bg-card border border-[#2A2A2A] p-6 rounded-3xl">
          <div className="flex justify-between items-center mb-6">
            <div>
              <h3 className="text-muted text-sm font-medium mb-1">Cash Flow</h3>
              <div className="text-2xl font-bold">$236,788.12</div>
            </div>
            <div className="bg-[#1A1A1A] border border-[#2A2A2A] px-3 py-1.5 rounded-lg text-sm text-white">
              Yearly
            </div>
          </div>
          
          <div className="h-64 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={cashFlow}>
                <defs>
                  <linearGradient id="colorBar" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor="#FF4D00" />
                    <stop offset="100%" stopColor="#FF4D00" stopOpacity={0.6} />
                  </linearGradient>
                </defs>
                <XAxis 
                  dataKey="name" 
                  axisLine={false} 
                  tickLine={false} 
                  tick={{ fill: '#444', fontSize: 12 }} 
                  dy={10}
                />
                <Tooltip 
                  cursor={{ fill: '#ffffff05' }}
                  contentStyle={{ backgroundColor: '#1A1A1A', border: '1px solid #333', borderRadius: '12px', color: '#fff' }}
                />
                <Bar dataKey="value" radius={[6, 6, 6, 6]}>
                  {cashFlow.map((entry, index) => (
                    <Cell 
                      key={`cell-${index}`} 
                      fill={entry.name === 'Jul' ? 'url(#colorBar)' : '#2A2A2A'} 
                    />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* UPCOMING PAYMENTS (1/3 width) */}
        <div className="bg-card border border-[#2A2A2A] p-6 rounded-3xl flex flex-col">
          <div className="flex justify-between items-center mb-6">
            <h3 className="font-bold">Upcoming Payments</h3>
            <button className="p-1 hover:bg-[#1A1A1A] rounded-lg transition-colors"><Plus size={18} /></button>
          </div>
          
          <div className="space-y-4 flex-1">
            {subscriptions.map((sub) => (
              <div key={sub.id} className="bg-[#1A1A1A] p-4 rounded-2xl flex items-center justify-between group hover:border border border-transparent hover:border-[#FF4D00]/50 transition-all">
                <div className="flex items-center gap-3">
                  <div className={`w-10 h-10 rounded-xl flex items-center justify-center font-bold text-lg ${sub.name.includes('Netflix') ? 'bg-red-600 text-white' : 'bg-green-500 text-black'}`}>
                    {sub.name[0]}
                  </div>
                  <div>
                    <div className="font-bold text-sm">{sub.name}</div>
                    <div className="text-xs text-muted">{sub.nextPaymentDate}</div>
                  </div>
                </div>
                <div className="flex flex-col items-end">
                  <div className="font-bold text-sm">${sub.amount.toFixed(2)}</div>
                  <button className="text-[10px] bg-[#FF4D00] text-white px-2 py-0.5 rounded-md mt-1 opacity-0 group-hover:opacity-100 transition-opacity">
                    Scheduled
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* BOTTOM WIDGETS */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        
        {/* WEEKLY EXPENSE (Donut) */}
        <div className="bg-card border border-[#2A2A2A] p-6 rounded-3xl">
          <h3 className="font-bold mb-6">Weekly Expense</h3>
          <div className="flex items-center gap-6">
            <div className="w-32 h-32 relative">
               <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={expenseDistribution}
                    innerRadius={40}
                    outerRadius={60}
                    paddingAngle={5}
                    dataKey="value"
                    stroke="none"
                  >
                    {expenseDistribution.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={entry.color} />
                    ))}
                  </Pie>
                </PieChart>
              </ResponsiveContainer>
              {/* Center Text */}
              <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none">
                <span className="text-xs text-muted">TOTAL</span>
                <span className="text-lg font-bold">84%</span>
              </div>
            </div>
            
            <div className="space-y-3">
              {expenseDistribution.map((item) => (
                <div key={item.name} className="flex items-center gap-2 text-sm">
                  <div className="w-2 h-2 rounded-full" style={{ backgroundColor: item.color }}></div>
                  <span className="text-muted flex-1">{item.name}</span>
                  <span className="font-bold">{item.value}%</span>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* RECENT TRANSACTIONS (2/3 width) */}
        <div className="lg:col-span-2 bg-card border border-[#2A2A2A] p-6 rounded-3xl">
          <div className="flex justify-between items-center mb-6">
            <h3 className="font-bold">Recent Transactions</h3>
            <button className="text-xs border border-[#2A2A2A] px-2 py-1 rounded-lg">View All</button>
          </div>

          <div className="space-y-4">
            {recentTransactions.map((tx) => (
              <div key={tx.id} className="flex items-center justify-between py-2 border-b border-[#1A1A1A] last:border-0 hover:bg-[#1A1A1A] rounded-xl px-2 -mx-2 transition-colors">
                <div className="flex items-center gap-4">
                  <div className="w-10 h-10 rounded-full bg-[#1A1A1A] border border-[#2A2A2A] overflow-hidden flex items-center justify-center">
                    {tx.avatar ? <img src={tx.avatar} className="w-full h-full object-cover" /> : <div className="text-[#FF4D00] font-bold">{tx.name[0]}</div>}
                  </div>
                  <div>
                    <div className="font-bold text-sm text-white">{tx.name}</div>
                    <div className="text-xs text-muted">{tx.type}</div>
                  </div>
                </div>
                
                <div className="flex items-center gap-8">
                  <div className="text-sm font-bold text-white w-24 text-right">
                     {tx.amount > 0 ? '+' : ''}{formatMoney(tx.amount)}
                  </div>
                  <div className="text-xs text-muted hidden sm:block w-32 text-right">{tx.date}</div>
                  <button className="text-muted hover:text-white"><MoreHorizontal size={16} /></button>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};

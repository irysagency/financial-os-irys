import React from 'react';
import { useApp } from '../context/AppContext';
import { Project, ProjectStatus } from '../types';
import { Plus, MoreHorizontal, Calendar, DollarSign } from 'lucide-react';

const StatusBadge = ({ status }: { status: ProjectStatus }) => {
  const styles = {
    'LEAD': 'bg-slate-100 text-slate-600',
    'SIGNED': 'bg-blue-100 text-blue-700',
    'IN_PROGRESS': 'bg-indigo-100 text-indigo-700',
    'COMPLETED': 'bg-emerald-100 text-emerald-700',
    'PAID': 'bg-gray-100 text-gray-500 line-through decoration-gray-400'
  };

  return (
    <span className={`px-2.5 py-0.5 rounded-full text-xs font-semibold ${styles[status]}`}>
      {status.replace('_', ' ')}
    </span>
  );
};

export const Projects: React.FC = () => {
  const { projects, clients, currentOrg } = useApp();

  const getClientName = (clientId: string) => {
    return clients.find(c => c.id === clientId)?.name || 'Unknown Client';
  };

  const getProfitMargin = (project: Project) => {
    if (project.budget === 0) return 0;
    return Math.round(((project.budget - project.expenses) / project.budget) * 100);
  };

  return (
    <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
      
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Projects</h1>
          <p className="text-slate-500">Manage workflow and profitability</p>
        </div>
        <button className="flex items-center gap-2 bg-indigo-600 text-white px-4 py-2 rounded-lg hover:bg-indigo-700 transition-colors shadow-lg shadow-indigo-600/20 font-medium text-sm">
          <Plus size={16} /> New Project
        </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {projects.map((project) => (
          <div key={project.id} className="bg-white rounded-xl border border-slate-200 p-5 hover:shadow-lg transition-all group">
            <div className="flex justify-between items-start mb-4">
              <StatusBadge status={project.status} />
              <button className="text-slate-400 hover:text-indigo-600">
                <MoreHorizontal size={20} />
              </button>
            </div>
            
            <h3 className="font-bold text-lg text-slate-900 mb-1">{project.name}</h3>
            <p className="text-sm text-slate-500 mb-4">{getClientName(project.clientId)}</p>
            
            <div className="space-y-3 mb-6">
              <div className="flex justify-between items-center text-sm">
                <span className="flex items-center gap-2 text-slate-500">
                  <DollarSign size={14} /> Budget
                </span>
                <span className="font-semibold text-slate-900">
                  {new Intl.NumberFormat('en-US', { style: 'currency', currency: currentOrg?.currency }).format(project.budget)}
                </span>
              </div>
              <div className="flex justify-between items-center text-sm">
                <span className="flex items-center gap-2 text-slate-500">
                  <Calendar size={14} /> Start Date
                </span>
                <span className="text-slate-700">{new Date(project.startDate).toLocaleDateString()}</span>
              </div>
            </div>

            <div className="pt-4 border-t border-slate-100">
              <div className="flex justify-between items-end">
                <div className="text-xs font-medium text-slate-400">Net Margin</div>
                <div className={`text-xl font-bold ${getProfitMargin(project) > 50 ? 'text-emerald-600' : 'text-amber-500'}`}>
                  {getProfitMargin(project)}%
                </div>
              </div>
              <div className="w-full bg-slate-100 rounded-full h-1.5 mt-2">
                <div 
                  className={`h-1.5 rounded-full ${getProfitMargin(project) > 50 ? 'bg-emerald-500' : 'bg-amber-400'}`} 
                  style={{ width: `${getProfitMargin(project)}%` }}
                ></div>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

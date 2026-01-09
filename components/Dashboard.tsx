import React, { useMemo, useState } from 'react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, LineChart, Line, AreaChart, Area } from 'recharts';
import { Project, Allocation, Role, TeamMember } from '../types';
import { getBusinessHoursInMonth, formatCurrency, getMonthName } from '../utils';
import { Loader2, Sparkles, TrendingUp, Users, Wallet } from 'lucide-react';
import { analyzeResourceForecast } from '../services/geminiService';

interface DashboardProps {
  projects: Project[];
  allocations: Allocation[];
  roles: Role[];
  members: TeamMember[];
}

const Dashboard: React.FC<DashboardProps> = ({ projects, allocations, roles, members }) => {
  const [aiAnalysis, setAiAnalysis] = useState<string | null>(null);
  const [isAnalyzing, setIsAnalyzing] = useState(false);

  // Calculate Monthly Financials
  const financialData = useMemo(() => {
    // Explicitly casting the array to string[] to resolve type mismatch with TypeScript
    const months: string[] = (Array.from(new Set(allocations.map(a => a.month))) as string[]).sort();
    
    return months.map(month => {
      let totalCost = 0;
      const hoursInMonth = getBusinessHoursInMonth(month);

      allocations.filter(a => a.month === month).forEach(alloc => {
        const member = members.find(m => m.id === alloc.memberId);
        const role = member ? roles.find(r => r.id === member.roleId) : null;
        
        if (member && role) {
          const hours = hoursInMonth * (alloc.percentage / 100);
          totalCost += hours * role.defaultHourlyRate;
        }
      });

      return {
        month: getMonthName(month),
        cost: totalCost,
        // Mock revenue for demonstration (Cost + 30% margin)
        revenue: totalCost * 1.3,
        hours: hoursInMonth
      };
    });
  }, [allocations, members, roles]);

  const totalForecastCost = financialData.reduce((acc, curr) => acc + curr.cost, 0);

  const handleRunAnalysis = async () => {
    setIsAnalyzing(true);
    const result = await analyzeResourceForecast({ projects, members, roles, allocations });
    setAiAnalysis(result);
    setIsAnalyzing(false);
  };

  return (
    <div className="space-y-6 animate-in fade-in duration-500">
      
      {/* Top Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="bg-white p-6 rounded-xl shadow-sm border border-slate-100 flex items-center justify-between">
          <div>
            <p className="text-sm font-medium text-slate-500">Total Forecast Cost</p>
            <h3 className="text-2xl font-bold text-slate-800">{formatCurrency(totalForecastCost)}</h3>
          </div>
          <div className="p-3 bg-emerald-100 rounded-full text-emerald-600">
            <Wallet size={24} />
          </div>
        </div>
        <div className="bg-white p-6 rounded-xl shadow-sm border border-slate-100 flex items-center justify-between">
          <div>
            <p className="text-sm font-medium text-slate-500">Active Projects</p>
            <h3 className="text-2xl font-bold text-slate-800">{projects.length}</h3>
          </div>
          <div className="p-3 bg-blue-100 rounded-full text-blue-600">
            <TrendingUp size={24} />
          </div>
        </div>
        <div className="bg-white p-6 rounded-xl shadow-sm border border-slate-100 flex items-center justify-between">
          <div>
            <p className="text-sm font-medium text-slate-500">Team Members</p>
            <h3 className="text-2xl font-bold text-slate-800">{members.length}</h3>
          </div>
          <div className="p-3 bg-indigo-100 rounded-full text-indigo-600">
            <Users size={24} />
          </div>
        </div>
      </div>

      {/* Charts Row */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Cost Forecast */}
        <div className="bg-white p-6 rounded-xl shadow-sm border border-slate-100">
          <h3 className="text-lg font-semibold text-slate-800 mb-4">Cost Forecast</h3>
          <div className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={financialData}>
                <defs>
                  <linearGradient id="colorCost" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#8884d8" stopOpacity={0.8}/>
                    <stop offset="95%" stopColor="#8884d8" stopOpacity={0}/>
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e2e8f0" />
                <XAxis dataKey="month" axisLine={false} tickLine={false} />
                <YAxis axisLine={false} tickLine={false} tickFormatter={(val) => `$${val/1000}k`} />
                <Tooltip formatter={(value: number) => formatCurrency(value)} />
                <Area type="monotone" dataKey="cost" stroke="#8884d8" fillOpacity={1} fill="url(#colorCost)" />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* AI Analysis Section */}
        <div className="bg-white p-6 rounded-xl shadow-sm border border-slate-100 flex flex-col">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-semibold text-slate-800 flex items-center gap-2">
              <Sparkles size={20} className="text-amber-500" />
              AI Insight
            </h3>
            <button
              onClick={handleRunAnalysis}
              disabled={isAnalyzing}
              className="px-3 py-1.5 bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-medium rounded-lg transition-colors flex items-center gap-2"
            >
              {isAnalyzing ? <Loader2 size={14} className="animate-spin" /> : "Analyze Risks"}
            </button>
          </div>
          
          <div className="flex-1 bg-slate-50 rounded-lg p-4 overflow-y-auto max-h-[250px] border border-slate-100">
            {aiAnalysis ? (
              <div className="prose prose-sm prose-slate">
                <div className="whitespace-pre-wrap text-slate-700 text-sm">{aiAnalysis}</div>
              </div>
            ) : (
              <div className="h-full flex flex-col items-center justify-center text-slate-400">
                <p className="text-center text-sm">Run analysis to identify resource bottlenecks <br/> and cost optimizations.</p>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default Dashboard;
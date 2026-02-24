// Removed unused imports
import { useState, useEffect } from 'react';
import {
    Ticket, Users, TrendingUp, AlertCircle, ArrowRight, Clock, RefreshCw, Plus
} from 'lucide-react';
import { useTabs } from '../context/TabContext';
import { cn } from '../lib/utils';
import {
    AreaChart, Area, XAxis, Tooltip, ResponsiveContainer, CartesianGrid, YAxis,
    BarChart, Bar, Cell
} from 'recharts';

interface StatCardProps {
    title: string;
    value: string;
    icon: React.ElementType;
    colorClass: string;
    trend?: string;
}

function StatCard({ title, value, icon: Icon, colorClass, trend }: StatCardProps) {
    return (
        <div className="glass-card p-6 group relative overflow-hidden transition-all duration-300 hover:shadow-xl hover:shadow-indigo-500/5 hover:-translate-y-1">
            {/* Background Accent Blob */}
            <div className={cn(
                "absolute -right-6 -bottom-6 w-32 h-32 rounded-full opacity-10 blur-2xl transition-all duration-500 group-hover:scale-150 group-hover:opacity-20",
                colorClass.split(' ')[0] // Take the bg color part
            )} />

            <div className="absolute top-0 right-0 p-4 opacity-5 group-hover:opacity-10 transition-all duration-500 group-hover:rotate-12 group-hover:scale-110">
                <Icon className="w-24 h-24" />
            </div>

            <div className="relative z-10 flex justify-between items-start">
                <div className="space-y-1">
                    <p className="text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider">{title}</p>
                    <div className="flex items-baseline gap-2">
                        <span className="text-4xl font-extrabold text-slate-900 dark:text-white tracking-tight">{value}</span>
                    </div>
                    {trend && (
                        <div className="flex items-center gap-1.5 mt-2">
                            <span className="flex items-center justify-center w-5 h-5 rounded-full bg-emerald-100 dark:bg-emerald-500/20 text-emerald-600 dark:text-emerald-400">
                                <TrendingUp className="w-3 h-3" />
                            </span>
                            <span className="text-xs text-emerald-600 dark:text-emerald-400 font-bold">{trend}</span>
                        </div>
                    )}
                </div>
                <div className={cn(
                    "p-3 rounded-2xl shadow-sm transition-all duration-300 group-hover:scale-110 group-hover:shadow-md",
                    colorClass
                )}>
                    <Icon className="w-6 h-6" />
                </div>
            </div>
        </div>
    );
}

export default function Dashboard() {
    const { updateTabPath, activeTabId } = useTabs();
    const [stats, setStats] = useState<any>(null);
    const [loading, setLoading] = useState(true);

    const fetchStats = async () => {
        setLoading(true);
        try {
            // Path: src/pages/Dashboard.tsx
            // Using client-side stats aggregation
            const { getDashboardStats } = await import('../lib/stats');
            const data = await getDashboardStats();
            setStats(data);
        } catch (err) {
            console.error('Error fetching dashboard stats:', err);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchStats();
    }, []);

    const handleRefresh = () => {
        fetchStats();
    };

    if (loading) {
        return (
            <div className="h-[80vh] flex items-center justify-center">
                <div className="space-y-4 text-center">
                    <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600 mx-auto"></div>
                    <p className="text-slate-500 dark:text-slate-400 text-sm animate-pulse">Loading Dashboard...</p>
                </div>
            </div>
        );
    }

    const { total, pending, resolved, recent, chart, activeCustomers } = stats || {};

    // Transform chart data for Recharts if needed, or use as is if API returns compatible format
    // Transform data for Recharts
    const chartData = chart?.map((d: any) => ({ name: d.date, value: d.count })) || [];
    const priorityData = stats?.priority_counts?.map((p: any) => ({ name: p.Priority, value: p.count })) || [];
    // const typeData = stats?.type_counts?.map((t: any) => ({ name: t.Complaint_Name || 'Other', value: t.count })) || [];
    const avgResolution = stats?.avg_resolution_hours || 0;

    const PRIORITY_COLORS = {
        'high': '#ef4444',
        'urgent': '#dc2626',
        'medium': '#f59e0b',
        'low': '#10b981'
    };

    return (
        <div className="space-y-8 fade-in p-2 pb-10">
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-3xl font-bold text-slate-900 dark:text-white tracking-tight font-display">Dashboard</h1>
                    <p className="text-slate-500 dark:text-slate-400 text-sm mt-1">Overview of your support performance.</p>
                </div>
                <div className="flex items-center gap-3">
                    <button
                        onClick={() => updateTabPath(activeTabId, '/tickets/new', 'New Ticket')}
                        className="flex items-center gap-2 px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl font-bold shadow-lg shadow-indigo-100 dark:shadow-none transition-all active:scale-95 group text-sm"
                    >
                        <Plus className="w-4 h-4 group-hover:rotate-90 transition-transform duration-300" />
                        <span>New Ticket</span>
                    </button>
                    <button
                        onClick={handleRefresh}
                        disabled={loading}
                        className="glass-btn-refresh group"
                        title="Refresh Dashboard"
                    >
                        <RefreshCw className={`w-5 h-5 ${loading ? 'animate-spin text-indigo-600' : 'group-hover:rotate-180 transition-transform duration-700'}`} />
                    </button>
                </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                <StatCard
                    title="Total Tickets"
                    value={String(total || 0)}
                    icon={Ticket}
                    colorClass="bg-indigo-50 text-indigo-600 dark:bg-indigo-500/20 dark:text-indigo-400 border border-indigo-100/50 dark:border-indigo-500/20"
                    trend="+12% vs last month"
                />
                <StatCard
                    title="Active Customers"
                    value={String(activeCustomers || 0)}
                    icon={Users}
                    colorClass="bg-violet-50 text-violet-600 dark:bg-violet-500/20 dark:text-violet-400 border border-violet-100/50 dark:border-violet-500/20"
                />
                <StatCard
                    title="Pending Tickets"
                    value={String(pending || 0)}
                    icon={AlertCircle}
                    colorClass="bg-amber-50 text-amber-600 dark:bg-amber-500/20 dark:text-amber-400 border border-amber-100/50 dark:border-amber-500/20"
                />
                <StatCard
                    title="Resolution Rate"
                    value={`${total ? Math.round((resolved / total) * 100) : 0}%`}
                    icon={TrendingUp}
                    colorClass="bg-emerald-50 text-emerald-600 dark:bg-emerald-500/20 dark:text-emerald-400 border border-emerald-100/50 dark:border-emerald-500/20"
                    trend="+5.2%"
                />
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                <div className="lg:col-span-2 glass-card p-6 group">
                    <div className="flex items-center justify-between mb-8">
                        <div>
                            <h3 className="text-lg font-bold text-slate-900 dark:text-white flex items-center gap-2">
                                <TrendingUp className="w-5 h-5 text-indigo-600" />
                                Ticket Volume
                            </h3>
                            <p className="text-xs text-slate-500 dark:text-slate-400 font-medium">Daily ticket creation trends</p>
                        </div>
                        <div className="flex gap-2">
                            <span className="flex items-center gap-1.5 px-3 py-1 rounded-full bg-slate-100 dark:bg-slate-800 text-[10px] font-bold text-slate-600 dark:text-slate-400 uppercase tracking-wider border border-slate-200 dark:border-slate-700">
                                Last 30 Days
                            </span>
                        </div>
                    </div>
                    <div className="h-80 w-full transition-all duration-500">
                        <ResponsiveContainer width="100%" height="100%">
                            <AreaChart data={chartData} margin={{ top: 10, right: 10, left: -25, bottom: 0 }}>
                                <defs>
                                    <linearGradient id="colorValue" x1="0" y1="0" x2="0" y2="1">
                                        <stop offset="5%" stopColor="#6366f1" stopOpacity={0.15} />
                                        <stop offset="95%" stopColor="#6366f1" stopOpacity={0} />
                                    </linearGradient>
                                </defs>
                                <CartesianGrid strokeDasharray="6 6" stroke="#e2e8f0" vertical={false} className="dark:stroke-slate-800" />
                                <XAxis
                                    dataKey="name"
                                    stroke="#94a3b8"
                                    axisLine={false}
                                    tickLine={false}
                                    tickMargin={15}
                                    tick={{ fontSize: 10, fontWeight: 600 }}
                                />
                                <YAxis
                                    stroke="#94a3b8"
                                    axisLine={false}
                                    tickLine={false}
                                    tickMargin={10}
                                    tick={{ fontSize: 10, fontWeight: 600 }}
                                />
                                <Tooltip
                                    contentStyle={{
                                        borderRadius: '16px',
                                        border: '1px solid rgba(226, 232, 240, 0.5)',
                                        boxShadow: '0 20px 25px -5px rgba(0, 0, 0, 0.1), 0 10px 10px -5px rgba(0, 0, 0, 0.04)',
                                        backgroundColor: 'rgba(255, 255, 255, 0.95)',
                                        backdropFilter: 'blur(8px)',
                                        padding: '12px'
                                    }}
                                    itemStyle={{ fontSize: '12px', fontWeight: 600, color: '#4f46e5' }}
                                    labelStyle={{ fontSize: '10px', color: '#64748b', marginBottom: '4px', textTransform: 'uppercase', fontWeight: 700 }}
                                    cursor={{ stroke: '#6366f1', strokeWidth: 1.5, strokeDasharray: '4 4' }}
                                />
                                <Area
                                    type="monotone"
                                    dataKey="value"
                                    stroke="#6366f1"
                                    strokeWidth={4}
                                    fillOpacity={1}
                                    fill="url(#colorValue)"
                                    animationDuration={1500}
                                />
                            </AreaChart>
                        </ResponsiveContainer>
                    </div>
                </div>

                <div className="glass-card flex flex-col overflow-hidden border border-slate-200/50 dark:border-slate-800/50">
                    <div className="p-6 border-b border-slate-100 dark:border-slate-800 flex items-center justify-between bg-slate-50/50 dark:bg-slate-900/50 backdrop-blur-sm">
                        <div className="flex items-center gap-2.5">
                            <div className="w-8 h-8 rounded-lg bg-indigo-50 dark:bg-indigo-500/10 flex items-center justify-center">
                                <AlertCircle className="w-4 h-4 text-indigo-600 dark:text-indigo-400" />
                            </div>
                            <h3 className="text-lg font-bold text-slate-900 dark:text-white">Recent Activity</h3>
                        </div>
                        <button
                            onClick={() => updateTabPath(activeTabId, '/tickets', 'Tickets')}
                            className="text-indigo-600 dark:text-indigo-400 text-xs font-bold hover:underline flex items-center gap-1 group/btn"
                        >
                            View All <ArrowRight className="w-3 h-3 group-hover/btn:translate-x-0.5 transition-transform" />
                        </button>
                    </div>
                    <div className="flex-1 overflow-y-auto max-h-[400px] custom-scrollbar">
                        <div className="divide-y divide-slate-100 dark:divide-slate-800/50">
                            {recent?.map((ticket: any) => (
                                <div key={ticket.Ticket_ID} className="p-5 hover:bg-slate-50 dark:hover:bg-slate-800/30 transition-all cursor-pointer group relative">
                                    <div className="absolute left-0 top-0 bottom-0 w-1 bg-indigo-600 scale-y-0 group-hover:scale-y-100 transition-transform origin-top duration-300" />

                                    <div className="flex items-start justify-between mb-3">
                                        <div className="flex-1 min-w-0 pr-4">
                                            <span className="block font-black text-slate-900 dark:text-white text-sm group-hover:text-indigo-600 dark:group-hover:text-indigo-400 transition-colors truncate tracking-tight">
                                                {ticket.Subject}
                                            </span>
                                            <div className="flex items-center gap-2 mt-0.5">
                                                <span className="text-[9px] font-black text-slate-400 dark:text-slate-500 uppercase tracking-tighter">
                                                    #{ticket.Ticket_No || ticket.Ticket_ID}
                                                </span>
                                                <span className="w-1 h-1 rounded-full bg-slate-300 dark:bg-slate-700" />
                                                <span className="text-[9px] font-bold text-slate-400 dark:text-slate-500 uppercase">
                                                    {ticket.Complaint_Name}
                                                </span>
                                            </div>
                                        </div>
                                        <span className={cn(
                                            "text-[9px] font-black px-2 py-1 rounded-md uppercase tracking-wider shadow-sm border whitespace-nowrap",
                                            ticket.Status === 'Open' ? 'bg-blue-50 dark:bg-blue-900/30 text-blue-700 dark:text-blue-300 border-blue-100 dark:border-blue-800/50' :
                                                ticket.Status === 'In Progress' ? 'bg-amber-50 dark:bg-amber-900/30 text-amber-700 dark:text-amber-300 border-amber-100 dark:border-amber-800/50' :
                                                    ticket.Status === 'Resolved' ? 'bg-emerald-50 dark:bg-emerald-900/30 text-emerald-700 dark:text-emerald-300 border-emerald-100 dark:border-emerald-800/50' :
                                                        'bg-slate-50 dark:bg-slate-800 text-slate-700 dark:text-slate-300 border-slate-100 dark:border-slate-700'
                                        )}>
                                            {ticket.Status}
                                        </span>
                                    </div>

                                    <div className="flex items-center justify-between">
                                        <div className="flex items-center gap-6">
                                            <div className="flex items-center gap-1.5 min-w-[120px]">
                                                <div className="w-5 h-5 rounded-full bg-slate-100 dark:bg-slate-800 flex items-center justify-center">
                                                    <Users className="w-3 h-3 text-slate-400" />
                                                </div>
                                                <span className="text-[11px] text-slate-600 dark:text-slate-400 font-bold truncate">
                                                    {ticket.Customer_Name}
                                                </span>
                                            </div>
                                            {ticket.Closed_By_Name && (
                                                <div className="flex items-center gap-1.5">
                                                    <div className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
                                                    <span className="text-[10px] text-slate-500 font-bold uppercase tracking-tight">
                                                        Closed by {ticket.Closed_By_Name}
                                                    </span>
                                                </div>
                                            )}
                                        </div>
                                        <span className="flex items-center gap-1.5 text-[10px] text-slate-400 dark:text-slate-500 font-black uppercase tracking-tighter">
                                            <Clock className="w-3 h-3" />
                                            {new Date(ticket.Created_At).toLocaleDateString(undefined, { month: 'short', day: 'numeric' })}
                                        </span>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>
                </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 pb-6 mt-6">
                <div className="glass-card p-6 overflow-hidden">
                    <h3 className="text-lg font-black text-slate-900 dark:text-white mb-6 flex items-center gap-2">
                        <AlertCircle className="w-5 h-5 text-indigo-600" />
                        Priority Distribution
                    </h3>
                    <div className="h-64 w-full">
                        <ResponsiveContainer width="100%" height="100%">
                            <BarChart data={priorityData}>
                                <XAxis dataKey="name" tick={{ fontSize: 10, fontWeight: 700 }} axisLine={false} tickLine={false} />
                                <YAxis hide />
                                <Tooltip
                                    cursor={{ fill: 'rgba(99, 102, 241, 0.05)' }}
                                    contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }}
                                />
                                <Bar dataKey="value" radius={[6, 6, 0, 0]} barSize={40}>
                                    {priorityData.map((entry: any, index: number) => (
                                        <Cell
                                            key={`cell-${index}`}
                                            fill={PRIORITY_COLORS[entry.name.toLowerCase() as keyof typeof PRIORITY_COLORS] || '#6366f1'}
                                        />
                                    ))}
                                </Bar>
                            </BarChart>
                        </ResponsiveContainer>
                    </div>
                </div>

                <div className="glass-card p-6 overflow-hidden flex flex-col justify-center items-center text-center group">
                    <div className="w-16 h-16 rounded-2xl bg-indigo-50 dark:bg-indigo-500/10 flex items-center justify-center mb-4 transition-transform group-hover:scale-110 group-hover:rotate-3">
                        <Clock className="w-8 h-8 text-indigo-600" />
                    </div>
                    <h3 className="text-sm font-black text-slate-500 dark:text-slate-400 uppercase tracking-widest mb-1">Avg Resolution Time</h3>
                    <div className="text-5xl font-black text-slate-900 dark:text-white tracking-tighter mb-2">
                        {avgResolution} <span className="text-lg text-slate-400 uppercase">hrs</span>
                    </div>
                    <p className="text-xs text-slate-500 font-bold max-w-[200px]">From initial creation to resolution status</p>
                </div>
            </div>
        </div>
    );
}

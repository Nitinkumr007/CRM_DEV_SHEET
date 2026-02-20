// Removed unused imports
import { useState, useEffect } from 'react';
import { Ticket, Users, TrendingUp, AlertCircle, ArrowRight } from 'lucide-react';
import { cn } from '../lib/utils';
import {
    AreaChart, Area, XAxis, Tooltip, ResponsiveContainer, CartesianGrid, YAxis
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
        <div className="glass-card p-6 group relative overflow-hidden">
            <div className="absolute top-0 right-0 p-4 opacity-5 group-hover:opacity-10 transition-opacity">
                <Icon className="w-24 h-24" />
            </div>
            <div className="relative z-10 flex justify-between items-start">
                <div>
                    <p className="text-sm font-medium text-slate-500 dark:text-slate-400">{title}</p>
                    <div className="mt-2 flex items-baseline gap-2">
                        <span className="text-3xl font-bold text-slate-900 dark:text-white tracking-tight">{value}</span>
                        {trend && <span className="text-xs text-emerald-600 dark:text-emerald-400 font-medium">{trend}</span>}
                    </div>
                </div>
                <div className={cn("p-3 rounded-xl bg-opacity-10 dark:bg-opacity-20 backdrop-blur-sm transition-colors", colorClass)}>
                    <Icon className="w-5 h-5 opacity-90" />
                </div>
            </div>
        </div>
    );
}

export default function Dashboard() {
    const [stats, setStats] = useState<any>(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const fetchStats = async () => {
            try {
                const res = await fetch('/api/tickets/stats');
                const data = await res.json();
                setStats(data);
            } catch (err) {
                console.error('Error fetching dashboard stats:', err);
            } finally {
                setLoading(false);
            }
        };
        fetchStats();
    }, []);

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
    const chartData = chart?.map((d: any) => ({ name: d.date, value: d.count })) || [];

    return (
        <div className="space-y-8 fade-in p-2 pb-10">
            <div>
                <h1 className="text-3xl font-bold text-slate-900 dark:text-white tracking-tight font-display">Dashboard</h1>
                <p className="text-slate-500 dark:text-slate-400 text-sm mt-1">Overview of your support performance.</p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-5">
                <StatCard
                    title="Total Tickets"
                    value={String(total || 0)}
                    icon={Ticket}
                    colorClass="bg-indigo-100 text-indigo-600 dark:bg-indigo-500/20 dark:text-indigo-400"
                    trend="+12% from last month"
                />
                <StatCard
                    title="Active Customers"
                    value={String(activeCustomers || 0)}
                    icon={Users}
                    colorClass="bg-purple-100 text-purple-600 dark:bg-purple-500/20 dark:text-purple-400"
                />
                <StatCard
                    title="Pending Tickets"
                    value={String(pending || 0)}
                    icon={AlertCircle}
                    colorClass="bg-orange-100 text-orange-600 dark:bg-orange-500/20 dark:text-orange-400"
                />
                <StatCard
                    title="Resolution Rate"
                    value={`${total ? Math.round((resolved / total) * 100) : 0}%`}
                    icon={TrendingUp}
                    colorClass="bg-emerald-100 text-emerald-600 dark:bg-emerald-500/20 dark:text-emerald-400"
                    trend="+5.2%"
                />
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                <div className="lg:col-span-2 glass-card p-6">
                    <div className="flex items-center justify-between mb-8">
                        <div>
                            <h3 className="text-lg font-semibold text-slate-900 dark:text-white">Ticket Volume</h3>
                            <p className="text-xs text-slate-500 dark:text-slate-400">Tickets created over time</p>
                        </div>
                    </div>
                    <div className="h-80 w-full">
                        <ResponsiveContainer width="100%" height="100%">
                            <AreaChart data={chartData} margin={{ top: 10, right: 10, left: -25, bottom: 0 }}>
                                <defs>
                                    <linearGradient id="colorValue" x1="0" y1="0" x2="0" y2="1">
                                        <stop offset="5%" stopColor="#6366f1" stopOpacity={0.3} />
                                        <stop offset="95%" stopColor="#6366f1" stopOpacity={0} />
                                    </linearGradient>
                                </defs>
                                <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" vertical={false} className="dark:stroke-slate-700/50" />
                                <XAxis
                                    dataKey="name"
                                    stroke="#94a3b8"
                                    axisLine={false}
                                    tickLine={false}
                                    tickMargin={10}
                                    tick={{ fontSize: 12 }}
                                />
                                <YAxis
                                    stroke="#94a3b8"
                                    axisLine={false}
                                    tickLine={false}
                                    tick={{ fontSize: 12 }}
                                />
                                <Tooltip
                                    contentStyle={{
                                        borderRadius: '12px',
                                        border: 'none',
                                        boxShadow: '0 10px 15px -3px rgba(0, 0, 0, 0.1)',
                                        backgroundColor: 'rgba(255, 255, 255, 0.9)',
                                        color: '#1e293b'
                                    }}
                                    cursor={{ stroke: '#6366f1', strokeWidth: 1, strokeDasharray: '4 4' }}
                                />
                                <Area
                                    type="monotone"
                                    dataKey="value"
                                    stroke="#6366f1"
                                    strokeWidth={3}
                                    fillOpacity={1}
                                    fill="url(#colorValue)"
                                />
                            </AreaChart>
                        </ResponsiveContainer>
                    </div>
                </div>

                <div className="glass-card flex flex-col overflow-hidden">
                    <div className="p-6 border-b border-slate-100 dark:border-slate-800 flex items-center justify-between bg-slate-50/50 dark:bg-slate-900/50 backdrop-blur-sm">
                        <h3 className="text-lg font-semibold text-slate-900 dark:text-white">Recent Activity</h3>
                        <button className="text-indigo-600 dark:text-indigo-400 text-xs font-semibold hover:underline flex items-center gap-1">
                            View All <ArrowRight className="w-3 h-3" />
                        </button>
                    </div>
                    <div className="flex-1 overflow-y-auto max-h-[400px]">
                        <div className="divide-y divide-slate-100 dark:divide-slate-800">
                            {recent?.map((ticket: any) => (
                                <div key={ticket.Ticket_ID} className="p-4 hover:bg-slate-50 dark:hover:bg-slate-800/50 transition-colors cursor-pointer group">
                                    <div className="flex items-center justify-between mb-1">
                                        <span className="font-medium text-slate-800 dark:text-slate-200 text-sm group-hover:text-indigo-600 dark:group-hover:text-indigo-400 transition-colors truncate pr-2">{ticket.Subject}</span>
                                        <span className={cn(
                                            "text-[10px] font-bold px-2 py-0.5 rounded-full uppercase tracking-wide border",
                                            ticket.Status === 'Open' ? 'bg-blue-50 dark:bg-blue-900/20 text-blue-700 dark:text-blue-300 border-blue-100 dark:border-blue-800' :
                                                ticket.Status === 'In Progress' ? 'bg-indigo-50 dark:bg-indigo-900/20 text-indigo-700 dark:text-indigo-300 border-indigo-100 dark:border-indigo-800' :
                                                    ticket.Status === 'Resolved' ? 'bg-emerald-50 dark:bg-emerald-900/20 text-emerald-700 dark:text-emerald-300 border-emerald-100 dark:border-emerald-800' :
                                                        'bg-slate-50 dark:bg-slate-800 text-slate-700 dark:text-slate-300 border-slate-100 dark:border-slate-700'
                                        )}>
                                            {ticket.Status}
                                        </span>
                                    </div>
                                    <div className="flex items-center justify-between mt-2">
                                        <span className="text-xs text-slate-500 dark:text-slate-400 font-medium flex items-center gap-1">
                                            <Users className="w-3 h-3" />
                                            {ticket.Customer_Name}
                                        </span>
                                        <span className="flex items-center gap-1 text-[10px] text-slate-400 dark:text-slate-500 font-mono">
                                            {new Date(ticket.Created_At).toLocaleDateString()}
                                        </span>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}

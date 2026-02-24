import { useState, useEffect } from 'react';
import {
    BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
    PieChart, Pie, Cell, Legend
} from 'recharts';
import { Calendar, Search, Download, FileText, Users, Shield, Workflow, UserCheck } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { useTickets } from '../context/TicketContext';
// import {
//     calculateTicketVolumeByDay,
//     calculateStatusDistribution,
//     calculatePriorityDistribution,
//     calculateCategoryDistribution
// } from '../lib/analytics';

// Define LoginLog type based on usage
interface LoginLog {
    Login_ID: number;
    Login_Time: string;
    Full_Name: string;
    User_Code: string;
    Login_Status: string;
    IP_Address?: string;
    Device_Info?: string;
}

interface PerformanceData {
    Full_Name: string;
    Resolved_Tickets: number;
    Open_Tickets: number;
    Total_Assigned: number;
    Avg_Resolution_Hours: number | null;
}

interface SLAData {
    Ticket_No: string;
    Subject: string;
    Assigned_To: string;
    sla_hours: number;
    Hours_Open: number;
    SLA_Status: 'Within SLA' | 'Breached';
}

const initialLoginLogs: LoginLog[] = [];

export default function Reports() {
    // ... (keep existing imports)
    // New state for new reports
    const [performanceData, setPerformanceData] = useState<PerformanceData[]>([]);
    const [slaData, setSlaData] = useState<SLAData[]>([]);
    const [activeTab, setActiveTab] = useState<'overview' | 'data' | 'performance' | 'sla' | 'login-logs' | 'masters'>('overview');

    // Restore missing state
    const [searchTerm, setSearchTerm] = useState('');
    const [dateRange, setDateRange] = useState({ start: '', end: '' });
    const { tickets } = useTickets();
    const [loginLogs, setLoginLogs] = useState<LoginLog[]>(initialLoginLogs);

    useEffect(() => {
        const fetchPerformance = async () => {
            const { getUserPerformance } = await import('../lib/stats');
            const data = await getUserPerformance();
            setPerformanceData(data);
        };
        const fetchSLA = async () => {
            const { getSlaCompliance } = await import('../lib/stats');
            const data = await getSlaCompliance();
            setSlaData(data);
        };

        if (activeTab === 'performance') {
            fetchPerformance().catch(err => console.error('Error fetching performance:', err));
        }
        if (activeTab === 'sla') {
            fetchSLA().catch(err => console.error('Error fetching SLA:', err));
        }
    }, [activeTab]);

    // Mock data for graphs (only keeping what is used)
    const ticketVolumeData = [
        { name: 'Mon', tickets: 4 },
        { name: 'Tue', tickets: 7 },
        { name: 'Wed', tickets: 5 },
        { name: 'Thu', tickets: 11 },
        { name: 'Fri', tickets: 9 },
        { name: 'Sat', tickets: 3 },
        { name: 'Sun', tickets: 2 },
    ];

    const statusData = [
        { name: 'Open', value: tickets.filter(t => (t.status || '').toLowerCase() === 'open').length, color: '#ef4444' },
        { name: 'In Progress', value: tickets.filter(t => (t.status || '').toLowerCase() === 'in-progress').length, color: '#f59e0b' },
        { name: 'Resolved', value: tickets.filter(t => (t.status || '').toLowerCase() === 'resolved').length, color: '#10b981' },
        { name: 'Closed', value: tickets.filter(t => (t.status || '').toLowerCase() === 'closed').length, color: '#64748b' },
    ];

    // Priority Distribution
    const priorityCounts = tickets.reduce((acc, ticket) => {
        const priority = (ticket.priority || 'Medium');
        acc[priority] = (acc[priority] || 0) + 1;
        return acc;
    }, {} as Record<string, number>);

    const priorityData = Object.keys(priorityCounts).map(key => ({
        name: key,
        value: priorityCounts[key],
        color: key.toLowerCase() === 'high' ? '#ef4444' : key.toLowerCase() === 'medium' ? '#f59e0b' : '#3b82f6'
    }));

    // Complaint Type Distribution
    const typeCounts = tickets.reduce((acc, ticket) => {
        const type = ticket.complaintType || 'Uncategorized';
        acc[type] = (acc[type] || 0) + 1;
        return acc;
    }, {} as Record<string, number>);

    const typeData = Object.keys(typeCounts).map(key => ({
        name: key,
        count: typeCounts[key]
    })).sort((a, b) => b.count - a.count).slice(0, 5); // Top 5

    // Average Resolution Time (Hours)
    const resolvedTickets = tickets.filter(t => t.status === 'resolved' || t.status === 'closed');
    const totalResolutionTime = resolvedTickets.reduce((acc, ticket) => {
        const start = new Date(ticket.createdAt).getTime();
        const end = new Date(ticket.updatedAt).getTime();
        return acc + (end - start);
    }, 0);
    const avgResolutionHours = resolvedTickets.length > 0
        ? Math.round(totalResolutionTime / resolvedTickets.length / (1000 * 60 * 60))
        : 0;

    // Aging Tickets (> 7 Days Open)
    const agingTickets = tickets.filter(t => {
        if (t.status === 'resolved' || t.status === 'closed') return false;
        const created = new Date(t.createdAt).getTime();
        const diffDays = (Date.now() - created) / (1000 * 60 * 60 * 24);
        return diffDays > 7;
    }).length;

    useEffect(() => {
        const fetchLoginLogs = async () => {
            try {
                const { gsheet } = await import('../lib/gsheet');
                const data = await gsheet.read('Login_Log');
                setLoginLogs(data);
            } catch (error) {
                console.error('Error fetching login logs:', error);
            }
        };

        if (activeTab === 'login-logs') {
            fetchLoginLogs();
        }
    }, [activeTab]);

    // Filter Logic
    const filteredData = tickets.filter(ticket => {
        const matchesSearch = ticket.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
            ticket.ticketNo?.toLowerCase().includes(searchTerm.toLowerCase()) ||
            ticket.id.toString().includes(searchTerm);

        if (!dateRange.start && !dateRange.end) return matchesSearch;

        const ticketDate = new Date(ticket.createdAt).setHours(0, 0, 0, 0);
        const startDate = dateRange.start ? new Date(dateRange.start).setHours(0, 0, 0, 0) : null;
        const endDate = dateRange.end ? new Date(dateRange.end).setHours(0, 0, 0, 0) : null;

        if (startDate && ticketDate < startDate) return false;
        if (endDate && ticketDate > endDate) return false;

        return matchesSearch;
    });

    // Excel Export Logic
    const downloadExcel = (data: unknown[], fileName: string) => {
        import('xlsx').then(XLSX => {
            const worksheet = XLSX.utils.json_to_sheet(data);
            const workbook = XLSX.utils.book_new();
            XLSX.utils.book_append_sheet(workbook, worksheet, "Report");
            XLSX.writeFile(workbook, `${fileName}_${new Date().toISOString().split('T')[0]}.xlsx`);
        });
    };

    return (
        <div className="space-y-6 fade-in">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div>
                    <h1 className="text-3xl font-bold text-slate-800 tracking-tight">Reports & Analytics</h1>
                    <p className="text-slate-500 mt-1">Manage queues, view data, and analyze metrics.</p>
                </div>
                <div className="flex items-center bg-white/50 p-1 rounded-xl border border-slate-200 backdrop-blur-sm overflow-x-auto">
                    {(['overview', 'data', 'login-logs', 'masters'] as const).map((tab) => (
                        <button
                            key={tab}
                            onClick={() => setActiveTab(tab)}
                            className={`px-4 py-2 rounded-lg text-sm font-medium transition-all duration-300 whitespace-nowrap ${activeTab === tab
                                ? 'bg-white text-indigo-600 shadow-sm'
                                : 'text-slate-500 hover:text-slate-700 hover:bg-slate-100/50'
                                }`}
                        >
                            {tab.charAt(0).toUpperCase() + tab.slice(1).replace('-', ' ')}
                        </button>
                    ))}
                </div>
            </div>

            <AnimatePresence mode="wait">
                <motion.div
                    key={activeTab}
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -10 }}
                    transition={{ duration: 0.2 }}
                >
                    {activeTab === 'overview' && (
                        <div className="space-y-6">
                            {/* Key Metrics Row */}
                            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                                <div className="glass-card p-6 flex flex-col justify-between h-32 relative overflow-hidden group">
                                    <div className="absolute top-0 right-0 w-24 h-24 bg-indigo-50 rounded-bl-full -mr-4 -mt-4 transition-transform group-hover:scale-110"></div>
                                    <div>
                                        <div className="text-sm font-medium text-slate-500 mb-1">Total Tickets</div>
                                        <div className="text-3xl font-bold text-slate-800">{tickets.length}</div>
                                    </div>
                                    <div className="text-xs text-indigo-600 font-medium flex items-center gap-1">
                                        All Time
                                    </div>
                                </div>
                                <div className="glass-card p-6 flex flex-col justify-between h-32 relative overflow-hidden group">
                                    <div className="absolute top-0 right-0 w-24 h-24 bg-pink-50 rounded-bl-full -mr-4 -mt-4 transition-transform group-hover:scale-110"></div>
                                    <div>
                                        <div className="text-sm font-medium text-slate-500 mb-1">Open Tickets</div>
                                        <div className="text-3xl font-bold text-slate-800">
                                            {tickets.filter(t => (t.status || '').toLowerCase() === 'open').length}
                                        </div>
                                    </div>
                                    <div className="text-xs text-red-500 font-medium flex items-center gap-1">
                                        Active
                                    </div>
                                </div>
                                <div className="glass-card p-6 flex flex-col justify-between h-32 relative overflow-hidden group">
                                    <div className="absolute top-0 right-0 w-24 h-24 bg-green-50 rounded-bl-full -mr-4 -mt-4 transition-transform group-hover:scale-110"></div>
                                    <div>
                                        <div className="text-sm font-medium text-slate-500 mb-1">Resolved</div>
                                        <div className="text-3xl font-bold text-slate-800">
                                            {tickets.filter(t => (t.status || '').toLowerCase() === 'resolved' || (t.status || '').toLowerCase() === 'closed').length}
                                        </div>
                                    </div>
                                    <div className="text-xs text-green-600 font-medium flex items-center gap-1">
                                        Completed
                                    </div>
                                </div>
                                <div className="glass-card p-6 flex flex-col justify-between h-32 relative overflow-hidden group">
                                    <div className="absolute top-0 right-0 w-24 h-24 bg-amber-50 rounded-bl-full -mr-4 -mt-4 transition-transform group-hover:scale-110"></div>
                                    <div>
                                        <div className="text-sm font-medium text-slate-500 mb-1">Avg Resolution</div>
                                        <div className="text-3xl font-bold text-slate-800">{avgResolutionHours}</div>
                                    </div>
                                    <div className="text-xs text-slate-400 font-medium flex items-center gap-1">
                                        Hours
                                    </div>
                                </div>
                                <div className="glass-card p-6 flex flex-col justify-between h-32 relative overflow-hidden group">
                                    <div className="absolute top-0 right-0 w-24 h-24 bg-red-50 rounded-bl-full -mr-4 -mt-4 transition-transform group-hover:scale-110"></div>
                                    <div>
                                        <div className="text-sm font-medium text-slate-500 mb-1">Aging Tickets</div>
                                        <div className="text-3xl font-bold text-slate-800">{agingTickets}</div>
                                    </div>
                                    <div className="text-xs text-red-500 font-medium flex items-center gap-1">
                                        &gt; 7 Days Open
                                    </div>
                                </div>
                            </div>

                            {/* Charts Row */}
                            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                                <div className="glass-card p-6">
                                    <div className="flex justify-between items-center mb-6">
                                        <h3 className="text-lg font-semibold text-slate-800">Weekly Volume</h3>
                                    </div>
                                    <div className="h-80 w-full">
                                        <ResponsiveContainer width="100%" height="100%">
                                            <BarChart data={ticketVolumeData}>
                                                <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" vertical={false} />
                                                <XAxis dataKey="name" stroke="#64748b" tickLine={false} axisLine={false} />
                                                <YAxis stroke="#64748b" tickLine={false} axisLine={false} />
                                                <Tooltip contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }} />
                                                <Bar dataKey="tickets" fill="#6366f1" radius={[6, 6, 0, 0]} barSize={40} />
                                            </BarChart>
                                        </ResponsiveContainer>
                                    </div>
                                </div>

                                <div className="glass-card p-6">
                                    <h3 className="text-lg font-semibold text-slate-800 mb-6">Status Distribution</h3>
                                    <div className="h-80 w-full">
                                        <ResponsiveContainer width="100%" height="100%">
                                            <PieChart>
                                                <Pie
                                                    data={statusData}
                                                    cx="50%"
                                                    cy="50%"
                                                    innerRadius={80}
                                                    outerRadius={110}
                                                    paddingAngle={5}
                                                    dataKey="value"
                                                >
                                                    {statusData.map((entry, index) => (
                                                        <Cell key={`cell-${index}`} fill={entry.color} strokeWidth={0} />
                                                    ))}
                                                </Pie>
                                                <Tooltip contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 10px 15px -3px rgb(0 0 0 / 0.1)' }} />
                                                <Legend iconType="circle" verticalAlign="middle" align="right" layout="vertical" />
                                            </PieChart>
                                        </ResponsiveContainer>
                                    </div>
                                </div>
                            </div>

                            {/* Second Row of Charts */}
                            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                                <div className="glass-card p-6">
                                    <h3 className="text-lg font-semibold text-slate-800 mb-6">Priority Distribution</h3>
                                    <div className="h-80 w-full">
                                        <ResponsiveContainer width="100%" height="100%">
                                            <PieChart>
                                                <Pie
                                                    data={priorityData}
                                                    cx="50%"
                                                    cy="50%"
                                                    innerRadius={60}
                                                    outerRadius={90}
                                                    paddingAngle={5}
                                                    dataKey="value"
                                                >
                                                    {priorityData.map((entry, index) => (
                                                        <Cell key={`cell-${index}`} fill={entry.color} strokeWidth={0} />
                                                    ))}
                                                </Pie>
                                                <Tooltip contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 10px 15px -3px rgb(0 0 0 / 0.1)' }} />
                                                <Legend iconType="circle" verticalAlign="middle" align="right" layout="vertical" />
                                            </PieChart>
                                        </ResponsiveContainer>
                                    </div>
                                </div>

                                <div className="glass-card p-6">
                                    <div className="flex justify-between items-center mb-6">
                                        <h3 className="text-lg font-semibold text-slate-800">Complaint Types (Top 5)</h3>
                                    </div>
                                    <div className="h-80 w-full">
                                        <ResponsiveContainer width="100%" height="100%">
                                            <BarChart data={typeData} layout="vertical">
                                                <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" horizontal={false} />
                                                <XAxis type="number" stroke="#64748b" tickLine={false} axisLine={false} />
                                                <YAxis dataKey="name" type="category" width={100} stroke="#64748b" tickLine={false} axisLine={false} />
                                                <Tooltip contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }} />
                                                <Bar dataKey="count" fill="#8b5cf6" radius={[0, 6, 6, 0]} barSize={20} />
                                            </BarChart>
                                        </ResponsiveContainer>
                                    </div>
                                </div>
                            </div>
                        </div>
                    )}

                    {activeTab === 'data' && (
                        <div className="glass-card p-6">
                            <div className="grid grid-cols-1 md:grid-cols-12 gap-4 mb-8">
                                <div className="md:col-span-12 lg:col-span-4 relative">
                                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                                    <input
                                        type="text"
                                        placeholder="Search by ID or Title..."
                                        value={searchTerm}
                                        onChange={(e) => setSearchTerm(e.target.value)}
                                        className="w-full pl-10 pr-4 py-2.5 rounded-xl bg-slate-50 border-none focus:bg-white focus:ring-2 focus:ring-indigo-100 transition-all text-sm"
                                    />
                                </div>
                                <div className="md:col-span-8 lg:col-span-6 flex gap-2">
                                    <div className="relative flex-1">
                                        <div className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400 pointer-events-none">
                                            <Calendar className="w-4 h-4" />
                                        </div>
                                        <input
                                            type="date"
                                            value={dateRange.start}
                                            onChange={(e) => setDateRange({ ...dateRange, start: e.target.value })}
                                            className="w-full pl-10 pr-2 py-2.5 rounded-xl bg-slate-50 border-none focus:bg-white focus:ring-2 focus:ring-indigo-100 transition-all text-sm text-slate-600"
                                        />
                                    </div>
                                    <span className="self-center text-slate-400">-</span>
                                    <div className="relative flex-1">
                                        <div className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400 pointer-events-none">
                                            <Calendar className="w-4 h-4" />
                                        </div>
                                        <input
                                            type="date"
                                            value={dateRange.end}
                                            onChange={(e) => setDateRange({ ...dateRange, end: e.target.value })}
                                            className="w-full pl-10 pr-2 py-2.5 rounded-xl bg-slate-50 border-none focus:bg-white focus:ring-2 focus:ring-indigo-100 transition-all text-sm text-slate-600"
                                        />
                                    </div>
                                </div>
                                <div className="md:col-span-4 lg:col-span-2 flex justify-end">
                                    <button
                                        onClick={() => downloadExcel(filteredData, 'Ticket_Report')}
                                        className="flex items-center justify-center gap-2 px-4 py-2.5 bg-green-600 hover:bg-green-700 text-white rounded-xl text-sm font-medium transition-colors shadow-lg shadow-green-500/20 w-full"
                                    >
                                        <Download className="w-4 h-4" />
                                        Export
                                    </button>
                                </div>
                            </div>

                            <div className="overflow-x-auto rounded-lg border border-slate-100">
                                <table className="w-full">
                                    <thead className="bg-slate-50">
                                        <tr>
                                            <th className="text-left py-4 px-4 text-xs font-bold text-slate-500 uppercase tracking-wider">Date</th>
                                            <th className="text-left py-4 px-4 text-xs font-bold text-slate-500 uppercase tracking-wider">Ticket No</th>
                                            <th className="text-left py-4 px-4 text-xs font-bold text-slate-500 uppercase tracking-wider">Subject</th>
                                            <th className="text-left py-4 px-4 text-xs font-bold text-slate-500 uppercase tracking-wider">Customer</th>
                                            <th className="text-left py-4 px-4 text-xs font-bold text-slate-500 uppercase tracking-wider">Status</th>
                                        </tr>
                                    </thead>
                                    <tbody className="divide-y divide-slate-50 bg-white">
                                        {filteredData.map((ticket) => (
                                            <tr key={ticket.id} className="hover:bg-slate-50/50 transition-colors">
                                                <td className="py-3 px-4 text-sm text-slate-600">
                                                    {new Date(ticket.createdAt).toLocaleDateString()}
                                                </td>
                                                <td className="py-3 px-4 text-sm font-medium text-slate-800">
                                                    {ticket.ticketNo || ticket.id}
                                                </td>
                                                <td className="py-3 px-4 text-sm text-slate-800">
                                                    {ticket.title}
                                                </td>
                                                <td className="py-3 px-4 text-sm text-slate-600">
                                                    {ticket.customer?.name || ticket.customerName || '-'}
                                                </td>
                                                <td className="py-3 px-4">
                                                    <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-bold uppercase ${(ticket.status || '').toLowerCase() === 'open' ? 'bg-red-100 text-red-700' :
                                                        (ticket.status || '').toLowerCase() === 'resolved' ? 'bg-green-100 text-green-700' :
                                                            (ticket.status || '').toLowerCase() === 'closed' ? 'bg-slate-100 text-slate-700' :
                                                                'bg-yellow-100 text-yellow-700'
                                                        }`}>
                                                        {ticket.status}
                                                    </span>
                                                </td>
                                            </tr>
                                        ))}
                                        {filteredData.length === 0 && (
                                            <tr>
                                                <td colSpan={5} className="py-8 text-center text-slate-400">
                                                    No records found for the selected criteria.
                                                </td>
                                            </tr>
                                        )}
                                    </tbody>
                                </table>
                            </div>
                        </div>
                    )}

                    {activeTab === 'performance' && (
                        <div className="space-y-6">
                            <div className="glass-card p-6">
                                <h2 className="text-xl font-bold text-slate-800 mb-4">User Performance</h2>
                                <div className="h-80 w-full mb-8">
                                    <ResponsiveContainer width="100%" height="100%">
                                        <BarChart data={performanceData} layout="vertical" margin={{ left: 20 }}>
                                            <CartesianGrid strokeDasharray="3 3" horizontal={false} />
                                            <XAxis type="number" />
                                            <YAxis dataKey="Full_Name" type="category" width={120} />
                                            <Tooltip />
                                            <Legend />
                                            <Bar dataKey="Resolved_Tickets" name="Resolved" fill="#10b981" />
                                            <Bar dataKey="Open_Tickets" name="Open" fill="#ef4444" />
                                        </BarChart>
                                    </ResponsiveContainer>
                                </div>
                                <div className="overflow-x-auto">
                                    <table className="w-full text-sm text-left">
                                        <thead className="bg-slate-50 font-bold text-slate-500">
                                            <tr>
                                                <th className="p-3">User</th>
                                                <th className="p-3">Total Assigned</th>
                                                <th className="p-3">Open</th>
                                                <th className="p-3">Resolved</th>
                                                <th className="p-3">Avg Resolution (Hrs)</th>
                                            </tr>
                                        </thead>
                                        <tbody>
                                            {performanceData.map((user, i) => (
                                                <tr key={i} className="border-b hover:bg-slate-50">
                                                    <td className="p-3 font-medium">{user.Full_Name}</td>
                                                    <td className="p-3">{user.Total_Assigned}</td>
                                                    <td className="p-3 text-red-600">{user.Open_Tickets}</td>
                                                    <td className="p-3 text-green-600">{user.Resolved_Tickets}</td>
                                                    <td className="p-3">{user.Avg_Resolution_Hours || '-'}</td>
                                                </tr>
                                            ))}
                                        </tbody>
                                    </table>
                                </div>
                            </div>
                        </div>
                    )}

                    {activeTab === 'sla' && (
                        <div className="glass-card p-6">
                            <h2 className="text-xl font-bold text-slate-800 mb-4">SLA Compliance</h2>
                            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
                                <div className="p-4 bg-red-50 rounded-xl border border-red-100">
                                    <div className="text-sm text-red-600 font-medium">Breached Tickets</div>
                                    <div className="text-2xl font-bold text-red-800">{slaData.filter(d => d.SLA_Status === 'Breached').length}</div>
                                </div>
                                <div className="p-4 bg-green-50 rounded-xl border border-green-100">
                                    <div className="text-sm text-green-600 font-medium">Within SLA</div>
                                    <div className="text-2xl font-bold text-green-800">{slaData.filter(d => d.SLA_Status === 'Within SLA').length}</div>
                                </div>
                            </div>
                            <h3 className="font-semibold text-slate-700 mb-2">Breach Details</h3>
                            <div className="overflow-x-auto">
                                <table className="w-full text-sm text-left">
                                    <thead className="bg-slate-50 font-bold text-slate-500">
                                        <tr>
                                            <th className="p-3">Ticket No</th>
                                            <th className="p-3">Subject</th>
                                            <th className="p-3">Assigned To</th>
                                            <th className="p-3">SLA (Hrs)</th>
                                            <th className="p-3">Hours Open</th>
                                            <th className="p-3">Status</th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                        {slaData.map((t, i) => (
                                            <tr key={i} className={`border-b hover:bg-slate-50 ${t.SLA_Status === 'Breached' ? 'bg-red-50/30' : ''}`}>
                                                <td className="p-3 font-medium">{t.Ticket_No}</td>
                                                <td className="p-3">{t.Subject}</td>
                                                <td className="p-3">{t.Assigned_To || 'Unassigned'}</td>
                                                <td className="p-3">{t.sla_hours}</td>
                                                <td className="p-3 font-bold">{t.Hours_Open}</td>
                                                <td className="p-3">
                                                    <span className={`px-2 py-1 rounded-full text-xs font-bold ${t.SLA_Status === 'Breached' ? 'bg-red-100 text-red-700' : 'bg-green-100 text-green-700'}`}>
                                                        {t.SLA_Status}
                                                    </span>
                                                </td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            </div>
                        </div>
                    )}

                    {activeTab === 'login-logs' && (
                        <div className="glass-card p-6">
                            <div className="flex justify-between items-center mb-6">
                                <h2 className="text-xl font-bold text-slate-800">User Login Logs</h2>
                                <button
                                    onClick={() => downloadExcel(loginLogs, 'Login_Logs')}
                                    className="flex items-center gap-2 px-4 py-2 bg-indigo-50 text-indigo-600 hover:bg-indigo-100 rounded-lg text-sm font-medium transition-colors"
                                >
                                    <Download className="w-4 h-4" /> Export Log
                                </button>
                            </div>
                            <div className="overflow-x-auto rounded-lg border border-slate-100">
                                <table className="w-full">
                                    <thead className="bg-slate-50">
                                        <tr>
                                            <th className="text-left py-4 px-4 text-xs font-bold text-slate-500 uppercase tracking-wider">Time</th>
                                            <th className="text-left py-4 px-4 text-xs font-bold text-slate-500 uppercase tracking-wider">User</th>
                                            <th className="text-left py-4 px-4 text-xs font-bold text-slate-500 uppercase tracking-wider">Status</th>
                                            <th className="text-left py-4 px-4 text-xs font-bold text-slate-500 uppercase tracking-wider">IP / Device</th>
                                        </tr>
                                    </thead>
                                    <tbody className="divide-y divide-slate-50 bg-white">
                                        {loginLogs.map((log) => (
                                            <tr key={log.Login_ID} className="hover:bg-slate-50/50 transition-colors">
                                                <td className="py-3 px-4 text-sm text-slate-600">
                                                    {new Date(log.Login_Time).toLocaleString()}
                                                </td>
                                                <td className="py-3 px-4 text-sm font-medium text-slate-800">
                                                    {log.Full_Name}<br />
                                                    <span className="text-xs text-slate-400 font-normal">{log.User_Code}</span>
                                                </td>
                                                <td className="py-3 px-4">
                                                    <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${log.Login_Status === 'Success' ? 'bg-green-100 text-green-800' :
                                                        log.Login_Status === 'Logged Out' ? 'bg-slate-100 text-slate-800' :
                                                            'bg-red-100 text-red-800'
                                                        }`}>
                                                        {log.Login_Status}
                                                    </span>
                                                </td>
                                                <td className="py-3 px-4 text-xs text-slate-500 max-w-xs truncate">
                                                    {log.IP_Address}<br />{log.Device_Info}
                                                </td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            </div>
                        </div>
                    )}

                    {activeTab === 'masters' && (
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                            {/* Masters Export Section */}
                            <div className="glass-card p-6">
                                <h3 className="text-lg font-bold text-slate-800 mb-2">Master Data Reports</h3>
                                <p className="text-sm text-slate-500 mb-6">Download complete master listings.</p>

                                <div className="space-y-3">
                                    <button
                                        onClick={async () => {
                                            const { gsheet } = await import('../lib/gsheet');
                                            const data = await gsheet.read('customers_profile');
                                            downloadExcel(data, 'Customer_Master');
                                        }}
                                        className="w-full flex items-center justify-between p-4 bg-slate-50 hover:bg-white hover:shadow-md border border-slate-200 rounded-xl transition-all group"
                                    >
                                        <div className="flex items-center gap-3">
                                            <div className="w-10 h-10 rounded-lg bg-blue-100 text-blue-600 flex items-center justify-center">
                                                <Users className="w-5 h-5" />
                                            </div>
                                            <div className="text-left">
                                                <div className="font-semibold text-slate-800">Customer Master</div>
                                                <div className="text-xs text-slate-500">All registered customers</div>
                                            </div>
                                        </div>
                                        <Download className="w-5 h-5 text-slate-400 group-hover:text-blue-600 transition-colors" />
                                    </button>

                                    <button
                                        onClick={async () => {
                                            const { gsheet } = await import('../lib/gsheet');
                                            const data = await gsheet.read('Ticket_Master');
                                            downloadExcel(data, 'All_Tickets');
                                        }}
                                        className="w-full flex items-center justify-between p-4 bg-slate-50 hover:bg-white hover:shadow-md border border-slate-200 rounded-xl transition-all group"
                                    >
                                        <div className="flex items-center gap-3">
                                            <div className="w-10 h-10 rounded-lg bg-indigo-100 text-indigo-600 flex items-center justify-center">
                                                <FileText className="w-5 h-5" />
                                            </div>
                                            <div className="text-left">
                                                <div className="font-semibold text-slate-800">All Tickets Dump</div>
                                                <div className="text-xs text-slate-500">Complete ticket history</div>
                                            </div>
                                        </div>
                                        <Download className="w-5 h-5 text-slate-400 group-hover:text-indigo-600 transition-colors" />
                                    </button>

                                    <button
                                        onClick={async () => {
                                            const { gsheet } = await import('../lib/gsheet');
                                            const data = await gsheet.read('ASM_Master');
                                            downloadExcel(data, 'ASM_Master');
                                        }}
                                        className="w-full flex items-center justify-between p-4 bg-slate-50 hover:bg-white hover:shadow-md border border-slate-200 rounded-xl transition-all group"
                                    >
                                        <div className="flex items-center gap-3">
                                            <div className="w-10 h-10 rounded-lg bg-orange-100 text-orange-600 flex items-center justify-center">
                                                <Shield className="w-5 h-5" />
                                            </div>
                                            <div className="text-left">
                                                <div className="font-semibold text-slate-800">ASM Master</div>
                                                <div className="text-xs text-slate-500">Area Sales Managers listing</div>
                                            </div>
                                        </div>
                                        <Download className="w-5 h-5 text-slate-400 group-hover:text-orange-600 transition-colors" />
                                    </button>

                                    <button
                                        onClick={async () => {
                                            const { gsheet } = await import('../lib/gsheet');
                                            const data = await gsheet.read('RSM_Master');
                                            downloadExcel(data, 'RSM_Master');
                                        }}
                                        className="w-full flex items-center justify-between p-4 bg-slate-50 hover:bg-white hover:shadow-md border border-slate-200 rounded-xl transition-all group"
                                    >
                                        <div className="flex items-center gap-3">
                                            <div className="w-10 h-10 rounded-lg bg-purple-100 text-purple-600 flex items-center justify-center">
                                                <Workflow className="w-5 h-5" />
                                            </div>
                                            <div className="text-left">
                                                <div className="font-semibold text-slate-800">RSM Master</div>
                                                <div className="text-xs text-slate-500">Regional Sales Managers listing</div>
                                            </div>
                                        </div>
                                        <Download className="w-5 h-5 text-slate-400 group-hover:text-purple-600 transition-colors" />
                                    </button>

                                    <button
                                        onClick={async () => {
                                            const { gsheet } = await import('../lib/gsheet');
                                            const data = await gsheet.read('Complaint_Type_Master');
                                            downloadExcel(data, 'Complaint_Type_Master');
                                        }}
                                        className="w-full flex items-center justify-between p-4 bg-slate-50 hover:bg-white hover:shadow-md border border-slate-200 rounded-xl transition-all group"
                                    >
                                        <div className="flex items-center gap-3">
                                            <div className="w-10 h-10 rounded-lg bg-red-100 text-red-600 flex items-center justify-center">
                                                <FileText className="w-5 h-5" />
                                            </div>
                                            <div className="text-left">
                                                <div className="font-semibold text-slate-800">Complaint Type Master</div>
                                                <div className="text-xs text-slate-500">Types of complaints and SLA</div>
                                            </div>
                                        </div>
                                        <Download className="w-5 h-5 text-slate-400 group-hover:text-red-600 transition-colors" />
                                    </button>

                                    <button
                                        onClick={async () => {
                                            const { gsheet } = await import('../lib/gsheet');
                                            const data = await gsheet.read('User_Master');
                                            downloadExcel(data, 'User_Master');
                                        }}
                                        className="w-full flex items-center justify-between p-4 bg-slate-50 hover:bg-white hover:shadow-md border border-slate-200 rounded-xl transition-all group"
                                    >
                                        <div className="flex items-center gap-3">
                                            <div className="w-10 h-10 rounded-lg bg-green-100 text-green-600 flex items-center justify-center">
                                                <UserCheck className="w-5 h-5" />
                                            </div>
                                            <div className="text-left">
                                                <div className="font-semibold text-slate-800">User Master</div>
                                                <div className="text-xs text-slate-500">System users and roles</div>
                                            </div>
                                        </div>
                                        <Download className="w-5 h-5 text-slate-400 group-hover:text-green-600 transition-colors" />
                                    </button>
                                </div>
                            </div>
                        </div>
                    )}
                </motion.div>
            </AnimatePresence>
        </div>
    );
}

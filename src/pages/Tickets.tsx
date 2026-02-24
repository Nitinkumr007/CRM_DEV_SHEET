import { useState, useEffect } from 'react';
import { Search, RefreshCw, Plus } from 'lucide-react';
import { TicketList } from '../components/TicketList';
import { KanbanBoard } from '../components/KanbanBoard';
import { Drawer } from '../components/Drawer';
import { TicketDetail } from '../components/TicketDetail';
import { useTickets } from '../context/TicketContext';
import { useSettings } from '../context/SettingsContext';
import { useTabs } from '../context/TabContext';

export default function Tickets() {
    const { tickets, refreshTickets, loading } = useTickets();
    const { settings } = useSettings();
    const { updateTabPath, activeTabId } = useTabs();
    const [view, setView] = useState<'list' | 'kanban'>('list');
    const [selectedTicketId, setSelectedTicketId] = useState<string | null>(null);

    const handleCreateNew = () => {
        updateTabPath(activeTabId, '/tickets/new', 'New Ticket');
    };

    // Sync view with settings when they load
    useEffect(() => {
        if (settings?.defaultView) {
            setView(settings.defaultView);
        }
    }, [settings?.defaultView]);

    // Filter States
    const [searchQuery, setSearchQuery] = useState('');
    const [statusFilter, setStatusFilter] = useState('');
    const [priorityFilter, setPriorityFilter] = useState('');

    const filteredTickets = tickets.filter(ticket => {
        const matchesSearch =
            ticket.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
            ticket.customer.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
            ticket.id.toLowerCase().includes(searchQuery.toLowerCase()) ||
            (ticket.phoneNumber && ticket.phoneNumber.includes(searchQuery)) ||
            (ticket.customer_number && ticket.customer_number.includes(searchQuery));

        const matchesStatus = statusFilter ? ticket.status.toLowerCase() === statusFilter.toLowerCase() : true;
        const matchesPriority = priorityFilter ? ticket.priority.toLowerCase() === priorityFilter.toLowerCase() : true;

        return matchesSearch && matchesStatus && matchesPriority;
    });

    const selectedTicket = tickets.find(t => t.id === selectedTicketId) || null;

    return (
        <div className="space-y-6 fade-in pb-10">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div className="flex flex-col md:flex-row md:items-center justify-between w-full">
                    <div>
                        <div className="flex items-center gap-3">
                            <h1 className="text-3xl font-black text-slate-900 dark:text-white tracking-tight font-display">Tickets</h1>
                            <button
                                onClick={refreshTickets}
                                disabled={loading}
                                className="glass-btn-refresh group"
                                title="Refresh Tickets"
                            >
                                <RefreshCw className={`w-5 h-5 ${loading ? 'animate-spin text-indigo-600' : 'group-hover:rotate-180 transition-transform duration-700'}`} />
                            </button>
                        </div>
                        <p className="text-slate-500 dark:text-slate-400 text-sm mt-1">Manage and track customer support requests.</p>
                    </div>

                    <div className="mt-4 md:mt-0">
                        <button
                            onClick={handleCreateNew}
                            className="flex items-center gap-2 px-6 py-3 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl font-bold shadow-lg shadow-indigo-100 dark:shadow-none transition-all active:scale-95 group"
                        >
                            <Plus className="w-5 h-5 group-hover:rotate-90 transition-transform duration-300" />
                            <span>New Ticket</span>
                        </button>
                    </div>
                </div>
            </div>

            {/* Advanced Filter Bar */}
            <div className="glass-card p-4 shadow-xl shadow-indigo-500/5 mb-6 border-slate-200/50 dark:border-slate-800/50">
                <div className="flex flex-col md:flex-row gap-4 items-center">
                    <div className="relative flex-1 w-full">
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                        <input
                            type="text"
                            placeholder="Search tickets by subject, customer, ID, or mobile..."
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                            className="w-full pl-10 pr-20 py-2 bg-white border border-slate-200 rounded-lg focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition-all text-sm outline-none placeholder:text-slate-400"
                        />
                        <button className="absolute right-1.5 top-1/2 -translate-y-1/2 px-3 py-1 bg-indigo-50 text-indigo-600 text-xs font-medium rounded-md hover:bg-indigo-100 transition-colors">
                            Search
                        </button>
                    </div>
                    <div className="flex gap-3 w-full md:w-auto overflow-x-auto pb-2 md:pb-0 items-center">
                        <select
                            value={statusFilter}
                            onChange={(e) => setStatusFilter(e.target.value)}
                            className="px-4 py-2 bg-slate-50 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-700 rounded-xl text-xs font-bold text-slate-600 dark:text-slate-300 focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 outline-none cursor-pointer hover:bg-white dark:hover:bg-slate-800 transition-all appearance-none pr-8 bg-[url('data:image/svg+xml;charset=utf-8,%3Csvg%20xmlns%3D%22http%3A%2F%2Fwww.w3.org%2F2000%2Fsvg%22%20fill%3D%22none%22%20viewBox%3D%220%200%2020%2020%22%3E%3Cpath%20stroke%3D%22%236b7280%22%20stroke-linecap%3D%22round%22%20stroke-linejoin%3D%22round%22%20stroke-width%3D%221.5%22%20d%3D%22m6%208%204%204%204-4%22%2F%3E%3C%2Fsvg%3E')] bg-[position:right_0.5rem_center] bg-no-repeat"
                        >
                            <option value="">All Statuses</option>
                            <option value="open">Open</option>
                            <option value="in-progress">In Progress</option>
                            <option value="closed">Closed</option>
                        </select>
                        <select
                            value={priorityFilter}
                            onChange={(e) => setPriorityFilter(e.target.value)}
                            className="px-4 py-2 bg-slate-50 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-700 rounded-xl text-xs font-bold text-slate-600 dark:text-slate-300 focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 outline-none cursor-pointer hover:bg-white dark:hover:bg-slate-800 transition-all appearance-none pr-8 bg-[url('data:image/svg+xml;charset=utf-8,%3Csvg%20xmlns%3D%22http%3A%2F%2Fwww.w3.org%2F2000%2Fsvg%22%20fill%3D%22none%22%20viewBox%3D%220%200%2020%2020%22%3E%3Cpath%20stroke%3D%22%236b7280%22%20stroke-linecap%3D%22round%22%20stroke-linejoin%3D%22round%22%20stroke-width%3D%221.5%22%20d%3D%22m6%208%204%204%204-4%22%2F%3E%3C%2Fsvg%3E')] bg-[position:right_0.5rem_center] bg-no-repeat"
                        >
                            <option value="">All Priorities</option>
                            <option value="low">Low</option>
                            <option value="medium">Medium</option>
                            <option value="high">High</option>
                            <option value="urgent">Urgent</option>
                        </select>
                        <div className="bg-slate-100 dark:bg-slate-800 p-1 rounded-xl flex items-center border border-slate-200/50 dark:border-slate-700/50 ml-2">
                            <button
                                onClick={() => setView('list')}
                                className={`px-4 py-1.5 rounded-lg text-xs font-black transition-all uppercase tracking-tight ${view === 'list' ? 'bg-white dark:bg-slate-700 text-indigo-600 dark:text-indigo-400 shadow-sm' : 'text-slate-500 dark:text-slate-400 hover:text-slate-700 dark:hover:text-slate-200'}`}
                            >
                                List
                            </button>
                            <button
                                onClick={() => setView('kanban')}
                                className={`px-4 py-1.5 rounded-lg text-xs font-black transition-all uppercase tracking-tight ${view === 'kanban' ? 'bg-white dark:bg-slate-700 text-indigo-600 dark:text-indigo-400 shadow-sm' : 'text-slate-500 dark:text-slate-400 hover:text-slate-700 dark:hover:text-slate-200'}`}
                            >
                                Kanban
                            </button>
                        </div>
                    </div>
                </div>
            </div>

            {view === 'list' ? (
                <TicketList
                    tickets={filteredTickets}
                    onTicketClick={(t) => setSelectedTicketId(t.id)}
                />
            ) : (
                <KanbanBoard
                    tickets={filteredTickets}
                    onTicketClick={(t) => setSelectedTicketId(t.id)}
                />
            )}

            {/* Ticket Details Drawer */}
            <Drawer
                isOpen={!!selectedTicketId}
                onClose={() => setSelectedTicketId(null)}
                title="Ticket Details"
                size="4xl"
            >
                {selectedTicket && <TicketDetail ticket={selectedTicket} />}
            </Drawer>
        </div>
    );
}


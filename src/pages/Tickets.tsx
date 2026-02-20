import { useState, useEffect } from 'react';
import { Plus, Search } from 'lucide-react';
import { TicketList } from '../components/TicketList';
import { KanbanBoard } from '../components/KanbanBoard';
import { Drawer } from '../components/Drawer';
import { TicketDetail } from '../components/TicketDetail';
import { useTickets } from '../context/TicketContext';
import { useSettings } from '../context/SettingsContext';
import { useNavigate } from 'react-router-dom';

export default function Tickets() {
    const { tickets } = useTickets();
    const { settings } = useSettings();
    const navigate = useNavigate();
    const [view, setView] = useState<'list' | 'kanban'>('list');
    const [selectedTicketId, setSelectedTicketId] = useState<string | null>(null);

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
        <div className="space-y-6">
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-3xl font-bold text-slate-800 tracking-tight">Tickets</h1>
                    <p className="text-slate-500 mt-1">Manage and track customer support requests.</p>
                </div>
                <button
                    onClick={() => navigate('/tickets/new')}
                    className="glass-btn px-4 py-2.5 flex items-center gap-2 font-medium"
                >
                    <Plus className="w-4 h-4" />
                    <span>New Ticket</span>
                </button>
            </div>

            {/* Advanced Filter Bar */}
            <div className="bg-white border border-slate-200/60 rounded-xl p-4 shadow-sm mb-6">
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
                            className="px-3 py-2 bg-white border border-slate-200 rounded-lg text-sm font-medium text-slate-600 focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 outline-none cursor-pointer hover:bg-slate-50 transition-colors bg-[length:16px_16px]"
                        >
                            <option value="">All Statuses</option>
                            <option value="open">Open</option>
                            <option value="in-progress">In Progress</option>
                            <option value="closed">Closed</option>
                        </select>
                        <select
                            value={priorityFilter}
                            onChange={(e) => setPriorityFilter(e.target.value)}
                            className="px-3 py-2 bg-white border border-slate-200 rounded-lg text-sm font-medium text-slate-600 focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 outline-none cursor-pointer hover:bg-slate-50 transition-colors"
                        >
                            <option value="">All Priorities</option>
                            <option value="low">Low</option>
                            <option value="medium">Medium</option>
                            <option value="high">High</option>
                            <option value="urgent">Urgent</option>
                        </select>
                        <div className="bg-slate-100 p-1 rounded-lg flex items-center border border-slate-200/50">
                            <button
                                onClick={() => setView('list')}
                                className={`px-4 py-1.5 rounded-md text-sm font-medium transition-all ${view === 'list' ? 'bg-white text-indigo-600 shadow-sm' : 'text-slate-500 hover:text-slate-700'}`}
                            >
                                List
                            </button>
                            <button
                                onClick={() => setView('kanban')}
                                className={`px-4 py-1.5 rounded-md text-sm font-medium transition-all ${view === 'kanban' ? 'bg-white text-indigo-600 shadow-sm' : 'text-slate-500 hover:text-slate-700'}`}
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


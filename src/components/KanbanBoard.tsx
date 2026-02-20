import { motion } from 'framer-motion';
import type { Ticket } from '../types/ticket';
import { MoreHorizontal, MessageSquare, Paperclip, Calendar } from 'lucide-react';
import { cn } from '../lib/utils';
import { PRIORITY_STYLES } from '../types/ticket';

interface KanbanBoardProps {
    tickets: Ticket[];
    onTicketClick: (ticket: Ticket) => void;
}

const COLUMNS = [
    { id: 'open', title: 'Open', color: 'bg-blue-500' },
    { id: 'in-progress', title: 'In Progress', color: 'bg-indigo-500' },
    { id: 'resolved', title: 'Resolved', color: 'bg-green-500' },
    { id: 'closed', title: 'Closed', color: 'bg-emerald-500' }
];

export function KanbanBoard({ tickets, onTicketClick }: KanbanBoardProps) {
    const getTicketsByStatus = (status: string) => {
        return tickets.filter(t => t.status === status);
    };

    return (
        <div className="flex h-[calc(100vh-12rem)] gap-6 overflow-x-auto pb-4">
            {COLUMNS.map(column => (
                <div key={column.id} className="min-w-[300px] flex flex-col h-full rounded-xl bg-slate-50/50 border border-slate-200/60 p-4">
                    <div className="flex items-center justify-between mb-4">
                        <div className="flex items-center gap-2">
                            <div className={`w-2 h-2 rounded-full ${column.color}`} />
                            <h3 className="font-semibold text-slate-700">{column.title}</h3>
                            <span className="bg-slate-200/50 px-2 py-0.5 rounded-full text-xs font-semibold text-slate-500">
                                {getTicketsByStatus(column.id).length}
                            </span>
                        </div>
                        <button className="text-slate-400 hover:text-slate-600">
                            <MoreHorizontal className="w-4 h-4" />
                        </button>
                    </div>

                    <div className="flex-1 overflow-y-auto pr-1 space-y-3 scrollbar-thin scrollbar-thumb-slate-200 scrollbar-track-transparent">
                        {getTicketsByStatus(column.id).map(ticket => (
                            <motion.div
                                layoutId={ticket.id}
                                key={ticket.id}
                                onClick={() => onTicketClick(ticket)}
                                whileHover={{ y: -2 }}
                                className="bg-white p-4 rounded-xl border border-slate-200/60 shadow-sm cursor-pointer group hover:shadow-md hover:border-indigo-100 transition-all"
                            >
                                <div className="flex items-start justify-between mb-2">
                                    <span className="text-xs font-medium text-slate-400">#{ticket.id}</span>
                                    <span className={cn("px-2 py-0.5 rounded-full text-[10px] font-semibold uppercase tracking-wide", PRIORITY_STYLES[ticket.priority])}>
                                        {ticket.priority}
                                    </span>
                                </div>

                                <h4 className="font-medium text-slate-800 mb-2 line-clamp-2 leading-snug group-hover:text-indigo-600 transition-colors">
                                    {ticket.title}
                                </h4>

                                <div className="flex items-center gap-2 text-xs text-slate-400 mb-3">
                                    <div className="flex items-center gap-1">
                                        <MessageSquare className="w-3 h-3" /> 2
                                    </div>
                                    <div className="flex items-center gap-1">
                                        <Paperclip className="w-3 h-3" /> 1
                                    </div>
                                    <div className="ml-auto flex items-center gap-1 text-slate-300">
                                        <Calendar className="w-3 h-3" /> {new Date(ticket.createdAt).toLocaleDateString(undefined, { month: 'short', day: 'numeric' })}
                                    </div>
                                </div>

                                <div className="flex items-center justify-between pt-3 border-t border-slate-50">
                                    <div className="flex items-center gap-2">
                                        <div className="w-6 h-6 rounded-full bg-indigo-100 flex items-center justify-center text-xs font-bold text-indigo-700 overflow-hidden">
                                            {ticket.customer.avatar ? (
                                                <img src={ticket.customer.avatar} alt="" className="w-full h-full object-cover" />
                                            ) : (
                                                ticket.customer.name[0]
                                            )}
                                        </div>
                                        <span className="text-xs text-slate-500 font-medium truncate max-w-[100px]">{ticket.customer.name}</span>
                                    </div>
                                    {ticket.assignedTo && (
                                        <div className="w-6 h-6 rounded-full bg-emerald-100 flex items-center justify-center text-xs font-bold text-emerald-700 overflow-hidden border-2 border-white ring-1 ring-slate-100" title={`Assigned to ${ticket.assignedTo.name}`}>
                                            {ticket.assignedTo.avatar ? (
                                                <img src={ticket.assignedTo.avatar} alt="" className="w-full h-full object-cover" />
                                            ) : (
                                                ticket.assignedTo.name[0]
                                            )}
                                        </div>
                                    )}
                                </div>
                            </motion.div>
                        ))}
                    </div>
                </div>
            ))}
        </div>
    );
}

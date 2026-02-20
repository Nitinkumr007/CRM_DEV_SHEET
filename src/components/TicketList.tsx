import { PRIORITY_STYLES, STATUS_STYLES } from '../types/ticket';
import type { Ticket } from '../types/ticket';
import { cn } from '../lib/utils';
import { MoreHorizontal, Clock, AlertCircle, Phone } from 'lucide-react';
import { format } from 'date-fns';

interface TicketListProps {
    tickets: Ticket[];
    onTicketClick?: (ticket: Ticket) => void;
}

export function TicketList({ tickets, onTicketClick }: TicketListProps) {
    return (
        <div className="glass-card overflow-hidden">
            <div className="overflow-x-auto">
                <table className="w-full text-left text-sm text-slate-600">
                    <thead className="bg-slate-50/50 text-xs uppercase text-slate-500 font-semibold">
                        <tr>
                            <th className="px-6 py-4">Ticket ID</th>
                            <th className="px-6 py-4">Subject</th>
                            <th className="px-6 py-4">Status</th>
                            <th className="px-6 py-4">Priority</th>
                            <th className="px-6 py-4">Customer</th>
                            <th className="px-6 py-4">Date</th>
                            <th className="px-6 py-4 text-right">Actions</th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100">
                        {tickets.map((ticket) => (
                            <tr
                                key={ticket.id}
                                onClick={() => onTicketClick?.(ticket)}
                                className="hover:bg-slate-50/80 transition-colors cursor-pointer group"
                            >
                                <td className="px-6 py-4 font-medium text-slate-900 group-hover:text-primary transition-colors">
                                    {ticket.id}
                                </td>
                                <td className="px-6 py-4">
                                    <div className="font-medium text-slate-900">{ticket.title}</div>
                                    <div className="text-xs text-slate-400 mt-0.5 truncate max-w-md">
                                        {ticket.description}
                                    </div>
                                </td>
                                <td className="px-6 py-4">
                                    <span className={cn(
                                        "inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium capitalize border border-transparent",
                                        STATUS_STYLES[ticket.status]
                                    )}>
                                        {ticket.status.replace('-', ' ')}
                                    </span>
                                </td>
                                <td className="px-6 py-4">
                                    <div className="flex items-center gap-1.5">
                                        <span className={cn(
                                            "inline-flex items-center px-2 py-0.5 rounded text-xs font-medium capitalize",
                                            PRIORITY_STYLES[ticket.priority]
                                        )}>
                                            {ticket.priority === 'urgent' && <AlertCircle className="w-3 h-3 mr-1" />}
                                            {ticket.priority}
                                        </span>
                                    </div>
                                </td>
                                <td className="px-6 py-4">
                                    <div className="flex items-center gap-3">
                                        <img
                                            src={ticket.customer.avatar}
                                            alt={ticket.customer.name}
                                            className="w-8 h-8 rounded-full border border-slate-200"
                                        />
                                        <div>
                                            <div className="font-medium text-slate-900">{ticket.customer.name}</div>
                                            <div className="text-xs text-slate-500 flex items-center gap-1">
                                                <Phone className="w-3 h-3" />
                                                {ticket.phoneNumber || ticket.customer_number || 'N/A'}
                                            </div>
                                        </div>
                                    </div>
                                </td>
                                <td className="px-6 py-4">
                                    <div className="flex items-center gap-1.5 text-slate-500">
                                        <Clock className="w-3.5 h-3.5" />
                                        <span>{format(new Date(ticket.createdAt), 'MMM d, yyyy')}</span>
                                    </div>
                                </td>
                                <td className="px-6 py-4 text-right">
                                    <button className="p-2 hover:bg-slate-100 rounded-lg text-slate-400 hover:text-slate-600 transition-colors">
                                        <MoreHorizontal className="w-4 h-4" />
                                    </button>
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>
        </div>
    );
}

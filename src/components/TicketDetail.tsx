
import type { Ticket } from '../types/ticket';
import { STATUS_STYLES, PRIORITY_STYLES } from '../types/ticket';
import { cn } from '../lib/utils';
import { format } from 'date-fns';
import { useState, useEffect } from 'react';
import { useTickets } from '../context/TicketContext';
import {
    User, Clock, Tag, CheckCircle, MapPin,
    MessageSquare, ShieldCheck, Timer, Edit2,
    Phone, Briefcase
} from 'lucide-react';

interface TicketDetailProps {
    ticket: Ticket;
}

export function TicketDetail({ ticket }: TicketDetailProps) {
    const { updateTicket } = useTickets();
    const [actionLoading, setActionLoading] = useState(false);

    // Closing State
    const [isClosing, setIsClosing] = useState(false);
    const [closingRemarks, setClosingRemarks] = useState('');

    // Description State
    const [isEditingDescription, setIsEditingDescription] = useState(false);
    const [description, setDescription] = useState(ticket.description);

    useEffect(() => {
        setDescription(ticket.description);
    }, [ticket.description]);

    const handleCloseTicket = async () => {
        if (!closingRemarks.trim()) return;
        setActionLoading(true);
        try {
            await updateTicket(ticket.id, {
                status: 'closed',
                closingRemarks: closingRemarks
            });
            setIsClosing(false);
        } catch (error) {
            console.error("Failed to close ticket", error);
        } finally {
            setActionLoading(false);
        }
    };

    const handleReopenTicket = async () => {
        if (actionLoading) return;
        setActionLoading(true);
        try {
            await updateTicket(ticket.id, { status: 'open' });
        } catch (error) {
            console.error("Failed to reopen ticket", error);
        } finally {
            setActionLoading(false);
        }
    };

    const handleUpdateDescription = async () => {
        if (description === ticket.description) {
            setIsEditingDescription(false);
            return;
        }
        setActionLoading(true);
        try {
            await updateTicket(ticket.id, { description });
            setIsEditingDescription(false);
        } catch (error) {
            console.error("Failed to update description", error);
        } finally {
            setActionLoading(false);
        }
    };

    const isClosed = ticket.status.toLowerCase() === 'closed' || ticket.status.toLowerCase() === 'resolved';

    return (
        <div className="space-y-6 h-full overflow-y-auto pr-2 custom-scrollbar pb-10">
            {/* Top Bar - Meta Info */}
            <div className="flex flex-wrap items-center justify-between gap-4 border-b border-slate-100 pb-4">
                <div className="flex items-center gap-3">
                    <span className={cn(
                        "inline-flex items-center px-2.5 py-0.5 rounded-md text-[11px] font-bold uppercase tracking-wider shadow-sm",
                        STATUS_STYLES[ticket.status.toLowerCase() as keyof typeof STATUS_STYLES] || 'bg-slate-100 text-slate-700'
                    )}>
                        {ticket.status.replace('-', ' ')}
                    </span>
                    <span className={cn(
                        "inline-flex items-center px-2.5 py-0.5 rounded-md text-[11px] font-bold uppercase tracking-wider shadow-sm",
                        PRIORITY_STYLES[ticket.priority]
                    )}>
                        {ticket.priority}
                    </span>
                    {ticket.sla_hours && (
                        <span className="inline-flex items-center px-2.5 py-0.5 rounded-md text-[11px] font-bold uppercase tracking-wider bg-purple-50 text-purple-700 border border-purple-100 gap-1">
                            <Timer className="w-3 h-3" /> SLA: {ticket.sla_hours}h
                        </span>
                    )}
                </div>
                <div className="text-xs font-mono text-slate-400 bg-slate-50 px-2 py-1 rounded border border-slate-100">
                    ID: #{ticket.ticketNo || ticket.id}
                </div>
            </div>

            {/* Title & Category */}
            <div className="space-y-2">
                <h3 className="text-2xl font-extrabold text-slate-900 tracking-tight leading-tight">
                    {ticket.title}
                </h3>
                {ticket.complaintType && (
                    <div className="flex items-center gap-1.5 text-xs font-semibold text-indigo-600">
                        <Tag className="w-3.5 h-3.5" />
                        {ticket.complaintType}
                    </div>
                )}
            </div>

            {/* Main Grid Layout */}
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">

                {/* Left Column - Core Info & Actions (8/12) */}
                <div className="lg:col-span-8 space-y-6">

                    {/* Resolution Section (Dynamic) */}
                    {!isClosed ? (
                        <div className="bg-emerald-50/30 border border-emerald-100 rounded-xl p-5 overflow-hidden">
                            {!isClosing ? (
                                <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
                                    <div>
                                        <h4 className="text-sm font-bold text-emerald-900 flex items-center gap-2">
                                            <CheckCircle className="w-4 h-4" /> Ready to Resolve?
                                        </h4>
                                        <p className="text-xs text-emerald-700 mt-0.5 font-medium">Mark this ticket as complete once the issue is addressed.</p>
                                    </div>
                                    <button
                                        onClick={() => setIsClosing(true)}
                                        className="w-full sm:w-auto px-4 py-2 rounded-lg text-sm font-bold bg-emerald-600 text-white hover:bg-emerald-700 shadow-sm transition-all active:scale-95"
                                    >
                                        Resolve Ticket
                                    </button>
                                </div>
                            ) : (
                                <div className="space-y-4 animate-in fade-in duration-300">
                                    <div className="flex items-center justify-between">
                                        <h4 className="text-sm font-bold text-emerald-900">Closing Remarks</h4>
                                        <button onClick={() => setIsClosing(false)} className="text-xs text-slate-500 hover:text-slate-800 font-bold">Cancel</button>
                                    </div>
                                    <textarea
                                        value={closingRemarks}
                                        onChange={(e) => setClosingRemarks(e.target.value)}
                                        placeholder="Enter resolution details..."
                                        className="w-full px-4 py-3 rounded-lg border border-emerald-200 focus:ring-4 focus:ring-emerald-500/10 focus:border-emerald-500 outline-none text-sm min-h-[100px] transition-all bg-white"
                                        autoFocus
                                    />
                                    <button
                                        onClick={handleCloseTicket}
                                        disabled={!closingRemarks.trim() || actionLoading}
                                        className="w-full py-2.5 rounded-lg text-sm font-bold bg-emerald-600 text-white hover:bg-emerald-700 disabled:opacity-50 transition-all font-bold uppercase tracking-wider"
                                    >
                                        {actionLoading ? "Submitting..." : "Confirm & Resolve"}
                                    </button>
                                </div>
                            )}
                        </div>
                    ) : (
                        <div className="bg-white border border-slate-200 rounded-xl p-5 shadow-sm">
                            <div className="flex items-start gap-4">
                                <div className="w-10 h-10 rounded-full bg-emerald-100 flex items-center justify-center flex-shrink-0 group">
                                    <CheckCircle className="w-6 h-6 text-emerald-600 group-hover:scale-110 transition-transform" />
                                </div>
                                <div className="flex-1">
                                    <div className="flex items-center justify-between mb-1">
                                        <h4 className="text-base font-bold text-slate-900">Ticket Resolved</h4>
                                        <button
                                            onClick={handleReopenTicket}
                                            className="text-[10px] font-bold text-slate-400 hover:text-indigo-600 p-1 rounded hover:bg-slate-50 transition-colors uppercase tracking-widest"
                                        >
                                            Reopen
                                        </button>
                                    </div>
                                    <p className="text-xs text-slate-500 mb-3">
                                        Closed by <span className="font-bold text-slate-700">{ticket.closedBy || 'System'}</span> on {ticket.closedAt ? format(new Date(ticket.closedAt), 'MMM d, h:mm a') : 'N/A'}
                                    </p>
                                    {ticket.closingRemarks && (
                                        <div className="bg-slate-50 border-l-4 border-emerald-400 p-3 rounded-r-lg mb-4">
                                            <p className="text-sm italic text-slate-700">"{ticket.closingRemarks}"</p>
                                        </div>
                                    )}
                                    {ticket.asm_name && ticket.asm_mobile && (
                                        <button
                                            onClick={() => {
                                                const text = `Hi ${ticket.asm_name},\n\nTicket No: ${ticket.ticketNo || ticket.id} has been RESOLVED.\n\nCustomer: ${ticket.customer.name}\nSubject: ${ticket.title}\nResolution: ${ticket.closingRemarks || 'N/A'}\n\nThank you!`;
                                                const phone = ticket.asm_mobile || '';
                                                const url = `https://wa.me/91${phone}?text=${encodeURIComponent(text)}`;
                                                window.open(url, '_blank');
                                            }}
                                            className="flex items-center gap-2 px-4 py-2 bg-emerald-600 text-white rounded-lg text-sm font-bold shadow-md shadow-emerald-100 hover:bg-emerald-700 transition-all active:scale-95"
                                        >
                                            <svg className="w-4 h-4 fill-current" viewBox="0 0 24 24"><path d="M12.031 6.172c-3.181 0-5.767 2.586-5.768 5.766-.001 1.298.38 2.27 1.019 3.287l-.582 2.128 2.182-.573c.978.58 1.911.928 3.145.929 3.178 0 5.767-2.587 5.768-5.766 0-3.18-2.587-5.771-5.764-5.771zm3.392 8.244c-.144.405-.837.774-1.17.824-.299.045-.677.063-1.092-.069-.252-.08-.575-.187-.988-.365-1.739-.751-2.874-2.502-2.961-2.617-.087-.116-.708-.94-.708-1.793 0-.852.449-1.271.61-1.444.161-.173.351-.216.468-.216.117 0 .234 0 .334.004.106.004.249-.04.391.297.144.35.494 1.208.536 1.294.043.086.07.186.012.303-.058.116-.087.188-.173.289l-.26.303c-.087.101-.177.211-.077.382.1.171.445.733.955 1.187.656.584 1.209.765 1.381.85.171.085.271.07.371-.045.103-.116.438-.506.556-.68.117-.173.234-.144.39-.087.158.058 1.002.472 1.174.558.173.086.289.129.332.202.043.073.043.419-.101.824zM12 2C6.477 2 2 6.477 2 12c0 1.891.528 3.657 1.439 5.161L2 22l4.98-1.393C8.428 21.488 10.16 22 12 22c5.523 0 10-4.477 10-10S17.523 2 12 2zm0 18c-1.63 0-3.149-.49-4.421-1.332l-2.825.79.805-2.942C4.69 15.228 4 13.693 4 12c0-4.411 3.589-8 8-8s8 3.589 8 8-3.589 8-8 8z" /></svg>
                                            Notify ASM on WhatsApp
                                        </button>
                                    )}
                                </div>
                            </div>
                        </div>
                    )}

                    {/* Description Section */}
                    <div className="bg-white border border-slate-200 rounded-xl p-5 shadow-sm">
                        <div className="flex items-center justify-between mb-4">
                            <h4 className="text-sm font-bold text-slate-900 flex items-center gap-2">
                                <MessageSquare className="w-4 h-4 text-indigo-500" /> Ticket Description
                            </h4>
                            {!isClosed && !isEditingDescription && (
                                <button
                                    onClick={() => setIsEditingDescription(true)}
                                    className="text-xs font-bold text-indigo-600 hover:text-indigo-800 flex items-center gap-1 transition-colors"
                                >
                                    <Edit2 className="w-3 h-3" /> Edit
                                </button>
                            )}
                        </div>

                        {isEditingDescription ? (
                            <div className="animate-in fade-in duration-200">
                                <textarea
                                    value={description}
                                    onChange={(e) => setDescription(e.target.value)}
                                    className="w-full px-4 py-3 rounded-lg border border-slate-300 focus:ring-4 focus:ring-indigo-500/10 focus:border-indigo-500 outline-none text-sm min-h-[120px] leading-relaxed transition-all"
                                />
                                <div className="flex items-center justify-end gap-2 mt-3">
                                    <button
                                        onClick={() => {
                                            setDescription(ticket.description);
                                            setIsEditingDescription(false);
                                        }}
                                        className="px-3 py-1.5 text-xs font-bold text-slate-500 hover:bg-slate-100 rounded-lg transition-colors"
                                    >
                                        Cancel
                                    </button>
                                    <button
                                        onClick={handleUpdateDescription}
                                        disabled={actionLoading}
                                        className="px-4 py-1.5 bg-indigo-600 text-white text-xs font-bold rounded-lg hover:bg-indigo-700 shadow-sm transition-all"
                                    >
                                        {actionLoading ? "Saving..." : "Save Changes"}
                                    </button>
                                </div>
                            </div>
                        ) : (
                            <div className="text-slate-700 text-sm leading-relaxed whitespace-pre-wrap font-medium">
                                {ticket.description || "No description provided."}
                            </div>
                        )}
                    </div>

                    {/* Customer Details Section */}
                    <div className="bg-white border border-slate-200 rounded-xl overflow-hidden shadow-sm">
                        <div className="bg-slate-50 px-5 py-3 border-b border-slate-200 flex items-center justify-between">
                            <h4 className="text-sm font-bold text-slate-900 flex items-center gap-2">
                                <User className="w-4 h-4 text-indigo-500" /> Customer Information
                            </h4>
                            <button
                                onClick={() => {
                                    const text = `Hi ${ticket.customer.name},\n\nSharing details for your ticket.\n\nTicket No: ${ticket.ticketNo || ticket.id}\nSubject: ${ticket.title}\nStatus: ${ticket.status}\nPriority: ${ticket.priority}\n\nThank you!`;
                                    const phone = ticket.customer_number || '';
                                    const url = `https://wa.me/91${phone}?text=${encodeURIComponent(text)}`;
                                    window.open(url, '_blank');
                                }}
                                className="flex items-center gap-1.5 px-3 py-1.5 bg-emerald-100 hover:bg-emerald-200 text-emerald-700 rounded-lg text-xs font-bold transition-all"
                                title="Share on WhatsApp"
                            >
                                <svg className="w-4 h-4 fill-current" viewBox="0 0 24 24"><path d="M12.031 6.172c-3.181 0-5.767 2.586-5.768 5.766-.001 1.298.38 2.27 1.019 3.287l-.582 2.128 2.182-.573c.978.58 1.911.928 3.145.929 3.178 0 5.767-2.587 5.768-5.766 0-3.18-2.587-5.771-5.764-5.771zm3.392 8.244c-.144.405-.837.774-1.17.824-.299.045-.677.063-1.092-.069-.252-.08-.575-.187-.988-.365-1.739-.751-2.874-2.502-2.961-2.617-.087-.116-.708-.94-.708-1.793 0-.852.449-1.271.61-1.444.161-.173.351-.216.468-.216.117 0 .234 0 .334.004.106.004.249-.04.391.297.144.35.494 1.208.536 1.294.043.086.07.186.012.303-.058.116-.087.188-.173.289l-.26.303c-.087.101-.177.211-.077.382.1.171.445.733.955 1.187.656.584 1.209.765 1.381.85.171.085.271.07.371-.045.103-.116.438-.506.556-.68.117-.173.234-.144.39-.087.158.058 1.002.472 1.174.558.173.086.289.129.332.202.043.073.043.419-.101.824zM12 2C6.477 2 2 6.477 2 12c0 1.891.528 3.657 1.439 5.161L2 22l4.98-1.393C8.428 21.488 10.16 22 12 22c5.523 0 10-4.477 10-10S17.523 2 12 2zm0 18c-1.63 0-3.149-.49-4.421-1.332l-2.825.79.805-2.942C4.69 15.228 4 13.693 4 12c0-4.411 3.589-8 8-8s8 3.589 8 8-3.589 8-8 8z" /></svg>
                                WhatsApp
                            </button>
                        </div>
                        <div className="p-5">
                            <div className="flex items-center gap-4 mb-6">
                                <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center text-white font-black text-xl shadow-indigo-100 shadow-lg">
                                    {ticket.customer.name.charAt(0)}
                                </div>
                                <div>
                                    <div className="font-extrabold text-slate-900 text-lg leading-tight">{ticket.customer.name}</div>
                                    <div className="text-xs font-bold text-slate-400 mt-0.5 uppercase tracking-widest">
                                        {ticket.customer_type || 'General Customer'}
                                    </div>
                                </div>
                            </div>

                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                <div className="p-3 bg-slate-50 rounded-lg border border-slate-100">
                                    <div className="text-[10px] text-slate-400 font-bold uppercase tracking-widest mb-1">Contact Number</div>
                                    <div className="flex items-center gap-2 font-bold text-slate-800 text-sm">
                                        <Phone className="w-3.5 h-3.5 text-indigo-400" />
                                        {ticket.customer_number || 'N/A'}
                                    </div>
                                </div>
                                <div className="p-3 bg-slate-50 rounded-lg border border-slate-100">
                                    <div className="text-[10px] text-slate-400 font-bold uppercase tracking-widest mb-1">Location</div>
                                    <div className="flex items-start gap-2 font-bold text-slate-800 text-sm">
                                        <MapPin className="w-3.5 h-3.5 text-indigo-400 mt-0.5" />
                                        <div className="leading-tight">
                                            {ticket.customer_address || 'N/A'}<br />
                                            <span className="text-xs text-slate-400 font-medium">{[ticket.city_name, ticket.pincode].filter(Boolean).join(', ')}</span>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Right Column - Alignment & History (4/12) */}
                <div className="lg:col-span-4 space-y-6">

                    {/* Sales Team Section */}
                    <div className="bg-white border border-slate-200 rounded-xl overflow-hidden shadow-sm">
                        <div className="bg-slate-50 px-4 py-3 border-b border-slate-200">
                            <h4 className="text-sm font-bold text-slate-900 flex items-center gap-2">
                                <Briefcase className="w-3.5 h-3.5 text-orange-500" /> Sales Alignment
                            </h4>
                        </div>
                        <div className="p-4 space-y-4">
                            <div className="flex items-center justify-between group/asm">
                                <div className="flex items-center gap-3 min-w-0">
                                    <div className="w-8 h-8 rounded-lg bg-orange-100 flex items-center justify-center flex-shrink-0">
                                        <User className="w-4 h-4 text-orange-600" />
                                    </div>
                                    <div className="min-w-0">
                                        <div className="text-[10px] text-slate-400 font-bold uppercase tracking-tight">Area Sales Manager</div>
                                        <div className="text-sm font-bold text-slate-800 truncate">{ticket.asm_name || 'Unassigned'}</div>
                                    </div>
                                </div>
                                {ticket.asm_name && ticket.asm_mobile && (
                                    <button
                                        onClick={() => {
                                            const text = `Hi ${ticket.asm_name},\n\nUpdate on Ticket No: ${ticket.ticketNo || ticket.id}\nCustomer: ${ticket.customer.name}\nSubject: ${ticket.title}\nStatus: ${ticket.status}\n\nPlease check the system for details.\nThank you!`;
                                            const phone = ticket.asm_mobile || '';
                                            const url = `https://wa.me/91${phone}?text=${encodeURIComponent(text)}`;
                                            window.open(url, '_blank');
                                        }}
                                        className="p-1.5 bg-emerald-50 text-emerald-600 rounded-md opacity-0 group-hover/asm:opacity-100 transition-opacity hover:bg-emerald-100"
                                        title="Share with ASM"
                                    >
                                        <svg className="w-4 h-4 fill-current" viewBox="0 0 24 24"><path d="M12.031 6.172c-3.181 0-5.767 2.586-5.768 5.766-.001 1.298.38 2.27 1.019 3.287l-.582 2.128 2.182-.573c.978.58 1.911.928 3.145.929 3.178 0 5.767-2.587 5.768-5.766 0-3.18-2.587-5.771-5.764-5.771zm3.392 8.244c-.144.405-.837.774-1.17.824-.299.045-.677.063-1.092-.069-.252-.08-.575-.187-.988-.365-1.739-.751-2.874-2.502-2.961-2.617-.087-.116-.708-.94-.708-1.793 0-.852.449-1.271.61-1.444.161-.173.351-.216.468-.216.117 0 .234 0 .334.004.106.004.249-.04.391.297.144.35.494 1.208.536 1.294.043.086.07.186.012.303-.058.116-.087.188-.173.289l-.26.303c-.087.101-.177.211-.077.382.1.171.445.733.955 1.187.656.584 1.209.765 1.381.85.171.085.271.07.371-.045.103-.116.438-.506.556-.68.117-.173.234-.144.39-.087.158.058 1.002.472 1.174.558.173.086.289.129.332.202.043.073.043.419-.101.824zM12 2C6.477 2 2 6.477 2 12c0 1.891.528 3.657 1.439 5.161L2 22l4.98-1.393C8.428 21.488 10.16 22 12 22c5.523 0 10-4.477 10-10S17.523 2 12 2zm0 18c-1.63 0-3.149-.49-4.421-1.332l-2.825.79.805-2.942C4.69 15.228 4 13.693 4 12c0-4.411 3.589-8 8-8s8 3.589 8 8-3.589 8-8 8z" /></svg>
                                    </button>
                                )}
                            </div>
                            <div className="flex items-center justify-between group/rsm">
                                <div className="flex items-center gap-3 min-w-0">
                                    <div className="w-8 h-8 rounded-lg bg-blue-100 flex items-center justify-center flex-shrink-0">
                                        <ShieldCheck className="w-4 h-4 text-blue-600" />
                                    </div>
                                    <div className="min-w-0">
                                        <div className="text-[10px] text-slate-400 font-bold uppercase tracking-tight">Regional Sales Manager</div>
                                        <div className="text-sm font-bold text-slate-800 truncate">{ticket.rsm_name || 'Unassigned'}</div>
                                    </div>
                                </div>
                                {ticket.rsm_name && ticket.rsm_mobile && (
                                    <button
                                        onClick={() => {
                                            const text = `Hi ${ticket.rsm_name},\n\nUpdate on Ticket No: ${ticket.ticketNo || ticket.id}\nCustomer: ${ticket.customer.name}\nSubject: ${ticket.title}\nStatus: ${ticket.status}\n\nThank you!`;
                                            const phone = ticket.rsm_mobile || '';
                                            const url = `https://wa.me/91${phone}?text=${encodeURIComponent(text)}`;
                                            window.open(url, '_blank');
                                        }}
                                        className="p-1.5 bg-emerald-50 text-emerald-600 rounded-md opacity-0 group-hover/rsm:opacity-100 transition-opacity hover:bg-emerald-100"
                                        title="Share with RSM"
                                    >
                                        <svg className="w-4 h-4 fill-current" viewBox="0 0 24 24"><path d="M12.031 6.172c-3.181 0-5.767 2.586-5.768 5.766-.001 1.298.38 2.27 1.019 3.287l-.582 2.128 2.182-.573c.978.58 1.911.928 3.145.929 3.178 0 5.767-2.587 5.768-5.766 0-3.18-2.587-5.771-5.764-5.771zm3.392 8.244c-.144.405-.837.774-1.17.824-.299.045-.677.063-1.092-.069-.252-.08-.575-.187-.988-.365-1.739-.751-2.874-2.502-2.961-2.617-.087-.116-.708-.94-.708-1.793 0-.852.449-1.271.61-1.444.161-.173.351-.216.468-.216.117 0 .234 0 .334.004.106.004.249-.04.391.297.144.35.494 1.208.536 1.294.043.086.07.186.012.303-.058.116-.087.188-.173.289l-.26.303c-.087.101-.177.211-.077.382.1.171.445.733.955 1.187.656.584 1.209.765 1.381.85.171.085.271.07.371-.045.103-.116.438-.506.556-.68.117-.173.234-.144.39-.087.158.058 1.002.472 1.174.558.173.086.289.129.332.202.043.073.043.419-.101.824zM12 2C6.477 2 2 6.477 2 12c0 1.891.528 3.657 1.439 5.161L2 22l4.98-1.393C8.428 21.488 10.16 22 12 22c5.523 0 10-4.477 10-10S17.523 2 12 2zm0 18c-1.63 0-3.149-.49-4.421-1.332l-2.825.79.805-2.942C4.69 15.228 4 13.693 4 12c0-4.411 3.589-8 8-8s8 3.589 8 8-3.589 8-8 8z" /></svg>
                                    </button>
                                )}
                            </div>
                        </div>
                    </div>

                    {/* Timeline / Audit Section */}
                    <div className="bg-white border border-slate-200 rounded-xl p-4 shadow-sm">
                        <h4 className="text-sm font-bold text-slate-900 flex items-center gap-2 mb-6">
                            <Clock className="w-3.5 h-3.5 text-slate-500" /> Activity Timeline
                        </h4>

                        <div className="space-y-6 relative before:absolute before:left-2 before:top-2 before:bottom-2 before:w-0.5 before:bg-slate-100">
                            {/* Created */}
                            <div className="relative pl-7 group">
                                <div className="absolute left-0 top-1 w-4 h-4 rounded-full bg-white border-2 border-slate-200 group-hover:border-indigo-500 transition-colors z-10 flex items-center justify-center">
                                    <div className="w-1.5 h-1.5 rounded-full bg-slate-300 group-hover:bg-indigo-500 transition-colors"></div>
                                </div>
                                <div>
                                    <p className="text-[10px] font-black uppercase text-slate-400 tracking-widest leading-none mb-1">Created</p>
                                    <p className="text-xs font-bold text-slate-800 mb-0.5">{format(new Date(ticket.createdAt), 'MMM d, yyyy h:mm a')}</p>
                                    <p className="text-[10px] text-slate-500 font-medium">by {ticket.createdBy?.name || 'System'}</p>
                                </div>
                            </div>

                            {/* Updated */}
                            <div className="relative pl-7 group">
                                <div className="absolute left-0 top-1 w-4 h-4 rounded-full bg-white border-2 border-slate-200 group-hover:border-blue-500 transition-colors z-10 flex items-center justify-center">
                                    <div className="w-1.5 h-1.5 rounded-full bg-slate-300 group-hover:bg-blue-500 transition-colors"></div>
                                </div>
                                <div>
                                    <p className="text-[10px] font-black uppercase text-slate-400 tracking-widest leading-none mb-1">Last Active</p>
                                    <p className="text-xs font-bold text-slate-800">{format(new Date(ticket.updatedAt), 'MMM d, yyyy h:mm a')}</p>
                                </div>
                            </div>

                            {/* Closed */}
                            {isClosed && ticket.closedAt && (
                                <div className="relative pl-7 group">
                                    <div className="absolute left-0 top-1 w-4 h-4 rounded-full bg-emerald-50 border-2 border-emerald-500 z-10 flex items-center justify-center shadow-sm shadow-emerald-100">
                                        <div className="w-1.5 h-1.5 rounded-full bg-emerald-600"></div>
                                    </div>
                                    <div>
                                        <p className="text-[10px] font-black uppercase text-emerald-600 tracking-widest leading-none mb-1">Closed</p>
                                        <p className="text-xs font-bold text-slate-800 mb-0.5">{format(new Date(ticket.closedAt), 'MMM d, yyyy h:mm a')}</p>
                                        <p className="text-[10px] text-slate-500 font-medium">by {ticket.closedBy || 'User'}</p>
                                    </div>
                                </div>
                            )}
                        </div>
                    </div>

                    {/* Meta Tags Section */}
                    {ticket.tags && ticket.tags.length > 0 && (
                        <div className="flex flex-wrap gap-2">
                            {ticket.tags.map((tag, idx) => (
                                <span key={idx} className="px-2 py-0.5 bg-slate-50 text-slate-500 text-[10px] font-black uppercase tracking-widest border border-slate-100 rounded">
                                    #{tag}
                                </span>
                            ))}
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
}


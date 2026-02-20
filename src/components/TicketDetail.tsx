
import type { Ticket } from '../types/ticket';
import { STATUS_STYLES, PRIORITY_STYLES } from '../types/ticket';
import { cn } from '../lib/utils';
import { format } from 'date-fns';
import { useState, useEffect } from 'react';
import { useTickets } from '../context/TicketContext';
import {
    User, Clock, Tag, CheckCircle, MapPin,
    MessageSquare, ShieldCheck, Timer, RotateCcw, Edit2,
    Save, Phone, Briefcase
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
        <div className="space-y-8 h-full overflow-y-auto pr-4 custom-scrollbar pb-20">
            {/* Header Section */}
            <div>
                <div className="flex flex-wrap items-center gap-3 mb-4">
                    <span className={cn(
                        "inline-flex items-center px-3 py-1 rounded-full text-sm font-medium capitalize shadow-sm transition-colors",
                        STATUS_STYLES[ticket.status.toLowerCase() as keyof typeof STATUS_STYLES] || 'bg-slate-100 text-slate-700'
                    )}>
                        {ticket.status.replace('-', ' ')}
                    </span>
                    <span className={cn(
                        "inline-flex items-center px-3 py-1 rounded-full text-sm font-medium capitalize shadow-sm",
                        PRIORITY_STYLES[ticket.priority]
                    )}>
                        {ticket.priority}
                    </span>
                    {ticket.sla_hours && (
                        <span className="inline-flex items-center px-3 py-1 rounded-full text-sm font-medium bg-purple-100 text-purple-700 shadow-sm gap-1">
                            <Timer className="w-3.5 h-3.5" /> SLA: {ticket.sla_hours}h
                        </span>
                    )}
                    <span className="text-sm font-mono text-slate-500 ml-auto bg-slate-100 px-3 py-1 rounded border border-slate-200">
                        #{ticket.ticketNo || ticket.id}
                    </span>
                </div>

                <div className="flex items-start justify-between gap-6">
                    <h3 className="text-3xl font-bold text-slate-800 leading-tight mb-2">
                        {ticket.title}
                    </h3>
                </div>

                {ticket.complaintType && (
                    <div className="inline-flex items-center gap-2 text-sm text-indigo-700 font-medium bg-indigo-50 px-4 py-1.5 rounded-full mb-6 border border-indigo-100">
                        <Tag className="w-4 h-4" />
                        {ticket.complaintType}
                    </div>
                )}
            </div>

            {/* Closing Workflow Section */}
            {!isClosed ? (
                <div className="bg-white border border-slate-200 rounded-xl p-6 shadow-sm ring-1 ring-slate-100">
                    {!isClosing ? (
                        <div className="flex items-center justify-between">
                            <div>
                                <h4 className="text-sm font-semibold text-slate-800">Resolution & Closing</h4>
                                <p className="text-xs text-slate-500 mt-1">Mark this ticket as resolved if the issue is fixed.</p>
                            </div>
                            <button
                                onClick={() => setIsClosing(true)}
                                className="flex items-center gap-2 px-5 py-2.5 rounded-lg text-sm font-bold bg-emerald-600 text-white hover:bg-emerald-700 shadow-sm hover:shadow-emerald-200 transition-all hover:-translate-y-0.5"
                            >
                                <CheckCircle className="w-4 h-4" />
                                Mark Ticket as Closed
                            </button>
                        </div>
                    ) : (
                        <div className="space-y-4 animate-in fade-in slide-in-from-top-2 duration-300">
                            <div className="flex items-center gap-2 text-emerald-800 font-bold border-b border-emerald-100 pb-3 mb-2 text-lg">
                                <ShieldCheck className="w-6 h-6 text-emerald-600" />
                                Close Ticket Validation
                            </div>

                            <div className="bg-emerald-50/50 p-4 rounded-lg border border-emerald-100/50">
                                <label className="block text-sm font-bold text-slate-700 mb-2">
                                    Closing Remarks / Resolution Notes <span className="text-red-500">*</span>
                                </label>
                                <textarea
                                    value={closingRemarks}
                                    onChange={(e) => setClosingRemarks(e.target.value)}
                                    placeholder="Please describe the resolution details, actions taken, and any relevant notes..."
                                    className="w-full px-4 py-3 rounded-lg border border-slate-300 focus:ring-4 focus:ring-emerald-500/10 focus:border-emerald-500 outline-none text-sm min-h-[120px] transition-shadow bg-white placeholder:text-slate-400"
                                    autoFocus
                                />
                                <p className="text-xs text-slate-500 mt-2 flex items-center gap-1">
                                    <ShieldCheck className="w-3 h-3" /> This information will be saved to the permanent audit record.
                                </p>
                            </div>

                            <div className="flex items-center justify-end gap-3 pt-2 border-t border-slate-100">
                                <button
                                    onClick={() => setIsClosing(false)}
                                    className="px-5 py-2.5 text-sm font-semibold text-slate-600 hover:text-slate-800 hover:bg-slate-100 rounded-lg transition-colors"
                                >
                                    Cancel
                                </button>
                                <button
                                    onClick={handleCloseTicket}
                                    disabled={!closingRemarks.trim() || actionLoading}
                                    className="flex items-center gap-2 px-8 py-2.5 rounded-lg text-sm font-bold bg-emerald-600 text-white hover:bg-emerald-700 shadow-lg shadow-emerald-200 disabled:opacity-50 disabled:cursor-not-allowed transition-all hover:-translate-y-0.5 active:translate-y-0"
                                >
                                    {actionLoading ? (
                                        <>
                                            <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                                            Closing...
                                        </>
                                    ) : (
                                        <>
                                            <CheckCircle className="w-4 h-4" />
                                            Confirm & Close Ticket
                                        </>
                                    )}
                                </button>
                            </div>
                        </div>
                    )}
                </div>
            ) : (
                <div className="bg-gradient-to-br from-emerald-50 to-white border border-emerald-100 rounded-xl p-8 shadow-sm relative overflow-hidden group">
                    <div className="absolute top-0 right-0 w-32 h-32 bg-emerald-100/50 rounded-full blur-3xl -mr-10 -mt-10 pointer-events-none"></div>

                    <div className="flex flex-col md:flex-row md:items-start gap-6 relative z-10">
                        <div className="w-14 h-14 rounded-full bg-emerald-100 flex items-center justify-center flex-shrink-0 shadow-inner border border-emerald-200">
                            <CheckCircle className="w-7 h-7 text-emerald-600" />
                        </div>
                        <div className="flex-1 space-y-4">
                            <div>
                                <div className="flex items-center gap-3 mb-1">
                                    <h4 className="text-xl font-bold text-slate-800">Ticket Closed & Resolved</h4>
                                    <span className="px-2 py-0.5 bg-emerald-600 text-white text-[10px] uppercase font-bold tracking-wider rounded">Complete</span>
                                </div>
                                <div className="text-sm text-slate-600 flex items-center flex-wrap gap-2">
                                    Closed by <span className="font-bold text-slate-900 bg-emerald-100/50 px-2 py-0.5 rounded border border-emerald-100">{ticket.closedBy || 'Unknown User'}</span>
                                    <span className="text-slate-300">•</span>
                                    {ticket.closedAt ? format(new Date(ticket.closedAt), 'MMM d, yyyy h:mm a') : 'Date N/A'}
                                </div>
                            </div>

                            {ticket.closingRemarks && (
                                <div className="bg-white p-5 rounded-xl border border-emerald-100/80 shadow-sm relative">
                                    <div className="absolute top-4 left-4 text-emerald-200/50 transform -scale-x-100">
                                        <MessageSquare className="w-8 h-8" />
                                    </div>
                                    <h5 className="text-xs font-bold text-emerald-800 uppercase tracking-wider mb-2 relative z-10">Resolution Remarks</h5>
                                    <div className="text-slate-700 text-sm leading-relaxed italic relative z-10 pl-2 border-l-2 border-emerald-200">
                                        "{ticket.closingRemarks}"
                                    </div>
                                </div>
                            )}

                            <div className="pt-2">
                                <button
                                    onClick={handleReopenTicket}
                                    disabled={actionLoading}
                                    className="flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-semibold bg-white text-slate-600 border border-slate-200 hover:border-slate-300 hover:text-slate-800 hover:bg-slate-50 shadow-sm transition-all hover:-translate-y-0.5"
                                >
                                    <RotateCcw className="w-4 h-4" />
                                    Reopen Ticket
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            )}

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                {/* Main Content Column */}
                <div className="lg:col-span-2 space-y-8">
                    {/* Description Section */}
                    <div>
                        <div className="flex items-center justify-between mb-3">
                            <h4 className="text-sm font-bold text-slate-800 flex items-center gap-2">
                                <MessageSquare className="w-4 h-4 text-indigo-500" /> Description
                            </h4>
                            {!isClosed && !isEditingDescription && (
                                <button
                                    onClick={() => setIsEditingDescription(true)}
                                    className="text-xs font-medium text-indigo-600 hover:text-indigo-700 flex items-center gap-1 bg-indigo-50 px-2 py-1 rounded transition-colors"
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
                                    className="w-full px-4 py-3 rounded-xl border border-slate-300 focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 outline-none text-sm min-h-[150px] leading-relaxed"
                                />
                                <div className="flex items-center justify-end gap-2 mt-3">
                                    <button
                                        onClick={() => {
                                            setDescription(ticket.description);
                                            setIsEditingDescription(false);
                                        }}
                                        className="px-3 py-1.5 text-xs font-medium text-slate-600 hover:bg-slate-100 rounded-md transition-colors"
                                    >
                                        Cancel
                                    </button>
                                    <button
                                        onClick={handleUpdateDescription}
                                        disabled={actionLoading}
                                        className="flex items-center gap-1.5 px-3 py-1.5 bg-indigo-600 text-white text-xs font-medium rounded-md hover:bg-indigo-700 shadow-sm transition-colors"
                                    >
                                        <Save className="w-3 h-3" /> Update
                                    </button>
                                </div>
                            </div>
                        ) : (
                            <div className="bg-slate-50/80 rounded-xl p-5 border border-slate-100 text-slate-700 text-sm leading-relaxed whitespace-pre-wrap">
                                {ticket.description}
                            </div>
                        )}
                    </div>

                    {/* Customer Information */}
                    <div>
                        <h4 className="text-sm font-bold text-slate-800 mb-3 flex items-center gap-2">
                            <User className="w-4 h-4 text-indigo-500" /> Customer Details
                        </h4>
                        <div className="bg-white border border-slate-200 rounded-xl p-5 shadow-sm space-y-5">
                            <div className="flex items-center gap-4 border-b border-slate-100 pb-5">
                                <div className="w-14 h-14 rounded-full bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center text-white font-bold text-xl shadow-md">
                                    {ticket.customer.name.charAt(0)}
                                </div>
                                <div>
                                    <div className="font-bold text-slate-900 text-lg">{ticket.customer.name}</div>
                                    <div className="text-xs text-slate-500 capitalize flex items-center gap-1.5 mt-0.5">
                                        <span className="px-2 py-0.5 bg-slate-100 rounded-md border border-slate-200">
                                            {ticket.customer_type || ticket.customer.role || 'Customer'}
                                        </span>
                                    </div>
                                </div>
                            </div>

                            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                <div className="flex items-start gap-3 text-sm">
                                    <div className="w-8 h-8 rounded-lg bg-indigo-50 flex items-center justify-center text-indigo-600 mt-0.5">
                                        <Phone className="w-4 h-4" />
                                    </div>
                                    <div className="flex-1">
                                        <div className="text-[10px] text-slate-400 font-bold uppercase tracking-wider mb-0.5">Contact Number</div>
                                        <div className="font-semibold text-slate-800">{ticket.customer_number || ticket.phoneNumber || 'N/A'}</div>
                                    </div>
                                </div>

                                <div className="flex items-start gap-3 text-sm">
                                    <div className="w-8 h-8 rounded-lg bg-indigo-50 flex items-center justify-center text-indigo-600 mt-0.5">
                                        <MapPin className="w-4 h-4" />
                                    </div>
                                    <div className="flex-1">
                                        <div className="text-[10px] text-slate-400 font-bold uppercase tracking-wider mb-0.5">Address & Location</div>
                                        <div className="font-medium text-slate-700 leading-snug">
                                            {ticket.customer_address || ticket.location || 'N/A'}
                                        </div>
                                        {(ticket.city_name || ticket.pincode) && (
                                            <div className="text-xs text-slate-500 mt-1 font-medium">
                                                {[ticket.city_name, ticket.pincode].filter(Boolean).join(', ')}
                                            </div>
                                        )}
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Sidebar Column */}
                <div className="space-y-6">
                    {/* Sales Alignment */}
                    {(ticket.asm_name || ticket.rsm_name) && (
                        <div>
                            <h4 className="text-sm font-bold text-slate-800 mb-3 flex items-center gap-2">
                                <Briefcase className="w-4 h-4 text-orange-500" /> Sales Alignment
                            </h4>
                            <div className="space-y-3">
                                <div className="bg-white border border-slate-200 rounded-xl p-4 shadow-sm hover:shadow-md transition-shadow">
                                    <div className="text-[10px] text-slate-400 font-bold uppercase mb-2">Area Sales Manager</div>
                                    <div className="font-semibold text-slate-800 flex items-center gap-3">
                                        <div className="w-8 h-8 rounded-full bg-orange-100 flex items-center justify-center text-xs text-orange-700 font-bold border border-orange-200">
                                            {ticket.asm_name ? ticket.asm_name.charAt(0) : 'A'}
                                        </div>
                                        {ticket.asm_name || 'Not assigned'}
                                    </div>
                                </div>
                                <div className="bg-white border border-slate-200 rounded-xl p-4 shadow-sm hover:shadow-md transition-shadow">
                                    <div className="text-[10px] text-slate-400 font-bold uppercase mb-2">Regional Sales Manager</div>
                                    <div className="font-semibold text-slate-800 flex items-center gap-3">
                                        <div className="w-8 h-8 rounded-full bg-blue-100 flex items-center justify-center text-xs text-blue-700 font-bold border border-blue-200">
                                            {ticket.rsm_name ? ticket.rsm_name.charAt(0) : 'R'}
                                        </div>
                                        {ticket.rsm_name || 'Not assigned'}
                                    </div>
                                </div>
                            </div>
                        </div>
                    )}

                    {/* Audit Trail / History */}
                    <div>
                        <h4 className="text-sm font-bold text-slate-800 mb-3 flex items-center gap-2">
                            <Clock className="w-4 h-4 text-slate-500" /> Audit Trail
                        </h4>
                        <div className="bg-slate-50 border border-slate-200 rounded-xl p-4 space-y-4">
                            <div className="relative pl-4 border-l-2 border-slate-200 pb-1">
                                <div className="absolute -left-[5px] top-0 w-2 h-2 rounded-full bg-slate-300"></div>
                                <div className="text-xs font-semibold text-slate-500 uppercase">Created</div>
                                <div className="text-sm font-medium text-slate-800 mt-0.5">
                                    {format(new Date(ticket.createdAt), 'MMM d, yyyy h:mm a')}
                                </div>
                                <div className="text-xs text-slate-500">
                                    by <span className="font-medium text-slate-700">{ticket.createdBy?.name || 'System/Admin'}</span>
                                </div>
                            </div>

                            <div className="relative pl-4 border-l-2 border-slate-200 pb-1">
                                <div className="absolute -left-[5px] top-0 w-2 h-2 rounded-full bg-blue-300"></div>
                                <div className="text-xs font-semibold text-slate-500 uppercase">Last Updated</div>
                                <div className="text-sm font-medium text-slate-800 mt-0.5">
                                    {format(new Date(ticket.updatedAt), 'MMM d, yyyy h:mm a')}
                                </div>
                            </div>

                            {isClosed && ticket.closedAt && (
                                <div className="relative pl-4 border-l-2 border-emerald-200">
                                    <div className="absolute -left-[5px] top-0 w-2 h-2 rounded-full bg-emerald-500"></div>
                                    <div className="text-xs font-semibold text-emerald-600 uppercase">Closed</div>
                                    <div className="text-sm font-medium text-slate-800 mt-0.5">
                                        {format(new Date(ticket.closedAt), 'MMM d, yyyy h:mm a')}
                                    </div>
                                    <div className="text-xs text-slate-500">
                                        by <span className="font-medium text-slate-700">{ticket.closedBy || 'User'}</span>
                                    </div>
                                </div>
                            )}
                        </div>
                    </div>

                    {/* Tags */}
                    {ticket.tags && ticket.tags.length > 0 && ticket.tags[0] !== ticket.complaintType && (
                        <div>
                            <h4 className="flex items-center gap-2 text-sm font-semibold text-slate-800 mb-2">
                                <Tag className="w-3.5 h-3.5 text-slate-400" /> Tags
                            </h4>
                            <div className="flex flex-wrap gap-2">
                                {ticket.tags.map((tag, idx) => (
                                    <span key={idx} className="px-2.5 py-1 rounded-md bg-slate-50 text-slate-600 text-xs font-medium border border-slate-200">
                                        #{tag}
                                    </span>
                                ))}
                            </div>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
}


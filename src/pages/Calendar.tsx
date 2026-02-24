import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
    format,
    addMonths,
    subMonths,
    startOfMonth,
    endOfMonth,
    startOfWeek,
    endOfWeek,
    isSameMonth,
    isSameDay,
    addDays,
    parseISO,
    addHours,
    isToday
} from 'date-fns';
import {
    ChevronLeft,
    ChevronRight,
    Clock,
    AlertCircle,
    Plus,
    CalendarDays,
    Zap
} from 'lucide-react';
import { useTickets } from '../context/TicketContext';
import { cn } from '../lib/utils';
import { STATUS_STYLES } from '../types/ticket';

export default function Calendar() {
    const { tickets, loading } = useTickets();
    const [currentMonth, setCurrentMonth] = useState(new Date());
    const [selectedDate, setSelectedDate] = useState<Date | null>(new Date());
    const [filter, setFilter] = useState<'all' | 'sla' | 'registered'>('all');
    const [direction, setDirection] = useState(0);

    const goToNextMonth = () => {
        setDirection(1);
        setCurrentMonth(addMonths(currentMonth, 1));
    };
    const goToPrevMonth = () => {
        setDirection(-1);
        setCurrentMonth(subMonths(currentMonth, 1));
    };

    const variants = {
        enter: (direction: number) => ({
            x: direction > 0 ? 20 : -20,
            opacity: 0
        }),
        center: {
            zIndex: 1,
            x: 0,
            opacity: 1
        },
        exit: (direction: number) => ({
            zIndex: 0,
            x: direction < 0 ? 20 : -20,
            opacity: 0
        })
    };

    const renderHeader = () => (
        <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4 mb-4">
            <div className="flex items-center gap-4">
                <div className="relative">
                    <div className="absolute inset-0 bg-indigo-500 blur-xl opacity-10 dark:opacity-20 rounded-full animate-pulse" />
                    <div className="relative p-2.5 bg-gradient-to-br from-indigo-500 to-indigo-700 rounded-xl text-white shadow-lg">
                        <CalendarDays className="w-6 h-6" />
                    </div>
                </div>
                <div>
                    <h1 className="text-xl font-black text-slate-900 dark:text-white tracking-tight">Service Calendar</h1>
                    <div className="flex items-center gap-1.5 mt-0.5">
                        <span className="flex h-1.5 w-1.5 rounded-full bg-green-500" />
                        <p className="text-[10px] font-bold text-slate-500 dark:text-slate-400 uppercase tracking-widest">Live Sync</p>
                    </div>
                </div>
            </div>

            <div className="flex flex-wrap items-center gap-3">
                <div className="flex items-center p-1 bg-slate-100/50 dark:bg-slate-800/50 backdrop-blur-md rounded-xl border border-slate-200/50 dark:border-slate-700/50">
                    {(['all', 'registered', 'sla'] as const).map((f) => (
                        <button
                            key={f}
                            onClick={() => setFilter(f)}
                            className={cn(
                                "relative px-4 py-1.5 text-[10px] font-bold rounded-lg transition-all capitalize z-10",
                                filter === f
                                    ? "text-white"
                                    : "text-slate-500 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-200"
                            )}
                        >
                            {filter === f && (
                                <motion.div
                                    layoutId="filter-bg"
                                    className="absolute inset-0 bg-gradient-to-r from-indigo-600 to-indigo-500 rounded-lg shadow-md -z-10"
                                    transition={{ type: "spring", bounce: 0.2, duration: 0.6 }}
                                />
                            )}
                            {f}
                        </button>
                    ))}
                </div>

                <div className="flex items-center gap-1 p-1 bg-white dark:bg-slate-900 rounded-xl border border-slate-200/60 dark:border-slate-800/60 shadow-lg">
                    <button
                        onClick={goToPrevMonth}
                        className="p-1.5 hover:bg-slate-50 dark:hover:bg-slate-800 rounded-lg text-slate-600 dark:text-slate-300 transition-all active:scale-90"
                    >
                        <ChevronLeft className="w-4 h-4" />
                    </button>
                    <div className="px-4 font-black text-slate-900 dark:text-white min-w-[140px] text-center text-[11px] uppercase tracking-tighter">
                        {format(currentMonth, 'MMMM yyyy')}
                    </div>
                    <button
                        onClick={goToNextMonth}
                        className="p-1.5 hover:bg-slate-50 dark:hover:bg-slate-800 rounded-lg text-slate-600 dark:text-slate-300 transition-all active:scale-90"
                    >
                        <ChevronRight className="w-4 h-4" />
                    </button>
                </div>
            </div>
        </div>
    );

    const renderDays = () => {
        const days = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
        return (
            <div className="grid grid-cols-7 mb-2 px-2">
                {days.map((day) => (
                    <div key={day} className="text-center py-1 text-[9px] font-black text-slate-400 dark:text-slate-600 uppercase tracking-[0.2em]">
                        {day}
                    </div>
                ))}
            </div>
        );
    };

    const renderCells = () => {
        const monthStart = startOfMonth(currentMonth);
        const monthEnd = endOfMonth(monthStart);
        const startDate = startOfWeek(monthStart);
        const endDate = endOfWeek(monthEnd);

        const rows = [];
        let days = [];
        let day = startDate;

        while (day <= endDate) {
            for (let i = 0; i < 7; i++) {
                const cloneDay = day;
                const dailyTickets = tickets.filter(t => isSameDay(parseISO(t.createdAt), cloneDay));
                const slaTickets = tickets.filter(t => {
                    if (!t.sla_hours) return false;
                    const dueDate = addHours(parseISO(t.createdAt), t.sla_hours);
                    return isSameDay(dueDate, cloneDay);
                });

                const hasRegistered = dailyTickets.length > 0 && (filter === 'all' || filter === 'registered');
                const hasSla = slaTickets.length > 0 && (filter === 'all' || filter === 'sla');

                days.push(
                    <motion.div
                        key={day.toString()}
                        onClick={() => setSelectedDate(cloneDay)}
                        whileHover={{ y: -1, backgroundColor: 'rgba(99, 102, 241, 0.05)' }}
                        className={cn(
                            "relative flex flex-col border border-slate-100/50 dark:border-slate-800/30 p-1.5 md:p-2 cursor-pointer transition-all overflow-hidden min-h-0",
                            !isSameMonth(day, monthStart) ? "bg-slate-50/20 dark:bg-slate-900/5 text-slate-300 dark:text-slate-700 opacity-30" : "bg-white dark:bg-slate-900",
                            selectedDate && isSameDay(day, selectedDate) && "bg-indigo-50/30 dark:bg-indigo-500/5 ring-2 ring-inset ring-indigo-500 z-10 shadow-lg shadow-indigo-500/10",
                            isToday(day) && !selectedDate && "bg-blue-50/30 dark:bg-blue-500/5"
                        )}
                    >
                        <div className="flex items-center justify-between relative z-10">
                            <span className={cn(
                                "text-[10px] font-black tracking-tighter transition-colors",
                                isToday(day)
                                    ? "w-5 h-5 flex items-center justify-center bg-indigo-600 text-white rounded-md shadow-sm"
                                    : "text-slate-400 dark:text-slate-600"
                            )}>
                                {format(day, 'd')}
                            </span>
                            {isToday(day) && (
                                <Zap className="w-2.5 h-2.5 text-indigo-500 animate-pulse" />
                            )}
                        </div>

                        <div className="mt-1 space-y-1 relative z-10 flex-1 flex flex-col justify-end">
                            {hasRegistered && (
                                <div
                                    className="flex items-center gap-1 px-1.5 py-0.5 bg-blue-500/10 border border-blue-500/20 text-blue-600 dark:text-blue-400 rounded-md text-[8px] font-black uppercase tracking-tight truncate"
                                >
                                    <div className="w-1 h-1 rounded-full bg-blue-500 shrink-0" />
                                    <span className="truncate">{dailyTickets.length} NEW</span>
                                </div>
                            )}
                            {hasSla && (
                                <div
                                    className="flex items-center gap-1 px-1.5 py-0.5 bg-orange-500/10 border border-orange-500/20 text-orange-600 dark:text-orange-400 rounded-md text-[8px] font-black uppercase tracking-tight truncate"
                                >
                                    <div className="w-1 h-1 rounded-full bg-orange-500 animate-pulse shrink-0" />
                                    <span className="truncate">{slaTickets.length} SLA</span>
                                </div>
                            )}
                        </div>

                        {/* Background Ornament */}
                        {!isSameMonth(day, monthStart) && (
                            <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 text-2xl opacity-[0.02] font-black select-none pointer-events-none">
                                {format(day, 'MMM')}
                            </div>
                        )}
                    </motion.div>
                );
                day = addDays(day, 1);
            }
            rows.push(
                <div className="grid grid-cols-7 h-full" key={day.toString()}>
                    {days}
                </div>
            );
            days = [];
        }

        const rowCount = rows.length;

        return (
            <motion.div
                custom={direction}
                variants={variants}
                initial="enter"
                animate="center"
                exit="exit"
                transition={{
                    x: { type: "spring", stiffness: 300, damping: 30 },
                    opacity: { duration: 0.2 }
                }}
                className={cn(
                    "h-full grid overflow-hidden border border-slate-200/60 dark:border-slate-800/60 shadow-xl bg-white dark:bg-slate-900 rounded-[1.5rem]",
                    rowCount === 4 ? "grid-rows-4" : rowCount === 5 ? "grid-rows-5" : "grid-rows-6"
                )}
            >
                {rows}
            </motion.div>
        );
    };

    const renderDetails = () => {
        if (!selectedDate) return null;

        const registeredInDay = tickets.filter(t => isSameDay(parseISO(t.createdAt), selectedDate));
        const slaInDay = tickets.filter(t => {
            if (!t.sla_hours) return false;
            const dueDate = addHours(parseISO(t.createdAt), t.sla_hours);
            return isSameDay(dueDate, selectedDate);
        });

        const hasEvents = registeredInDay.length > 0 || slaInDay.length > 0;

        return (
            <AnimatePresence>
                {selectedDate && (
                    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
                        <motion.div
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            exit={{ opacity: 0 }}
                            onClick={() => setSelectedDate(null)}
                            className="absolute inset-0 bg-slate-950/40 backdrop-blur-[2px]"
                        />
                        <motion.div
                            initial={{ opacity: 0, scale: 0.95, y: 10 }}
                            animate={{ opacity: 1, scale: 1, y: 0 }}
                            exit={{ opacity: 0, scale: 0.95, y: 10 }}
                            className="relative w-full max-w-2xl bg-white dark:bg-slate-900 rounded-[2rem] shadow-2xl overflow-hidden border border-slate-200/50 dark:border-slate-800/50"
                        >
                            <div className="flex flex-col h-[70vh] max-h-[600px]">
                                <div className="p-6 pb-4 flex items-center justify-between border-b border-slate-100 dark:border-slate-800">
                                    <div>
                                        <h2 className="text-2xl font-black text-slate-900 dark:text-white tracking-tighter">
                                            {format(selectedDate, 'do MMMM')}
                                        </h2>
                                        <p className="text-[10px] font-bold text-indigo-500 uppercase tracking-[0.2em]">{format(selectedDate, 'EEEE')}</p>
                                    </div>
                                    <button
                                        onClick={() => setSelectedDate(null)}
                                        className="p-2 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-full transition-colors text-slate-500"
                                    >
                                        <Plus className="rotate-45 w-5 h-5" />
                                    </button>
                                </div>

                                <div className="flex-1 overflow-y-auto p-6 custom-scrollbar">
                                    {!hasEvents ? (
                                        <div className="h-full flex flex-col items-center justify-center text-center">
                                            <div className="w-16 h-16 bg-slate-50 dark:bg-slate-800/50 rounded-full flex items-center justify-center mb-3">
                                                <CalendarDays className="w-8 h-8 text-slate-200 dark:text-slate-700" />
                                            </div>
                                            <p className="text-sm font-bold text-slate-400 uppercase tracking-widest">No Events</p>
                                        </div>
                                    ) : (
                                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                            {/* Registrations */}
                                            <div className="space-y-4">
                                                <div className="flex items-center gap-3">
                                                    <div className="p-1.5 bg-blue-500/10 rounded-lg">
                                                        <Zap className="w-3 h-3 text-blue-500" />
                                                    </div>
                                                    <h3 className="text-[10px] font-black uppercase tracking-widest text-slate-500">Tickets ({registeredInDay.length})</h3>
                                                </div>
                                                <div className="space-y-3">
                                                    {registeredInDay.map((ticket) => (
                                                        <div key={ticket.id} className="p-3 bg-slate-50 dark:bg-slate-800/40 border border-slate-200/50 dark:border-slate-700/50 rounded-xl">
                                                            <div className="flex items-center justify-between mb-1.5">
                                                                <span className="text-[9px] font-black text-indigo-500">{ticket.ticketNo}</span>
                                                                <span className={cn("text-[8px] px-2 py-0.5 rounded-full font-black uppercase", STATUS_STYLES[ticket.status])}>{ticket.status}</span>
                                                            </div>
                                                            <h4 className="text-xs font-bold text-slate-900 dark:text-white line-clamp-1 mb-1.5">{ticket.title}</h4>
                                                            <div className="text-[9px] text-slate-500 flex items-center gap-1 font-medium italic">
                                                                <Clock className="w-2.5 h-2.5" />
                                                                {format(parseISO(ticket.createdAt), 'h:mm a')}
                                                            </div>
                                                        </div>
                                                    ))}
                                                </div>
                                            </div>

                                            {/* SLA Section */}
                                            <div className="space-y-4">
                                                <div className="flex items-center gap-3">
                                                    <div className="p-1.5 bg-orange-500/10 rounded-lg">
                                                        <Clock className="w-3 h-3 text-orange-500" />
                                                    </div>
                                                    <h3 className="text-[10px] font-black uppercase tracking-widest text-slate-500">Deadlines ({slaInDay.length})</h3>
                                                </div>
                                                <div className="space-y-3">
                                                    {slaInDay.map((ticket) => (
                                                        <div key={ticket.id} className="p-3 bg-orange-50/50 dark:bg-orange-950/20 border border-orange-200/50 dark:border-orange-500/20 rounded-xl">
                                                            <div className="flex items-center justify-between mb-1.5">
                                                                <span className="text-[9px] font-black text-orange-500">{ticket.ticketNo}</span>
                                                                <div className="flex items-center gap-1 text-red-500 font-black text-[8px] animate-pulse">
                                                                    <AlertCircle className="w-2.5 h-2.5" />
                                                                    CRITICAL
                                                                </div>
                                                            </div>
                                                            <h4 className="text-xs font-bold text-slate-900 dark:text-white line-clamp-1 mb-1.5">{ticket.title}</h4>
                                                            <div className="text-[9px] text-red-500 font-black flex items-center gap-1">
                                                                <Clock className="w-2.5 h-2.5" />
                                                                Expires {format(addHours(parseISO(ticket.createdAt), ticket.sla_hours || 0), 'p')}
                                                            </div>
                                                        </div>
                                                    ))}
                                                </div>
                                            </div>
                                        </div>
                                    )}
                                </div>

                                <div className="p-6 bg-slate-50 dark:bg-slate-800/50 border-t border-slate-100 dark:border-slate-800 flex justify-end">
                                    <button
                                        onClick={() => setSelectedDate(null)}
                                        className="px-6 py-2.5 bg-slate-900 dark:bg-white text-white dark:text-slate-900 rounded-xl font-black text-[10px] uppercase tracking-widest hover:scale-105 transition-transform"
                                    >
                                        Dismiss
                                    </button>
                                </div>
                            </div>
                        </motion.div>
                    </div>
                )}
            </AnimatePresence>
        );
    };

    return (
        <div className="h-full max-h-[calc(100vh-8.5rem)] md:h-[calc(100vh-8.5rem)] p-4 md:px-8 md:py-4 bg-slate-50/50 dark:bg-slate-950/20 transition-colors duration-500 overflow-hidden">
            <div className="max-w-[1400px] mx-auto h-full flex flex-col w-full">
                {renderHeader()}
                <div className="flex-1 flex flex-col min-h-0">
                    {renderDays()}
                    <AnimatePresence mode="wait">
                        {loading ? (
                            <motion.div
                                initial={{ opacity: 0 }}
                                animate={{ opacity: 1 }}
                                exit={{ opacity: 0 }}
                                className="flex-1 flex items-center justify-center p-20 bg-white dark:bg-slate-900 rounded-[2rem] border border-slate-200/60 dark:border-slate-800/60 border-dashed shadow-xl"
                            >
                                <div className="flex flex-col items-center gap-6">
                                    <div className="relative">
                                        <div className="absolute inset-0 bg-indigo-500 blur-xl opacity-20 animate-pulse rounded-full" />
                                        <div className="w-12 h-12 border-4 border-indigo-600 border-t-transparent rounded-full animate-spin relative" />
                                    </div>
                                    <div className="text-center">
                                        <span className="text-xs font-black text-slate-800 dark:text-white block mb-1 tracking-[0.2em] uppercase italic">Synchronizing</span>
                                    </div>
                                </div>
                            </motion.div>
                        ) : (
                            <div key={format(currentMonth, 'yyyy-MM')} className="flex-1 min-h-0">
                                {renderCells()}
                            </div>
                        )}
                    </AnimatePresence>
                </div>
            </div>

            {renderDetails()}
        </div>
    );
}

import { Edit2, Trash2 } from 'lucide-react';
import { motion } from 'framer-motion';
import { cn } from '../../lib/utils';

interface MasterCardProps {
    title: string;
    subtitle?: string;
    tags?: { label: string; color: string }[];
    details?: { label: string; value: string | number | null | undefined }[];
    onEdit?: () => void;
    onDelete?: () => void;
    className?: string;
}

export function MasterCard({
    title,
    subtitle,
    tags = [],
    details = [],
    onEdit,
    onDelete,
    className
}: MasterCardProps) {
    return (
        <motion.div
            layout
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.95 }}
            whileHover={{ y: -5 }}
            className={cn(
                "glass-card p-6 group relative overflow-hidden transition-all duration-300 hover:shadow-xl hover:shadow-indigo-500/10",
                className
            )}
        >
            {/* Background Accent */}
            <div className="absolute top-0 right-0 w-32 h-32 bg-indigo-500/5 rounded-full -mr-16 -mt-16 blur-3xl group-hover:bg-indigo-500/10 transition-colors duration-500" />

            <div className="relative z-10">
                <div className="flex justify-between items-start mb-4">
                    <div className="space-y-1 min-w-0 flex-1">
                        <div className="flex items-center gap-2">
                            <h3 className="text-lg font-bold text-slate-900 truncate tracking-tight">{title}</h3>
                            <div className="flex gap-1 flex-shrink-0">
                                {tags.map((tag, idx) => (
                                    <span
                                        key={idx}
                                        className={cn(
                                            "px-1.5 py-0.5 rounded text-[9px] font-black uppercase tracking-wider border whitespace-nowrap",
                                            tag.color || "bg-slate-100 text-slate-600 border-slate-200"
                                        )}
                                    >
                                        {tag.label}
                                    </span>
                                ))}
                            </div>
                        </div>
                        {subtitle && (
                            <p className="text-xs text-slate-500 font-medium truncate uppercase tracking-widest">{subtitle}</p>
                        )}
                    </div>
                </div>

                {details.length > 0 && (
                    <div className="space-y-3 mt-4 pt-4 border-t border-slate-100/50">
                        {details.map((detail, idx) => (
                            <div key={idx} className="flex justify-between items-center text-xs">
                                <span className="text-slate-400 font-bold uppercase tracking-tighter">{detail.label}</span>
                                <span className="text-slate-700 font-black truncate max-w-[150px]">{detail.value || '—'}</span>
                            </div>
                        ))}
                    </div>
                )}

                <div className="flex items-center justify-end gap-2 mt-6 pt-4 border-t border-slate-100/50 opacity-0 group-hover:opacity-100 transition-opacity duration-300">
                    {onEdit && (
                        <button
                            onClick={(e) => {
                                e.stopPropagation();
                                onEdit();
                            }}
                            className="p-2 bg-indigo-50 text-indigo-600 rounded-lg hover:bg-indigo-100 transition-colors shadow-sm border border-indigo-100/50"
                            title="Edit"
                        >
                            <Edit2 className="w-4 h-4" />
                        </button>
                    )}
                    {onDelete && (
                        <button
                            onClick={(e) => {
                                e.stopPropagation();
                                onDelete();
                            }}
                            className="p-2 bg-red-50 text-red-600 rounded-lg hover:bg-red-100 transition-colors shadow-sm border border-red-100/50"
                            title="Delete"
                        >
                            <Trash2 className="w-4 h-4" />
                        </button>
                    )}
                </div>
            </div>
        </motion.div>
    );
}

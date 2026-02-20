import { Edit2, Trash2 } from 'lucide-react';
import { motion } from 'framer-motion';

interface MasterCardProps {
    title: string;
    subtitle?: string;
    tags?: { label: string; color: string }[];
    details?: { label: string; value: string }[];
    onEdit: () => void;
    onDelete: () => void;
}

export function MasterCard({ title, subtitle, tags, details, onEdit, onDelete }: MasterCardProps) {
    return (
        <motion.div
            layout
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95 }}
            className="group relative bg-white rounded-2xl p-6 shadow-sm hover:shadow-xl transition-all duration-300 border border-slate-100 hover:border-indigo-100 overflow-hidden"
        >
            {/* Decorative Gradient Background on Hover */}
            <div className="absolute inset-0 bg-gradient-to-br from-indigo-50/0 via-indigo-50/0 to-indigo-50/30 opacity-0 group-hover:opacity-100 transition-opacity duration-500" />

            <div className="absolute top-4 right-4 flex gap-2 opacity-0 group-hover:opacity-100 transition-all duration-300 translate-x-2 group-hover:translate-x-0">
                <button
                    onClick={(e) => { e.stopPropagation(); onEdit(); }}
                    className="p-2 bg-white/80 backdrop-blur-sm text-indigo-600 rounded-xl hover:bg-indigo-50 shadow-sm border border-slate-100 transition-colors"
                    title="Edit"
                >
                    <Edit2 size={16} />
                </button>
                <button
                    onClick={(e) => { e.stopPropagation(); onDelete(); }}
                    className="p-2 bg-white/80 backdrop-blur-sm text-red-500 rounded-xl hover:bg-red-50 shadow-sm border border-slate-100 transition-colors"
                    title="Delete"
                >
                    <Trash2 size={16} />
                </button>
            </div>

            <div className="relative mb-5 pr-16">
                <div className="w-10 h-10 rounded-xl bg-indigo-50 flex items-center justify-center mb-3 text-indigo-600 group-hover:scale-110 transition-transform duration-300">
                    <span className="text-lg font-bold font-display">{title.charAt(0)}</span>
                </div>
                <h3 className="text-lg font-bold text-slate-800 tracking-tight font-display group-hover:text-indigo-700 transition-colors line-clamp-1">{title}</h3>
                {subtitle && <p className="text-sm text-slate-500 font-medium mt-1">{subtitle}</p>}
            </div>

            {tags && tags.length > 0 && (
                <div className="relative flex flex-wrap gap-2 mb-5">
                    {tags.map((tag, idx) => (
                        <span key={idx} className={`px-2.5 py-1 text-[11px] uppercase tracking-wider font-bold rounded-lg ${tag.color}`}>
                            {tag.label}
                        </span>
                    ))}
                </div>
            )}

            <div className="relative space-y-2.5 border-t border-slate-100 pt-4">
                {details?.map((detail, idx) => (
                    <div key={idx} className="flex justify-between items-center text-sm group/item">
                        <span className="text-slate-400 font-medium">{detail.label}</span>
                        <span className="font-semibold text-slate-700 group-hover/item:text-slate-900 transition-colors text-right truncate pl-4">{detail.value}</span>
                    </div>
                ))}
            </div>
        </motion.div>
    );
}

import { X } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { useEffect } from 'react';

interface MasterModalProps {
    isOpen: boolean;
    onClose: () => void;
    title: string;
    children: React.ReactNode;
    onSubmit: () => void;
    isSubmitting?: boolean;
}

export function MasterModal({ isOpen, onClose, title, children, onSubmit, isSubmitting }: MasterModalProps) {

    // Close on Escape
    useEffect(() => {
        const handleEsc = (e: KeyboardEvent) => {
            if (e.key === 'Escape') onClose();
        };
        window.addEventListener('keydown', handleEsc);
        return () => window.removeEventListener('keydown', handleEsc);
    }, [onClose]);

    if (!isOpen) return null;

    return (
        <AnimatePresence>
            <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
                {/* Backdrop */}
                <motion.div
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    onClick={onClose}
                    className="absolute inset-0 bg-black/40 backdrop-blur-sm"
                />

                {/* Modal Content */}
                <motion.div
                    initial={{ scale: 0.95, opacity: 0, y: 10 }}
                    animate={{ scale: 1, opacity: 1, y: 0 }}
                    exit={{ scale: 0.95, opacity: 0, y: 10 }}
                    className="relative w-full max-w-lg bg-white rounded-2xl shadow-xl border border-slate-100 overflow-hidden max-h-[90vh] flex flex-col"
                >
                    <div className="flex items-center justify-between px-6 py-4 border-b border-slate-100 bg-slate-50/50">
                        <h2 className="text-lg font-bold text-slate-800">{title}</h2>
                        <button onClick={onClose} className="p-2 -mr-2 text-slate-400 hover:text-slate-600 hover:bg-slate-100 rounded-lg transition-colors">
                            <X size={20} />
                        </button>
                    </div>

                    <div className="flex-1 overflow-y-auto p-6">
                        {children}
                    </div>

                    <div className="px-6 py-4 border-t border-slate-100 bg-slate-50/50 flex justify-end gap-3">
                        <button
                            onClick={onClose}
                            className="px-4 py-2 text-sm font-medium text-slate-600 hover:text-slate-800 hover:bg-slate-100 rounded-lg transition-colors"
                        >
                            Cancel
                        </button>
                        <button
                            onClick={onSubmit}
                            disabled={isSubmitting}
                            className="px-4 py-2 text-sm font-medium text-white bg-indigo-600 hover:bg-indigo-700 rounded-lg shadow-sm shadow-indigo-200 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
                        >
                            {isSubmitting ? 'Saving...' : 'Save Changes'}
                        </button>
                    </div>
                </motion.div>
            </div>
        </AnimatePresence>
    );
}

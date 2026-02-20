import { X } from 'lucide-react';
import { AnimatePresence, motion } from 'framer-motion';
import { useEffect } from 'react';
import { createPortal } from 'react-dom';

interface DrawerProps {
    isOpen: boolean;
    onClose: () => void;
    title: string;
    description?: string;
    children: React.ReactNode;
    width?: string;
}

export function Drawer({ isOpen, onClose, title, description, children, width = "max-w-md" }: DrawerProps) {
    // Prevent body scroll when open
    useEffect(() => {
        if (isOpen) {
            document.body.style.overflow = 'hidden';
        } else {
            document.body.style.overflow = 'unset';
        }
        return () => {
            document.body.style.overflow = 'unset';
        };
    }, [isOpen]);

    return createPortal(
        <AnimatePresence>
            {isOpen && (
                <>
                    {/* Backdrop */}
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        onClick={onClose}
                        className="fixed inset-0 bg-slate-900/40 backdrop-blur-sm z-50 transition-opacity"
                    />

                    {/* Drawer Panel */}
                    <motion.div
                        initial={{ x: '100%' }}
                        animate={{ x: 0 }}
                        exit={{ x: '100%' }}
                        transition={{ type: "spring", damping: 25, stiffness: 200 }}
                        className={`fixed inset-y-0 right-0 z-50 w-full ${width} bg-white shadow-2xl flex flex-col`}
                    >
                        {/* Header */}
                        <div className="flex items-center justify-between px-6 py-5 border-b border-slate-100 bg-white/50 backdrop-blur-sm sticky top-0 z-10">
                            <div>
                                <h2 className="text-lg font-bold text-slate-800 tracking-tight">{title}</h2>
                                {description && <p className="text-sm text-slate-500 mt-0.5">{description}</p>}
                            </div>
                            <button
                                onClick={onClose}
                                className="p-2 rounded-full hover:bg-slate-100 text-slate-400 hover:text-slate-600 transition-colors"
                            >
                                <X className="w-5 h-5" />
                            </button>
                        </div>

                        {/* Content */}
                        <div className="flex-1 overflow-y-auto p-6">
                            {children}
                        </div>
                    </motion.div>
                </>
            )}
        </AnimatePresence>,
        document.body
    );
}

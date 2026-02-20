import React from 'react';
import { X } from 'lucide-react';
import { createPortal } from 'react-dom';
import { motion, AnimatePresence } from 'framer-motion';

interface ModalProps {
    isOpen: boolean;
    onClose: () => void;
    children: React.ReactNode;
    title: string;
}

export function Modal({ isOpen, onClose, children, title }: ModalProps) {
    if (!isOpen) return null;

    return createPortal(
        <AnimatePresence>
            <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
                <motion.div
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    onClick={onClose}
                    className="absolute inset-0 bg-black/20 backdrop-blur-sm"
                />
                <motion.div
                    initial={{ scale: 0.95, opacity: 0 }}
                    animate={{ scale: 1, opacity: 1 }}
                    exit={{ scale: 0.95, opacity: 0 }}
                    className="relative bg-white rounded-2xl shadow-2xl w-full max-w-lg overflow-hidden glass-card border border-white/50"
                >
                    <div className="flex items-center justify-between px-6 py-4 border-b border-slate-100">
                        <h3 className="text-lg font-semibold text-slate-800">{title}</h3>
                        <button
                            onClick={onClose}
                            className="p-2 -mr-2 text-slate-400 hover:text-slate-600 hover:bg-slate-100 rounded-full transition-colors"
                        >
                            <X className="w-5 h-5" />
                        </button>
                    </div>
                    <div className="p-6">
                        {children}
                    </div>
                </motion.div>
            </div>
        </AnimatePresence>,
        document.body
    );
}

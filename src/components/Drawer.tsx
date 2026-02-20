import React, { useEffect } from 'react';
import { X } from 'lucide-react';
import { createPortal } from 'react-dom';
import { cn } from '../lib/utils';
import { motion, AnimatePresence } from 'framer-motion';

interface DrawerProps {
    isOpen: boolean;
    onClose: () => void;
    children: React.ReactNode;
    title?: string;
    size?: 'sm' | 'md' | 'lg' | 'xl' | '2xl' | '3xl' | '4xl' | 'full';
    noPadding?: boolean;
}

const sizes = {
    sm: 'max-w-sm',
    md: 'max-w-md',
    lg: 'max-w-lg',
    xl: 'max-w-xl',
    '2xl': 'max-w-2xl',
    '3xl': 'max-w-3xl',
    '4xl': 'max-w-4xl',
    full: 'max-w-full',
};

export function Drawer({ isOpen, onClose, children, title, size = 'md', noPadding = false }: DrawerProps) {
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
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        onClick={onClose}
                        className="fixed inset-0 bg-black/20 backdrop-blur-sm z-50 transition-opacity"
                    />
                    <motion.div
                        initial={{ x: '100%' }}
                        animate={{ x: 0 }}
                        exit={{ x: '100%' }}
                        transition={{ type: 'spring', damping: 20, stiffness: 300 }}
                        className={cn(
                            "fixed inset-y-0 right-0 z-50 h-full w-full bg-white shadow-2xl flex flex-col glass-card border-l border-white/50 rounded-l-2xl my-2 mr-2 max-h-[calc(100vh-16px)]",
                            sizes[size]
                        )}
                    >
                        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-100">
                            <h2 className="text-lg font-semibold text-slate-800">{title}</h2>
                            <button
                                onClick={onClose}
                                className="p-2 -mr-2 text-slate-400 hover:text-slate-600 hover:bg-slate-100 rounded-full transition-colors"
                            >
                                <X className="w-5 h-5" />
                            </button>
                        </div>
                        <div className={cn("flex-1 overflow-y-auto", noPadding ? "p-0" : "p-6")}>
                            {children}
                        </div>
                    </motion.div>
                </>
            )}
        </AnimatePresence>,
        document.body
    );
}

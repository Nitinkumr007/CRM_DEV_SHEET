import { LayoutDashboard, Ticket, Settings, Database, Users, BarChart3, LogOut, X, Calendar as CalendarIcon, Plus } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { useAuth } from '../context/AuthContext';
import { useTabs } from '../context/TabContext';

interface SidebarProps {
    isOpen: boolean;
    onClose: () => void;
}

export function Sidebar({ isOpen, onClose }: SidebarProps) {
    const { logout, user } = useAuth();
    const { updateTabPath, activeTabId } = useTabs();

    const menuItems = [
        { id: 'dashboard', label: 'Dashboard', icon: LayoutDashboard, path: '/' },
        { id: 'tickets', label: 'Tickets', icon: Ticket, path: '/tickets' },
        { id: 'calendar', label: 'Calendar', icon: CalendarIcon, path: '/calendar' },
        { id: 'customers', label: 'Customers', icon: Users, path: '/customers' },
        { id: 'reports', label: 'Reports', icon: BarChart3, path: '/reports' },
        { id: 'masters', label: 'Masters', icon: Database, path: '/masters' },
        { id: 'settings', label: 'Settings', icon: Settings, path: '/settings' },
    ];

    const handleNavigation = (path: string, label: string) => {
        // Update the CURRENT active tab's path
        updateTabPath(activeTabId, path, label);
        if (window.innerWidth < 768) {
            onClose();
        }
    };

    // We need to know the current path of the active tab to highlight sidebar items correcty
    const { tabs } = useTabs();
    const activeTab = tabs.find(t => t.id === activeTabId);
    const currentPath = activeTab?.path || '/';

    const SidebarContent = (
        <div className="h-full flex flex-col bg-white dark:bg-slate-900 border-r border-slate-200/60 dark:border-slate-800/60 transition-colors duration-300">
            {/* 1. Branding */}
            <div className="flex items-center gap-3 px-6 py-6 border-b border-slate-50 dark:border-slate-800/50">
                <div className="w-8 h-8 rounded-lg bg-indigo-600 flex items-center justify-center text-white font-bold text-lg shadow-indigo-200 dark:shadow-none">
                    C
                </div>
                <div>
                    <span className="font-bold text-xl text-slate-800 dark:text-slate-100 tracking-tight font-display">Gyandhara Industries</span>
                    {user && (
                        <div className="text-xs text-slate-500 dark:text-slate-400 font-medium -mt-1">
                            Hi, {user.name.split(' ')[0]}
                        </div>
                    )}
                </div>
                <button onClick={onClose} className="md:hidden ml-auto p-2 text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-lg">
                    <X size={20} />
                </button>
            </div>

            {/* 2. New Ticket Button (Prominent) */}
            <div className="px-4 py-4">
                <button
                    onClick={() => handleNavigation('/tickets/new', 'New Ticket')}
                    className="w-full flex items-center justify-center gap-2 px-4 py-3 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl font-bold shadow-lg shadow-indigo-200 dark:shadow-none transition-all active:scale-95 group"
                >
                    <Plus className="w-5 h-5 group-hover:rotate-90 transition-transform duration-300" />
                    <span>New Ticket</span>
                </button>
            </div>


            {/* 4. Navigation Links */}
            <nav className="flex-1 px-4 space-y-1 overflow-y-auto py-4">
                {menuItems.map((item) => (
                    <button
                        key={item.path}
                        onClick={() => handleNavigation(item.path, item.label)}
                        className={`w-full flex items-center gap-3 px-4 py-3 text-sm font-medium rounded-xl transition-all duration-200 group relative overflow-hidden ${currentPath === item.path
                            ? 'text-indigo-600 dark:text-indigo-400 bg-indigo-50 dark:bg-indigo-500/10 shadow-sm dark:shadow-none'
                            : 'text-slate-500 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-200 hover:bg-slate-50 dark:hover:bg-slate-800/50'
                            }`}
                    >
                        {currentPath === item.path && (
                            <div className="absolute left-0 top-1/2 -translate-y-1/2 w-1 h-8 bg-indigo-600 dark:bg-indigo-500 rounded-r-full" />
                        )}
                        <item.icon className={`w-5 h-5 transition-colors ${currentPath === item.path ? 'text-indigo-600 dark:text-indigo-400' : 'text-slate-400 dark:text-slate-500 group-hover:text-slate-600 dark:group-hover:text-slate-300'}`} />
                        {item.label}
                    </button>
                ))}
            </nav>

            {/* 5. Logout */}
            <div className="p-4 border-t border-slate-100 dark:border-slate-800 mt-auto">
                <button
                    onClick={logout}
                    className="w-full flex items-center gap-3 px-3 py-2 text-slate-500 dark:text-slate-400 hover:text-red-600 dark:hover:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/10 rounded-lg transition-all text-sm font-medium group"
                >
                    <LogOut className="w-4 h-4 group-hover:-translate-x-1 transition-transform" />
                    <span>Sign Out</span>
                </button>
            </div>
        </div>
    );

    return (
        <>
            {/* Desktop Sidebar */}
            <aside className="hidden md:flex fixed left-4 top-4 h-[calc(100vh-2rem)] w-64 glass-card z-30 flex-col overflow-hidden">
                {SidebarContent}
            </aside>

            {/* Mobile Sidebar (Drawer) */}
            <AnimatePresence>
                {isOpen && (
                    <>
                        <motion.div
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            exit={{ opacity: 0 }}
                            onClick={onClose}
                            className="fixed inset-0 bg-black/20 backdrop-blur-sm z-40 md:hidden"
                        />
                        <motion.aside
                            initial={{ x: "-100%" }}
                            animate={{ x: 0 }}
                            exit={{ x: "-100%" }}
                            transition={{ type: "spring", stiffness: 300, damping: 30 }}
                            className="fixed left-0 top-0 h-full w-72 bg-white/90 backdrop-blur-xl border-r border-white/20 z-50 md:hidden shadow-2xl overflow-hidden"
                        >
                            {SidebarContent}
                        </motion.aside>
                    </>
                )}
            </AnimatePresence>
        </>
    );
}

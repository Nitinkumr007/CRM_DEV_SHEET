import { Bell, User as UserIcon, Menu, LogOut } from 'lucide-react';
import type { User } from '../types/ticket';
import { useLocation } from 'react-router-dom';

interface HeaderProps {
    onMenuClick: () => void;
    user: User | null;
    onLogout: () => void;
}

export function Header({ onMenuClick, user, onLogout }: HeaderProps) {
    const location = useLocation();

    const getPageTitle = (path: string) => {
        switch (path) {
            case '/': return 'Dashboard';
            case '/tickets': return 'Ticket Management';
            case '/reports': return 'Reports & Analytics';
            case '/masters': return 'Master Data';
            case '/settings': return 'Settings';
            default: return 'Overview';
        }
    };

    return (
        <header className="fixed top-0 md:top-4 left-0 md:left-72 right-0 md:right-4 h-16 md:h-20 glass-card flex items-center justify-between px-4 md:px-8 z-30 transition-all duration-300 rounded-none md:rounded-2xl border-b md:border border-slate-200/50">
            <div className="flex items-center gap-4 flex-1">
                <button
                    onClick={onMenuClick}
                    className="md:hidden p-2 -ml-2 text-slate-600 hover:bg-slate-100 rounded-lg transition-colors"
                >
                    <Menu size={24} />
                </button>

                <h1 className="text-xl font-bold text-slate-800 tracking-tight hidden md:block font-display">
                    {getPageTitle(location.pathname)}
                </h1>
            </div>

            <div className="flex items-center gap-3 md:gap-4">
                <button className="relative p-2.5 rounded-xl hover:bg-slate-50 text-slate-600 transition-colors hidden sm:block">
                    <Bell className="w-5 h-5" />
                    <span className="absolute top-2.5 right-2.5 w-2 h-2 bg-red-500 rounded-full border-2 border-white animate-pulse"></span>
                </button>

                <div className="flex items-center gap-3 pl-2 sm:pl-4 border-l border-slate-100">
                    <div className="text-right hidden md:block">
                        <div className="text-sm font-semibold text-slate-800">{user?.name || 'User'}</div>
                        <div className="text-xs text-slate-500 capitalize">{user?.role || 'Member'}</div>
                    </div>

                    <div className="group relative">
                        <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-blue-500 to-indigo-600 p-0.5 shadow-lg shadow-indigo-500/20 cursor-pointer hover:scale-105 transition-transform">
                            <div className="w-full h-full rounded-[10px] bg-white flex items-center justify-center overflow-hidden">
                                <UserIcon className="w-5 h-5 text-indigo-600" />
                            </div>
                        </div>

                        {/* Dropdown for Logout */}
                        <div className="absolute right-0 top-full mt-2 w-48 bg-white rounded-xl shadow-xl border border-slate-100 py-1 opacity-0 group-hover:opacity-100 invisible group-hover:visible transition-all duration-200 transform origin-top-right z-50">
                            <div className="px-4 py-3 border-b border-slate-50 md:hidden">
                                <p className="text-sm font-semibold text-slate-800">{user?.name || 'User'}</p>
                                <p className="text-xs text-slate-500">{user?.email || 'user@example.com'}</p>
                            </div>
                            <button
                                onClick={onLogout}
                                className="w-full text-left px-4 py-2 text-sm text-slate-600 hover:bg-red-50 hover:text-red-600 flex items-center gap-2"
                            >
                                <LogOut size={16} />
                                Sign Out
                            </button>
                        </div>
                    </div>
                </div>
            </div>
        </header>
    );
}

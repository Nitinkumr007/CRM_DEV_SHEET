import { X, Plus, ScanFace } from 'lucide-react';
import { useTabs } from '../../context/TabContext';
import { useAuth } from '../../context/AuthContext';
import { ThemeToggle } from '../ThemeToggle';

export function TabsBar() {
    const { tabs, activeTabId, setActiveTab, closeTab, addTab } = useTabs();
    const { user } = useAuth();

    return (
        <div className="flex items-center pt-2 px-2 bg-slate-50/50 dark:bg-slate-900/50 backdrop-blur-md border-b border-slate-200 dark:border-slate-800 overflow-x-auto no-scrollbar gap-1 relative transition-colors duration-300">

            {tabs.map((tab) => (
                <div
                    key={tab.id}
                    onClick={() => setActiveTab(tab.id)}
                    className={`
                        group relative flex items-center gap-2 px-4 py-2 text-xs font-semibold rounded-t-xl transition-all cursor-pointer min-w-[120px] max-w-[200px] select-none
                        ${activeTabId === tab.id
                            ? 'bg-white dark:bg-slate-800 text-indigo-600 dark:text-indigo-400 shadow-[0_-2px_10px_-3px_rgba(0,0,0,0.05)] z-10'
                            : 'bg-transparent text-slate-500 dark:text-slate-400 hover:text-slate-800 dark:hover:text-slate-200 hover:bg-slate-200/50 dark:hover:bg-slate-800/50'
                        }
                    `}
                    style={{
                        marginBottom: activeTabId === tab.id ? '-1px' : '0'
                    }}
                >
                    <span className="truncate flex-1">{tab.title}</span>
                    {tab.closable && (
                        <button
                            onClick={(e) => {
                                e.stopPropagation();
                                closeTab(tab.id);
                            }}
                            className={`
                                p-0.5 rounded-full hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 opacity-0 group-hover:opacity-100 transition-all
                            `}
                        >
                            <X className="w-3 h-3" />
                        </button>
                    )}

                    {/* Divider for inactive tabs */}
                    {activeTabId !== tab.id && (
                        <div className="absolute right-0 top-1/2 -translate-y-1/2 h-4 w-px bg-slate-400/30 dark:bg-slate-600/30"></div>
                    )}
                </div>
            ))}

            {/* New Tab Button */}
            <button
                onClick={addTab}
                className="p-1.5 ml-1 rounded-full hover:bg-slate-300 dark:hover:bg-slate-700 text-slate-600 dark:text-slate-400 transition-colors"
                title="New Tab"
            >
                <Plus className="w-4 h-4" />
            </button>

            {/* Right Side: User Profile / Window Actions placeholders */}
            <div className="ml-auto flex items-center gap-3 pr-4 pb-2">
                <ThemeToggle />
                <div className="flex items-center gap-2.5 text-xs font-semibold text-slate-700 dark:text-slate-200 bg-white dark:bg-slate-800/80 px-3 py-1.5 rounded-xl border border-slate-200 dark:border-slate-700 shadow-sm hover:shadow-md transition-all cursor-default">
                    <div className="w-5 h-5 rounded-lg bg-indigo-50 dark:bg-indigo-500/10 flex items-center justify-center">
                        <ScanFace className="w-3.5 h-3.5 text-indigo-600 dark:text-indigo-400" />
                    </div>
                    <span>{user?.name || 'User'}</span>
                </div>
            </div>
        </div>
    );
}

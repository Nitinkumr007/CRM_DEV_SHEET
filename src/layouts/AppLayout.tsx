import { useState } from 'react';
import { Sidebar } from '../components/Sidebar';
import { useTabs } from '../context/TabContext';
import { TabsBar } from '../components/layout/TabsBar';

// Page Imports
import Dashboard from '../pages/Dashboard';
import Tickets from '../pages/Tickets';
import CreateTicket from '../pages/CreateTicket';
import Reports from '../pages/Reports';
import Masters from '../pages/Masters';
import Customers from '../pages/Customers';
import Settings from '../pages/Settings';

const COMPONENT_MAP: Record<string, React.ReactNode> = {
    '/': <Dashboard />,
    '/tickets': <Tickets />,
    '/tickets/new': <CreateTicket />,
    '/customers': <Customers />,
    '/reports': <Reports />,
    '/masters': <Masters />,
    '/settings': <Settings />,
};

export function AppLayout() {
    const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
    const { tabs, activeTabId } = useTabs();

    return (
        <div className="min-h-screen bg-slate-50 dark:bg-slate-950 relative flex transition-colors duration-300">
            {/* Background Gradients */}
            <div className="fixed inset-0 z-0 pointer-events-none overflow-hidden">
                <div className="absolute top-[-10%] left-[-10%] w-[40%] h-[40%] rounded-full bg-indigo-500/10 dark:bg-indigo-500/5 blur-[100px]" />
                <div className="absolute top-[20%] right-[-10%] w-[30%] h-[30%] rounded-full bg-blue-500/10 dark:bg-blue-500/5 blur-[100px]" />
                <div className="absolute bottom-[-10%] left-[20%] w-[30%] h-[30%] rounded-full bg-violet-500/10 dark:bg-violet-500/5 blur-[100px]" />
            </div>

            <Sidebar
                isOpen={isMobileMenuOpen}
                onClose={() => setIsMobileMenuOpen(false)}
            />

            <div className="flex-1 flex flex-col min-h-screen md:pl-72 transition-all duration-300 relative z-10 text-nowrap">

                {/* Tabs Bar - Acts as Title Bar */}
                <div className="sticky top-0 z-20 bg-slate-200/90 dark:bg-slate-900/90 backdrop-blur w-full border-b border-slate-300 dark:border-slate-800">
                    <TabsBar />
                </div>

                <main className="flex-1 p-4 overflow-y-auto">
                    <div className="max-w-7xl mx-auto h-full">
                        {tabs.map((tab) => {
                            // Find component for this path
                            // Simple matching: exact path or start with
                            // For now, exact mapping from COMPONENT_MAP
                            const Component = COMPONENT_MAP[tab.path];

                            return (
                                <div
                                    key={tab.id}
                                    style={{ display: activeTabId === tab.id ? 'block' : 'none' }}
                                    className="h-full animate-in fade-in duration-300"
                                >
                                    {Component || <div className="p-4 text-center text-slate-500">Page not found: {tab.path}</div>}
                                </div>
                            );
                        })}
                    </div>
                </main>
            </div>
        </div>
    );
}

import { createContext, useContext, useState, useEffect, type ReactNode } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';

export interface Tab {
    id: string; // Unique ID usually based on path
    path: string;
    title: string;
    closable: boolean;
}

interface TabContextType {
    tabs: Tab[];
    activeTabId: string;
    addTab: () => void;
    updateTabPath: (tabId: string, path: string, title?: string) => void;
    closeTab: (id: string) => void;
    setActiveTab: (id: string) => void;
}

const TabContext = createContext<TabContextType | undefined>(undefined);

export function TabProvider({ children }: { children: ReactNode }) {
    const [activeTabId, setActiveTabId] = useState<string>('default-tab');
    const [tabs, setTabs] = useState<Tab[]>([
        { id: 'default-tab', path: '/', title: 'Dashboard', closable: false }
    ]);
    const navigate = useNavigate();
    const location = useLocation();

    // Sync URL with Active Tab
    useEffect(() => {
        // If the URL matches a known tab, set it as active
        const existingTab = tabs.find(t => t.path === location.pathname);
        if (existingTab && existingTab.id !== activeTabId) {
            setActiveTabId(existingTab.id);
        }
    }, [location.pathname]);

    // When active tab changes, push to history (so back button works somewhat comfortably, 
    // though strict state preservation usually implies a single route. We will sync URL for bookmarkability).
    useEffect(() => {
        const tab = tabs.find(t => t.id === activeTabId);
        if (tab && location.pathname !== tab.path) {
            navigate(tab.path);
        }
    }, [activeTabId]);

    const addTab = () => {
        const newId = crypto.randomUUID();
        const defaultPath = '/';
        const defaultTitle = 'Dashboard';

        setTabs(prev => [...prev, {
            id: newId,
            path: defaultPath,
            title: defaultTitle,
            closable: true
        }]);
        setActiveTabId(newId);
    };

    const updateTabPath = (tabId: string, path: string, title?: string) => {
        setTabs(prev => prev.map(t => {
            if (t.id === tabId) {
                return { ...t, path, title: title || t.title };
            }
            return t;
        }));
    };

    const closeTab = (id: string) => {
        setTabs(prev => {
            const newTabs = prev.filter(t => t.id !== id);

            // If we closed the active tab, switch to the last one
            if (activeTabId === id) {
                const lastTab = newTabs[newTabs.length - 1];
                if (lastTab) {
                    setActiveTabId(lastTab.id);
                }
            }
            return newTabs;
        });
    };

    return (
        <TabContext.Provider value={{ tabs, activeTabId, addTab, updateTabPath, closeTab, setActiveTab: setActiveTabId }}>
            {children}
        </TabContext.Provider>
    );
}

export function useTabs() {
    const context = useContext(TabContext);
    if (context === undefined) {
        throw new Error('useTabs must be used within a TabProvider');
    }
    return context;
}

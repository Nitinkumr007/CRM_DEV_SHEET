import { useState } from 'react';
import { useSettings } from '../context/SettingsContext';
import { useAuth } from '../context/AuthContext';
import { useTheme } from '../context/ThemeContext';
import { Bell, Layout, Monitor, User, Shield, Check } from 'lucide-react';
import { cn } from '../lib/utils';

export default function Settings() {
    const { settings, updateSettings, loading } = useSettings();
    const { theme, setTheme } = useTheme(); // Use ThemeContext for live updates
    const { user } = useAuth();
    const [activeTab, setActiveTab] = useState<'general' | 'notifications' | 'profile'>('general');
    const [saving, setSaving] = useState(false);

    // Local state for immediate feedback before saving
    // In a real app, this might be more complex, but here we can just write directly

    // Helper to delay showing "Saved"
    const handleSave = async (updates: any) => {
        setSaving(true);
        await updateSettings(updates);
        setTimeout(() => setSaving(false), 1000);
    };

    const handleThemeChange = (newTheme: string) => {
        setTheme(newTheme as "light" | "dark" | "system");
        handleSave({ theme: newTheme });
    };

    if (loading) return <div className="p-8 text-center text-slate-500">Loading settings...</div>;

    return (
        <div className="max-w-4xl mx-auto pb-12">
            <h1 className="text-3xl font-bold text-slate-800 mb-2">Settings</h1>
            <p className="text-slate-500 mb-8">Manage your application preferences and profile.</p>

            <div className="glass-card flex flex-col md:flex-row min-h-[500px] overflow-hidden">
                {/* Sidebar */}
                <div className="w-full md:w-64 bg-slate-50/50 border-r border-slate-200/60 p-4 space-y-1">
                    <button
                        onClick={() => setActiveTab('general')}
                        className={cn(
                            "w-full flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-medium transition-all text-left",
                            activeTab === 'general' ? "bg-white shadow-sm text-indigo-600 ring-1 ring-slate-200" : "text-slate-600 hover:bg-slate-100 hover:text-slate-900"
                        )}
                    >
                        <Layout className="w-4 h-4" /> General
                    </button>
                    <button
                        onClick={() => setActiveTab('notifications')}
                        className={cn(
                            "w-full flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-medium transition-all text-left",
                            activeTab === 'notifications' ? "bg-white shadow-sm text-indigo-600 ring-1 ring-slate-200" : "text-slate-600 hover:bg-slate-100 hover:text-slate-900"
                        )}
                    >
                        <Bell className="w-4 h-4" /> Notifications
                    </button>
                    <button
                        onClick={() => setActiveTab('profile')}
                        className={cn(
                            "w-full flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-medium transition-all text-left",
                            activeTab === 'profile' ? "bg-white shadow-sm text-indigo-600 ring-1 ring-slate-200" : "text-slate-600 hover:bg-slate-100 hover:text-slate-900"
                        )}
                    >
                        <User className="w-4 h-4" /> Profile
                    </button>
                </div>

                {/* Content Area */}
                <div className="flex-1 p-8 bg-white/50 relative">
                    {/* General Settings */}
                    {activeTab === 'general' && (
                        <div className="space-y-8 animate-in fade-in slide-in-from-right-4 duration-300">
                            <div>
                                <h3 className="text-lg font-bold text-slate-800 mb-1">Appearance</h3>
                                <p className="text-sm text-slate-500 mb-5">Customize how the application looks and feels.</p>

                                <div className="space-y-4">
                                    <div className="flex items-center justify-between p-4 bg-white border border-slate-200 rounded-xl">
                                        <div className="flex items-center gap-3">
                                            <div className="w-10 h-10 rounded-lg bg-indigo-50 flex items-center justify-center text-indigo-600">
                                                <Monitor className="w-5 h-5" />
                                            </div>
                                            <div>
                                                <div className="font-medium text-slate-800">Theme Preference</div>
                                                <div className="text-xs text-slate-500">Select your preferred color scheme</div>
                                            </div>
                                        </div>
                                        <select
                                            value={theme}
                                            onChange={(e) => handleThemeChange(e.target.value)}
                                            className="px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-sm outline-none focus:ring-2 focus:ring-indigo-500/20"
                                        >
                                            <option value="light">Light Mode</option>
                                            <option value="dark">Dark Mode (Beta)</option>
                                            <option value="system">System Default</option>
                                        </select>
                                    </div>
                                </div>
                            </div>

                            <div>
                                <h3 className="text-lg font-bold text-slate-800 mb-1">Workflow Preferences</h3>
                                <p className="text-sm text-slate-500 mb-5">Set your default views and behaviors.</p>

                                <div className="grid grid-cols-1 gap-4">
                                    <div className="p-4 bg-white border border-slate-200 rounded-xl space-y-4">
                                        <div className="flex items-center justify-between">
                                            <div>
                                                <div className="font-medium text-slate-800">Default Ticket View</div>
                                                <div className="text-xs text-slate-500">Choose how tickets are displayed by default</div>
                                            </div>
                                            <div className="flex bg-slate-100 p-1 rounded-lg">
                                                <button
                                                    onClick={() => handleSave({ defaultView: 'list' })}
                                                    className={cn(
                                                        "px-3 py-1.5 rounded-md text-xs font-medium transition-all",
                                                        settings.defaultView === 'list' ? "bg-white text-indigo-600 shadow-sm" : "text-slate-500 hover:text-slate-700"
                                                    )}
                                                >
                                                    List
                                                </button>
                                                <button
                                                    onClick={() => handleSave({ defaultView: 'kanban' })}
                                                    className={cn(
                                                        "px-3 py-1.5 rounded-md text-xs font-medium transition-all",
                                                        settings.defaultView === 'kanban' ? "bg-white text-indigo-600 shadow-sm" : "text-slate-500 hover:text-slate-700"
                                                    )}
                                                >
                                                    Kanban
                                                </button>
                                            </div>
                                        </div>

                                        <div className="border-t border-slate-100 pt-4 flex items-center justify-between">
                                            <div>
                                                <div className="font-medium text-slate-800">Items Per Page</div>
                                                <div className="text-xs text-slate-500">Rows to show in data tables</div>
                                            </div>
                                            <select
                                                value={settings.itemsPerPage}
                                                onChange={(e) => handleSave({ itemsPerPage: Number(e.target.value) })}
                                                className="px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-sm outline-none focus:ring-2 focus:ring-indigo-500/20"
                                            >
                                                <option value="10">10 rows</option>
                                                <option value="25">25 rows</option>
                                                <option value="50">50 rows</option>
                                                <option value="100">100 rows</option>
                                            </select>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>
                    )}

                    {/* Notifications */}
                    {activeTab === 'notifications' && (
                        <div className="space-y-8 animate-in fade-in slide-in-from-right-4 duration-300">
                            <div>
                                <h3 className="text-lg font-bold text-slate-800 mb-1">Notification Preferences</h3>
                                <p className="text-sm text-slate-500 mb-5">Control how and when you receive alerts.</p>

                                <div className="space-y-3">
                                    <div className="flex items-center justify-between p-4 bg-white border border-slate-200 rounded-xl">
                                        <div className="flex items-center gap-3">
                                            <div className="w-10 h-10 rounded-lg bg-amber-50 flex items-center justify-center text-amber-600">
                                                <Bell className="w-5 h-5" />
                                            </div>
                                            <div>
                                                <div className="font-medium text-slate-800">In-App Notifications</div>
                                                <div className="text-xs text-slate-500">Receive alerts within the application header</div>
                                            </div>
                                        </div>
                                        <label className="relative inline-flex items-center cursor-pointer">
                                            <input
                                                type="checkbox"
                                                checked={settings.notificationsEnabled}
                                                onChange={(e) => handleSave({ notificationsEnabled: e.target.checked })}
                                                className="sr-only peer"
                                            />
                                            <div className="w-11 h-6 bg-slate-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-indigo-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-indigo-600"></div>
                                        </label>
                                    </div>

                                    <div className="flex items-center justify-between p-4 bg-white border border-slate-200 rounded-xl">
                                        <div className="flex items-center gap-3">
                                            <div className="w-10 h-10 rounded-lg bg-orange-50 flex items-center justify-center text-orange-600">
                                                <span className="text-lg font-bold">@</span>
                                            </div>
                                            <div>
                                                <div className="font-medium text-slate-800">Email Notifications</div>
                                                <div className="text-xs text-slate-500">Receive daily summaries and critical alerts via email</div>
                                            </div>
                                        </div>
                                        <label className="relative inline-flex items-center cursor-pointer">
                                            <input
                                                type="checkbox"
                                                checked={settings.emailNotifications}
                                                onChange={(e) => handleSave({ emailNotifications: e.target.checked })}
                                                className="sr-only peer"
                                            />
                                            <div className="w-11 h-6 bg-slate-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-indigo-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-indigo-600"></div>
                                        </label>
                                    </div>
                                </div>
                            </div>
                        </div>
                    )}

                    {/* Profile */}
                    {activeTab === 'profile' && (
                        <div className="space-y-8 animate-in fade-in slide-in-from-right-4 duration-300">
                            <div>
                                <h3 className="text-lg font-bold text-slate-800 mb-1">My Profile</h3>
                                <p className="text-sm text-slate-500 mb-5">Manage your account information.</p>

                                <div className="bg-white border border-slate-200 rounded-xl p-6 shadow-sm">
                                    <div className="flex items-center gap-5 border-b border-slate-100 pb-6 mb-6">
                                        <div className="w-20 h-20 rounded-full bg-indigo-100 flex items-center justify-center text-2xl font-bold text-indigo-700">
                                            {user?.name?.charAt(0) || 'U'}
                                        </div>
                                        <div>
                                            <h2 className="text-xl font-bold text-slate-800">{user?.name}</h2>
                                            <div className="flex items-center gap-2 mt-1">
                                                <span className="px-2.5 py-0.5 rounded-full bg-indigo-50 text-indigo-700 text-xs font-bold uppercase border border-indigo-100">
                                                    {user?.role}
                                                </span>
                                                <span className="text-xs text-slate-500">
                                                    ID: #{user?.code || user?.id}
                                                </span>
                                            </div>
                                        </div>
                                    </div>

                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                        <div>
                                            <label className="block text-xs font-semibold text-slate-500 uppercase tracking-wider mb-1.5">Full Name</label>
                                            <div className="px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-lg text-slate-700 text-sm font-medium">
                                                {user?.name}
                                            </div>
                                        </div>
                                        <div>
                                            <label className="block text-xs font-semibold text-slate-500 uppercase tracking-wider mb-1.5">Email Address</label>
                                            <div className="px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-lg text-slate-700 text-sm font-medium">
                                                {user?.email || 'N/A'}
                                            </div>
                                        </div>
                                        <div>
                                            <label className="block text-xs font-semibold text-slate-500 uppercase tracking-wider mb-1.5">Security</label>
                                            <div className="flex items-center gap-2 text-sm text-emerald-600 font-medium">
                                                <Shield className="w-4 h-4" /> Password Protected
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>
                    )}

                    {/* Floating Save Indicator */}
                    {saving && (
                        <div className="absolute top-4 right-4 flex items-center gap-2 px-3 py-1.5 bg-emerald-100 text-emerald-700 text-xs font-bold rounded-lg shadow-sm animate-in fade-in slide-in-from-top-2">
                            <Check className="w-3 h-3" /> Saved
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
}

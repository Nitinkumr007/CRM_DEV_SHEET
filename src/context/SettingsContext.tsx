/* eslint-disable react-refresh/only-export-components */
import React, { createContext, useContext, useState, useEffect } from 'react';
import type { UserSettings } from '../types/settings';
import { DEFAULT_SETTINGS } from '../types/settings';

interface SettingsContextType {
    settings: UserSettings;
    loading: boolean;
    updateSettings: (updates: Partial<UserSettings>) => Promise<void>;
    refreshSettings: () => void;
}

const SettingsContext = createContext<SettingsContextType | undefined>(undefined);

export function SettingsProvider({ children }: { children: React.ReactNode }) {
    const [settings, setSettings] = useState<UserSettings>(DEFAULT_SETTINGS);
    const [loading, setLoading] = useState(true);

    const fetchSettings = async () => {
        try {
            const token = localStorage.getItem('token');
            if (!token) {
                setLoading(false);
                return;
            }

            const res = await fetch('/api/settings', {
                headers: { 'Authorization': `Bearer ${token}` }
            });

            if (res.ok) {
                const data = await res.json();
                // Map DB keys to Context keys
                setSettings({
                    settingId: data.Setting_ID,
                    userId: data.User_ID,
                    theme: data.Theme || 'light',
                    notificationsEnabled: data.Notifications_Enabled,
                    emailNotifications: data.Email_Notifications,
                    dashboardLayout: data.Dashboard_Layout || [],
                    itemsPerPage: data.Items_Per_Page || 10,
                    defaultView: data.Default_View || 'list',
                    updatedAt: data.Updated_At
                });
            }
        } catch (err) {
            console.error('Failed to fetch settings', err);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchSettings();
    }, []);

    const updateSettings = async (updates: Partial<UserSettings>) => {
        // Optimistic UI update
        const newSettings = { ...settings, ...updates };
        setSettings(newSettings);

        try {
            const token = localStorage.getItem('token');
            // Map Context keys to DB keys for API
            const apiPayload = {
                theme: updates.theme,
                notifications_enabled: updates.notificationsEnabled,
                email_notifications: updates.emailNotifications,
                dashboard_layout: updates.dashboardLayout,
                items_per_page: updates.itemsPerPage,
                default_view: updates.defaultView
            };

            await fetch('/api/settings', {
                method: 'PUT',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${token}`
                },
                body: JSON.stringify(apiPayload)
            });
        } catch (err) {
            console.error('Failed to update settings', err);
            // Revert on failure (could implement more robust rollback)
            fetchSettings();
        }
    };

    return (
        <SettingsContext.Provider value={{ settings, loading, updateSettings, refreshSettings: fetchSettings }}>
            {children}
        </SettingsContext.Provider>
    );
}

export function useSettings() {
    const context = useContext(SettingsContext);
    if (context === undefined) {
        throw new Error('useSettings must be used within a SettingsProvider');
    }
    return context;
}

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
            const { gsheet } = await import('../lib/gsheet');
            const user = JSON.parse(localStorage.getItem('user') || '{}');
            if (!user.User_ID) {
                setLoading(false);
                return;
            }

            const sql = `SELECT * FROM User_Settings WHERE User_ID = @userId`;
            const result = await gsheet.query(sql, { userId: user.User_ID });

            if (result.recordset && result.recordset.length > 0) {
                const data = result.recordset[0];
                setSettings({
                    settingId: data.Setting_ID,
                    userId: data.User_ID,
                    theme: data.Theme || 'light',
                    notificationsEnabled: !!data.Notifications_Enabled,
                    emailNotifications: !!data.Email_Notifications,
                    dashboardLayout: JSON.parse(data.Dashboard_Layout || '[]'),
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
        const newSettings = { ...settings, ...updates };
        setSettings(newSettings);

        try {
            const { gsheet } = await import('../lib/gsheet');
            const user = JSON.parse(localStorage.getItem('user') || '{}');

            const apiPayload = {
                userId: user.User_ID,
                theme: updates.theme || newSettings.theme,
                notifications_enabled: updates.notificationsEnabled ? 1 : 0,
                email_notifications: updates.emailNotifications ? 1 : 0,
                dashboard_layout: JSON.stringify(updates.dashboardLayout || newSettings.dashboardLayout),
                items_per_page: updates.itemsPerPage || newSettings.itemsPerPage,
                default_view: updates.defaultView || newSettings.defaultView
            };

            const checkSql = `SELECT Setting_ID FROM User_Settings WHERE User_ID = @userId`;
            const checkResult = await gsheet.query(checkSql, { userId: user.User_ID });

            if (checkResult.recordset && checkResult.recordset.length > 0) {
                await gsheet.query(`
                    UPDATE User_Settings SET 
                        Theme = @theme, 
                        Notifications_Enabled = @notifications_enabled, 
                        Email_Notifications = @email_notifications, 
                        Dashboard_Layout = @dashboard_layout, 
                        Items_Per_Page = @items_per_page, 
                        Default_View = @default_view 
                    WHERE User_ID = @userId
                `, apiPayload);
            } else {
                await gsheet.query(`
                    INSERT INTO User_Settings (
                        User_ID, Theme, Notifications_Enabled, 
                        Email_Notifications, Dashboard_Layout, 
                        Items_Per_Page, Default_View
                    ) VALUES (
                        @userId, @theme, @notifications_enabled, 
                        @email_notifications, @dashboard_layout, 
                        @items_per_page, @default_view
                    )
                `, apiPayload);
            }
        } catch (err) {
            console.error('Failed to update settings', err);
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

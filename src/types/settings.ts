export interface UserSettings {
    settingId: number;
    userId: number;
    theme: 'light' | 'dark' | 'system';
    notificationsEnabled: boolean;
    emailNotifications: boolean;
    dashboardLayout: any[]; // JSON structure for widgets
    itemsPerPage: number;
    defaultView: 'list' | 'kanban';
    updatedAt: string;
}

export const DEFAULT_SETTINGS: UserSettings = {
    settingId: 0,
    userId: 0,
    theme: 'light',
    notificationsEnabled: true,
    emailNotifications: true,
    dashboardLayout: [],
    itemsPerPage: 10,
    defaultView: 'list',
    updatedAt: new Date().toISOString()
};

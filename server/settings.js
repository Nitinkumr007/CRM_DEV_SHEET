import express from 'express';
import { connectToDb } from './db.js';
import sql from 'mssql';

const router = express.Router();

// GET Settings for logged-in user
router.get('/', async (req, res) => {
    try {
        if (!req.user) return res.status(401).json({ message: 'Unauthorized' });

        const pool = await connectToDb();
        const result = await pool.request()
            .input('userId', sql.Int, req.user.User_ID)
            .query('SELECT * FROM User_App_Settings WHERE User_ID = @userId');

        let settings = result.recordset[0];

        // If no settings exist, create default
        if (!settings) {
            await pool.request()
                .input('userId', sql.Int, req.user.User_ID)
                .query(`
                    INSERT INTO User_App_Settings (User_ID) 
                    VALUES (@userId)
                `);
            // Fetch again
            const newResult = await pool.request()
                .input('userId', sql.Int, req.user.User_ID)
                .query('SELECT * FROM User_App_Settings WHERE User_ID = @userId');
            settings = newResult.recordset[0];
        }

        // Parse JSON fields
        if (settings.Dashboard_Layout) {
            try {
                settings.Dashboard_Layout = JSON.parse(settings.Dashboard_Layout);
            } catch (e) {
                console.error('Failed to parse dashboard layout', e);
                settings.Dashboard_Layout = [];
            }
        }

        res.json(settings);
    } catch (err) {
        console.error('Error fetching settings:', err);
        res.status(500).json({ message: 'Server error fetching settings' });
    }
});

// UPDATE Settings
router.put('/', async (req, res) => {
    try {
        if (!req.user) return res.status(401).json({ message: 'Unauthorized' });

        const {
            theme,
            notifications_enabled,
            email_notifications,
            dashboard_layout,
            items_per_page,
            default_view
        } = req.body;

        const pool = await connectToDb();

        await pool.request()
            .input('userId', sql.Int, req.user.User_ID)
            .input('theme', sql.VarChar, theme)
            .input('notif', sql.Bit, notifications_enabled)
            .input('emailNotif', sql.Bit, email_notifications)
            .input('layout', sql.NVarChar, JSON.stringify(dashboard_layout))
            .input('items', sql.Int, items_per_page)
            .input('view', sql.VarChar, default_view)
            .query(`
                UPDATE User_App_Settings
                SET 
                    Theme = COALESCE(@theme, Theme),
                    Notifications_Enabled = COALESCE(@notif, Notifications_Enabled),
                    Email_Notifications = COALESCE(@emailNotif, Email_Notifications),
                    Dashboard_Layout = COALESCE(@layout, Dashboard_Layout),
                    Items_Per_Page = COALESCE(@items, Items_Per_Page),
                    Default_View = COALESCE(@view, Default_View),
                    Updated_At = GETDATE()
                WHERE User_ID = @userId
            `);

        res.json({ message: 'Settings updated successfully' });
    } catch (err) {
        console.error('Error updating settings:', err);
        res.status(500).json({ message: 'Server error updating settings' });
    }
});

export default router;

const express = require('express');
const router = express.Router();
const { connectToDb } = require('./db');
const { authenticateToken } = require('./middleware/auth');

// Apply auth middleware
router.use(authenticateToken);

// User Performance Report
router.get('/user-performance', async (req, res) => {
    try {
        const pool = await connectToDb();

        // Fetch raw data for manual aggregation
        const [usersRes, ticketsRes] = await Promise.all([
            pool.request().query('SELECT * FROM User_Master'),
            pool.request().query('SELECT * FROM Ticket_Master')
        ]);

        const users = usersRes.recordset;
        const tickets = ticketsRes.recordset;

        const performance = users.map(u => {
            const userTickets = tickets.filter(t => t.Assigned_To == u.User_ID);
            if (userTickets.length === 0) return null;

            const open = userTickets.filter(t => (t.Status || '').toLowerCase() === 'open').length;
            const resolved = userTickets.filter(t => ['resolved', 'closed'].includes((t.Status || '').toLowerCase()));

            let avgHours = 0;
            if (resolved.length > 0) {
                const totalHours = resolved.reduce((sum, t) => {
                    const diff = (new Date(t.Updated_At) - new Date(t.Created_At)) / (1000 * 60 * 60);
                    return sum + (diff > 0 ? diff : 0);
                }, 0);
                avgHours = totalHours / resolved.length;
            }

            return {
                Full_Name: u.Full_Name,
                Total_Assigned: userTickets.length,
                Open_Tickets: open,
                Resolved_Tickets: resolved.length,
                Avg_Resolution_Hours: Math.round(avgHours * 10) / 10
            };
        }).filter(p => p !== null);

        // Order by Resolved_Tickets DESC
        performance.sort((a, b) => b.Resolved_Tickets - a.Resolved_Tickets);

        res.json(performance);
    } catch (err) {
        console.error('Error fetching user performance:', err);
        res.status(500).json({ message: 'Error fetching user performance', error: err.message });
    }
});

// SLA Compliance Report
router.get('/sla-status', async (req, res) => {
    try {
        const pool = await connectToDb();
        const [ticketsRes, usersRes] = await Promise.all([
            pool.request().query('SELECT * FROM Ticket_Master'),
            pool.request().query('SELECT * FROM User_Master')
        ]);

        const tickets = ticketsRes.recordset;
        const users = usersRes.recordset;

        const now = new Date();
        const slaStatus = tickets
            .filter(t => !['resolved', 'closed'].includes((t.Status || '').toLowerCase()) && t.sla_hours)
            .map(t => {
                const hoursOpen = Math.round((now - new Date(t.Created_At)) / (1000 * 60 * 60));
                const assignedUser = users.find(u => u.User_ID == t.Assigned_To);

                return {
                    Ticket_No: t.Ticket_No,
                    Subject: t.Subject,
                    Status: t.Status,
                    Created_At: t.Created_At,
                    sla_hours: t.sla_hours,
                    Hours_Open: hoursOpen,
                    SLA_Status: hoursOpen > t.sla_hours ? 'Breached' : 'Within SLA',
                    Assigned_To: assignedUser ? assignedUser.Full_Name : null
                };
            });

        // Order by Hours_Open DESC
        slaStatus.sort((a, b) => b.Hours_Open - a.Hours_Open);

        res.json(slaStatus);
    } catch (err) {
        console.error('Error fetching SLA status:', err);
        res.status(500).json({ message: 'Error fetching SLA status', error: err.message });
    }
});

// Login Logs (Moved from index.js to here for organization, or just keep new ones here)
// For now, I'll keep just the new ones to avoid conflict with index.js unless I refactor.

module.exports = router;

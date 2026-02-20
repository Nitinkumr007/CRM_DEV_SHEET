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
        const result = await pool.request().query(`
            SELECT 
                u.Full_Name,
                COUNT(t.Ticket_ID) as Total_Assigned,
                SUM(CASE WHEN LOWER(t.Status) = 'open' THEN 1 ELSE 0 END) as Open_Tickets,
                SUM(CASE WHEN LOWER(t.Status) IN ('resolved', 'closed') THEN 1 ELSE 0 END) as Resolved_Tickets,
                AVG(CASE WHEN LOWER(t.Status) IN ('resolved', 'closed') THEN DATEDIFF(hour, t.Created_At, t.Updated_At) ELSE NULL END) as Avg_Resolution_Hours
            FROM User_Master u
            LEFT JOIN Ticket_Master t ON u.User_ID = t.Assigned_To
            GROUP BY u.Full_Name
            HAVING COUNT(t.Ticket_ID) > 0
            ORDER BY Resolved_Tickets DESC
        `);
        res.json(result.recordset);
    } catch (err) {
        console.error('Error fetching user performance:', err);
        res.status(500).json({ message: 'Error fetching user performance', error: err.message });
    }
});

// SLA Compliance Report
router.get('/sla-status', async (req, res) => {
    try {
        const pool = await connectToDb();
        // Check for open tickets that have exceeded their SLA
        const result = await pool.request().query(`
            SELECT 
                t.Ticket_No,
                t.Subject,
                t.Status,
                t.Created_At,
                t.sla_hours,
                DATEDIFF(hour, t.Created_At, GETDATE()) as Hours_Open,
                CASE 
                    WHEN DATEDIFF(hour, t.Created_At, GETDATE()) > t.sla_hours THEN 'Breached'
                    ELSE 'Within SLA'
                END as SLA_Status,
                u.Full_Name as Assigned_To
            FROM Ticket_Master t
            LEFT JOIN User_Master u ON t.Assigned_To = u.User_ID
            WHERE LOWER(t.Status) NOT IN ('resolved', 'closed')
            AND t.sla_hours IS NOT NULL
            ORDER BY Hours_Open DESC
        `);
        res.json(result.recordset);
    } catch (err) {
        console.error('Error fetching SLA status:', err);
        res.status(500).json({ message: 'Error fetching SLA status', error: err.message });
    }
});

// Login Logs (Moved from index.js to here for organization, or just keep new ones here)
// For now, I'll keep just the new ones to avoid conflict with index.js unless I refactor.

module.exports = router;

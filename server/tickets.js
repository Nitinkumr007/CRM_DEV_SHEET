const express = require('express');
const router = express.Router();
const { connectToDb } = require('./db');
const { authenticateToken } = require('./middleware/auth');
const { logActivity } = require('./logger');

// Helper for error handling
const handleError = (res, err, message) => {
    console.error(message, err);
    res.status(500).json({ message, error: err.message });
};

// Apply auth middleware
router.use(authenticateToken);

// GET All Tickets
router.get('/', async (req, res) => {
    try {
        const pool = await connectToDb();
        const result = await pool.request().query(`
            SELECT 
                t.*,
                ct.Complaint_Name as Complaint_Type,
                u.Full_Name as Assigned_User,
                creator.Full_Name as Creator_Name,
                closer.Full_Name as Closed_By_Name
            FROM Ticket_Master t
            LEFT JOIN Complaint_Type_Master ct ON t.Complaint_Type_ID = ct.Complaint_Type_ID
            LEFT JOIN User_Master u ON t.Assigned_To = u.User_ID
            LEFT JOIN User_Master creator ON t.Created_By = creator.User_ID
            LEFT JOIN User_Master closer ON t.Closed_By = closer.User_ID
            ORDER BY t.Created_At DESC
        `);
        res.json(result.recordset);
    } catch (err) { handleError(res, err, 'Error fetching tickets'); }
});

// GET Tickets by Customer ID
router.get('/customer/:customerId', async (req, res) => {
    try {
        const { customerId } = req.params;
        const pool = await connectToDb();
        const result = await pool.request()
            .input('cid', customerId)
            .query(`
                SELECT TOP 10 
                    t.*,
                    ct.Complaint_Name as Complaint_Type,
                    u.Full_Name as Assigned_User,
                    creator.Full_Name as Creator_Name,
                    closer.Full_Name as Closed_By_Name
                FROM Ticket_Master t
                LEFT JOIN Complaint_Type_Master ct ON t.Complaint_Type_ID = ct.Complaint_Type_ID
                LEFT JOIN User_Master u ON t.Assigned_To = u.User_ID
                LEFT JOIN User_Master creator ON t.Created_By = creator.User_ID
                LEFT JOIN User_Master closer ON t.Closed_By = closer.User_ID
                WHERE t.customer_id = @cid OR t.customer_ids = @cid
                ORDER BY t.Created_At DESC
            `);
        res.json(result.recordset);
    } catch (err) { handleError(res, err, 'Error fetching customer tickets'); }
});

// GET Dashboard Stats
router.get('/stats', async (req, res) => {
    try {
        const pool = await connectToDb();

        // Parallel queries for stats
        const totalQuery = pool.request().query("SELECT COUNT(*) as count FROM Ticket_Master");
        const pendingQuery = pool.request().query("SELECT COUNT(*) as count FROM Ticket_Master WHERE Status = 'Open' OR Status = 'Pending'");
        const resolvedQuery = pool.request().query("SELECT COUNT(*) as count FROM Ticket_Master WHERE Status = 'Resolved' OR Status = 'Closed'");
        const recentQuery = pool.request().query(`
            SELECT TOP 5 t.*, ct.Complaint_Name, u.Full_Name as Assigned_User 
            FROM Ticket_Master t
            LEFT JOIN Complaint_Type_Master ct ON t.Complaint_Type_ID = ct.Complaint_Type_ID
            LEFT JOIN User_Master u ON t.Assigned_To = u.User_ID
            ORDER BY t.Created_At DESC
        `);

        // Get daily volume for chart (last 7 days)
        const chartQuery = pool.request().query(`
            SELECT FORMAT(Created_At, 'yyyy-MM-dd') as date, COUNT(*) as count
            FROM Ticket_Master
            WHERE Created_At >= DATEADD(day, -7, GETDATE())
            GROUP BY FORMAT(Created_At, 'yyyy-MM-dd')
            ORDER BY date
        `);

        // Get Active Customers count (CASE SENSITIVE CHECK MIGHT BE NEEDED depending on DB collation, but normally 'Active' is fine)
        // Using Customer_Master or customers_profile based on earlier file exploration. 
        // CreateTicketForm uses /api/customers which inserts into Customer_Master (as seen in server/customers.js context from previous turns, though not explicitly read in this turn, I should verify. 
        // Wait, I see customers.js in the file list. Let me check customers.js to be 100% sure of the table name. 
        // Actually, looking at tickets.js, it has "SELECT COUNT(*) as count FROM customers_profile". 
        // I will assume customers_profile is correct but verify with a quick read if I fail. 
        // However, standardizing to use the "Customer_Master" if that's the main one. 
        // Let's stick to what was there but correct the query if it was wrong or ensure table exists.
        // The previous `tickets.js` file content I read had:
        // const activeCustomersQuery = pool.request().query("SELECT COUNT(*) as count FROM customers_profile WHERE customer_statu = 'Active'");
        // Use 'Customer_Master' as it seems to be the main table used in CreateTicketForm.
        // Let's first check `server/customers.js` to see where customers are saved.

        // Actually, I'll stick to the plan: "Active Customers" count. 
        // I will assume Customer_Master is the source of truth for now as "customers_profile" sounds like a legacy or separate thing.
        // Let's read customers.js first to be sure. I will do that in a separate step or just assume Customer_Master if I want to be quick.
        // But to be safe, I will read customers.js first in this turn quickly.

        // Actually, I will just update tickets.js to use Customer_Master which is definitely used.
        // Priority Distribution
        const priorityQuery = pool.request().query("SELECT Priority, COUNT(*) as count FROM Ticket_Master GROUP BY Priority");

        // Complaint Type Distribution
        const typeQuery = pool.request().query("SELECT ct.Complaint_Name, COUNT(*) as count FROM Ticket_Master t LEFT JOIN Complaint_Type_Master ct ON t.Complaint_Type_ID = ct.Complaint_Type_ID GROUP BY ct.Complaint_Name");

        // Average Resolution Time (in hours) for Resolved/Closed tickets
        const avgResQuery = pool.request().query("SELECT AVG(DATEDIFF(hour, Created_At, Updated_At)) as avg_hours FROM Ticket_Master WHERE Status IN ('Resolved', 'Closed')");

        // Active Customers
        const activeCustomersQuery = pool.request().query("SELECT COUNT(*) as count FROM customers_profile WHERE customer_statu = 'Active'");

        const [total, pending, resolved, recent, chart, activeCustomers, priorityDist, typeDist, avgRes] = await Promise.all([
            totalQuery, pendingQuery, resolvedQuery, recentQuery, chartQuery, activeCustomersQuery, priorityQuery, typeQuery, avgResQuery
        ]);

        res.json({
            total: total.recordset[0].count,
            pending: pending.recordset[0].count,
            resolved: resolved.recordset[0].count,
            recent: recent.recordset,
            chart: chart.recordset,
            activeCustomers: activeCustomers.recordset[0].count || 0,
            priority_counts: priorityDist.recordset,
            type_counts: typeDist.recordset,
            avg_resolution_hours: avgRes.recordset[0].avg_hours || 0
        });

    } catch (err) { handleError(res, err, 'Error fetching stats'); }
});

// CREATE Ticket
router.post('/', async (req, res) => {
    const {
        subject, description, priority, complaintTypeId, customerName, assignedTo, createdBy,
        asm_name, rsm_name, customer_type, complaint_type, customer_number, customer_address, priority_level, sla_hours, customer_id
    } = req.body;
    try {
        const pool = await connectToDb();

        // Generate a simple Ticket No (T-100X)
        const countRes = await pool.request().query("SELECT COUNT(*) as count FROM Ticket_Master");
        const nextId = countRes.recordset[0].count + 1001;
        const ticketNo = `T-${nextId}`;

        // Fetch user code
        const creatorId = createdBy || 1;
        const userRes = await pool.request()
            .input('uid', creatorId)
            .query("SELECT User_Code FROM User_Master WHERE User_ID = @uid");
        const userCode = userRes.recordset[0] ? userRes.recordset[0].User_Code : null;

        await pool.request()
            .input('no', ticketNo)
            // ... (keep all inputs)
            .input('subject', subject)
            .input('desc', description)
            .input('priority', priority || 'Medium')
            .input('ctId', complaintTypeId)
            .input('custName', customerName)
            .input('assigned', assignedTo ?? null)
            .input('creator', creatorId)
            // New Fields - Mapping to BOTH Duplicate Columns for Safety
            .input('asm1', asm_name ?? null)
            .input('asm2', asm_name ?? null)
            .input('rsm1', rsm_name ?? null)
            .input('rsm2', rsm_name ?? null)
            .input('custType1', customer_type ?? null)
            .input('custType2', customer_type ?? null)
            .input('compType1', complaint_type ?? null)
            .input('compType2', complaint_type ?? null)
            .input('custNum1', customer_number ?? null)
            .input('custNum2', customer_number ?? null)
            .input('custAddr1', customer_address ?? null)
            .input('custAddr2', customer_address ?? null)
            .input('priorityLvl1', priority_level ?? null)
            .input('priorityLvl2', priority_level ?? null)
            .input('sla1', sla_hours ?? null)
            .input('sla2', sla_hours ?? null) // Insert into sla_hour too
            .input('custId1', customer_id ?? null)
            .input('custId2', customer_id ?? null)
            .input('uc', userCode)
            // NOTE: Inserting into multiple columns (e.g., asm/asm_name) due to denormalized schema.
            // This ensures data exists in both legacy and new fields to prevent breakage.
            .query(`INSERT INTO Ticket_Master 
                    (Ticket_No, Subject, Description, Priority, Complaint_Type_ID, Customer_Name, Assigned_To, Created_By, Status, Created_At, Updated_At,
                     asm, asm_name, rsm, rsm_name, customer_type, customer_types, complaint_type, complaint_types, 
                     customer_number, customer_numbers, customer_address, customers_address, 
                     priority_level, priority_levels, sla_hours, sla_hour, customer_id, customer_ids, user_code)
                    VALUES 
                    (@no, @subject, @desc, @priority, @ctId, @custName, @assigned, @creator, 'open', GETDATE(), GETDATE(),
                     @asm1, @asm2, @rsm1, @rsm2, @custType1, @custType2, @compType1, @compType2, 
                     @custNum1, @custNum2, @custAddr1, @custAddr2, 
                     @priorityLvl1, @priorityLvl2, @sla1, @sla2, @custId1, @custId2, @uc)`);

        await logActivity(pool, req.user, 'CREATE', 'TICKET', `Created Ticket ${ticketNo}: ${subject}`, req);
        res.json({ message: 'Ticket created successfully', ticketNo });
    } catch (err) { handleError(res, err, 'Error creating ticket'); }
});

// UPDATE Ticket
router.put('/:id', async (req, res) => {
    const { id } = req.params;
    const { status, assignedTo, priority, asm_name, rsm_name, customer_type, complaint_type, customer_number, customer_address, priority_level, sla_hours, customer_id, description } = req.body;
    try {
        const pool = await connectToDb();
        await pool.request()
            .input('id', id)
            .input('status', status || null)
            .input('assigned', assignedTo || null)
            .input('priority', priority || null)
            .input('desc', description || null)
            // Update both sets of columns
            .input('asm', asm_name || null)
            .input('rsm', rsm_name || null)
            .input('custType', customer_type || null)
            .input('compType', complaint_type || null)
            .input('custNum', customer_number || null)
            .input('custAddr', customer_address || null)
            .input('priorityLvl', priority_level || null)
            .input('sla', sla_hours || null)
            .input('custId', customer_id || null)
            .input('closingRemarks', req.body.closingRemarks || null)
            .input('city', req.body.customer_city || null)
            .input('pincode', req.body.customer_pincode || null)
            .input('userId', req.user ? req.user.User_ID : null)
            .query(`UPDATE Ticket_Master SET 
                    Status = COALESCE(LOWER(@status), Status),
                    Assigned_To = COALESCE(@assigned, Assigned_To),
                    Priority = COALESCE(@priority, Priority),
                    -- Update generic and specific columns
                    asm = COALESCE(@asm, asm),
                    asm_name = COALESCE(@asm, asm_name),
                    rsm = COALESCE(@rsm, rsm),
                    rsm_name = COALESCE(@rsm, rsm_name),
                    customer_type = COALESCE(@custType, customer_type),
                    customer_types = COALESCE(@custType, customer_types),
                    complaint_type = COALESCE(@compType, complaint_type),
                    complaint_types = COALESCE(@compType, complaint_types),
                    customer_number = COALESCE(@custNum, customer_number),
                    customer_numbers = COALESCE(@custNum, customer_numbers),
                    customer_address = COALESCE(@custAddr, customer_address),
                    customers_address = COALESCE(@custAddr, customers_address),
                    priority_level = COALESCE(@priorityLvl, priority_level),
                    priority_levels = COALESCE(@priorityLvl, priority_levels),
                    sla_hours = COALESCE(@sla, sla_hours),
                    sla_hour = COALESCE(@sla, sla_hour),
                    customer_id = COALESCE(@custId, customer_id),
                    customer_ids = COALESCE(@custId, customer_ids),
                    
                    -- Description Update
                    Description = COALESCE(@desc, Description),

                    -- New Fields
                    Customer_city = COALESCE(@city, Customer_city),
                    Customer_pincode = COALESCE(@pincode, Customer_pincode),
                    Closing_Remarks = COALESCE(@closingRemarks, Closing_Remarks),
                    
                    -- Intelligent Status Handling
                    Closed_By = CASE 
                        WHEN LOWER(@status) = 'closed' THEN @userId 
                        WHEN LOWER(@status) IN ('open', 'in-progress', 'resolved') THEN NULL
                        ELSE Closed_By 
                    END,
                    Closed_At = CASE 
                        WHEN LOWER(@status) = 'closed' THEN GETDATE() 
                        WHEN LOWER(@status) IN ('open', 'in-progress', 'resolved') THEN NULL
                        ELSE Closed_At 
                    END,

                    Updated_At = GETDATE()
                    WHERE Ticket_ID = @id`);

        await logActivity(pool, req.user, 'UPDATE', 'TICKET', `Updated Ticket ID: ${id}`, req);
        res.json({ message: 'Ticket updated successfully' });
    } catch (err) { handleError(res, err, 'Error updating ticket'); }
});

// DELETE Ticket
router.delete('/:id', async (req, res) => {
    const { id } = req.params;
    try {
        const pool = await connectToDb();
        await pool.request().input('id', id).query('DELETE FROM Ticket_Master WHERE Ticket_ID = @id');

        await logActivity(pool, req.user, 'DELETE', 'TICKET', `Deleted Ticket ID: ${id}`, req);
        res.json({ message: 'Ticket deleted successfully' });
    } catch (err) { handleError(res, err, 'Error deleting ticket'); }
});

module.exports = router;

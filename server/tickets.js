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
router.get('/', async (req, res) => {
    try {
        const pool = await connectToDb();

        // 1. Fetch all tickets
        const ticketsResult = await pool.request().query('SELECT * FROM Ticket_Master');
        const tickets = ticketsResult.recordset;

        // 2. Fetch lookup tables for joins
        const [usersResult, complaintsResult, asmsResult] = await Promise.all([
            pool.request().query('SELECT * FROM User_Master'),
            pool.request().query('SELECT * FROM Complaint_Type_Master'),
            pool.request().query('SELECT * FROM ASM_Master')
        ]);

        const users = usersResult.recordset;
        const complaints = complaintsResult.recordset;
        const asms = asmsResult.recordset;

        // 3. Map names to tickets (Manual Join)
        const enrichedTickets = tickets.map(t => {
            const assignedUser = users.find(u => u.User_ID == t.Assigned_To);
            const creator = users.find(u => u.User_ID == t.Created_By);
            const closer = users.find(u => u.User_ID == t.Closed_By);
            const complaintType = complaints.find(ct => ct.Complaint_Type_ID == t.Complaint_Type_ID);
            const asm = asms.find(a => a.ASM_Name === t.asm_name || a.ASM_Name === t.asm);

            return {
                ...t,
                Complaint_Type: complaintType ? complaintType.Complaint_Name : t.complaint_type,
                Assigned_User: assignedUser ? assignedUser.Full_Name : null,
                Creator_Name: creator ? creator.Full_Name : null,
                Closed_By_Name: closer ? closer.Full_Name : null,
                asm_mobile: asm ? asm.Mobile : null
            };
        });

        // 4. Sort by Created_At DESC
        enrichedTickets.sort((a, b) => new Date(b.Created_At || 0) - new Date(a.Created_At || 0));

        res.json(enrichedTickets);
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
                    closer.Full_Name as Closed_By_Name,
                    asm.Mobile as asm_mobile
                FROM Ticket_Master t
                LEFT JOIN Complaint_Type_Master ct ON t.Complaint_Type_ID = ct.Complaint_Type_ID
                LEFT JOIN User_Master u ON t.Assigned_To = u.User_ID
                LEFT JOIN User_Master creator ON t.Created_By = creator.User_ID
                LEFT JOIN User_Master closer ON t.Closed_By = closer.User_ID
                LEFT JOIN ASM_Master asm ON (t.asm_name = asm.ASM_Name OR t.asm = asm.ASM_Name)
                WHERE t.customer_id = @cid OR t.customer_ids = @cid
                ORDER BY t.Created_At DESC
            `);
        res.json(result.recordset);
    } catch (err) { handleError(res, err, 'Error fetching customer tickets'); }
});

// GET Dashboard Stats
router.get('/stats', async (req, res) => {
    console.log('[API HIT] GET /api/tickets/stats - Requested by:', req.user?.User_Code || 'Unknown');
    try {
        const pool = await connectToDb();

        // 1. Fetch all required data in parallel
        const [ticketsRes, complaintsRes, usersRes, customersRes] = await Promise.all([
            pool.request().query("SELECT * FROM Ticket_Master"),
            pool.request().query("SELECT * FROM Complaint_Type_Master"),
            pool.request().query("SELECT * FROM User_Master"),
            pool.request().query("SELECT * FROM customers_profile")
        ]);

        const tickets = ticketsRes.recordset || [];
        const complaints = complaintsRes.recordset || [];
        const users = usersRes.recordset || [];
        const customers = customersRes.recordset || [];

        // 2. Compute Stats in JS
        const total = tickets.length;
        const pending = tickets.filter(t => ['open', 'pending'].includes((t.Status || '').toLowerCase())).length;
        const resolved = tickets.filter(t => ['resolved', 'closed'].includes((t.Status || '').toLowerCase())).length;
        const activeCustomers = customers.filter(c => (c.customer_statu || '').toLowerCase() === 'active').length;

        // Recently created (Top 5)
        const recent = [...tickets]
            .sort((a, b) => new Date(b.Created_At || 0) - new Date(a.Created_At || 0))
            .slice(0, 5)
            .map(t => {
                const assignedUser = users.find(u => u.User_ID == t.Assigned_To);
                const closer = users.find(u => u.User_ID == t.Closed_By);
                const complaintType = complaints.find(ct => ct.Complaint_Type_ID == t.Complaint_Type_ID);
                return {
                    ...t,
                    Complaint_Name: complaintType ? complaintType.Complaint_Name : t.complaint_type,
                    Assigned_User: assignedUser ? assignedUser.Full_Name : null,
                    Closed_By_Name: closer ? closer.Full_Name : null
                };
            });

        // Priority Distribution
        const prioritMap = {};
        tickets.forEach(t => {
            const p = t.Priority || 'Medium';
            prioritMap[p] = (prioritMap[p] || 0) + 1;
        });
        const priorityDist = Object.keys(prioritMap).map(k => ({ Priority: k, count: prioritMap[k] }));

        // Complaint Type Distribution
        const typeMap = {};
        tickets.forEach(t => {
            const ct = complaints.find(c => c.Complaint_Type_ID == t.Complaint_Type_ID);
            const name = ct ? ct.Complaint_Name : (t.complaint_type || 'Unknown');
            typeMap[name] = (typeMap[name] || 0) + 1;
        });
        const typeDist = Object.keys(typeMap).map(k => ({ Complaint_Name: k, count: typeMap[k] }));

        // Avg Resolution Time
        const resolvedTickets = tickets.filter(t => ['resolved', 'closed'].includes((t.Status || '').toLowerCase()) && t.Created_At && t.Updated_At);
        let avgRes = 0;
        if (resolvedTickets.length > 0) {
            const totalHours = resolvedTickets.reduce((sum, t) => {
                const diff = (new Date(t.Updated_At) - new Date(t.Created_At)) / (1000 * 60 * 60);
                return sum + (diff > 0 ? diff : 0);
            }, 0);
            avgRes = totalHours / resolvedTickets.length;
        }

        // Chart Data (Last 7 Days)
        const last7Days = {};
        for (let i = 0; i < 7; i++) {
            const d = new Date();
            d.setDate(d.getDate() - i);
            const dateStr = d.toISOString().split('T')[0];
            last7Days[dateStr] = 0;
        }
        tickets.forEach(t => {
            if (t.Created_At) {
                const dateStr = new Date(t.Created_At).toISOString().split('T')[0];
                if (last7Days[dateStr] !== undefined) {
                    last7Days[dateStr]++;
                }
            }
        });
        const chart = Object.keys(last7Days).map(k => ({ date: k, count: last7Days[k] })).reverse();

        res.json({
            total,
            pending,
            resolved,
            recent,
            chart,
            activeCustomers,
            priority_counts: priorityDist,
            type_counts: typeDist,
            avg_resolution_hours: Math.round(avgRes * 10) / 10
        });

    } catch (err) { handleError(res, err, 'Error fetching stats'); }
});

// CREATE Ticket
router.post('/', async (req, res) => {
    try {
        const {
            subject, description, priority, complaintTypeId, customerName, assignedTo, createdBy,
            asm_name, rsm_name, customer_type, complaint_type, customer_number, customer_address, priority_level, sla_hours, customer_id
        } = req.body;
        const pool = await connectToDb();

        // 1. Resolve ASM and RSM Codes if names are provided
        let asm_code = null;
        let rsm_code = null;

        if (asm_name) {
            const asmRes = await pool.request().input('aname', asm_name).query("SELECT ASM_Code FROM ASM_Master WHERE ASM_Name = @aname");
            if (asmRes.recordset.length > 0) asm_code = asmRes.recordset[0].ASM_Code;
        }
        if (rsm_name) {
            const rsmRes = await pool.request().input('rname', rsm_name).query("SELECT RSM_Code FROM RSM_Master WHERE RSM_Name = @rname");
            if (rsmRes.recordset.length > 0) rsm_code = rsmRes.recordset[0].RSM_Code;
        }

        // 2. Generate a simple Ticket No (T-100X)
        const countRes = await pool.request().query("SELECT COUNT(*) as count FROM Ticket_Master");
        const nextId = (countRes.recordset[0].count || 0) + 1001;
        const ticketNo = `T-${nextId}`;

        // 3. Fetch user code for creator
        const creatorId = createdBy || (req.user ? req.user.User_ID : 1);
        const userCodeVal = req.user ? req.user.User_Code : null;

        // 4. Increment Customer Ticket Count
        if (customer_id) {
            const custRes = await pool.request()
                .input('cid', customer_id)
                .query("SELECT * FROM customers_profile WHERE Customer_ID = @cid");

            if (custRes.recordset.length > 0) {
                const currentCount = parseInt(custRes.recordset[0].tickets_count || 0);
                await pool.request()
                    .input('cid', customer_id)
                    .input('newCount', currentCount + 1)
                    .query("UPDATE customers_profile SET tickets_count = @newCount WHERE Customer_ID = @cid");
            }
        }

        await pool.request()
            .input('no', ticketNo)
            .input('subject', subject)
            .input('desc', description)
            .input('priority', priority || 'Medium')
            .input('ctId', complaintTypeId)
            .input('custName', customerName)
            .input('assigned', assignedTo ?? null)
            .input('creator', creatorId)
            .input('asm_code_val', asm_code ?? asm_name ?? null)
            .input('asm_name_val', asm_name ?? null)
            .input('rsm_code_val', rsm_code ?? rsm_name ?? null)
            .input('rsm_name_val', rsm_name ?? null)
            .input('custType1', customer_type ?? null)
            .input('custType2', customer_type ?? null)
            .input('compType1', complaint_type ?? null)
            .input('compType2', complaint_type ?? null)
            .input('custNum1', customer_number ?? null)
            .input('custNum2', customer_number ?? null)
            .input('custAddr1', customer_address ?? null)
            .input('custAddr2', customer_address ?? null)
            .input('priorityLvl1', priority_level ?? (priority || 'medium'))
            .input('priorityLvl2', priority_level ?? (priority || 'medium'))
            .input('sla1', sla_hours ?? null)
            .input('sla2', sla_hours ?? null)
            .input('custId1', customer_id ?? null)
            .input('custId2', customer_id ?? null)
            .input('uc', userCodeVal)
            .query(`INSERT INTO Ticket_Master 
                    (Ticket_No, Subject, Description, Priority, Complaint_Type_ID, Customer_Name, Assigned_To, Created_By, Status, Created_At, Updated_At,
                     asm, asm_name, rsm, rsm_name, customer_type, customer_types, complaint_type, complaint_types, 
                     customer_number, customer_numbers, customer_address, customers_address, 
                     priority_level, priority_levels, sla_hours, sla_hour, customer_id, customer_ids, user_code)
                    VALUES 
                    (@no, @subject, @desc, @priority, @ctId, @custName, @assigned, @creator, 'open', GETDATE(), GETDATE(),
                     @asm_code_val, @asm_name_val, @rsm_code_val, @rsm_name_val, @custType1, @custType2, @compType1, @compType2, 
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
        const request = pool.request().input('id', id);
        const updateFields = [];

        // Logic for Closed_By and Closed_At
        const lowStatus = (status || '').toLowerCase();
        let closedByVal = undefined;
        let closedAtVal = undefined;

        if (lowStatus === 'closed') {
            closedByVal = req.user ? req.user.User_ID : null;
            closedAtVal = new Date().toISOString();

            // Add user_code to update if closing
            if (req.user && req.user.User_Code) {
                updateFields.push(`user_code = @ucl`);
                request.input('ucl', req.user.User_Code);
            }
        } else if (['open', 'in-progress', 'resolved', 'pending'].includes(lowStatus)) {
            closedByVal = null;
            closedAtVal = null;
        }

        // Logic to Resolve Codes if names are provided in body
        if (asm_name) {
            const asmRes = await pool.request().input('aname', asm_name).query("SELECT ASM_Code FROM ASM_Master WHERE ASM_Name = @aname");
            const asm_code = asmRes.recordset.length > 0 ? asmRes.recordset[0].ASM_Code : asm_name;
            updateFields.push(`asm = @asmCodeUpd`);
            request.input('asmCodeUpd', asm_code);
        }
        if (rsm_name) {
            const rsmRes = await pool.request().input('rname', rsm_name).query("SELECT RSM_Code FROM RSM_Master WHERE RSM_Name = @rname");
            const rsm_code = rsmRes.recordset.length > 0 ? rsmRes.recordset[0].RSM_Code : rsm_name;
            updateFields.push(`rsm = @rsmCodeUpd`);
            request.input('rsmCodeUpd', rsm_code);
        }

        // Map body fields to DB columns
        const fieldMapping = {
            'status': 'Status',
            'assignedTo': 'Assigned_To',
            'priority': 'Priority',
            'description': 'Description',
            'asm_name': 'asm_name', // handled asm code above
            'rsm_name': 'rsm_name', // handled rsm code above
            'customer_type': ['customer_type', 'customer_types'],
            'complaint_type': ['complaint_type', 'complaint_types'],
            'customer_number': ['customer_number', 'customer_numbers'],
            'customer_address': ['customer_address', 'customers_address'],
            'priority_level': ['priority_level', 'priority_levels'],
            'sla_hours': ['sla_hours', 'sla_hour'],
            'customer_id': ['customer_id', 'customer_ids'],
            'customer_city': 'Customer_city',
            'customer_pincode': 'Customer_pincode',
            'closingRemarks': 'Closing_Remarks'
        };

        Object.keys(fieldMapping).forEach(apiKey => {
            const val = req.body[apiKey];
            if (val !== undefined) {
                const dbCols = Array.isArray(fieldMapping[apiKey]) ? fieldMapping[apiKey] : [fieldMapping[apiKey]];
                dbCols.forEach(col => {
                    const paramName = `${apiKey}_${col}`.replace(/[^a-zA-Z0-9]/g, '');
                    updateFields.push(`${col} = @${paramName}`);
                    request.input(paramName, val);
                });
            }
        });

        if (closedByVal !== undefined) {
            updateFields.push(`Closed_By = @closedBy`);
            updateFields.push(`Closed_At = @closedAt`);
            request.input('closedBy', closedByVal);
            request.input('closedAt', closedAtVal);
        }

        updateFields.push(`Updated_At = GETDATE()`);

        const updateSql = `UPDATE Ticket_Master SET ${updateFields.join(', ')} WHERE Ticket_ID = @id`;
        await request.query(updateSql);

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

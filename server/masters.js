const express = require('express');
const router = express.Router();
const { connectToDb } = require('./db');
const bcrypt = require('bcryptjs');
const { authenticateToken } = require('./middleware/auth');
const { logActivity } = require('./logger');

// Helper for error handling
const handleError = (res, err, message) => {
    console.error(message, err);
    res.status(500).json({ message });
};

// Apply auth middleware to all routes
router.use(authenticateToken);

// ==========================================
// STATUS MASTER
// ==========================================
// GET All Statuses
router.get('/status', async (req, res) => {
    try {
        const pool = await connectToDb();
        const result = await pool.request().query('SELECT * FROM Status_Master');
        res.json(result.recordset);
    } catch (err) { handleError(res, err, 'Error fetching statuses'); }
});

// CREATE Status
router.post('/status', async (req, res) => {
    const { statusCode, statusName, statusType } = req.body;
    try {
        const pool = await connectToDb();
        await pool.request()
            .input('code', statusCode)
            .input('name', statusName)
            .input('type', statusType)
            .query('INSERT INTO Status_Master (Status_Code, Status_Name, Status_Type) VALUES (@code, @name, @type)');

        await logActivity(pool, req.user, 'CREATE', 'MASTER', `Created Status: ${statusName}`, req);
        res.json({ message: 'Status created successfully' });
    } catch (err) { handleError(res, err, 'Error creating status'); }
});

// UPDATE Status
router.put('/status/:id', async (req, res) => {
    const { id } = req.params;
    const { statusCode, statusName, statusType } = req.body;
    try {
        const pool = await connectToDb();
        await pool.request()
            .input('id', id)
            .input('code', statusCode)
            .input('name', statusName)
            .input('type', statusType)
            .query('UPDATE Status_Master SET Status_Code = @code, Status_Name = @name, Status_Type = @type WHERE Status_ID = @id');

        await logActivity(pool, req.user, 'UPDATE', 'MASTER', `Updated Status ID: ${id}`, req);
        res.json({ message: 'Status updated successfully' });
    } catch (err) { handleError(res, err, 'Error updating status'); }
});

// DELETE Status
router.delete('/status/:id', async (req, res) => {
    const { id } = req.params;
    try {
        const pool = await connectToDb();
        await pool.request().input('id', id).query('DELETE FROM Status_Master WHERE Status_ID = @id');

        await logActivity(pool, req.user, 'DELETE', 'MASTER', `Deleted Status ID: ${id}`, req);
        res.json({ message: 'Status deleted successfully' });
    } catch (err) { handleError(res, err, 'Error deleting status'); }
});


// ==========================================
// RSM MASTER
// ==========================================
// GET All RSMs
router.get('/rsm', async (req, res) => {
    try {
        const pool = await connectToDb();
        const result = await pool.request().query('SELECT * FROM RSM_Master');
        res.json(result.recordset);
    } catch (err) { handleError(res, err, 'Error fetching RSMs'); }
});

// CREATE RSM
router.post('/rsm', async (req, res) => {
    const { rsmCode, rsmName, designation, mobile, email, region, statusId } = req.body;
    try {
        const pool = await connectToDb();
        await pool.request()
            .input('code', rsmCode)
            .input('name', rsmName)
            .input('designation', designation)
            .input('mobile', mobile)
            .input('email', email)
            .input('region', region)
            .input('statusId', statusId || 1)
            .query(`INSERT INTO RSM_Master (RSM_Code, RSM_Name, Designation, Mobile, Email, Region, Status_ID, Created_At) 
                    VALUES (@code, @name, @designation, @mobile, @email, @region, @statusId, GETDATE())`);

        await logActivity(pool, req.user, 'CREATE', 'MASTER', `Created RSM: ${rsmName}`, req);
        res.json({ message: 'RSM created successfully' });
    } catch (err) { handleError(res, err, 'Error creating RSM'); }
});

// UPDATE RSM
router.put('/rsm/:id', async (req, res) => {
    const { id } = req.params;
    const { rsmCode, rsmName, designation, mobile, email, region, statusId } = req.body;
    try {
        const pool = await connectToDb();
        await pool.request()
            .input('id', id)
            .input('code', rsmCode)
            .input('name', rsmName)
            .input('designation', designation)
            .input('mobile', mobile)
            .input('email', email)
            .input('region', region)
            .input('statusId', statusId)
            .query(`UPDATE RSM_Master SET 
                    RSM_Code = @code, RSM_Name = @name, Designation = @designation, Mobile = @mobile, Email = @email, 
                    Region = @region, Status_ID = @statusId, Updated_At = GETDATE()
                    WHERE RSM_ID = @id`);

        await logActivity(pool, req.user, 'UPDATE', 'MASTER', `Updated RSM ID: ${id}`, req);
        res.json({ message: 'RSM updated successfully' });
    } catch (err) { handleError(res, err, 'Error updating RSM'); }
});

// DELETE RSM
router.delete('/rsm/:id', async (req, res) => {
    const { id } = req.params;
    try {
        const pool = await connectToDb();
        await pool.request().input('id', id).query('DELETE FROM RSM_Master WHERE RSM_ID = @id');

        await logActivity(pool, req.user, 'DELETE', 'MASTER', `Deleted RSM ID: ${id}`, req);
        res.json({ message: 'RSM deleted successfully' });
    } catch (err) { handleError(res, err, 'Error deleting RSM'); }
});


// ==========================================
// ASM MASTER
// ==========================================
// GET All ASMs
router.get('/asm', async (req, res) => {
    try {
        const pool = await connectToDb();
        // Join with RSM to get RSM Name if needed, but for now simple select
        const result = await pool.request().query('SELECT * FROM ASM_Master');
        res.json(result.recordset);
    } catch (err) { handleError(res, err, 'Error fetching ASMs'); }
});

// CREATE ASM
router.post('/asm', async (req, res) => {
    const { asmCode, asmName, mobile, email, district } = req.body;
    const rsmId = parseInt(req.body.rsmId);
    const statusId = parseInt(req.body.statusId) || 1;

    try {
        const pool = await connectToDb();

        // Fetch RSM Name
        const rsmResult = await pool.request()
            .input('rsmId', rsmId)
            .query('SELECT RSM_Name FROM RSM_Master WHERE RSM_ID = @rsmId');

        const rsmName = rsmResult.recordset.length > 0 ? rsmResult.recordset[0].RSM_Name : null;

        await pool.request()
            .input('code', asmCode)
            .input('name', asmName)
            .input('mobile', mobile)
            .input('email', email)
            .input('district', district)
            .input('rsmId', rsmId)
            .input('rsmName', rsmName)
            .input('statusId', statusId)
            .query(`INSERT INTO ASM_Master (ASM_Code, ASM_Name, Mobile, Email, District, RSM_ID, RSM_NAME, Status_ID, Created_At) 
                    VALUES (@code, @name, @mobile, @email, @district, @rsmId, @rsmName, @statusId, GETDATE())`);
        res.json({ message: 'ASM created successfully' });
    } catch (err) { handleError(res, err, 'Error creating ASM'); }
});

// UPDATE ASM
router.put('/asm/:id', async (req, res) => {
    const { id } = req.params;
    const { asmCode, asmName, mobile, email, district } = req.body;
    const rsmId = parseInt(req.body.rsmId);
    const statusId = parseInt(req.body.statusId) || 1;

    try {
        const pool = await connectToDb();

        // Fetch RSM Name
        const rsmResult = await pool.request()
            .input('rsmId', rsmId)
            .query('SELECT RSM_Name FROM RSM_Master WHERE RSM_ID = @rsmId');

        const rsmName = rsmResult.recordset.length > 0 ? rsmResult.recordset[0].RSM_Name : null;

        await pool.request()
            .input('id', id)
            .input('code', asmCode)
            .input('name', asmName)
            .input('mobile', mobile)
            .input('email', email)
            .input('district', district)
            .input('rsmId', rsmId)
            .input('rsmName', rsmName)
            .input('statusId', statusId)
            .query(`UPDATE ASM_Master SET 
                    ASM_Code = @code, ASM_Name = @name, Mobile = @mobile, Email = @email, 
                    District = @district, RSM_ID = @rsmId, RSM_NAME = @rsmName, Status_ID = @statusId, Updated_At = GETDATE()
                    WHERE ASM_ID = @id`);
        res.json({ message: 'ASM updated successfully' });
    } catch (err) { handleError(res, err, 'Error updating ASM'); }
});

// DELETE ASM
router.delete('/asm/:id', async (req, res) => {
    const { id } = req.params;
    try {
        const pool = await connectToDb();
        await pool.request().input('id', id).query('DELETE FROM ASM_Master WHERE ASM_ID = @id');
        res.json({ message: 'ASM deleted successfully' });
    } catch (err) { handleError(res, err, 'Error deleting ASM'); }
});


// ==========================================
// COMPLAINT TYPE MASTER
// ==========================================
// GET All Complaint Types
router.get('/complaint-type', async (req, res) => {
    try {
        const pool = await connectToDb();
        // User requested explicit headers, likely simplified the table. 
        // If Status Name is now stored in Complaint_Type_Status, we don't need the join anymore.
        const result = await pool.request().query('SELECT * FROM Complaint_Type_Master');
        res.json(result.recordset);
    } catch (err) { handleError(res, err, 'Error fetching complaint types'); }
});

// CREATE Complaint Type
router.post('/complaint-type', async (req, res) => {
    const { complaintCode, complaintName, slaHours, statusId } = req.body;
    // Map statusId to status text
    const STATUS_MAP = { 1: 'Active', 2: 'Inactive' };
    const statusText = STATUS_MAP[statusId] || 'Inactive';

    try {
        const pool = await connectToDb();
        await pool.request()
            .input('code', complaintCode)
            .input('name', complaintName)
            .input('sla', slaHours)
            .input('statusId', statusId || 1)
            .input('statusText', statusText)
            .query(`INSERT INTO Complaint_Type_Master (Complaint_Code, Complaint_Name, SLA_Hours, Status_ID, Complaint_Type_Status, Created_At) 
                    VALUES (@code, @name, @sla, @statusId, @statusText, GETDATE())`);
        res.json({ message: 'Complaint Type created successfully' });
    } catch (err) { handleError(res, err, 'Error creating Complaint Type'); }
});

// UPDATE Complaint Type
router.put('/complaint-type/:id', async (req, res) => {
    const { id } = req.params;
    const { complaintCode, complaintName, slaHours, statusId } = req.body;
    const STATUS_MAP = { 1: 'Active', 2: 'Inactive' };
    const statusText = STATUS_MAP[statusId] || 'Inactive';

    try {
        const pool = await connectToDb();
        await pool.request()
            .input('id', id)
            .input('code', complaintCode)
            .input('name', complaintName)
            .input('sla', slaHours)
            .input('statusId', statusId)
            .input('statusText', statusText)
            .query(`UPDATE Complaint_Type_Master SET 
                    Complaint_Code = @code, Complaint_Name = @name, 
                    SLA_Hours = @sla, Status_ID = @statusId, Complaint_Type_Status = @statusText
                    WHERE Complaint_Type_ID = @id`);
        res.json({ message: 'Complaint Type updated successfully' });
    } catch (err) { handleError(res, err, 'Error updating Complaint Type'); }
});

// DELETE Complaint Type
router.delete('/complaint-type/:id', async (req, res) => {
    const { id } = req.params;
    try {
        const pool = await connectToDb();
        await pool.request().input('id', id).query('DELETE FROM Complaint_Type_Master WHERE Complaint_Type_ID = @id');

        await logActivity(pool, req.user, 'DELETE', 'MASTER', `Deleted Complaint Type ID: ${id}`, req);
        res.json({ message: 'Complaint Type deleted successfully' });
    } catch (err) { handleError(res, err, 'Error deleting Complaint Type'); }
});


// ==========================================
// CUSTOMER TYPE MASTER
// ==========================================
// GET All Customer Types
router.get('/customer-type', async (req, res) => {
    try {
        const pool = await connectToDb();
        const result = await pool.request().query('SELECT * FROM Customer_Type_Master');
        res.json(result.recordset);
    } catch (err) { handleError(res, err, 'Error fetching customer types'); }
});

// CREATE Customer Type
router.post('/customer-type', async (req, res) => {
    const { customerTypeCode, customerTypeName, description, statusId } = req.body;
    try {
        const pool = await connectToDb();
        await pool.request()
            .input('code', customerTypeCode)
            .input('name', customerTypeName)
            .input('desc', description)
            .input('statusId', statusId || 1)
            .query(`INSERT INTO Customer_Type_Master (Customer_Type_Code, Customer_Type_Name, Description, Status_ID, Created_At) 
                    VALUES (@code, @name, @desc, @statusId, GETDATE())`);

        await logActivity(pool, req.user, 'CREATE', 'MASTER', `Created Customer Type: ${customerTypeName}`, req);
        res.json({ message: 'Customer Type created successfully' });
    } catch (err) { handleError(res, err, 'Error creating Customer Type'); }
});

// UPDATE Customer Type
router.put('/customer-type/:id', async (req, res) => {
    const { id } = req.params;
    const { customerTypeCode, customerTypeName, description, statusId } = req.body;
    try {
        const pool = await connectToDb();
        await pool.request()
            .input('id', id)
            .input('code', customerTypeCode)
            .input('name', customerTypeName)
            .input('desc', description)
            .input('statusId', statusId)
            .query(`UPDATE Customer_Type_Master SET 
                    Customer_Type_Code = @code, Customer_Type_Name = @name, Description = @desc, Status_ID = @statusId
                    WHERE Customer_Type_ID = @id`);

        await logActivity(pool, req.user, 'UPDATE', 'MASTER', `Updated Customer Type ID: ${id}`, req);
        res.json({ message: 'Customer Type updated successfully' });
    } catch (err) { handleError(res, err, 'Error updating Customer Type'); }
});

// DELETE Customer Type
router.delete('/customer-type/:id', async (req, res) => {
    const { id } = req.params;
    try {
        const pool = await connectToDb();
        await pool.request().input('id', id).query('DELETE FROM Customer_Type_Master WHERE Customer_Type_ID = @id');

        await logActivity(pool, req.user, 'DELETE', 'MASTER', `Deleted Customer Type ID: ${id}`, req);
        res.json({ message: 'Customer Type deleted successfully' });
    } catch (err) { handleError(res, err, 'Error deleting Customer Type'); }
});


// ==========================================
// USER MASTER
// ==========================================
// GET All Users
router.get('/user', async (req, res) => {
    try {
        const pool = await connectToDb();
        const result = await pool.request().query('SELECT * FROM User_Master');
        res.json(result.recordset);
    } catch (err) { handleError(res, err, 'Error fetching users'); }
});

// CREATE User
router.post('/user', async (req, res) => {
    const { userCode, fullName, email, mobile, password, role, statusId } = req.body;
    try {
        const pool = await connectToDb();

        // Hash password
        const salt = await bcrypt.genSalt(10);
        const hashedPassword = await bcrypt.hash(password, salt);

        await pool.request()
            .input('code', userCode)
            .input('name', fullName)
            .input('email', email)
            .input('mobile', mobile)
            .input('hash', hashedPassword)
            .input('role', role)
            .input('statusId', statusId || 1)
            .query(`INSERT INTO User_Master (User_Code, Full_Name, Email, Mobile, Password_Hash, Role, Status_ID, Created_At) 
                    VALUES (@code, @name, @email, @mobile, @hash, @role, @statusId, GETDATE())`);
        res.json({ message: 'User created successfully' });
    } catch (err) { handleError(res, err, 'Error creating User'); }
});

// UPDATE User
router.put('/user/:id', async (req, res) => {
    const { id } = req.params;
    const { userCode, fullName, email, mobile, role, statusId, password } = req.body; // Password optional
    try {
        const pool = await connectToDb();
        let query = `UPDATE User_Master SET 
                     User_Code = @code, Full_Name = @name, Email = @email, Mobile = @mobile, 
                     Role = @role, Status_ID = @statusId, Updated_At = GETDATE()`;

        const request = pool.request()
            .input('id', id)
            .input('code', userCode)
            .input('name', fullName)
            .input('email', email)
            .input('mobile', mobile)
            .input('role', role)
            .input('statusId', statusId);

        if (password) {
            const salt = await bcrypt.genSalt(10);
            const hashedPassword = await bcrypt.hash(password, salt);
            query += `, Password_Hash = @hash`;
            request.input('hash', hashedPassword);
        }

        query += ` WHERE User_ID = @id`;

        await request.query(query);
        res.json({ message: 'User updated successfully' });
    } catch (err) { handleError(res, err, 'Error updating User'); }
});

// DELETE User
router.delete('/user/:id', async (req, res) => {
    const { id } = req.params;
    try {
        const pool = await connectToDb();
        await pool.request().input('id', id).query('DELETE FROM User_Master WHERE User_ID = @id');
        res.json({ message: 'User deleted successfully' });
    } catch (err) { handleError(res, err, 'Error deleting User'); }
});

// ==========================================
// WHATSAPP TEMPLATE MASTER
// ==========================================
// GET All Templates
router.get('/template', async (req, res) => {
    try {
        const pool = await connectToDb();
        const result = await pool.request().query('SELECT * FROM WhatsApp_Template_Master ORDER BY Created_At DESC');
        res.json(result.recordset);
    } catch (err) { handleError(res, err, 'Error fetching templates'); }
});

// CREATE Template
router.post('/template', async (req, res) => {
    const { templateName, content, category, statusId } = req.body;
    try {
        const pool = await connectToDb();
        await pool.request()
            .input('name', templateName)
            .input('content', content)
            .input('category', category)
            .input('statusId', statusId || 1)
            .query(`INSERT INTO WhatsApp_Template_Master (Template_Name, Content, Category, Status_ID) 
                    VALUES (@name, @content, @category, @statusId)`);

        await logActivity(pool, req.user, 'CREATE', 'MASTER', `Created Template: ${templateName}`, req);
        res.json({ message: 'Template created successfully' });
    } catch (err) { handleError(res, err, 'Error creating template'); }
});

// UPDATE Template
router.put('/template/:id', async (req, res) => {
    const { id } = req.params;
    const { templateName, content, category, statusId } = req.body;
    try {
        const pool = await connectToDb();
        await pool.request()
            .input('id', id)
            .input('name', templateName)
            .input('content', content)
            .input('category', category)
            .input('statusId', statusId || 1)
            .query(`UPDATE WhatsApp_Template_Master 
                    SET Template_Name = @name, Content = @content, Category = @category, Status_ID = @statusId, Updated_At = GETDATE()
                    WHERE Template_ID = @id`);

        await logActivity(pool, req.user, 'UPDATE', 'MASTER', `Updated Template ID: ${id}`, req);
        res.json({ message: 'Template updated successfully' });
    } catch (err) { handleError(res, err, 'Error updating template'); }
});

// DELETE Template
router.delete('/template/:id', async (req, res) => {
    const { id } = req.params;
    try {
        const pool = await connectToDb();
        await pool.request().input('id', id).query('DELETE FROM WhatsApp_Template_Master WHERE Template_ID = @id');

        await logActivity(pool, req.user, 'DELETE', 'MASTER', `Deleted Template ID: ${id}`, req);
        res.json({ message: 'Template deleted successfully' });
    } catch (err) { handleError(res, err, 'Error deleting template'); }
});

module.exports = router;

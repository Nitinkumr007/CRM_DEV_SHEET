const express = require('express');
const router = express.Router();
const { connectToDb } = require('./db');
const { authenticateToken } = require('./middleware/auth');
const { logActivity } = require('./logger');

// Helper for error handling
const handleError = (res, err, message) => {
    console.error(message, err);
    res.status(500).json({ message });
};

// Apply auth middleware
router.use(authenticateToken);

// SEARCH Customer by query (Name or Number)
router.get('/search', async (req, res) => {
    try {
        const q = req.query.q;
        if (!q) return res.status(400).json({ message: 'Query parameter required' });

        const pool = await connectToDb();
        const result = await pool.request()
            .input('searchParam', `%${q}%`)
            .query(`
                SELECT 
                    c.Customer_ID,
                    c.Customer_Name,
                    c.Customer_Number,
                    c.Customer_Address,
                    c.Customer_Type_ID,
                    c.customer_statu, -- Fixed column name
                    c.pincode,
                    c.city_name,
                    ct.Customer_Type_Name
                FROM customers_profile c
                LEFT JOIN Customer_Type_Master ct ON c.Customer_Type_ID = ct.Customer_Type_ID
                WHERE c.Customer_Number LIKE @searchParam OR c.Customer_Name LIKE @searchParam
            `);

        res.json(result.recordset);
    } catch (err) { handleError(res, err, 'Error searching customers'); }
});

// GET All Customers
router.get('/', async (req, res) => {
    try {
        const pool = await connectToDb();
        const result = await pool.request().query(`
            SELECT 
                c.Customer_ID,
                c.Customer_Name,
                c.Customer_Number,
                c.Customer_Address,
                c.Customer_Type_ID,
                c.customer_statu,
                c.tickets_count,
                c.Created_At,
                c.Updated_At,
                c.pincode,
                c.city_name,
                ct.Customer_Type_Name as Customer_Type_Name_Joined
            FROM customers_profile c
            LEFT JOIN Customer_Type_Master ct ON c.Customer_Type_ID = ct.Customer_Type_ID
            ORDER BY c.Created_At DESC
        `);
        res.json(result.recordset);
    } catch (err) { handleError(res, err, 'Error fetching customers'); }
});

// CREATE Customer
router.post('/', async (req, res) => {
    const { customerName, customerNumber, customerAddress, customerTypeId, customerStatus, pincode, cityName } = req.body;
    try {
        const pool = await connectToDb();

        // Check if customer with same number already exists
        const checkRes = await pool.request()
            .input('number', customerNumber)
            .query("SELECT Customer_ID, Customer_Name FROM customers_profile WHERE Customer_Number = @number");

        if (checkRes.recordset.length > 0) {
            return res.status(409).json({
                message: 'Customer with this mobile number already exists',
                customer: checkRes.recordset[0]
            });
        }

        // Fetch Customer Type Name for redundant column
        const typeRes = await pool.request()
            .input('tid', customerTypeId)
            .query("SELECT Customer_Type_Name FROM Customer_Type_Master WHERE Customer_Type_ID = @tid");

        const typeName = typeRes.recordset[0] ? typeRes.recordset[0].Customer_Type_Name : 'Unknown';

        const result = await pool.request()
            .input('name', customerName)
            .input('type', typeName)
            .input('number', customerNumber)
            .input('addr', customerAddress)
            .input('tid', customerTypeId)
            .input('status', customerStatus || 'Active')
            .input('pin', pincode)
            .input('city', cityName)
            .query(`INSERT INTO customers_profile 
                    (Customer_Name, Customer_type, Customer_Number, Customer_Address, Customer_Type_ID, customer_statu, pincode, city_name, Created_At, Updated_At)
                    OUTPUT INSERTED.Customer_ID
                    VALUES 
                    (@name, @type, @number, @addr, @tid, @status, @pin, @city, GETDATE(), GETDATE());`);

        const newCustomerId = result.recordset[0].Customer_ID;

        await logActivity(pool, req.user, 'CREATE', 'CUSTOMER', `Created Customer: ${customerName}`, req);
        res.json({ message: 'Customer created successfully', customerId: newCustomerId });
    } catch (err) { handleError(res, err, 'Error creating customer'); }
});

// UPDATE Customer
router.put('/:id', async (req, res) => {
    const { id } = req.params;
    try {
        const pool = await connectToDb();
        // Use the new field names directly as per schema
        const { customerName, customerNumber, customerAddress, customerTypeId, customerStatus, pincode, cityName } = req.body;

        await pool.request()
            .input('id', id)
            .input('name', customerName)
            .input('number', customerNumber)
            .input('addr', customerAddress)
            .input('tid', customerTypeId)
            .input('status', customerStatus)
            .input('pin', pincode)
            .input('city', cityName)
            .query(`UPDATE customers_profile SET 
                    Customer_Name = @name,
                    Customer_Number = @number,
                    Customer_Address = @addr,
                    Customer_Type_ID = @tid,
                    customer_statu = @status,
                    pincode = @pin,
                    city_name = @city,
                    Updated_At = GETDATE()
                    WHERE Customer_ID = @id`);

        await logActivity(pool, req.user, 'UPDATE', 'CUSTOMER', `Updated Customer ID: ${id}`, req);
        res.json({ message: 'Customer updated successfully' });
    } catch (err) { handleError(res, err, 'Error updating customer'); }
});

// DELETE Customer
router.delete('/:id', async (req, res) => {
    const { id } = req.params;
    try {
        const pool = await connectToDb();
        await pool.request().input('id', id).query('DELETE FROM customers_profile WHERE Customer_ID = @id');

        await logActivity(pool, req.user, 'DELETE', 'CUSTOMER', `Deleted Customer ID: ${id}`, req);
        res.json({ message: 'Customer deleted successfully' });
    } catch (err) { handleError(res, err, 'Error deleting customer'); }
});

module.exports = router;

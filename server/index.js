const express = require('express');
require('dotenv').config();
const cors = require('cors');
const { connectToDb } = require('./db');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');

const app = express();
const PORT = process.env.PORT || 4000;
const JWT_SECRET = process.env.JWT_SECRET || 'your-secret-key'; // Move to .env for production

// Middleware
app.use(cors()); // Allow requests from React frontend
app.use(express.json());
app.use('/api/masters', require('./masters'));
app.use('/api/tickets', require('./tickets'));
app.use('/api/customers', require('./customers'));
app.use('/api/customers', require('./customers'));
app.use('/api/settings', require('./settings').default || require('./settings')); // Handle ESM/CJS interop
app.use('/api/reports-analytics', require('./reports')); // Use a different path or merge with existing report endpoints? 
// Existing reports are in index.js under /api/reports/login-log
// I will mount this at /api/analytics to be clean, or /api/new-reports.
// Actually, `src/pages/Reports.tsx` calls `/api/reports/login-log`.
// If I use `/api/reports`, I might conflict if I don't handle the existing route.
// Existing route is `app.get('/api/reports/login-log'...)` in index.js.
// If I mount `app.use('/api/reports', require('./reports'))`, express matches based on order.
// I will mount it as `/api/analytics` to be safe and clear.

// Routes
app.get('/', (req, res) => {
    res.send('CRM.Dev Backend is running');
});

const { logActivity } = require('./logger');

// Login Endpoint
app.post('/api/login', async (req, res) => {
    const { userCode, password } = req.body;

    if (!userCode || !password) {
        return res.status(400).json({ message: 'User Code and Password are required' });
    }

    try {
        const pool = await connectToDb();

        // Fetch user by User_Code
        const result = await pool.request()
            .input('code', userCode)
            .query('SELECT * FROM User_Master WHERE User_Code = @code');

        const user = result.recordset[0];

        if (!user) {
            return res.status(401).json({ message: 'Wrong Code' });
        }

        // Compare password (Bcrypt first, then plain text fallback)
        let isMatch = false;
        try {
            isMatch = await bcrypt.compare(password, user.Password_Hash);
        } catch (err) {
            // If bcrypt errors (e.g. invalid hash), we'll check plain text below
            console.log('Bcrypt comparison failed (likely not a hash), checking plain text...');
        }

        if (!isMatch && password === user.Password_Hash) {
            isMatch = true;
            console.log('Plain text password matched');
        }

        if (!isMatch) {
            return res.status(401).json({ message: 'Wrong Password' });
        }

        // Create Token
        const token = jwt.sign(
            { id: user.User_ID, code: user.User_Code, role: user.Role },
            JWT_SECRET,
            { expiresIn: '8h' }
        );

        // Update Last Login
        await pool.request()
            .input('id', user.User_ID)
            .query('UPDATE User_Master SET Last_Login = GETDATE() WHERE User_ID = @id');

        // Log successful login (Legacy Table)
        const deviceInfo = req.headers['user-agent'] || 'Unknown Device';
        const loginLogResult = await pool.request()
            .input('uid', user.User_ID)
            .input('userCode', user.User_Code)
            .input('ip', req.ip)
            .input('device', deviceInfo)
            .query("INSERT INTO Login_Log (User_ID, User_Code, Login_Status, IP_Address, Device_Info) OUTPUT INSERTED.Login_ID VALUES (@uid, @userCode, 'Success', @ip, @device)");

        const loginId = loginLogResult.recordset[0].Login_ID;

        // Log Activity (New Table)
        await logActivity(pool, { id: user.User_ID, code: user.User_Code }, 'LOGIN', 'AUTH', 'User logged in successfully', req);

        res.json({
            token,
            user: {
                id: user.User_ID,
                code: user.User_Code,
                name: user.Full_Name,
                role: user.Role,
                email: user.Email,
                loginId: loginId // Send back loginId
            }
        });

    } catch (err) {
        console.error('Login Error:', err);
        res.status(500).json({ message: 'Server error during login' });
    }
});

// Logout Endpoint
app.post('/api/logout', async (req, res) => {
    const { userId, loginId } = req.body;
    try {
        const pool = await connectToDb();
        if (loginId) {
            await pool.request()
                .input('loginId', loginId)
                .query("UPDATE Login_Log SET Logout_Time = GETDATE(), Login_Status = 'Logged Out' WHERE Login_ID = @loginId");
        } else if (userId) {
            // Fallback: Close latest open session for user
            await pool.request()
                .input('uid', userId)
                .query("UPDATE TOP(1) Login_Log SET Logout_Time = GETDATE(), Login_Status = 'Logged Out' WHERE User_ID = @uid AND Logout_Time IS NULL ORDER BY Login_Time DESC");
        }

        // Log Activity (New Table)
        if (userId) {
            await logActivity(pool, { id: userId }, 'LOGOUT', 'AUTH', 'User logged out', req);
        }

        res.json({ message: 'Logged out successfully' });
    } catch (err) {
        console.error('Logout Error:', err);
        res.status(500).json({ message: 'Error logging out' });
    }
});

// Auto-Logout Job (Check every 10 minutes)
setInterval(async () => {
    try {
        console.log('Running Auto-Logout Check...');
        const pool = await connectToDb();
        await pool.request().query(`
            UPDATE Login_Log 
            SET Logout_Time = DATEADD(hour, 10, Login_Time), Login_Status = 'Auto-Logout'
            WHERE Logout_Time IS NULL AND Login_Time < DATEADD(hour, -10, GETDATE())
        `);
    } catch (err) {
        console.error('Auto-Logout Job Error:', err);
    }
}, 10 * 60 * 1000); // 10 minutes

// Report: Login Logs
app.get('/api/reports/login-log', async (req, res) => {
    try {
        const pool = await connectToDb();
        const result = await pool.request().query(`
            SELECT 
                L.*, 
                U.Full_Name, U.User_Code 
            FROM Login_Log L
            LEFT JOIN User_Master U ON L.User_ID = U.User_ID
            ORDER BY L.Login_Time DESC
        `);
        res.json(result.recordset);
    } catch (err) { handleError(res, err, 'Error fetching login logs'); }
});

// Reset Password Endpoint
app.post('/api/reset-password', async (req, res) => {
    const { userCode, mobile, newPassword } = req.body;

    if (!userCode || !mobile || !newPassword) {
        return res.status(400).json({ message: 'All fields are required' });
    }

    try {
        const pool = await connectToDb();

        // 1. Verify User Code and Mobile
        const result = await pool.request()
            .input('code', userCode)
            .query('SELECT * FROM User_Master WHERE User_Code = @code');

        const user = result.recordset[0];

        if (!user) {
            return res.status(404).json({ message: 'User not found' });
        }

        // Check if mobile matches
        if (String(user.Mobile) !== String(mobile)) {
            return res.status(400).json({ message: 'Mobile number does not match our records' });
        }

        // 2. Hash new password
        const salt = await bcrypt.genSalt(10);
        const hashedPassword = await bcrypt.hash(newPassword, salt);

        // 3. Update password
        await pool.request()
            .input('hash', hashedPassword)
            .input('id', user.User_ID)
            .query('UPDATE User_Master SET Password_Hash = @hash WHERE User_ID = @id');

        res.json({ message: 'Password updated successfully' });

    } catch (err) {
        console.error('Reset Password Error:', err);
        res.status(500).json({ message: 'Server error during password reset' });
    }
});

// Test DB Connection Route
app.get('/api/health', async (req, res) => {
    try {
        const pool = await connectToDb();
        const result = await pool.request().query('SELECT 1 as health_check');
        res.json({
            status: 'ok',
            message: 'Database connection healthy',
            timestamp: new Date(),
            data: result.recordset
        });
    } catch (err) {
        res.status(500).json({
            status: 'error',
            message: 'Database connection failed',
            error: err.message
        });
    }
});

// Start Server
app.listen(PORT, () => {
    console.log(`🚀 Server running on http://localhost:${PORT}`);
    // Attempt initial connection
    connectToDb().catch(err => console.log('Initial DB connection attempt failed (waiting for request)...'));
});

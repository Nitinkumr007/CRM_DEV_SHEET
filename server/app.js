const express = require('express');
const path = require('path');
const cors = require('cors');
const { connectToDb } = require('./db');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
require('dotenv').config({ path: path.resolve(__dirname, '.env') });

const app = express();
const JWT_SECRET = process.env.JWT_SECRET || 'your-secret-key';

const { logActivity } = require('./logger');

// Middleware
app.use(cors());
app.use(express.json());

// API Routes
app.use('/api/masters', require('./masters'));
app.use('/api/tickets', require('./tickets'));
app.use('/api/customers', require('./customers'));
app.use('/api/reports-analytics', require('./reports'));

// Login Endpoint
app.post('/api/login', async (req, res) => {
    const { userCode, password } = req.body;
    if (!userCode || !password) {
        return res.status(400).json({ message: 'User Code and Password are required' });
    }

    try {
        const pool = await connectToDb();
        const result = await pool.request()
            .input('code', userCode)
            .query('SELECT * FROM User_Master WHERE User_Code = @code');

        const user = result.recordset[0];
        if (!user) return res.status(401).json({ message: 'Wrong Code' });

        let isMatch = false;
        try {
            isMatch = await bcrypt.compare(password, String(user.Password_Hash || ''));
        } catch (err) { }

        if (!isMatch && String(password).trim() === String(user.Password_Hash).trim()) {
            isMatch = true;
        }

        if (!isMatch) return res.status(401).json({ message: 'Wrong Password' });

        const token = jwt.sign(
            { id: user.User_ID, code: user.User_Code, role: user.Role },
            JWT_SECRET,
            { expiresIn: '8h' }
        );

        await pool.request()
            .input('id', user.User_ID)
            .query('UPDATE User_Master SET Last_Login = GETDATE() WHERE User_ID = @id');

        const deviceInfo = req.headers['user-agent'] || 'Unknown Device';
        const loginLogResult = await pool.request()
            .input('uid', user.User_ID)
            .input('userCode', user.User_Code)
            .input('ip', req.ip)
            .input('device', deviceInfo)
            .query("INSERT INTO Login_Log (User_ID, User_Code, Login_Status, IP_Address, Device_Info) OUTPUT INSERTED.Login_ID VALUES (@uid, @userCode, 'Success', @ip, @device)");

        const loginId = loginLogResult.recordset[0].Login_ID;
        await logActivity(pool, { id: user.User_ID, code: user.User_Code }, 'LOGIN', 'AUTH', 'User logged in successfully', req);

        res.json({
            token,
            user: {
                id: user.User_ID,
                code: user.User_Code,
                name: user.Full_Name,
                role: user.Role,
                email: user.Email,
                loginId: loginId
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
            await pool.request()
                .input('uid', userId)
                .query("UPDATE TOP(1) Login_Log SET Logout_Time = GETDATE(), Login_Status = 'Logged Out' WHERE User_ID = @uid AND Logout_Time IS NULL ORDER BY Login_Time DESC");
        }
        if (userId) {
            await logActivity(pool, { id: userId }, 'LOGOUT', 'AUTH', 'User logged out', req);
        }
        res.json({ message: 'Logged out successfully' });
    } catch (err) {
        console.error('Logout Error:', err);
        res.status(500).json({ message: 'Error logging out' });
    }
});

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
    } catch (err) {
        console.error('Error fetching login logs', err);
        res.status(500).json({ message: 'Error fetching login logs' });
    }
});

// Reset Password Endpoint
app.post('/api/reset-password', async (req, res) => {
    const { userCode, mobile, newPassword } = req.body;
    if (!userCode || !mobile || !newPassword) {
        return res.status(400).json({ message: 'All fields are required' });
    }

    try {
        const pool = await connectToDb();
        const result = await pool.request()
            .input('code', userCode)
            .query('SELECT * FROM User_Master WHERE User_Code = @code');

        const user = result.recordset[0];
        if (!user) return res.status(404).json({ message: 'User not found' });
        if (String(user.Mobile) !== String(mobile)) {
            return res.status(400).json({ message: 'Mobile number does not match our records' });
        }

        const salt = await bcrypt.genSalt(10);
        const hashedPassword = await bcrypt.hash(newPassword, salt);

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

// Health Check
app.get('/api/health', async (req, res) => {
    try {
        const pool = await connectToDb();
        const result = await pool.request().query('SELECT 1 as health_check');
        res.json({ status: 'ok', data: result.recordset });
    } catch (err) {
        res.status(500).json({ status: 'error', error: err.message });
    }
});

module.exports = app;

const jwt = require('jsonwebtoken');
const path = require('path');
require('dotenv').config({ path: path.resolve(__dirname, '../.env') }); // It's in one level up from middleware/
const JWT_SECRET = process.env.JWT_SECRET || 'your-secret-key';

const authenticateToken = (req, res, next) => {
    const authHeader = req.headers['authorization'];
    const token = authHeader && authHeader.split(' ')[1];

    if (token == null) {
        // If no token, we can either block (401) or allow as guest (next)
        // For logging purposes, we want to know if it's a user.
        // If we block, we break existing frontend until it's updated.
        // Let's allow but user will be undefined or explicit guest.
        req.user = { User_ID: null, User_Code: 'GUEST', Role: 'Guest' };
        return next();
    }

    jwt.verify(token, JWT_SECRET, (err, user) => {
        if (err) {
            console.error("Token verification failed:", err.message);
            return res.status(401).json({ message: 'Session expired. Please login again.' });
        }

        // Map token payload to req.user
        // Token payload from login: { id: user.User_ID, role: user.Role }
        // We might want to fetch full details or just use what's in token.
        // Logger needs User_ID and User_Code. Token has ID. Code is not in token currently!
        // We need to update login to put Code in token OR fetch user here.
        // Fetching user on every request is heavy.
        // Let's stick with what we have. User_ID is crucial. User_Code we can try to look up or ignore if missing.
        // Wait, I can update the login token generation to include code!
        req.user = user;
        req.user.User_ID = user.id;
        req.user.User_Code = user.code; // Added mapping
        next();
    });
};

module.exports = { authenticateToken };

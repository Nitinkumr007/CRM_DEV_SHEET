const { connectToDb } = require('./db');
require('dotenv').config();

async function getUser() {
    try {
        const pool = await connectToDb();
        const result = await pool.request().query('SELECT TOP 1 User_Code, Password_Hash, Role FROM User_Master');
        console.log('User Creds:', JSON.stringify(result.recordset[0]));
        process.exit(0);
    } catch (err) {
        console.error('Error:', err);
        process.exit(1);
    }
}

getUser();

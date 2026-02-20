const { connectToDb } = require('./db');

async function debugUserSchema() {
    try {
        const pool = await connectToDb();
        console.log('Connected. Fetching User_Master columns...');
        const schemaRes = await pool.request().query("SELECT COLUMN_NAME FROM INFORMATION_SCHEMA.COLUMNS WHERE TABLE_NAME = 'User_Master'");
        console.log('User_Master Columns:', schemaRes.recordset.map(r => r.COLUMN_NAME));
    } catch (err) {
        console.error('Error:', err);
    }
}

debugUserSchema();

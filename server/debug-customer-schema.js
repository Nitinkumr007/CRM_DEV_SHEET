const { connectToDb } = require('./db');

async function debugSchema() {
    try {
        const pool = await connectToDb();
        console.log('Connected. Fetching schema info...');

        const schemaRes = await pool.request().query("SELECT COLUMN_NAME, DATA_TYPE, CHARACTER_MAXIMUM_LENGTH FROM INFORMATION_SCHEMA.COLUMNS WHERE TABLE_NAME = 'customers_profile'");
        console.log('Schema Columns:', schemaRes.recordset);

    } catch (err) {
        console.error('Error:', err);
    }
}

debugSchema();

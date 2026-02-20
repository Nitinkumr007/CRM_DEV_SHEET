const { connectToDb } = require('./db');

async function checkTypes() {
    try {
        const pool = await connectToDb();
        const result = await pool.request().query('SELECT * FROM Customer_Type_Master');
        console.table(result.recordset);
        process.exit(0);
    } catch (err) {
        console.error('Error:', err);
        process.exit(1);
    }
}

checkTypes();

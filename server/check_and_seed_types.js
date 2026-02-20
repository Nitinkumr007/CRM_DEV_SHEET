const { connectToDb } = require('./db');

async function checkTypes() {
    try {
        const pool = await connectToDb();
        console.log('Connected to DB');
        const result = await pool.request().query("SELECT Customer_Type_ID, Customer_Type_Name FROM Customer_Type_Master");
        console.log('Query result:', JSON.stringify(result.recordset, null, 2));

        if (result.recordset.length === 0) {
            console.log('No customer types found. Attempting to seed...');
            // Optional: Auto-seed if empty
            await pool.request().query(`
                INSERT INTO Customer_Type_Master (Customer_Type_Code, Customer_Type_Name) VALUES 
                ('RET', 'Retailer'),
                ('DIST', 'Distributor'),
                ('FARM', 'Farmer');
            `);
            console.log('Seeded default types.');
            const newResult = await pool.request().query("SELECT * FROM Customer_Type_Master");
            console.log('New types:', JSON.stringify(newResult.recordset, null, 2));
        }

        process.exit(0);
    } catch (err) {
        console.error('Error:', err);
        process.exit(1);
    }
}

checkTypes();

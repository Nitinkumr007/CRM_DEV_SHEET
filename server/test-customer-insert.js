const { connectToDb } = require('./db');

async function testInsert() {
    try {
        const pool = await connectToDb();
        console.log('Connected. Checking IDENTITY property of Customer_ID...');

        const identityRes = await pool.request().query("SELECT is_identity FROM sys.columns WHERE object_id = object_id('customers_profile') AND name = 'Customer_ID'");
        if (identityRes.recordset.length > 0) {
            console.log('is_identity:', identityRes.recordset[0].is_identity);
        } else {
            console.log('Customer_ID column not found in sys.columns');
        }

        console.log('Attempting INSERT...');

        // Mock data
        const customerName = 'Test User ' + Date.now();
        const customerNumber = '9999999999';
        const customerAddress = 'Test Addr';
        const customerTypeId = 1; // Assuming 1 exists
        const customerStatus = 'Active';

        // Fetch type name logic
        const typeRes = await pool.request()
            .input('tid', customerTypeId)
            .query("SELECT Customer_Type_Name FROM Customer_Type_Master WHERE Customer_Type_ID = @tid");

        const typeName = typeRes.recordset[0] ? typeRes.recordset[0].Customer_Type_Name : 'Unknown';
        console.log('Fetched Type Name:', typeName);

        const result = await pool.request()
            .input('name', customerName)
            .input('type', typeName)
            .input('number', customerNumber)
            .input('addr', customerAddress)
            .input('tid', customerTypeId)
            .input('status', customerStatus)
            .query(`INSERT INTO customers_profile 
                    (Customer_Name, Customer_type, Customer_Number, Customer_Address, Customer_Type_ID, customer_statu, Created_At, Updated_At)
                    OUTPUT INSERTED.Customer_ID
                    VALUES 
                    (@name, @type, @number, @addr, @tid, @status, GETDATE(), GETDATE());`);

        if (result.recordset && result.recordset.length > 0) {
            console.log('Insert Success! New ID:', result.recordset[0].Customer_ID);
        } else {
            console.error('Insert executed but returned no ID. Recordset:', result.recordset);
        }

    } catch (err) {
        console.error('INSERT FAILED with error:', err);
        const fs = require('fs');
        fs.writeFileSync('insert-error.log', 'Error: ' + err.message + '\nFull: ' + JSON.stringify(err, null, 2));
    }
}

testInsert();

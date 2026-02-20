const { connectToDb } = require('./db');

async function debugStats() {
    try {
        console.log('Connecting to DB...');
        const pool = await connectToDb();
        console.log('Connected.');

        console.log('Testing Total Tickets Query...');
        try {
            await pool.request().query("SELECT COUNT(*) as count FROM Ticket_Master");
            console.log('✅ Total Tickets Query: OK');
        } catch (e) { console.error('❌ Total Tickets Query FAILED:', e.message); }

        console.log('Testing Active Customers Query...');
        try {
            await pool.request().query("SELECT COUNT(*) as count FROM Customer_Master WHERE Customer_Status = 'Active'");
            console.log('✅ Active Customers Query: OK');
        } catch (e) { console.error('❌ Active Customers Query FAILED:', e.message); }

        console.log('Testing Chart Query...');
        try {
            await pool.request().query(`
                SELECT FORMAT(Created_At, 'yyyy-MM-dd') as date, COUNT(*) as count
                FROM Ticket_Master
                WHERE Created_At >= DATEADD(day, -7, GETDATE())
                GROUP BY FORMAT(Created_At, 'yyyy-MM-dd')
                ORDER BY date
            `);
            console.log('✅ Chart Query: OK');
        } catch (e) { console.error('❌ Chart Query FAILED:', e.message); }

    } catch (err) {
        console.error('General Error:', err);
    } finally {
        // process.exit(); 
    }
}

debugStats();

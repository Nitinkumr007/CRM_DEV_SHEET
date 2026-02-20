const { connectToDb } = require('./db');

async function runMigration() {
    try {
        const pool = await connectToDb();
        console.log('Connected to DB. Syncing Ticket_Master schema...');

        // List of all new columns to ensure exist
        const columns = [
            'asm VARCHAR(100)',
            'rsm VARCHAR(100)',
            'customer_type VARCHAR(100)',
            'complaint_type VARCHAR(100)',
            'customer_number VARCHAR(50)',
            'customer_address VARCHAR(255)',
            'priority_level VARCHAR(50)',
            'sla_hours INT',
            'customer_id INT',
            // Duplicates / Variations provided by user
            'asm_name VARCHAR(100)',
            'rsm_name VARCHAR(100)',
            'customer_types VARCHAR(100)',
            'complaint_types VARCHAR(100)',
            'customer_numbers VARCHAR(50)',
            'customers_address VARCHAR(255)',
            'priority_levels VARCHAR(50)',
            'sla_hour INT',
            'customer_ids INT'
        ];

        for (const colDef of columns) {
            const colName = colDef.split(' ')[0];
            const checkQuery = `
                IF NOT EXISTS (
                    SELECT * FROM sys.columns 
                    WHERE object_id = OBJECT_ID('Ticket_Master') AND name = '${colName}'
                )
                BEGIN
                    ALTER TABLE Ticket_Master ADD ${colDef};
                    PRINT 'Added column ${colName}';
                END
            `;
            await pool.request().query(checkQuery);
        }

        console.log('Ticket_Master sync completed.');
        process.exit(0);
    } catch (err) {
        console.error('Migration failed:', err);
        process.exit(1);
    }
}

runMigration();

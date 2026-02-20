const { connectToDb } = require('./db');

async function runMigration() {
    try {
        const pool = await connectToDb();
        console.log('Connected to DB. Running migration...');

        const query = `
            ALTER TABLE Ticket_Master
            ADD asm_name varchar(100),
                rsm_name varchar(100),
                customer_type varchar(100),
                complaint_type_name varchar(100), -- Renamed to avoid collision if needed, but user said 'complaint_type'. Let's use user's names.
                customer_number varchar(50),
                customer_address varchar(255),
                priority_level varchar(50),
                sla_hours int,
                customer_id int;
        `;

        // Note: I will use the exact column names the user requested.
        // If 'complaint_type' conflicts with something, SQL might complain if it was already there, but it wasn't in the schema I read. 
        // Wait, schema has 'Complaint_Type_ID'. 'complaint_type' (string) is new.

        await pool.request().query(`
            IF NOT EXISTS (SELECT * FROM sys.columns WHERE object_id = OBJECT_ID('Ticket_Master') AND name = 'asm_name')
            BEGIN
                ALTER TABLE Ticket_Master
                ADD asm_name varchar(100),
                    rsm_name varchar(100),
                    customer_type varchar(100),
                    complaint_type varchar(100),
                    customer_number varchar(50),
                    customer_address varchar(255),
                    priority_level varchar(50),
                    sla_hours int,
                    customer_id int;
            END
        `);

        console.log('Migration completed successfully.');
        process.exit(0);
    } catch (err) {
        console.error('Migration failed:', err);
        process.exit(1);
    }
}

runMigration();

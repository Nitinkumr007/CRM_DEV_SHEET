const { connectToDb } = require('./db');

async function runMigration() {
    try {
        const pool = await connectToDb();
        console.log('Connected to DB. Running migration for customers_profile...');

        const query = `
            IF NOT EXISTS (SELECT * FROM sys.tables WHERE name = 'customers_profile')
            BEGIN
                CREATE TABLE customers_profile (
                    Customer_ID int identity(1,1) primary key,
                    Customer_Name varchar(255) not null,
                    Customer_type varchar(500) not null,
                    Customer_Number varchar(50) not null,
                    Customer_Address varchar(500) not null,
                    Customer_Type_ID int not null,
                    tickets_count int default 0,
                    Created_At datetime default getdate(),
                    Updated_At datetime default getdate()
                );
                PRINT 'Table customers_profile created.';
            END
            ELSE
            BEGIN
                PRINT 'Table customers_profile already exists.';
            END
        `;

        await pool.request().query(query);

        console.log('Migration completed successfully.');
        process.exit(0);
    } catch (err) {
        console.error('Migration failed:', err);
        process.exit(1);
    }
}

runMigration();

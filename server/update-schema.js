const { connectToDb } = require('./db');

async function updateSchema() {
    try {
        const pool = await connectToDb();
        console.log('🔌 Connecting to database...');

        // Check if Ticket_Master exists
        const check = await pool.request().query("SELECT * FROM INFORMATION_SCHEMA.TABLES WHERE TABLE_NAME = 'Ticket_Master'");

        if (check.recordset.length === 0) {
            console.log('⚡ Creating Ticket_Master table...');
            await pool.request().query(`
                CREATE TABLE Ticket_Master (
                    Ticket_ID INT IDENTITY PRIMARY KEY,
                    Ticket_No VARCHAR(20) UNIQUE NOT NULL,
                    Subject VARCHAR(200) NOT NULL,
                    Description TEXT,
                    Status VARCHAR(20) DEFAULT 'Open',  -- Open, In Progress, Resolved, Closed
                    Priority VARCHAR(20) DEFAULT 'Medium', -- Low, Medium, High, Urgent
                    Complaint_Type_ID INT,
                    Customer_Name VARCHAR(100), -- For now, string. Later can link to Customer Master if needed.
                    Assigned_To INT, -- User_ID of Agent/Admin
                    Created_By INT, -- User_ID
                    Created_At DATETIME DEFAULT GETDATE(),
                    Updated_At DATETIME,
                    CONSTRAINT FK_Ticket_ComplaintType FOREIGN KEY (Complaint_Type_ID) REFERENCES Complaint_Type_Master(Complaint_Type_ID),
                    CONSTRAINT FK_Ticket_AssignedTo FOREIGN KEY (Assigned_To) REFERENCES User_Master(User_ID),
                    CONSTRAINT FK_Ticket_CreatedBy FOREIGN KEY (Created_By) REFERENCES User_Master(User_ID)
                );
            `);
            console.log('✅ Ticket_Master created successfully.');
        } else {
            console.log('ℹ️ Ticket_Master already exists.');
        }

    } catch (err) {
        console.error('❌ Schema update failed:', err);
    } finally {
        process.exit();
    }
}

updateSchema();

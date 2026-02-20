const sql = require('msnodesqlv8');

// The verified connection string
const connectionString = "Driver={ODBC Driver 17 for SQL Server};Server=localhost,4000;Database=CRM_SW;Trusted_Connection=Yes;";

// Secure query function utilizing parameterized queries
function query(sqlQuery, inputs = {}) {
    return new Promise((resolve, reject) => {
        let finalQuery = sqlQuery;
        const params = [];

        // Regex to find parameters like @param
        // We replace them with ? and push the corresponding value to params array
        // This ensures proper parameterization by the driver
        finalQuery = finalQuery.replace(/@(\w+)/g, (match, paramName) => {
            if (Object.prototype.hasOwnProperty.call(inputs, paramName)) {
                params.push(inputs[paramName]);
                return '?';
            }
            return match; // Leave it if no matching input found (or error?)
        });

        console.log('[DB EXEC] Query:', finalQuery);
        // console.log('[DB EXEC] Params:', params);

        sql.query(connectionString, finalQuery, params, (err, rows) => {
            if (err) {
                console.error('[DB ERROR]', err);
                reject(err);
            } else {
                resolve({ recordset: rows || [] });
            }
        });
    });
}

class SecureRequest {
    constructor() {
        this.inputs = {};
    }

    input(name, value) {
        this.inputs[name] = value;
        return this; // Chainable
    }

    query(q) {
        return query(q, this.inputs);
    }
}

const securePool = {
    request: () => new SecureRequest(),
    connect: () => Promise.resolve(),
    close: () => Promise.resolve()
};

async function connectToDb() {
    return new Promise((resolve, reject) => {
        sql.open(connectionString, (err, conn) => {
            if (err) {
                console.error('❌ Database connection failed:', err);
                reject(err);
            } else {
                console.log('✅ Connected to SQL Server successfully');
                conn.close(); // Close immediately as we just use generic query helper which opens its own connections usually, 
                // or msnodesqlv8.query handles it. 
                // Actually msnodesqlv8.query(connectionString, ...) opens/closes internally.
                resolve(securePool);
            }
        });
    });
}

module.exports = {
    connectToDb,
    sql: null // No direct access to sql driver from outside needed usually
};

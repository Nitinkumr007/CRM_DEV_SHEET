const gsheet = require('./appsScriptClient');

/**
 * Splits a string by comma while respecting parentheses and single quotes.
 * Useful for parsing SQL LISTS and SET clauses.
 */
function smartSplit(str) {
    const result = [];
    let current = "";
    let depth = 0;
    let inQuote = false;

    for (let i = 0; i < str.length; i++) {
        const char = str[i];
        if (char === "'" && str[i - 1] !== "\\") inQuote = !inQuote;
        if (!inQuote) {
            if (char === "(") depth++;
            if (char === ")") depth--;
        }

        if (char === "," && depth === 0 && !inQuote) {
            result.push(current.trim());
            current = "";
        } else {
            current += char;
        }
    }
    if (current) result.push(current.trim());
    return result;
}

// Data query function using Google Sheets
async function query(sqlQuery, inputs = {}) {
    // 0. Cleanup Query
    let cleanQuery = sqlQuery.replace(/--.*$/gm, '').replace(/\s+/g, ' ').trim();
    console.log('[GSHEET EXEC] Parsed Query:', cleanQuery.substring(0, 100) + '...');

    try {
        // --- 1. SELECT COUNT Pattern ---
        if (/SELECT\s+COUNT\(\*\)\s+as\s+count\s+FROM\s+(\w+)/i.test(cleanQuery)) {
            const tableName = cleanQuery.match(/FROM\s+(\w+)/i)[1];
            const data = await gsheet.read(tableName);

            let filtered = data;
            if (/WHERE\s+(\w+)\s*=\s*['"]?([^'"]+)['"]?/i.test(cleanQuery)) {
                const match = cleanQuery.match(/WHERE\s+(\w+)\s*=\s*['"]?([^'"]+)['"]?/i);
                filtered = data.filter(row => row[match[1]]?.toString() === match[2]);
            }

            return { recordset: [{ count: filtered.length }] };
        }

        // --- 2. SELECT TOP Pattern (Improved ORDER BY) ---
        if (/SELECT\s+TOP\s+(\d+)/i.test(cleanQuery)) {
            const limit = parseInt(cleanQuery.match(/SELECT\s+TOP\s+(\d+)/i)[1]);
            const tableNameResult = cleanQuery.match(/FROM\s+(\w+)/i);
            if (tableNameResult) {
                const tableName = tableNameResult[1];
                let data = await gsheet.read(tableName);

                // Enhanced ORDER BY
                const orderMatch = cleanQuery.match(/ORDER\s+BY\s+(\w+)(?:\s+(DESC|ASC))?/i);
                if (orderMatch) {
                    const col = orderMatch[1];
                    const dir = (orderMatch[2] || 'ASC').toUpperCase();
                    data.sort((a, b) => {
                        let valA = a[col], valB = b[col];
                        if (valA instanceof Date || !isNaN(Date.parse(valA))) {
                            valA = new Date(valA || 0); valB = new Date(valB || 0);
                        }
                        return dir === 'DESC' ? (valB > valA ? 1 : -1) : (valA > valB ? 1 : -1);
                    });
                }
                return { recordset: data.slice(0, limit) };
            }
        }

        // --- 3. General SELECT Pattern (Handle basic JOINs, OR conditions and ORDER BY) ---
        if (/^\s*SELECT\s+.*FROM\s+(\w+)/i.test(cleanQuery)) {
            const tableName = cleanQuery.match(/FROM\s+(\w+)/i)[1];
            let data = await gsheet.read(tableName);

            // Enhanced WHERE (Supports simple OR: WHERE Col = @val OR Col2 = @val)
            const wherePart = cleanQuery.match(/WHERE\s+(.*?)(?:ORDER\s+BY|$)/i);
            if (wherePart) {
                const conditions = wherePart[1].split(/OR/i).map(c => c.trim());
                data = data.filter(row => {
                    return conditions.some(cond => {
                        const match = cond.match(/(?:[\w\.]*?\.)?(\w+)\s*=\s*@(\w+)/i);
                        if (match) {
                            const col = match[1];
                            const param = match[2];
                            return row[col]?.toString() === inputs[param]?.toString();
                        }
                        const valMatch = cond.match(/(\w+)\s*=\s*['"]?([^'"]+)['"]?/i);
                        if (valMatch) {
                            const col = valMatch[1];
                            const val = valMatch[2];
                            return row[col]?.toString() === val.toString();
                        }
                        return false;
                    });
                });
            }

            // Reuse ORDER BY logic
            const orderMatch = cleanQuery.match(/ORDER\s+BY\s+(\w+)(?:\s+(DESC|ASC))?/i);
            if (orderMatch) {
                const col = orderMatch[1];
                const dir = (orderMatch[2] || 'ASC').toUpperCase();
                data.sort((a, b) => {
                    let valA = a[col], valB = b[col];
                    if (valA instanceof Date || !isNaN(Date.parse(valA))) {
                        valA = new Date(valA || 0); valB = new Date(valB || 0);
                    }
                    return dir === 'DESC' ? (valB > valA ? 1 : -1) : (valA > valB ? 1 : -1);
                });
            }

            return { recordset: data };
        }

        // --- 4. INSERT Pattern (Robust ID detection) ---
        if (/INSERT\s+INTO\s+(\w+)\s*\((.*?)\)\s*(?:OUTPUT\s+INSERTED\.(\w+)\s*)?VALUES\s*\((.*)\)/is.test(cleanQuery)) {
            const match = cleanQuery.match(/INSERT\s+INTO\s+(\w+)\s*\((.*?)\)\s*(?:OUTPUT\s+INSERTED\.(\w+)\s*)?VALUES\s*\((.*)\)/is);
            const tableName = match[1];
            const columns = smartSplit(match[2]);
            const outputIdCol = match[3];
            const values = smartSplit(match[4]);

            const dataToAppend = {};
            columns.forEach((col, idx) => {
                const val = values[idx];
                if (!val) return;
                if (val.startsWith('@')) {
                    const paramName = val.substring(1);
                    dataToAppend[col] = inputs[paramName];
                } else if (val.toUpperCase() === 'GETDATE()') {
                    dataToAppend[col] = new Date().toISOString();
                } else {
                    dataToAppend[col] = val.replace(/^['"]|['"]$/g, '');
                }
            });

            // Handle ID Generation
            const cleanTable = tableName.replace('_Master', '').replace('customers_profile', 'Customer').replace('_Log', '');
            let idColName = outputIdCol || `${cleanTable}_ID`;

            // Special cases for Master tables with non-standard ID names
            if (tableName === 'WhatsApp_Template_Master') idColName = 'Template_ID';

            if (!dataToAppend[idColName]) dataToAppend[idColName] = Date.now();

            await gsheet.append(tableName, dataToAppend);

            // Compatibility result (Ensure the requested ID column exists in recordset)
            const returned = { ...dataToAppend };
            if (outputIdCol) returned[outputIdCol] = dataToAppend[idColName];

            return { recordset: [returned] };
        }

        // --- 5. UPDATE Pattern ---
        if (/UPDATE\s+(\w+)\s+SET\s+(.*?)\s+WHERE\s+(\w+)\s*=\s*@(\w+)/is.test(cleanQuery)) {
            const match = cleanQuery.match(/UPDATE\s+(\w+)\s+SET\s+(.*?)\s+WHERE\s+(\w+)\s*=\s*@(\w+)/is);
            const tableName = match[1];
            const setClause = match[2];
            const idCol = match[3];
            const idParam = match[4];
            const idValue = inputs[idParam];

            const updates = {};
            const pairs = smartSplit(setClause);
            pairs.forEach(pair => {
                const eqIdx = pair.indexOf('=');
                if (eqIdx === -1) return;
                const col = pair.substring(0, eqIdx).trim();
                const val = pair.substring(eqIdx + 1).trim();

                if (val.startsWith('@')) {
                    const paramName = val.substring(1);
                    if (inputs[paramName] !== undefined && inputs[paramName] !== null) {
                        updates[col] = inputs[paramName];
                    }
                } else if (val.toUpperCase() === 'GETDATE()') {
                    updates[col] = new Date().toISOString();
                } else if (val.toUpperCase().startsWith('COALESCE')) {
                    const coalMatch = val.match(/COALESCE\s*\(@(\w+),\s*(\w+)\)/i);
                    if (coalMatch) {
                        const paramName = coalMatch[1];
                        if (inputs[paramName] !== undefined && inputs[paramName] !== null) {
                            updates[col] = inputs[paramName];
                        }
                    }
                } else if (val.toUpperCase().startsWith('LOWER')) {
                    const lowerMatch = val.match(/LOWER\s*\(@(\w+)\)/i);
                    if (lowerMatch) {
                        const paramName = lowerMatch[1];
                        if (inputs[paramName]) updates[col] = inputs[paramName].toLowerCase();
                    }
                }
            });

            await gsheet.update(tableName, idValue, idCol, updates);
            return { recordset: [] };
        }

        // --- 6. DELETE Pattern ---
        if (/DELETE\s+FROM\s+(\w+)\s+WHERE\s+(\w+)\s*=\s*@(\w+)/i.test(cleanQuery)) {
            const match = cleanQuery.match(/FROM\s+(\w+)\s+WHERE\s+(\w+)\s*=\s*@(\w+)/i);
            const tableName = match[1];
            const idCol = match[2];
            const idParam = match[3];
            const idValue = inputs[idParam];
            await gsheet.delete(tableName, idValue, idCol);
            return { recordset: [] };
        }

        if (cleanQuery.includes('SELECT 1')) {
            return { recordset: [{ health_check: 1 }] };
        }

        console.warn('[GSHEET] Query Pattern not fully supported:', cleanQuery);
        return { recordset: [] };
    } catch (err) {
        console.error('[GSHEET ERROR]', err.message);
        throw err;
    }
}

class SecureRequest {
    constructor() {
        this.inputs = {};
    }
    input(name, value) {
        this.inputs[name] = value;
        return this;
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
    console.log('✅ Google Sheets Backend Bridge active');
    return Promise.resolve(securePool);
}

module.exports = { connectToDb };

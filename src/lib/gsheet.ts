// Get URL from environment variable
const VITE_URL = import.meta.env.VITE_APPS_SCRIPT_URL;
const STORED_URL = typeof window !== 'undefined' ? localStorage.getItem('APPS_SCRIPT_URL') : null;
const APPS_SCRIPT_URL = VITE_URL || STORED_URL;

if (!APPS_SCRIPT_URL) {
    console.error('VITE_APPS_SCRIPT_URL is not defined! Sheet access will fail.');
}
if (VITE_URL && VITE_URL !== STORED_URL) {
    localStorage.setItem('APPS_SCRIPT_URL', VITE_URL);
}

export interface GSheetResponse {
    success: boolean;
    data?: any[];
    message?: string;
}

/**
 * Splits a string by comma while respecting parentheses and single quotes.
 * Useful for parsing SQL LISTS and SET clauses.
 */
function smartSplit(str: string) {
    const result: string[] = [];
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

export class GSheetClient {
    private url: string;

    constructor(url: string) {
        this.url = url;
    }

    async read(tableName: string): Promise<any[]> {
        try {
            if (!this.url) throw new Error('Apps Script URL is not configured.');
            const url = new URL(this.url);
            url.searchParams.append('action', 'read');
            url.searchParams.append('table', tableName);

            const response = await fetch(url.toString());
            const text = await response.text();
            try {
                const result = JSON.parse(text);
                return result.data || [];
            } catch (e) {
                console.error(`[GSHEET ERROR] Invalid JSON response from ${tableName}:`, text.substring(0, 100));
                return [];
            }
        } catch (error: any) {
            console.error(`[GSHEET ERROR] Failed to read ${tableName}:`, error.message);
            if (error.message.includes('Failed to fetch')) {
                throw new Error('Network Error: Unable to reach Google Apps Script. Please verify the URL and deployment.');
            }
            throw error;
        }
    }

    private async mutate(action: string, tableName: string, payload: any): Promise<any> {
        try {
            const url = new URL(this.url);
            url.searchParams.append('action', action);
            url.searchParams.append('table', tableName);
            if (payload.id) url.searchParams.append('id', payload.id.toString());
            if (payload.idColumn) url.searchParams.append('idColumn', payload.idColumn);

            // Use text/plain to ensure it's a "simple request" and avoids CORS preflight
            const response = await fetch(url.toString(), {
                method: 'POST',
                headers: { 'Content-Type': 'text/plain' },
                body: JSON.stringify(payload)
            });

            return await response.json();
        } catch (error: any) {
            console.error(`[GSHEET MUTATION ERROR] ${action} on ${tableName}:`, error.message);
            throw error;
        }
    }

    async append(tableName: string, data: any): Promise<any> {
        return this.mutate('append', tableName, { data });
    }

    async update(tableName: string, id: any, idColumn: string, data: any): Promise<any> {
        return this.mutate('update', tableName, { id, idColumn, data });
    }

    async delete(tableName: string, id: any, idColumn: string): Promise<any> {
        return this.mutate('delete', tableName, { id, idColumn });
    }

    /**
     * Executes a SQL-like query locally by fetching the table and filtering/sorting
     */
    async query(sqlQuery: string, inputs: any = {}): Promise<{ recordset: any[] }> {
        // Cleanup Query
        let cleanQuery = sqlQuery.replace(/--.*$/gm, '').replace(/\s+/g, ' ').trim();

        try {
            // --- 1. SELECT COUNT Pattern ---
            if (/SELECT\s+COUNT\(\*\)\s+as\s+count\s+FROM\s+(\w+)/i.test(cleanQuery)) {
                const tableNameMatch = cleanQuery.match(/FROM\s+(\w+)/i);
                if (tableNameMatch) {
                    const tableName = tableNameMatch[1];
                    const data = await this.read(tableName);

                    let filtered = data;
                    if (/WHERE\s+(\w+)\s*=\s*['"]?([^'"]+)['"]?/i.test(cleanQuery)) {
                        const match = cleanQuery.match(/WHERE\s+(\w+)\s*=\s*['"]?([^'"]+)['"]?/i);
                        if (match) filtered = data.filter(row => row[match[1]]?.toString() === match[2]);
                    }

                    return { recordset: [{ count: filtered.length }] };
                }
            }

            // --- 2. SELECT TOP Pattern (Improved ORDER BY) ---
            if (/SELECT\s+TOP\s+(\d+)/i.test(cleanQuery)) {
                const limitMatch = cleanQuery.match(/SELECT\s+TOP\s+(\d+)/i);
                const tableNameResult = cleanQuery.match(/FROM\s+(\w+)/i);
                if (limitMatch && tableNameResult) {
                    const limit = parseInt(limitMatch[1]);
                    const tableName = tableNameResult[1];
                    let data = await this.read(tableName);

                    // Enhanced ORDER BY
                    const orderMatch = cleanQuery.match(/ORDER\s+BY\s+(\w+)(?:\s+(DESC|ASC))?/i);
                    if (orderMatch) {
                        const col = orderMatch[1];
                        const dir = (orderMatch[2] || 'ASC').toUpperCase();
                        data.sort((a, b) => {
                            let valA = a[col], valB = b[col];
                            if (valA instanceof Date || (!isNaN(Date.parse(valA)) && isNaN(valA))) {
                                valA = new Date(valA || 0); valB = new Date(valB || 0);
                            }
                            return dir === 'DESC' ? (valB > valA ? 1 : -1) : (valA > valB ? 1 : -1);
                        });
                    }
                    return { recordset: data.slice(0, limit) };
                }
            }

            // --- 3. General SELECT Pattern ---
            if (/^\s*SELECT\s+.*FROM\s+(\w+)/i.test(cleanQuery)) {
                const tableNameMatch = cleanQuery.match(/FROM\s+(\w+)/i);
                if (tableNameMatch) {
                    const tableName = tableNameMatch[1];
                    let data = await this.read(tableName);

                    // Enhanced WHERE
                    const wherePart = cleanQuery.match(/WHERE\s+(.*?)(?:ORDER\s+BY|$)/i);
                    if (wherePart) {
                        const conditions = wherePart[1].split(/OR/i).map(c => c.trim());
                        data = data.filter(row => {
                            return conditions.some(cond => {
                                // Match LIKE operator
                                const likeMatch = cond.match(/(?:[\w\.]*?\.)?(\w+)\s+LIKE\s+@(\w+)/i);
                                if (likeMatch) {
                                    const col = likeMatch[1];
                                    const param = likeMatch[2];
                                    const pattern = (inputs[param] || '').toString().replace(/%/g, '.*');
                                    const regex = new RegExp(`^${pattern}$`, 'i');
                                    return regex.test(row[col]?.toString() || '');
                                }

                                // Match = operator with params
                                const match = cond.match(/(?:[\w\.]*?\.)?(\w+)\s*=\s*@(\w+)/i);
                                if (match) {
                                    const col = match[1];
                                    const param = match[2];
                                    return row[col]?.toString() === inputs[param]?.toString();
                                }

                                // Match = operator with literal values
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

                    // ORDER BY
                    const orderMatch = cleanQuery.match(/ORDER\s+BY\s+(\w+)(?:\s+(DESC|ASC))?/i);
                    if (orderMatch) {
                        const col = orderMatch[1];
                        const dir = (orderMatch[2] || 'ASC').toUpperCase();
                        data.sort((a, b) => {
                            let valA = a[col], valB = b[col];
                            if (valA instanceof Date || (!isNaN(Date.parse(valA)) && isNaN(valA))) {
                                valA = new Date(valA || 0); valB = new Date(valB || 0);
                            }
                            return dir === 'DESC' ? (valB > valA ? 1 : -1) : (valA > valB ? 1 : -1);
                        });
                    }

                    return { recordset: data };
                }
            }

            // --- 4. INSERT Pattern ---
            if (/INSERT\s+INTO\s+(\w+)\s*\((.*?)\)\s*(?:OUTPUT\s+INSERTED\.(\w+)\s*)?VALUES\s*\((.*)\)/is.test(cleanQuery)) {
                const match = cleanQuery.match(/INSERT\s+INTO\s+(\w+)\s*\((.*?)\)\s*(?:OUTPUT\s+INSERTED\.(\w+)\s*)?VALUES\s*\((.*)\)/is);
                if (match) {
                    const tableName = match[1];
                    const columns = smartSplit(match[2]);
                    const outputIdCol = match[3];
                    const values = smartSplit(match[4]);

                    const dataToAppend: any = {};
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
                    if (tableName === 'WhatsApp_Template_Master') idColName = 'Template_ID';
                    if (tableName === 'customers_profile') idColName = 'Customer_ID';

                    if (!dataToAppend[idColName]) dataToAppend[idColName] = Date.now();

                    // Specific for Ticket_Master: Generate Ticket_No if missing
                    if (tableName === 'Ticket_Master' && !dataToAppend['Ticket_No']) {
                        dataToAppend['Ticket_No'] = `T-${String(dataToAppend[idColName]).slice(-5)}`;
                    }

                    const res = await this.append(tableName, dataToAppend);
                    if (!res.success) throw new Error(res.error || 'Failed to append record');

                    const returned = { ...dataToAppend };
                    if (outputIdCol) returned[outputIdCol] = dataToAppend[idColName];

                    return { recordset: [returned] };
                }
            }

            // --- 5. UPDATE Pattern ---
            if (/UPDATE\s+(\w+)\s+SET\s+(.*?)\s+WHERE\s+(\w+)\s*=\s*@(\w+)/is.test(cleanQuery)) {
                const match = cleanQuery.match(/UPDATE\s+(\w+)\s+SET\s+(.*?)\s+WHERE\s+(\w+)\s*=\s*@(\w+)/is);
                if (match) {
                    const tableName = match[1];
                    const setClause = match[2];
                    const idCol = match[3];
                    const idParam = match[4];
                    const idValue = inputs[idParam];

                    const updates: any = {};
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
                        }
                    });

                    const res = await this.update(tableName, idValue, idCol, updates);
                    if (!res.success) throw new Error(res.error || 'Failed to update record');

                    return { recordset: [] };
                }
            }

            // --- 6. DELETE Pattern ---
            if (/DELETE\s+FROM\s+(\w+)\s+WHERE\s+(\w+)\s*=\s*@(\w+)/i.test(cleanQuery)) {
                const match = cleanQuery.match(/FROM\s+(\w+)\s+WHERE\s+(\w+)\s*=\s*@(\w+)/i);
                if (match) {
                    const tableName = match[1];
                    const idCol = match[2];
                    const idParam = match[3];
                    const idValue = inputs[idParam];
                    await this.delete(tableName, idValue, idCol);
                    return { recordset: [] };
                }
            }

            if (cleanQuery.includes('SELECT 1')) {
                return { recordset: [{ health_check: 1 }] };
            }

            return { recordset: [] };
        } catch (err: any) {
            console.error('[GSHEET QUERY ERROR]', err.message);
            throw err;
        }
    }
}

export const gsheet = new GSheetClient(APPS_SCRIPT_URL || '');

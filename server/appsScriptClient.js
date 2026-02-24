const path = require('path');
require('dotenv').config({ path: path.resolve(__dirname, '.env') });
const axios = require('axios');

const APPS_SCRIPT_URL = process.env.APPS_SCRIPT_URL;

if (!APPS_SCRIPT_URL) {
    console.error('CRITICAL: APPS_SCRIPT_URL is not defined in .env');
}

class AppsScriptClient {
    async read(tableName) {
        try {
            const response = await axios.get(APPS_SCRIPT_URL, {
                params: {
                    action: 'read',
                    table: tableName
                }
            });
            return response.data.data || [];
        } catch (error) {
            console.error(`Error reading table ${tableName}:`, error.message);
            throw error;
        }
    }

    async append(tableName, data) {
        try {
            const response = await axios.post(APPS_SCRIPT_URL, {
                action: 'append',
                table: tableName,
                data: data
            });
            return response.data;
        } catch (error) {
            console.error(`Error appending to table ${tableName}:`, error.message);
            throw error;
        }
    }

    async update(tableName, id, idColumn, data) {
        try {
            const response = await axios.post(APPS_SCRIPT_URL, {
                action: 'update',
                table: tableName,
                id: id,
                idColumn: idColumn,
                data: data
            });
            return response.data;
        } catch (error) {
            console.error(`Error updating table ${tableName}:`, error.message);
            throw error;
        }
    }

    async delete(tableName, id, idColumn) {
        try {
            const response = await axios.post(APPS_SCRIPT_URL, {
                action: 'delete',
                table: tableName,
                id: id,
                idColumn: idColumn
            });
            return response.data;
        } catch (error) {
            console.error(`Error deleting from table ${tableName}:`, error.message);
            throw error;
        }
    }
}

module.exports = new AppsScriptClient();

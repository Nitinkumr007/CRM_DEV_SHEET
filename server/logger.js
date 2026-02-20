const { connectToDb } = require('./db');

const logActivity = async (pool, user, actionType, moduleName, description, req) => {
    try {
        const ip = req.headers['x-forwarded-for'] || req.socket.remoteAddress || 'Unknown IP';
        const deviceInfo = req.headers['user-agent'] || 'Unknown Device';

        // If pool is not provided, connect (useful if not in a request context where pool is already available)
        // But optimally, we pass the existing pool or request object
        let request = pool ? pool.request() : (await connectToDb()).request();

        await request
            .input('uid', user.id || user.User_ID) // Handle both formats
            .input('uCode', user.code || user.User_Code || null)
            .input('action', actionType)
            .input('module', moduleName)
            .input('desc', description)
            .input('ip', ip)
            .input('device', deviceInfo)
            .query(`
                INSERT INTO Application_Logs (User_ID, User_Code, Action_Type, Module_Name, Description, IP_Address, Device_Info)
                VALUES (@uid, @uCode, @action, @module, @desc, @ip, @device)
            `);

        console.log(`[LOG] ${actionType} on ${moduleName}: ${description}`);
    } catch (err) {
        console.error('[LOG ERROR] Failed to log activity:', err);
        // Don't throw, we don't want to break the main flow if logging fails
    }
};

module.exports = { logActivity };

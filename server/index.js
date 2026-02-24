const app = require('./app');
const PORT = process.env.PORT || 4001;
const { connectToDb } = require('./db');

app.listen(PORT, () => {
    console.log(`🚀 Local development server running on http://localhost:${PORT}`);
    connectToDb().catch(err => console.log('Initial DB connection failed:', err.message));
});

// order-service/server.js
require('dotenv').config();

const express      = require('express');
const cookieParser = require('cookie-parser');

const { env }        = require('./app/config/environment');
const database       = require('./app/database/init');
const middlewareInit = require('./app/middleware/init');
const errorHandler   = require('./app/middleware/errorHandler');
const appRoutes      = require('./app/routes/index');

const app = express();

app.set('trust proxy', 1);
app.use(cookieParser());
middlewareInit(app);

// Health check
app.get('/health', (req, res) => {
    res.json({ success: true, service: 'order-service', timestamp: new Date().toISOString() });
});

// Routes
app.use('/api', appRoutes);

// 404
app.use((req, res) => {
    res.status(404).json({ success: false, message: 'Route not found' });
});

// Error handler
app.use(errorHandler);

async function startServer() {
    await database.initDatabase(); // ← đổi từ database.init()
    const PORT = process.env.PORT || 3003;
    app.listen(PORT, () => {
        console.log(`Order Service running on port ${PORT}`);
    });
}

startServer();
module.exports = app;
// identity-service/server.js
require('dotenv').config();

const express    = require('express');
const cookieParser = require('cookie-parser');
const swaggerJsdoc = require('swagger-jsdoc');
const swaggerUi = require('swagger-ui-express');

const { env }          = require('./app/config/environment');
const database         = require('./app/database/init');
const middlewareInit   = require('./app/middleware/init');
const errorHandler     = require('./app/middleware/errorHandler');
const appRoutes        = require('./app/routes/index');

const app = express();

app.set('trust proxy', 1);
app.use(cookieParser());
middlewareInit(app);

// Swagger
const swaggerSpec = swaggerJsdoc({
  definition: {
    openapi: '3.0.0',
    info: { title: 'Identity Service API', version: '1.0.0', description: 'Auth, users, addresses' },
    servers: [{ url: 'http://localhost:8080/api', description: 'API Gateway' }],
  },
  apis: ['./app/routes/*.js'],
});
app.use('/api-docs', swaggerUi.serve, swaggerUi.setup(swaggerSpec));

// Health check
app.get('/health', (req, res) => {
    res.json({ success: true, service: 'identity-service', timestamp: new Date().toISOString() });
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
    await database.initDatabase();
    const PORT = process.env.PORT || 3001;
    app.listen(PORT, () => {
        console.log(`Identity Service running on port ${PORT}`);
        console.log(`Swagger docs: http://localhost:${PORT}/api-docs`);
    });
}

startServer();
module.exports = app;
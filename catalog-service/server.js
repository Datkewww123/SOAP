require('dotenv').config();

const express      = require('express');
const cookieParser = require('cookie-parser');
const swaggerJsdoc = require('swagger-jsdoc');
const swaggerUi = require('swagger-ui-express');

const { env }        = require('./app/config/environment');
const database       = require('./app/database/init');
const middlewareInit = require('./app/middleware/init');
const errorHandler   = require('./app/middleware/errorHandler');
const appRoutes      = require('./app/routes/index');

const app = express();

app.set('trust proxy', 1);
app.use(cookieParser());
middlewareInit(app);

// Swagger
const swaggerSpec = swaggerJsdoc({
  definition: {
    openapi: '3.0.0',
    info: { title: 'Catalog Service API', version: '1.0.0', description: 'Products, categories, brands' },
    servers: [{ url: 'http://localhost:8080/api', description: 'API Gateway' }],
  },
  apis: ['./app/routes/*.js'],
});
app.use('/api-docs', swaggerUi.serve, swaggerUi.setup(swaggerSpec));

app.get('/health', (req, res) => {
  res.json({ success: true, service: 'catalog-service', timestamp: new Date().toISOString() });
});

app.use('/api', appRoutes);

app.use((req, res) => {
  res.status(404).json({ success: false, message: 'Route not found' });
});

app.use(errorHandler);

async function startServer() {
  await database.initDatabase();
  const { startSportsNewsSync } = require('./app/jobs/syncSportsNews.job');
  startSportsNewsSync();
  const PORT = process.env.PORT || 3002;
  app.listen(PORT, () => {
    console.log(`Catalog Service running on port ${PORT}`);
    console.log(`Swagger docs: http://localhost:${PORT}/api-docs`);
  });
}

startServer();
module.exports = app;
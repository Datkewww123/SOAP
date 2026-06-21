require('dotenv').config();
const express = require('express');
const eventSubscriber = require('./app/services/eventSubscriber');

const app = express();
const PORT = process.env.PORT || 3005;

// Health endpoint (for Docker healthcheck)
app.get('/health', (req, res) => {
  res.status(200).json({ status: 'ok', service: 'notification-service' });
});

// Start Redis subscriber
eventSubscriber.start();

// Graceful shutdown
process.on('SIGTERM', () => {
  console.log('[App] SIGTERM received');
  eventSubscriber.shutdown();
  process.exit(0);
});

process.on('SIGINT', () => {
  console.log('[App] SIGINT received');
  eventSubscriber.shutdown();
  process.exit(0);
});

app.listen(PORT, () => {
  console.log(`Notification service running on port ${PORT}`);
});

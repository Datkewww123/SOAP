const mysqlDatabase = require('./mysql.database');
const { initModels } = require('../models');

async function initDatabase() {
  await mysqlDatabase.connect();
  initModels();
  await mysqlDatabase.getSequelize().sync({ alter: true });
  console.log('✅ MySQL tables synced (order-service)');
}

async function closeDatabase() {
  await mysqlDatabase.disconnect();
}

module.exports = { initDatabase, closeDatabase };
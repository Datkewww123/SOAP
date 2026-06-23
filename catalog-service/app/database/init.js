const mysqlDatabase = require('./mysql.database');
const { initModels } = require('../models');

async function initDatabase() {
  await mysqlDatabase.connect();

  // Khởi tạo tất cả models SAU KHI đã connect
  initModels();

  await mysqlDatabase.getSequelize().sync({ alter: true });
  console.log('✅ MySQL tables synced (catalog-service)');
}

async function closeDatabase() {
  await mysqlDatabase.disconnect();
}

module.exports = { initDatabase, closeDatabase };
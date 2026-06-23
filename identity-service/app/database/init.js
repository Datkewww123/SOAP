const mysqlDatabase = require('./mysql.database');
const { initModels } = require('../models/User');

async function initDatabase() {
  await mysqlDatabase.connect();
  
  // Khởi tạo models SAU KHI đã connect
  initModels();

  await mysqlDatabase.getSequelize().sync({ alter: true });
  console.log('✅ MySQL tables synced');
}

async function closeDatabase() {
  await mysqlDatabase.disconnect();
}

module.exports = { initDatabase, closeDatabase };
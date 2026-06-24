const { Sequelize } = require('sequelize');

class MySQLDatabase {
  constructor() {
    this.sequelize = null;
    this.isConnected = false;
  }

  async connect(retryCount = 0) {
    const MAX_RETRIES = 5;
    const RETRY_INTERVAL = 5000;

    try {
      if (this.isConnected) return this.sequelize;

            this.sequelize = new Sequelize(
        process.env.MYSQL_DATABASE,
        process.env.MYSQL_USER,
        process.env.MYSQL_PASSWORD,
        {
          host: process.env.MYSQL_HOST || 'mysql',
          port: Number(process.env.MYSQL_PORT) || 3306,
          dialect: 'mysql',
          logging: false,
          
          // Bật SSL cho Aiven
          dialectOptions: {
            ssl: {
              require: true,
              rejectUnauthorized: false
            }
          },

          pool: { max: 10, min: 0, acquire: 30000, idle: 10000 },
          define: {
            charset: 'utf8mb4',
            collate: 'utf8mb4_unicode_ci',
            underscored: true,
          },
          timezone: '+07:00',
        }
      );

      await this.sequelize.authenticate();
      this.isConnected = true;
      console.log('✅ MySQL connected successfully');
      return this.sequelize;

    } catch (error) {
      retryCount++;
      if (retryCount >= MAX_RETRIES) {
        console.error(`❌ Failed to connect to MySQL after ${MAX_RETRIES} attempts`);
        throw error;
      }
      console.warn(`⚠️ MySQL connection failed (attempt ${retryCount}/${MAX_RETRIES}), retrying in 5s...`);
      await new Promise(r => setTimeout(r, RETRY_INTERVAL));
      return this.connect(retryCount);
    }
  }

  async disconnect() {
    if (this.sequelize) {
      await this.sequelize.close();
      this.isConnected = false;
      console.log('MySQL disconnected');
    }
  }

  getSequelize() {
    return this.sequelize;
  }
}

module.exports = new MySQLDatabase();
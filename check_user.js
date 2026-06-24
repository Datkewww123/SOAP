require('dotenv').config(); // Load environment variables from .env
require('dotenv').config({ path: './identity-service/.env' }); // Load from identity-service env

const { Sequelize } = require('sequelize');

const dbHost = process.env.MYSQL_HOST === 'mysql' ? '127.0.0.1' : (process.env.MYSQL_HOST || '127.0.0.1');
const dbPort = process.env.MYSQL_PORT || 3306;
const dbUser = process.env.MYSQL_USER || 'root';
const dbPass = process.env.MYSQL_PASSWORD || 'rootpassword';
const dbName = 'soap_identity_db'; // Identity DB name

const sequelize = new Sequelize(dbName, dbUser, dbPass, {
  host: dbHost,
  port: dbPort,
  dialect: 'mysql',
  logging: false,
  timezone: '+07:00'
});

async function run() {
  try {
    await sequelize.authenticate();
    console.log('✅ MySQL connected');
    
    // Define simple User model to query
    const { DataTypes } = require('sequelize');
    const User = sequelize.define('User', {
      id: { type: DataTypes.INTEGER, primaryKey: true, autoIncrement: true },
      username: DataTypes.STRING,
      email: DataTypes.STRING,
      role: DataTypes.STRING,
      password: DataTypes.STRING
    }, { tableName: 'users', underscored: true, timestamps: true });
    
    const u = await User.findOne({ where: { email: 'tuan@example.com' } });
    console.log("User found:", u ? "YES" : "NO");
    if (u) {
      console.log("Username:", u.username);
      console.log("Role:", u.role);
      console.log("Password hash:", u.password.substring(0, 20) + "...");
    }
  } catch (e) {
    console.error("Error:", e.message);
  } finally {
    await sequelize.close();
    process.exit(0);
  }
}

run();

const { DataTypes } = require('sequelize');
const mysqlDatabase = require('../database/mysql.database');

let User, Address;

function initModels() {
  const sequelize = mysqlDatabase.getSequelize();

  User = sequelize.define('User', {
    id: { type: DataTypes.INTEGER, primaryKey: true, autoIncrement: true },
    username: { type: DataTypes.STRING(50), allowNull: false, unique: true },
    email: { type: DataTypes.STRING(100), allowNull: false, unique: true },
    password: { type: DataTypes.STRING(255), allowNull: false },
    name: { type: DataTypes.STRING(100), allowNull: false },
    phone: { type: DataTypes.STRING(20), defaultValue: '' },
    avatar: { type: DataTypes.STRING(500), defaultValue: '' },
    date_of_birth: { type: DataTypes.DATEONLY },
    gender: { type: DataTypes.ENUM('nam', 'nu', 'unisex'), defaultValue: 'unisex' },
    address: { type: DataTypes.STRING(255), defaultValue: '' },
    role: { type: DataTypes.ENUM('user', 'admin'), defaultValue: 'user' },
    is_active: { type: DataTypes.BOOLEAN, defaultValue: true },
    is_verified: { type: DataTypes.BOOLEAN, defaultValue: false },
    total_orders: { type: DataTypes.INTEGER, defaultValue: 0 },
    total_spent: { type: DataTypes.DECIMAL(15, 2), defaultValue: 0 },
    last_login_at: { type: DataTypes.DATE }
  }, {
    tableName: 'users',
    timestamps: true,
    underscored: true
  });

  Address = sequelize.define('Address', {
    id: { type: DataTypes.INTEGER, primaryKey: true, autoIncrement: true },
    user_id: { type: DataTypes.INTEGER, allowNull: false },
    full_name: { type: DataTypes.STRING(100), allowNull: false },
    phone: { type: DataTypes.STRING(20), allowNull: false },
    province: { type: DataTypes.STRING(100), allowNull: false },
    district: { type: DataTypes.STRING(100), allowNull: false },
    ward: { type: DataTypes.STRING(100) },
    street: { type: DataTypes.STRING(255), allowNull: false },
    is_default: { type: DataTypes.BOOLEAN, defaultValue: false }
  }, {
    tableName: 'addresses',
    timestamps: true,
    underscored: true
  });

  User.hasMany(Address, { foreignKey: 'user_id', as: 'addresses', onDelete: 'CASCADE' });
  Address.belongsTo(User, { foreignKey: 'user_id' });

  return { User, Address };
}

function getUser() { return User; }
function getAddress() { return Address; }

module.exports = { initModels, getUser, getAddress };
export const Sequelize = require('sequelize');
const mysql2 = require('mysql2');

export let SQLConnection = new Sequelize(
  process.env.MYSQLDATABASE,
  process.env.MYSQLUSER,
  process.env.MYSQLPASSWORD,
  {
    host: process.env.MYSQLHOSTNAME,
    dialect: 'mysql',
    pool: {
      max: 1000,
      min: 1,
      idle: 1,
      handleDisconnects: true
    },
    dialectOptions: process.env.USEMYSQLSOCKETCONNECTION
      ? {
          socketPath: process.env.MYSQLSOCKETPATH
        }
      : {},
    dialectModulePath: 'mysql2',
    define: {
      freezeTableName: true
    }
  }
);

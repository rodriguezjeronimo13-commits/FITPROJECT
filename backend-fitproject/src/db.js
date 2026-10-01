const mysql = require('mysql2/promise');
require('dotenv').config();

const connectionLimit = process.env.VERCEL ? 1 : 2;

const pool = mysql.createPool({
  host: process.env.MYSQL_ADDON_HOST,
  user: process.env.MYSQL_ADDON_USER,
  password: process.env.MYSQL_ADDON_PASSWORD,
  database: process.env.MYSQL_ADDON_DB,
  port: Number(process.env.MYSQL_ADDON_PORT || 3306),
  waitForConnections: true,
  connectionLimit,
  maxIdle: 1,
  idleTimeout: 10000,
  queueLimit: 40,
  enableKeepAlive: true,
  connectTimeout: 15000,
  charset: 'utf8mb4',
  timezone: '-05:00',
  dateStrings: true,
});

async function query(sql, params = []) {
  const [rows] = await pool.query(sql, params);
  return rows;
}

module.exports = { pool, query, connectionLimit };

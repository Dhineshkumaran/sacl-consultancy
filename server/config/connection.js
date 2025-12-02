import mysql from 'mysql2';
import dotenv from 'dotenv';
import fs from 'fs';

dotenv.config();

const pool = mysql.createPool({
  host: process.env.DB_HOST,
  user: process.env.DB_USER,
  password: process.env.DB_PASSWORD,
  database: process.env.DB_NAME,
  port: process.env.DB_PORT,
  waitForConnections: true,
  connectionLimit: 10,
  queueLimit: 0,
  ssl: {
    ca: fs.readFileSync("./config/ca.pem"),
    rejectUnauthorized: true
  }
});

const promisePool = pool.promise();

promisePool.getConnection()
  .then(conn => {
    console.log("MySQL connected successfully!");
    conn.release();
  })
  .catch(err => {
    console.error("MySQL connection failed:", err);
  });

export default promisePool;
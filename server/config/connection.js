import sql from 'mssql';
import dotenv from 'dotenv';

dotenv.config();

const config = {
  user: process.env.DB_USER,
  password: process.env.DB_PASSWORD,
  server: process.env.DB_SERVER,
  database: process.env.DB_DATABASE,
  options: {
    encrypt: true,
    trustServerCertificate: true
  },
  connectionTimeout: 30000
};

const poolPromise = new sql.ConnectionPool(config)
  .connect()
  .then(pool => {
    console.log('Connected to SQL Server successfully!');
    return pool;
  })
  .catch(err => {
    console.error('Database Connection Failed:', err);
    throw err;
  });

const client = {
  query: async (sqlText, params = {}) => {
    try {
      const pool = await poolPromise;
      const request = pool.request();

      if (params && typeof params === 'object' && !Array.isArray(params)) {
        for (const [key, value] of Object.entries(params)) {
          request.input(key, value === undefined ? null : value);
        }
      }

      const result = await request.query(sqlText);
      return [result.recordset || result.rowsAffected, result.output];
    } catch (error) {
      console.error('SQL Execution Error:', error);
      throw error;
    }
  }
};

client.execute = client.query;

export default client;
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

const prepareRequest = (request, params = {}) => {
  if (params && typeof params === 'object' && !Array.isArray(params)) {
    for (const [key, value] of Object.entries(params)) {
      request.input(key, value === undefined ? null : value);
    }
  }
};

const client = {
  query: async (sqlText, params = {}) => {
    try {
      const pool = await poolPromise;
      const request = pool.request();
      prepareRequest(request, params);

      const result = await request.query(sqlText);
      return result.recordset || result.rowsAffected;
    } catch (error) {
      console.error('SQL Execution Error:', error);
      throw error;
    }
  },

  transaction: async (callback) => {
    const pool = await poolPromise;
    const transaction = new sql.Transaction(pool);

    try {
      await transaction.begin();

      const trx = {
        query: async (sqlText, params = {}) => {
          const request = new sql.Request(transaction);
          prepareRequest(request, params);
          const result = await request.query(sqlText);
          return result.recordset || result.rowsAffected;
        }
      };

      const result = await callback(trx);

      await transaction.commit();
      return result;
    } catch (error) {
      await transaction.rollback();
      console.error('Transaction Rolled Back:', error);
      throw error;
    }
  }
};

client.execute = client.query;

export default client;
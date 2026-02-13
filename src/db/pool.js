import pkg from 'pg';

const { Pool } = pkg;

export const pool = new Pool({
  connectionString: process.env.DATABASE_URL
});

const originalQuery = pool.query.bind(pool);

pool.query = (text, params) => {
  if (process.env.SQL_LOG === 'true') {
    console.log('SQL:', text, params || []);
  }

  return originalQuery(text, params);
};

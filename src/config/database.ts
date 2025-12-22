// src/config/database.ts
import dotenv from 'dotenv';
import { Pool } from 'pg';

dotenv.config();

const {
  PG_HOST,
  PG_PORT='5432',
  PG_DATABASE,
  PG_USER,
  PG_PASSWORD,
} = process.env;

if (!PG_USER || !PG_PASSWORD) {
  throw new Error('PostgreSQL credentials are missing in .env');
}

const pool = new Pool({
  host: PG_HOST,
  port: parseInt(PG_PORT),
  database: PG_DATABASE,
  user: PG_USER,
  password: PG_PASSWORD,
  max: 50,
  idleTimeoutMillis: 30000,
  connectionTimeoutMillis: 2000,
});

export const getPool = async () => {
  return pool;
};

// Optional: test connection on startup
pool.on('error', (err) => {
  console.error('Unexpected error on idle PostgreSQL client', err);
});
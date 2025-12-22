// src/config/database.ts
import dotenv from 'dotenv';
import { Pool } from 'pg';

dotenv.config();

const databaseUrl = process.env.DATABASE_URL;

if (!databaseUrl) {
  throw new Error('DATABASE_URL is not set in environment variables');
}

// The 'pg' library supports connection strings directly
const pool = new Pool({
  connectionString: databaseUrl,
  // Optional: Recommended settings for production (Render, etc.)
  max: 20,                    // Reduce from 50 → Render free/paid tiers have connection limits
  idleTimeoutMillis: 30000,
  connectionTimeoutMillis: 2000,
  // Render requires SSL in production but rejects self-signed certs
  ssl: process.env.NODE_ENV === 'production' 
    ? { rejectUnauthorized: false } 
    : false,
});

export const getPool = async () => {
  return pool;
};

// Handle unexpected errors on idle clients
pool.on('error', (err) => {
  console.error('Unexpected error on idle PostgreSQL client', err);
  process.exit(-1);
});
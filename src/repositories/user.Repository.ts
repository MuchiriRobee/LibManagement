// src/repositories/user.Repository.ts
import { getPool } from "../config/database";
import { User, NewUser } from "../types/users.types";

export const findAll = async (): Promise<User[]> => {
  const pool = await getPool();
  const result = await pool.query(`
    SELECT 
      u.user_id,
      u.username,
      u.email,
      u.role,
      u.created_at,
      u.updated_at,
      COALESCE(b.borrow_count, 0) AS total_borrows
    FROM users u
    LEFT JOIN (
      SELECT user_id, COUNT(*) AS borrow_count
      FROM borrowrecords
      GROUP BY user_id
    ) b ON u.user_id = b.user_id
    ORDER BY u.created_at DESC
  `);
  return result.rows;
};

export const findByRole = async (role: "Admin" | "Member"): Promise<User[]> => {
  const pool = await getPool();
  const result = await pool.query(
    `
    SELECT 
      u.user_id,
      u.username,
      u.email,
      u.role,
      u.created_at,
      u.updated_at,
      COALESCE(b.borrow_count, 0) AS total_borrows
    FROM users u
    LEFT JOIN (
      SELECT user_id, COUNT(*) AS borrow_count
      FROM borrowrecords
      GROUP BY user_id
    ) b ON u.user_id = b.user_id
    WHERE u.role = $1
    ORDER BY u.created_at DESC
  `,
    [role]
  );
  return result.rows;
};

// In findById function – add password_hash to SELECT
export const findById = async (id: number): Promise<User | null> => {
  const pool = await getPool();
  const result = await pool.query(
    `
    SELECT 
      u.user_id,
      u.username,
      u.email,
      u.password_hash,        -- ← ADD THIS LINE
      u.role,
      u.created_at,
      u.updated_at,
      COALESCE(b.borrow_count, 0) AS total_borrows
    FROM users u
    LEFT JOIN (
      SELECT user_id, COUNT(*) AS borrow_count
      FROM borrowrecords
      GROUP BY user_id
    ) b ON u.user_id = b.user_id
    WHERE u.user_id = $1
  `,
    [id]
  );
  return result.rows[0] || null;
};

export const findByEmail = async (email: string): Promise<User | null> => {
  const pool = await getPool();
  const result = await pool.query(
    `
    SELECT 
      u.user_id,
      u.username,
      u.email,
      u.password_hash,
      u.role,
      u.created_at,
      u.updated_at,
      COALESCE(b.borrow_count, 0) AS total_borrows
    FROM users u
    LEFT JOIN (
      SELECT user_id, COUNT(*) AS borrow_count
      FROM borrowrecords
      GROUP BY user_id
    ) b ON u.user_id = b.user_id
    WHERE u.email = $1
  `,
    [email]
  );
  return result.rows[0] || null;
};
export const createUser = async (user: {
  username: string;
  email: string;
  password_hash: string;     // renamed for clarity
  role: string;
  created_at: Date;
  is_verified: boolean;
  verification_token?: string | null;
  verification_expires?: Date | null;
}): Promise<User> => {
  const pool = await getPool();
  const result = await pool.query(
    `
    INSERT INTO users (
      username, email, password_hash, role, created_at,
      is_verified, verification_token, verification_expires
    )
    VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
    RETURNING 
      user_id, username, email, role, created_at, updated_at,
      is_verified, verification_token, verification_expires
    `,
    [
      user.username,
      user.email,
      user.password_hash,
      user.role,
      user.created_at,
      user.is_verified,
      user.verification_token || null,
      user.verification_expires || null,
    ]
  );
  return result.rows[0];
};

export const findByVerificationToken = async (token: string): Promise<User | null> => {
  const pool = await getPool();
  const result = await pool.query(
    `
    SELECT 
      user_id, username, email, role, created_at, updated_at,
      is_verified, password_hash
    FROM users 
    WHERE verification_token = $1 
      AND (
        verification_expires > NOW() 
        OR is_verified = TRUE  -- allow already verified (idempotent)
      )
    `,
    [token]
  );
  return result.rows[0] || null;
};

export const markEmailVerified = async (userId: number): Promise<boolean> => {
  const pool = await getPool();
  const result = await pool.query(
    `UPDATE users SET is_verified = TRUE, verification_token = NULL, verification_expires = NULL, updated_at = NOW() WHERE user_id = $1`,
    [userId]
  );
  return result.rows[0] || null;
};

export const setResetToken = async (userId: number, token: string, expires: Date): Promise<boolean> => {
  const pool = await getPool();
  const result = await pool.query(
    `UPDATE users SET reset_token = $1, reset_expires = $2, updated_at = NOW() WHERE user_id = $3`,
    [token, expires, userId]
  );
  return result.rows[0] || null;
};

export const findByResetToken = async (token: string): Promise<User | null> => {
  const pool = await getPool();
  const result = await pool.query(
    `SELECT * FROM users WHERE reset_token = $1 AND reset_expires > NOW()`,
    [token]
  );
  return result.rows[0] || null;
};

export const clearResetToken = async (userId: number): Promise<boolean> => {
  const pool = await getPool();
  const result = await pool.query(
    `UPDATE users SET reset_token = NULL, reset_expires = NULL, updated_at = NOW() WHERE user_id = $1`,
    [userId]
  );
  return result.rows[0] || null;
};

export const updateUserRole = async (id: number, role: "Admin" | "Member"): Promise<User | null> => {
  const pool = await getPool();
  const result = await pool.query(
    `
    UPDATE users
    SET role = $1, updated_at = CURRENT_TIMESTAMP
    WHERE user_id = $2
    RETURNING user_id
  `,
    [role, id]
  );

  if (result.rowCount === 0) {
    return null;
  }

  return await findById(id);
};

export const updateProfile = async (
  id: number,
  updates: Partial<User>
): Promise<User> => {
  const pool = await getPool();

  const fields: string[] = [];
  const values: any[] = [];
  let paramIndex = 1;

  if (updates.username !== undefined) {
    fields.push(`username = $${paramIndex++}`);
    values.push(updates.username);
  }
  if (updates.email !== undefined) {
    fields.push(`email = $${paramIndex++}`);
    values.push(updates.email);
  }
  if (updates.password_hash !== undefined) {
    fields.push(`password_hash = $${paramIndex++}`);
    values.push(updates.password_hash);
  }

  fields.push(`updated_at = CURRENT_TIMESTAMP`);
  values.push(id); // last parameter is the ID

  const query = `
    UPDATE users
    SET ${fields.join(", ")}
    WHERE user_id = $${paramIndex}
    RETURNING 
      user_id,
      username,
      email,
      role,
      created_at,
      updated_at,
      COALESCE((
        SELECT COUNT(*) 
        FROM borrowrecords 
        WHERE user_id = users.user_id
      ), 0) AS total_borrows
  `;

  const result = await pool.query(query, values);
  return result.rows[0];
};
export const remove = async (id: number): Promise<void> => {
  const pool = await getPool();
  await pool.query("DELETE FROM users WHERE user_id = $1", [id]);
};
export const countAllUsers = async (): Promise<number> => {
  const pool = await getPool();
  const result = await pool.query("SELECT COUNT(*) AS count FROM users");
  return parseInt(result.rows[0].count, 10);
};


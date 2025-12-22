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

export const findById = async (id: number): Promise<User | null> => {
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

export const createUser = async (user: NewUser): Promise<User> => {
  const pool = await getPool();
  const result = await pool.query(
    `
    INSERT INTO users (username, email, password_hash, role, created_at)
    VALUES ($1, $2, $3, $4, $5)
    RETURNING *
  `,
    [user.username, user.email, user.password, user.role, user.created_at]
  );
  return result.rows[0];
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

export const remove = async (id: number): Promise<void> => {
  const pool = await getPool();
  await pool.query("DELETE FROM users WHERE user_id = $1", [id]);
};
export const countAllUsers = async (): Promise<number> => {
  const pool = await getPool();
  const result = await pool.query("SELECT COUNT(*) AS count FROM users");
  return parseInt(result.rows[0].count, 10);
};
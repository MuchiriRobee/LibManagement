// src/repositories/user.Repository.ts
import { getPool } from "../config/database";
import { User, NewUser } from "../types/users.types";

export const findAll = async (): Promise<User[]> => {
  const pool = await getPool();
  const result = await pool.request().query(`
    SELECT 
      u.user_id,
      u.username,
      u.email,
      u.role,
      u.created_at,
      u.updated_at,
      ISNULL(b.borrow_count, 0) AS total_borrows
    FROM Users u
    LEFT JOIN (
      SELECT user_id, COUNT(*) AS borrow_count
      FROM BorrowRecords
      GROUP BY user_id
    ) b ON u.user_id = b.user_id
    ORDER BY u.created_at DESC
  `);
  return result.recordset;
};

export const findByRole = async (role: "Admin" | "Member"): Promise<User[]> => {
  const pool = await getPool();
  const result = await pool
    .request()
    .input("role", role)
    .query(`
      SELECT 
        u.user_id,
        u.username,
        u.email,
        u.role,
        u.created_at,
        u.updated_at,
        ISNULL(b.borrow_count, 0) AS total_borrows
      FROM Users u
      LEFT JOIN (
        SELECT user_id, COUNT(*) AS borrow_count
        FROM BorrowRecords
        GROUP BY user_id
      ) b ON u.user_id = b.user_id
      WHERE u.role = @role
      ORDER BY u.created_at DESC
    `);
  return result.recordset;
};

export const findById = async (id: number): Promise<User | null> => {
  const pool = await getPool();
  const result = await pool
    .request()
    .input("id", id)
    .query(`
      SELECT 
        u.user_id,
        u.username,
        u.email,
        u.role,
        u.created_at,
        u.updated_at,
        ISNULL(b.borrow_count, 0) AS total_borrows
      FROM Users u
      LEFT JOIN (
        SELECT user_id, COUNT(*) AS borrow_count
        FROM BorrowRecords
        GROUP BY user_id
      ) b ON u.user_id = b.user_id
      WHERE u.user_id = @id
    `);
  return result.recordset[0] || null;
};

export const findByEmail = async (email: string): Promise<User | null> => {
  const pool = await getPool();
  const result = await pool
    .request()
    .input("email", email)
    .query(`
      SELECT 
        u.user_id,
        u.username,
        u.email,
        u.password_hash,
        u.role,
        u.created_at,
        u.updated_at,
        ISNULL(b.borrow_count, 0) AS total_borrows
      FROM Users u
      LEFT JOIN (
        SELECT user_id, COUNT(*) AS borrow_count
        FROM BorrowRecords
        GROUP BY user_id
      ) b ON u.user_id = b.user_id
      WHERE u.email = @email
    `);
  return result.recordset[0] || null;
};

export const createUser = async (user: NewUser): Promise<User> => {
  const pool = await getPool();
  const result = await pool
    .request()
    .input("username", user.username)
    .input("email", user.email)
    .input("password_hash", user.password)
    .input("role", user.role)
    .input("created_at", user.created_at)
    .query(`
      INSERT INTO Users (username, email, password_hash, role, created_at)
      OUTPUT INSERTED.*
      VALUES (@username, @email, @password_hash, @role, @created_at)
    `);
  return result.recordset[0];
};

export const updateUserRole = async (id: number, role: "Admin" | "Member"): Promise<User | null> => {
  const pool = await getPool();
  const result = await pool
    .request()
    .input("id", id)
    .input("role", role)
    .query(`
      UPDATE Users
      SET role = @role, updated_at = GETDATE()
      OUTPUT INSERTED.user_id, INSERTED.username, INSERTED.email, INSERTED.role, INSERTED.created_at, INSERTED.updated_at,
             ISNULL(b.borrow_count, 0) AS total_borrows
      FROM Users u
      LEFT JOIN (
        SELECT user_id, COUNT(*) AS borrow_count
        FROM BorrowRecords
        GROUP BY user_id
      ) b ON u.user_id = b.user_id
      WHERE u.user_id = @id
    `);
  return result.recordset[0] || null;
};

export const remove = async (id: number): Promise<void> => {
  const pool = await getPool();
  await pool
    .request()
    .input("id", id)
    .query("DELETE FROM Users WHERE user_id = @id");
};
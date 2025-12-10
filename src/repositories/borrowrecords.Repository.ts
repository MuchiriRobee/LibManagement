// src/repositories/borrowrecords.Repository.ts
// Note: Updated getBorrows and getBorrowById to include JOINs for username, email, title, author
// Assumes Users table has username, email columns
// No changes to other functions

import { getPool } from "../config/database";

export const getBookStock = async (trx: any, book_id: number) => {
  const result = await trx.request()
    .input("book_id", book_id)
    .query(`
      SELECT stock_quantity 
      FROM Books WITH (UPDLOCK, ROWLOCK) 
      WHERE book_id = @book_id
    `);
  return result.recordset[0];
};

export const hasActiveBorrow = async (trx: any, user_id: number, book_id: number) => {
  const result = await trx.request()
    .input("user_id", user_id)
    .input("book_id", book_id)
    .query(`SELECT 1 FROM BorrowRecords 
            WHERE user_id = @user_id AND book_id = @book_id 
            AND status IN ('Borrowed', 'Overdue')`);
  return result.recordset.length > 0;
};

export const createBorrowRecord = async (trx: any, data: any) => {
  const result = await trx.request()
    .input("user_id", data.user_id)
    .input("book_id", data.book_id)
    .input("borrow_date", data.borrow_date)
    .input("due_date", data.due_date)
    .input("status", data.status)
    .query(`
      INSERT INTO BorrowRecords (user_id, book_id, borrow_date, due_date, status)
      OUTPUT INSERTED.*
      VALUES (@user_id, @book_id, @borrow_date, @due_date, @status)
    `);
  return result.recordset[0];
};

export const updateBorrowStatus = async (trx: any, id: number, status: string, return_date?: Date | null) => {
  const request = trx.request()
    .input("id", id)
    .input("status", status)
    .input("return_date", return_date ?? null);

  await request.query(`
    UPDATE BorrowRecords 
    SET status = @status, 
        return_date = @return_date, 
        updated_at = GETDATE()
    WHERE borrow_id = @id
  `);
};

export const incrementStock = async (trx: any, book_id: number) => {
  await trx.request()
    .input("book_id", book_id)
    .query("UPDATE Books SET stock_quantity = stock_quantity + 1 WHERE book_id = @book_id");
};

export const decrementStock = async (trx: any, book_id: number) => {
  await trx.request()
    .input("book_id", book_id)
    .query("UPDATE Books SET stock_quantity = stock_quantity - 1 WHERE book_id = @book_id");
};

export const getBorrows = async (filter: any) => {
  const pool = await getPool();
  let query = `
    SELECT 
      br.borrow_id,
      br.user_id,
      u.username AS member_name,
      u.email AS member_email,
      br.book_id,
      b.title AS book_title,
      b.author AS book_author,
      br.borrow_date,
      br.due_date,
      br.return_date,
      br.status
    FROM BorrowRecords br
    INNER JOIN Users u ON br.user_id = u.user_id
    INNER JOIN Books b ON br.book_id = b.book_id
  `;
  const request = pool.request();
  if (filter.user_id) {
    query += " WHERE br.user_id = @user_id";
    request.input("user_id", filter.user_id);
  }
  query += " ORDER BY br.borrow_date DESC";
  const result = await request.query(query);
  return result.recordset;
};

export const getBorrowById = async (poolOrTrx: any, id: number) => {
  const result = await poolOrTrx.request()
    .input("id", id)
    .query(`
      SELECT 
        br.borrow_id,
        br.user_id,
        u.username AS member_name,
        u.email AS member_email,
        br.book_id,
        b.title AS book_title,
        b.author AS book_author,
        br.borrow_date,
        br.due_date,
        br.return_date,
        br.status
      FROM BorrowRecords br
      INNER JOIN Users u ON br.user_id = u.user_id
      INNER JOIN Books b ON br.book_id = b.book_id
      WHERE br.borrow_id = @id
    `);
  return result.recordset[0] || null;
};

export const deleteBorrow = async (id: number) => {
  const pool = await getPool();
  await pool.request()
    .input("id", id)
    .query("DELETE FROM BorrowRecords WHERE borrow_id = @id");
};
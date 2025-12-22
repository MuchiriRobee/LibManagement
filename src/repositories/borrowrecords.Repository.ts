// src/repositories/borrowrecords.Repository.ts
import { getPool } from "../config/database";

export const getBookStock = async (client: any, book_id: number) => {
  const result = await client.query(
    `
    SELECT stock_quantity 
    FROM books 
    WHERE book_id = $1
    FOR UPDATE
  `,
    [book_id]
  );
  return result.rows[0];
};

export const hasActiveBorrow = async (client: any, user_id: number, book_id: number) => {
  const result = await client.query(
    `
    SELECT 1 FROM borrowrecords 
    WHERE user_id = $1 AND book_id = $2 
    AND status IN ('Borrowed', 'Overdue')
  `,
    [user_id, book_id]
  );
  return result.rowCount > 0;
};

export const createBorrowRecord = async (client: any, data: any) => {
  const result = await client.query(
    `
    INSERT INTO borrowrecords (user_id, book_id, borrow_date, due_date, status)
    VALUES ($1, $2, $3, $4, $5)
    RETURNING *
  `,
    [data.user_id, data.book_id, data.borrow_date, data.due_date, data.status]
  );
  return result.rows[0];
};

export const updateBorrowStatus = async (client: any, id: number, status: string, return_date?: Date | null) => {
  await client.query(
    `
    UPDATE borrowrecords 
    SET status = $1, 
        return_date = $2, 
        updated_at = CURRENT_TIMESTAMP
    WHERE borrow_id = $3
  `,
    [status, return_date ?? null, id]
  );
};

export const incrementStock = async (client: any, book_id: number) => {
  await client.query(
    "UPDATE books SET stock_quantity = stock_quantity + 1 WHERE book_id = $1",
    [book_id]
  );
};

export const decrementStock = async (client: any, book_id: number) => {
  await client.query(
    "UPDATE books SET stock_quantity = stock_quantity - 1 WHERE book_id = $1",
    [book_id]
  );
};

export const getBorrows = async (filter: any = {}) => {
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
    FROM borrowrecords br
    INNER JOIN users u ON br.user_id = u.user_id
    INNER JOIN books b ON br.book_id = b.book_id
  `;
  const params: any[] = [];
  if (filter.user_id) {
    query += " WHERE br.user_id = $1";
    params.push(filter.user_id);
  }
  query += " ORDER BY br.borrow_date DESC";

  const result = await pool.query(query, params);
  return result.rows;
};

export const getBorrowById = async (poolOrClient: any, id: number) => {
  const result = await poolOrClient.query(
    `
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
    FROM borrowrecords br
    INNER JOIN users u ON br.user_id = u.user_id
    INNER JOIN books b ON br.book_id = b.book_id
    WHERE br.borrow_id = $1
  `,
    [id]
  );
  return result.rows[0] || null;
};

export const deleteBorrow = async (id: number) => {
  const pool = await getPool();
  await pool.query("DELETE FROM borrowrecords WHERE borrow_id = $1", [id]);
};
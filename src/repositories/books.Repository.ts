// src/repositories/books.Repository.ts
import { getPool } from "../config/database";
import { Book } from "../types/books.Interface";

export const findAll = async (filters: {
  title?: string;
  author?: string;
  category_id?: number;
} = {}): Promise<any[]> => {
  const pool = await getPool();
  let query = `
    SELECT 
      b.book_id,
      b.title,
      b.author,
      b.category_id,
      c.name AS genre,
      b.publication_year,
      b.stock_quantity,
      COALESCE(borrowed.active_borrows, 0) AS active_borrows,
      (b.stock_quantity - COALESCE(borrowed.active_borrows, 0)) AS available_copies,
      b.created_at,
      b.updated_at
    FROM books b
    LEFT JOIN categories c ON b.category_id = c.category_id
    LEFT JOIN (
      SELECT book_id, COUNT(*) AS active_borrows
      FROM borrowrecords
      WHERE status IN ('Borrowed', 'Overdue')
      GROUP BY book_id
    ) borrowed ON b.book_id = borrowed.book_id
  `;

  const params: any[] = [];
  let paramIndex = 1;

  if (filters.title) {
    query += ` WHERE b.title ILIKE $${paramIndex}`;
    params.push(`%${filters.title}%`);
    paramIndex++;
  }
  if (filters.author) {
    query += filters.title ? ` AND` : ` WHERE`;
    query += ` b.author ILIKE $${paramIndex}`;
    params.push(`%${filters.author}%`);
    paramIndex++;
  }
  if (filters.category_id !== undefined) {
    query += (filters.title || filters.author) ? ` AND` : ` WHERE`;
    query += ` b.category_id = $${paramIndex}`;
    params.push(filters.category_id);
  }

  query += " ORDER BY b.title";

  const result = await pool.query(query, params);
  return result.rows;
};

export const findById = async (id: number): Promise<any | null> => {
  const pool = await getPool();
  const result = await pool.query(
    `
    SELECT 
      b.book_id,
      b.title,
      b.author,
      b.category_id,
      c.name AS genre,
      b.publication_year,
      b.stock_quantity,
      COALESCE(borrowed.active_borrows, 0) AS active_borrows,
      (b.stock_quantity - COALESCE(borrowed.active_borrows, 0)) AS available_copies,
      b.created_at,
      b.updated_at
    FROM books b
    LEFT JOIN categories c ON b.category_id = c.category_id
    LEFT JOIN (
      SELECT book_id, COUNT(*) AS active_borrows
      FROM borrowrecords
      WHERE status IN ('Borrowed', 'Overdue')
      GROUP BY book_id
    ) borrowed ON b.book_id = borrowed.book_id
    WHERE b.book_id = $1
  `,
    [id]
  );
  return result.rows[0] || null;
};

export const create = async (
  title: string,
  author: string,
  category_id: number | null,
  publication_year?: number,
  stock_quantity: number = 1
): Promise<Book> => {
  const pool = await getPool();
  const result = await pool.query(
    `
    INSERT INTO books (title, author, category_id, publication_year, stock_quantity)
    VALUES ($1, $2, $3, $4, $5)
    RETURNING *
  `,
    [title, author, category_id, publication_year ?? null, stock_quantity]
  );
  return result.rows[0];
};

export const update = async (
  id: number,
  title?: string,
  author?: string,
  category_id?: number | null,
  publication_year?: number,
  stock_quantity?: number
): Promise<Book | null> => {
  const pool = await getPool();
  const updates: string[] = [];
  const values: any[] = [];
  let paramIndex = 1;

  if (title !== undefined) {
    updates.push(`title = $${paramIndex}`);
    values.push(title);
    paramIndex++;
  }
  if (author !== undefined) {
    updates.push(`author = $${paramIndex}`);
    values.push(author);
    paramIndex++;
  }
  if (category_id !== undefined) {
    updates.push(`category_id = $${paramIndex}`);
    values.push(category_id);
    paramIndex++;
  }
  if (publication_year !== undefined) {
    updates.push(`publication_year = $${paramIndex}`);
    values.push(publication_year);
    paramIndex++;
  }
  if (stock_quantity !== undefined) {
    updates.push(`stock_quantity = $${paramIndex}`);
    values.push(stock_quantity);
    paramIndex++;
  }

  if (updates.length === 0) {
    return await findById(id);
  }

  updates.push(`updated_at = CURRENT_TIMESTAMP`);
  values.push(id); // for WHERE

  const query = `
    UPDATE books
    SET ${updates.join(", ")}
    WHERE book_id = $${paramIndex}
    RETURNING *
  `;

  const result = await pool.query(query, values);
  return result.rows[0] || null;
};

export const remove = async (id: number): Promise<boolean> => {
  const pool = await getPool();
  const result = await pool.query("DELETE FROM books WHERE book_id = $1", [id]);
  return (result.rowCount ?? 0) > 0;
};

export const categoryExists = async (categoryId: number): Promise<boolean> => {
  const pool = await getPool();
  const result = await pool.query("SELECT 1 FROM categories WHERE category_id = $1", [categoryId]);
  return (result.rowCount ?? 0) > 0;
};

export const countBorrowRecordsForBook = async (bookId: number): Promise<number> => {
  const pool = await getPool();
  const result = await pool.query(
    `SELECT COUNT(*) AS cnt FROM borrowrecords WHERE book_id = $1 AND status IN ('Borrowed', 'Overdue')`,
    [bookId]
  );
  return parseInt(result.rows[0]?.cnt || "0", 10);
};
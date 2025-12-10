import sql from 'mssql';
import { getPool } from '../config/database';
import { Book } from '../types/books.Interface';

export const findAll = async (filters: {
  title?: string;
  author?: string;
  category_id?: number;
}): Promise<any[]> => {  // Return richer object with genre name and availability
  const pool = await getPool();
  const request = pool.request();

  let whereClause = 'WHERE 1=1';
  if (filters.title) {
    whereClause += ' AND b.title LIKE @title';
    request.input('title', sql.NVarChar, `%${filters.title}%`);
  }
  if (filters.author) {
    whereClause += ' AND b.author LIKE @author';
    request.input('author', sql.NVarChar, `%${filters.author}%`);
  }
  if (filters.category_id !== undefined) {
    whereClause += ' AND b.category_id = @category_id';
    request.input('category_id', sql.Int, filters.category_id);
  }

  const result = await request.query(`
    SELECT 
      b.book_id,
      b.title,
      b.author,
      b.category_id,
      c.name AS genre,
      b.publication_year,
      b.stock_quantity,
      ISNULL(borrowed.active_borrows, 0) AS active_borrows,
      (b.stock_quantity - ISNULL(borrowed.active_borrows, 0)) AS available_copies,
      b.created_at,
      b.updated_at
    FROM Books b
    LEFT JOIN Categories c ON b.category_id = c.category_id
    LEFT JOIN (
      SELECT book_id, COUNT(*) AS active_borrows
      FROM BorrowRecords
      WHERE status IN ('Borrowed', 'Overdue')
      GROUP BY book_id
    ) borrowed ON b.book_id = borrowed.book_id
    ${whereClause}
    ORDER BY b.title
  `);

  return result.recordset;
};

export const findById = async (id: number): Promise<any | null> => {
  const pool = await getPool();
  const result = await pool.request()
    .input('id', sql.Int, id)
    .query(`
      SELECT 
        b.book_id,
        b.title,
        b.author,
        b.category_id,
        c.name AS genre,
        b.publication_year,
        b.stock_quantity,
        ISNULL(borrowed.active_borrows, 0) AS active_borrows,
        (b.stock_quantity - ISNULL(borrowed.active_borrows, 0)) AS available_copies,
        b.created_at,
        b.updated_at
      FROM Books b
      LEFT JOIN Categories c ON b.category_id = c.category_id
      LEFT JOIN (
        SELECT book_id, COUNT(*) AS active_borrows
        FROM BorrowRecords
        WHERE status IN ('Borrowed', 'Overdue')
        GROUP BY book_id
      ) borrowed ON b.book_id = borrowed.book_id
      WHERE b.book_id = @id
    `);

  return result.recordset[0] || null;
};

export const create = async (
  title: string,
  author: string,
  category_id: number | null,
  publication_year?: number,
  stock_quantity: number = 1
): Promise<Book> => {
  const pool = await getPool();
  const result = await pool
    .request()
    .input('title', sql.NVarChar(100), title)
    .input('author', sql.NVarChar(100), author)
    .input('category_id', sql.Int, category_id)
    .input('publication_year', sql.Int, publication_year ?? null)
    .input('stock_quantity', sql.Int, stock_quantity)
    .query(`
      INSERT INTO Books (title, author, category_id, publication_year, stock_quantity)
      OUTPUT INSERTED.*
      VALUES (@title, @author, @category_id, @publication_year, @stock_quantity)
    `);
  return result.recordset[0];
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
  const request = pool.request().input('id', sql.Int, id);
  let setClause = 'updated_at = GETDATE()';
  if (title !== undefined) {
    setClause += ', title = @title';
    request.input('title', sql.NVarChar(100), title);
  }
  if (author !== undefined) {
    setClause += ', author = @author';
    request.input('author', sql.NVarChar(100), author);
  }
  if (category_id !== undefined) {
    setClause += ', category_id = @category_id';
    request.input('category_id', sql.Int, category_id ?? null);
  }
  if (publication_year !== undefined) {
    setClause += ', publication_year = @publication_year';
    request.input('publication_year', sql.Int, publication_year);
  }
  if (stock_quantity !== undefined) {
    setClause += ', stock_quantity = @stock_quantity';
    request.input('stock_quantity', sql.Int, stock_quantity);
  }

  const result = await request.query(`
    UPDATE Books
    SET ${setClause}
    OUTPUT INSERTED.*
    WHERE book_id = @id
  `);
  return result.recordset[0] ?? null;
};

export const remove = async (id: number): Promise<boolean> => {
  const pool = await getPool();
  const result = await pool
    .request()
    .input('id', sql.Int, id)
    .query(`DELETE FROM Books WHERE book_id = @id`);
  return result.rowsAffected[0] > 0;
};

export const categoryExists = async (categoryId: number): Promise<boolean> => {
  const pool = await getPool();
  const result = await pool
    .request()
    .input('categoryId', sql.Int, categoryId)
    .query(`SELECT 1 FROM Categories WHERE category_id = @categoryId`);
  return result.recordset.length > 0;
};

export const countBorrowRecordsForBook = async (bookId: number): Promise<number> => {
  const pool = await getPool();
  const result = await pool
    .request()
    .input('bookId', sql.Int, bookId)
    .query(`SELECT COUNT(*) AS cnt FROM BorrowRecords WHERE book_id = @bookId AND status IN ('Borrowed', 'Overdue')`);
  return result.recordset[0].cnt;
};
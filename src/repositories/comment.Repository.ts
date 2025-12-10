// src/repositories/comment.Repository.ts
import { getPool } from "../config/database";
import { Comment, NewComment, UpdateComment } from "../types/comments.Interface";

export const findAll = async (): Promise<any[]> => {  // Return enriched Comment with user_name, book_title
  const pool = await getPool();
  const result = await pool.request().query(`
    SELECT 
      c.comment_id, 
      c.user_id, 
      u.username AS user_name,
      c.book_id, 
      b.title AS book_title,
      c.rating, 
      c.comment, 
      c.created_at 
    FROM Comments c
    INNER JOIN Users u ON c.user_id = u.user_id
    INNER JOIN Books b ON c.book_id = b.book_id
    ORDER BY c.created_at DESC
  `);
  return result.recordset;
};

export const findByBookId = async (book_id: number): Promise<any[]> => {
  const pool = await getPool();
  const result = await pool
    .request()
    .input("book_id", book_id)
    .query(`
      SELECT 
        c.comment_id, 
        c.user_id, 
        u.username AS user_name,
        c.book_id, 
        b.title AS book_title,
        c.rating, 
        c.comment, 
        c.created_at 
      FROM Comments c
      INNER JOIN Users u ON c.user_id = u.user_id
      INNER JOIN Books b ON c.book_id = b.book_id
      WHERE c.book_id = @book_id 
      ORDER BY c.created_at DESC
    `);
  return result.recordset;
};

export const findById = async (id: number): Promise<any | null> => {
  const pool = await getPool();
  const result = await pool
    .request()
    .input("id", id)
    .query(`
      SELECT 
        c.comment_id, 
        c.user_id, 
        u.username AS user_name,
        c.book_id, 
        b.title AS book_title,
        c.rating, 
        c.comment, 
        c.created_at 
      FROM Comments c
      INNER JOIN Users u ON c.user_id = u.user_id
      INNER JOIN Books b ON c.book_id = b.book_id
      WHERE c.comment_id = @id
    `);
  return result.recordset[0] || null;
};

export const create = async (data: NewComment): Promise<Comment> => {
  const pool = await getPool();
  const result = await pool
    .request()
    .input("user_id", data.user_id)
    .input("book_id", data.book_id)
    .input("rating", data.rating)
    .input("comment", data.comment || null)
    .query(`
      INSERT INTO Comments (user_id, book_id, rating, comment)
      OUTPUT INSERTED.*
      VALUES (@user_id, @book_id, @rating, @comment)
    `);
  return result.recordset[0];
};

export const update = async (id: number, data: UpdateComment): Promise<Comment | null> => {
  const pool = await getPool();

  const result = await pool
    .request()
    .input("id", id)
    .input("rating", data.rating ?? null)
    .input("comment", data.comment ?? null)
    .query(`
      UPDATE Comments
      SET 
        rating = COALESCE(@rating, rating),
        comment = COALESCE(@comment, comment),
        updated_at = GETDATE()
      OUTPUT INSERTED.*
      WHERE comment_id = @id
    `);

  return result.recordset[0] ?? null;
};

export const remove = async (id: number): Promise<void> => {
  const pool = await getPool();
  await pool
    .request()
    .input("id", id)
    .query("DELETE FROM Comments WHERE comment_id = @id");
};
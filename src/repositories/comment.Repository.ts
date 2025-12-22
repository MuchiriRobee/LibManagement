// src/repositories/comment.Repository.ts
import { getPool } from "../config/database";
import { Comment, NewComment, UpdateComment } from "../types/comments.Interface";

export const findAll = async (): Promise<any[]> => {
  const pool = await getPool();
  const result = await pool.query(`
    SELECT 
      c.comment_id, 
      c.user_id, 
      u.username AS user_name,
      c.book_id, 
      b.title AS book_title,
      c.rating, 
      c.comment, 
      c.created_at 
    FROM comments c
    INNER JOIN users u ON c.user_id = u.user_id
    INNER JOIN books b ON c.book_id = b.book_id
    ORDER BY c.created_at DESC
  `);
  return result.rows;
};

export const findByBookId = async (book_id: number): Promise<any[]> => {
  const pool = await getPool();
  const result = await pool.query(
    `
    SELECT 
      c.comment_id, 
      c.user_id, 
      u.username AS user_name,
      c.book_id, 
      b.title AS book_title,
      c.rating, 
      c.comment, 
      c.created_at 
    FROM comments c
    INNER JOIN users u ON c.user_id = u.user_id
    INNER JOIN books b ON c.book_id = b.book_id
    WHERE c.book_id = $1 
    ORDER BY c.created_at DESC
  `,
    [book_id]
  );
  return result.rows;
};

export const findById = async (id: number): Promise<any | null> => {
  const pool = await getPool();
  const result = await pool.query(
    `
    SELECT 
      c.comment_id, 
      c.user_id, 
      u.username AS user_name,
      c.book_id, 
      b.title AS book_title,
      c.rating, 
      c.comment, 
      c.created_at 
    FROM comments c
    INNER JOIN users u ON c.user_id = u.user_id
    INNER JOIN books b ON c.book_id = b.book_id
    WHERE c.comment_id = $1
  `,
    [id]
  );
  return result.rows[0] || null;
};

export const create = async (data: NewComment): Promise<Comment> => {
  const pool = await getPool();
  const result = await pool.query(
    `
    INSERT INTO comments (user_id, book_id, rating, comment)
    VALUES ($1, $2, $3, $4)
    RETURNING *
  `,
    [data.user_id, data.book_id, data.rating, data.comment || null]
  );
  return result.rows[0];
};

export const update = async (id: number, data: UpdateComment): Promise<Comment | null> => {
  const pool = await getPool();
  const result = await pool.query(
    `
    UPDATE comments
    SET 
      rating = COALESCE($1, rating),
      comment = COALESCE($2, comment),
      updated_at = CURRENT_TIMESTAMP
    WHERE comment_id = $3
    RETURNING *
  `,
    [data.rating ?? null, data.comment ?? null, id]
  );

  return result.rows[0] || null;
};

export const remove = async (id: number): Promise<void> => {
  const pool = await getPool();
  await pool.query("DELETE FROM comments WHERE comment_id = $1", [id]);
};
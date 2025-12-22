// src/repositories/categories.Repository.ts
import { getPool } from "../config/database";
import { Category } from "../types/categories.Interface";

export const findAll = async (): Promise<Category[]> => {
  const pool = await getPool();
  const result = await pool.query(`
    SELECT category_id, name, description, created_at, updated_at
    FROM categories
    ORDER BY name
  `);
  return result.rows;
};

export const findById = async (id: number): Promise<Category | null> => {
  const pool = await getPool();
  const result = await pool.query(
    `
    SELECT category_id, name, description, created_at, updated_at
    FROM categories WHERE category_id = $1
  `,
    [id]
  );
  return result.rows[0] || null;
};

export const create = async (name: string, description?: string): Promise<Category> => {
  const pool = await getPool();
  const result = await pool.query(
    `
    INSERT INTO categories (name, description)
    VALUES ($1, $2)
    RETURNING *
  `,
    [name, description ?? null]
  );
  return result.rows[0];
};

export const update = async (
  id: number,
  name?: string,
  description?: string
): Promise<Category | null> => {
  const pool = await getPool();
  const updates: string[] = [];
  const values: any[] = [];
  let paramIndex = 1;

  if (name !== undefined) {
    updates.push(`name = $${paramIndex}`);
    values.push(name);
    paramIndex++;
  }
  if (description !== undefined) {
    updates.push(`description = $${paramIndex}`);
    values.push(description);
    paramIndex++;
  }

  if (updates.length === 0) {
    return await findById(id);
  }

  updates.push(`updated_at = CURRENT_TIMESTAMP`);
  values.push(id);

  const query = `
    UPDATE categories
    SET ${updates.join(", ")}
    WHERE category_id = $${paramIndex}
    RETURNING *
  `;

  const result = await pool.query(query, values);
  return result.rows[0] || null;
};

export const remove = async (id: number): Promise<boolean> => {
  const pool = await getPool();
  const result = await pool.query("DELETE FROM categories WHERE category_id = $1", [id]);
  return (result.rowCount ?? 0) > 0;
};

export const countBooksInCategory = async (categoryId: number): Promise<number> => {
  const pool = await getPool();
  const result = await pool.query(
    `SELECT COUNT(*) AS cnt FROM books WHERE category_id = $1`,
    [categoryId]
  );
  return parseInt(result.rows[0]?.cnt || "0", 10);
};
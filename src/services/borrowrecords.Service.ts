// src/services/borrowrecords.Service.ts
import * as repo from "../repositories/borrowrecords.Repository";
import { getPool } from "../config/database";

export const borrowBook = async ({ user_id, book_id }: { user_id: number; book_id: number }) => {
  const pool = await getPool();
  const client = await pool.connect();

  try {
    await client.query('BEGIN');

    // 1. Check stock
    const book = await repo.getBookStock(client, book_id);
    if (!book || book.stock_quantity <= 0) {
      throw new Error("Book is not available");
    }

    // 2. Prevent duplicate active borrow
    //const active = await repo.hasActiveBorrow(client, user_id, book_id);
    //if (active) {
      //throw new Error("You have already borrowed this book");
    //}

    // 3. Create borrow record
    const due_date = new Date();
    due_date.setDate(due_date.getDate() + 14); // 14 days

    const record = await repo.createBorrowRecord(client, {
      user_id,
      book_id,
      borrow_date: new Date(),
      due_date,
      status: "Borrowed",
    });

    // 4. Decrement stock
    await repo.decrementStock(client, book_id);

    await client.query('COMMIT');
    return { success: true, message: "Book borrowed successfully", data: record };
  } catch (error: any) {
    await client.query('ROLLBACK');
    throw error;
  } finally {
    client.release();
  }
};

export const returnBook = async (borrow_id: number, user_id: number, role: string) => {
  const pool = await getPool();
  const client = await pool.connect();

  try {
    await client.query('BEGIN');

    const record = await repo.getBorrowById(client, borrow_id);
    if (!record) throw new Error("Borrow record not found");

    if (record.user_id !== user_id && role.toLowerCase() !== "admin") {
      throw new Error("You can only return your own books");
    }

    if (record.status === "Returned") {
      throw new Error("Book already returned");
    }

    await repo.updateBorrowStatus(client, borrow_id, "Returned", new Date());
    await repo.incrementStock(client, record.book_id);

    await client.query('COMMIT');
    return { success: true, message: "Book returned successfully" };
  } catch (error: any) {
    await client.query('ROLLBACK');
    throw error;
  } finally {
    client.release();
  }
};

export const getBorrows = async (filter: any) => {
  return await repo.getBorrows(filter);
};

export const getBorrowById = async (id: number) => {
  return await repo.getBorrowById(await getPool(), id);
};

export const deleteBorrow = async (id: number) => {
  const record = await repo.getBorrowById(await getPool(), id);
  if (!record) throw new Error("Borrow record not found");
  if (record.status !== "Returned") throw new Error("Cannot delete active borrow");
  await repo.deleteBorrow(id);
};
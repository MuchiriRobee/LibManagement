// src/controllers/books.Controllers.ts
import { Request, Response } from "express";
import * as bookService from "../services/books.Service";

const send = (res: Response, status: number, success: boolean, data?: any, message?: string) =>
  res.status(status).json({ success, ...(data && { data }), ...(message && { message }) });

export const getAllBooks = async (req: Request, res: Response) => {
  const filters = {
    title: req.query.title as string,
    author: req.query.author as string,
    category_id: req.query.category_id ? Number(req.query.category_id) : undefined,
  };
  const books = await bookService.getAllBooks(filters);
  send(res, 200, true, books);
};

export const getBookById = async (req: Request, res: Response) => {
  const id = Number(req.params.id);
  if (isNaN(id)) return send(res, 400, false, null, "Invalid book ID");

  const book = await bookService.getBookById(id);
  if (!book) return send(res, 404, false, null, "Book not found");

  send(res, 200, true, book);
};

export const createBook = async (req: Request, res: Response) => {
  const { title, author, category_id, publication_year, stock_quantity = 1 } = req.body;

  if (!title?.trim() || !author?.trim()) {
    return send(res, 400, false, null, "Title and author are required");
  }
  if (stock_quantity < 0) {
    return send(res, 400, false, null, "Stock cannot be negative");
  }

  try {
    const book = await bookService.createBook({
      title: title.trim(),
      author: author.trim(),
      category_id: category_id ? Number(category_id) : null,
      publication_year: publication_year ? Number(publication_year) : null,
      stock_quantity: Number(stock_quantity),
    });
    send(res, 201, true, book);
  } catch (error: any) {
    const msg = error.message.includes("UNIQUE")
      ? "Book with this title and author already exists"
      : error.message;
    send(res, 400, false, null, msg);
  }
};

export const updateBook = async (req: Request, res: Response) => {
  const id = Number(req.params.id);
  if (isNaN(id)) return send(res, 400, false, null, "Invalid book ID");

  if (Object.keys(req.body).length === 0) {
    return send(res, 400, false, null, "No fields to update");
  }

  try {
    const updated = await bookService.updateBook(id, req.body);
    if (!updated) return send(res, 404, false, null, "Book not found");
    send(res, 200, true, updated);
  } catch (error: any) {
    send(res, 400, false, null, error.message);
  }
};

export const deleteBook = async (req: Request, res: Response) => {
  const id = Number(req.params.id);
  if (isNaN(id)) return send(res, 400, false, null, "Invalid book ID");

  const success = await bookService.deleteBook(id);
  if (!success) return send(res, 409, false, null, "Cannot delete: book has active borrows");

  send(res, 200, true, null, "Book deleted successfully");
};
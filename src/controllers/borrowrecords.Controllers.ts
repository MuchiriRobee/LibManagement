// src/controllers/borrowrecords.Controllers.ts
import { Request, Response } from "express";
import * as borrowService from "../services/borrowrecords.Service";

export const borrowBook = async (req: Request, res: Response) => {
  try {
    const { book_id } = req.body;
    const user_id = (req as any).user.id;

    if (!book_id) {
      return res.status(400).json({ success: false, message: "book_id is required" });
    }

    const result = await borrowService.borrowBook({ user_id, book_id });
    return res.status(201).json(result);
  } catch (error: any) {
    return res.status(400).json({ success: false, message: error.message });
  }
};

export const returnBook = async (req: Request, res: Response) => {
  try {
    const borrow_id = Number(req.params.borrow_id);
    const user_id = (req as any).user.id;
    const user_role = (req as any).user.role;

    const result = await borrowService.returnBook(borrow_id, user_id, user_role);
    return res.status(200).json(result);
  } catch (error: any) {
    return res.status(400).json({ success: false, message: error.message });
  }
};

export const getMyBorrows = async (req: Request, res: Response) => {
  const user_id = (req as any).user.id;
  return getBorrowsWithFilter(req, res, { user_id });
};

export const getAllBorrows = (req: Request, res: Response) => {
  return getBorrowsWithFilter(req, res, {});
};

const getBorrowsWithFilter = async (req: Request, res: Response, filter: any) => {
  try {
    const records = await borrowService.getBorrows(filter);
    return res.status(200).json({ success: true, data: records });
  } catch (error: any) {
    return res.status(500).json({ success: false, message: error.message });
  }
};

export const getBorrowById = async (req: Request, res: Response) => {
  try {
    const id = Number(req.params.borrow_id);
    const record = await borrowService.getBorrowById(id);
    if (!record) return res.status(404).json({ success: false, message: "Borrow record not found" });
    return res.status(200).json({ success: true, data: record });
  } catch (error: any) {
    return res.status(500).json({ success: false, message: error.message });
  }
};

export const deleteBorrow = async (req: Request, res: Response) => {
  try {
    const id = Number(req.params.borrow_id);
    await borrowService.deleteBorrow(id);
    return res.status(200).json({ success: true, message: "Borrow record deleted" });
  } catch (error: any) {
    return res.status(400).json({ success: false, message: error.message });
  }
};
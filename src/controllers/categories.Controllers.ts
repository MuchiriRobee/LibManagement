// src/controllers/categories.Controllers.ts
import { Request, Response } from "express";
import * as catService from "../services/categories.Service";

const send = (res: Response, status: number, success: boolean, data?: any, message?: string) =>
  res.status(status).json({ success, ...(data && { data }), ...(message && { message }) });

export const getAllCategories = async (_: Request, res: Response) => {
  const categories = await catService.getAllCategories();
  send(res, 200, true, categories);
};

export const getCategoryById = async (req: Request, res: Response) => {
  const id = Number(req.params.id);
  if (isNaN(id)) return send(res, 400, false, null, "Invalid category ID");

  const category = await catService.getCategoryById(id);
  if (!category) return send(res, 404, false, null, "Category not found");

  send(res, 200, true, category);
};

export const createCategory = async (req: Request, res: Response) => {
  const { name, description } = req.body;
  if (!name?.trim()) return send(res, 400, false, null, "Category name is required");

  try {
    const category = await catService.createCategory({ name: name.trim(), description: description?.trim() });
    send(res, 201, true, category);
  } catch (error: any) {
    const msg = error.message.includes("UNIQUE") ? "Category name already exists" : error.message;
    send(res, 409, false, null, msg);
  }
};

export const updateCategory = async (req: Request, res: Response) => {
  const id = Number(req.params.id);
  if (isNaN(id)) return send(res, 400, false, null, "Invalid category ID");

  const { name, description } = req.body;
  if (!name && !description) return send(res, 400, false, null, "At least one field is required");

  try {
    const updated = await catService.updateCategory(id, { name: name?.trim(), description: description?.trim() });
    if (!updated) return send(res, 404, false, null, "Category not found");
    send(res, 200, true, updated);
  } catch (error: any) {
    send(res, 409, false, null, "Category name already exists");
  }
};

export const deleteCategory = async (req: Request, res: Response) => {
  const id = Number(req.params.id);
  if (isNaN(id)) return send(res, 400, false, null, "Invalid category ID");

  const success = await catService.deleteCategory(id);
  if (!success) return send(res, 409, false, null, "Cannot delete: books are assigned to this category");

  send(res, 200, true, null, "Category deleted successfully");
};
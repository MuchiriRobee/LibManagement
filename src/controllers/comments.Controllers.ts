// src/controllers/comments.Controllers.ts
import { Request, Response } from "express";
import * as commentService from "../services/comments.Service";

const sendError = (res: Response, status: number, message: string) => {
  res.status(status).json({ success: false, message });
};

export const getAllComments = async (req: Request, res: Response) => {
  try {
    const comments = await commentService.getAllComments();
    res.status(200).json({ success: true, data: comments });
  } catch (error: any) {
    sendError(res, 500, error.message || "Server error");
  }
};

export const getCommentsByBook = async (req: Request, res: Response) => {
  try {
    const book_id = Number(req.params.book_id);
    if (isNaN(book_id)) return sendError(res, 400, "Invalid book ID");

    const comments = await commentService.getCommentsByBook(book_id);
    res.status(200).json({ success: true, data: comments });
  } catch (error: any) {
    sendError(res, 500, error.message);
  }
};

export const getCommentById = async (req: Request, res: Response) => {
  try {
    const id = Number(req.params.id);
    if (isNaN(id)) return sendError(res, 400, "Invalid comment ID");

    const comment = await commentService.getCommentById(id);
    if (!comment) return sendError(res, 404, "Comment not found");

    res.status(200).json({ success: true, data: comment });
  } catch (error: any) {
    sendError(res, 500, error.message);
  }
};

export const createComment = async (req: Request, res: Response) => {
  try {
    const user_id = (req as any).user.id;
    const { book_id, rating, comment } = req.body;

    if (!book_id || !rating) {
      return sendError(res, 400, "book_id and rating are required");
    }
    if (rating < 1 || rating > 5) {
      return sendError(res, 400, "Rating must be between 1 and 5");
    }

    const newComment = await commentService.createComment({
      user_id,
      book_id: Number(book_id),
      rating: Number(rating),
      comment: comment?.trim() || null,
    });

    res.status(201).json({ success: true, data: newComment });
  } catch (error: any) {
    sendError(res, 400, error.message || "Failed to create comment");
  }
};

export const updateComment = async (req: Request, res: Response) => {
  try {
    const id = Number(req.params.id);
    if (isNaN(id)) {
      return sendError(res, 400, "Invalid comment ID");
    }

    const user_id = (req as any).user.id;
    const user_role = (req as any).user.role;

    const updates = req.body;

    // Validate rating if provided
    if (updates.rating !== undefined) {
      if (!Number.isInteger(updates.rating) || updates.rating < 1 || updates.rating > 5) {
        return sendError(res, 400, "Rating must be an integer between 1 and 5");
      }
    }

    const updated = await commentService.updateComment(id, user_id, user_role, updates);

    // This is the KEY line — null means not found OR not authorized
    if (!updated) {
      return sendError(res, 404, "Comment not found or you do not have permission to update it");
    }

    // Success!
    res.status(200).json({ success: true, data: updated });
  } catch (error: any) {
    // ONLY real unexpected errors come here
    console.error("Unexpected error in updateComment:", error);
    sendError(res, 500, "Internal server error");
  }
};

export const deleteComment = async (req: Request, res: Response) => {
  try {
    const id = Number(req.params.id);
    const user_id = (req as any).user.id;
    const user_role = (req as any).user.role;

    const success = await commentService.deleteComment(id, user_id, user_role);
    if (!success) return sendError(res, 404, "Comment not found or unauthorized");

    res.status(200).json({ success: true, message: "Comment deleted" });
  } catch (error: any) {
    sendError(res, 500, "Server error");
  }
};
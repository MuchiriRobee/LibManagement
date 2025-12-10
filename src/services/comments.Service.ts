// src/services/comments.Service.ts
import * as repo from "../repositories/comment.Repository";
import { Comment, NewComment, UpdateComment } from "../types/comments.Interface";

export const getAllComments = async (): Promise<Comment[]> => {
  return await repo.findAll();
};

export const getCommentsByBook = async (book_id: number): Promise<Comment[]> => {
  return await repo.findByBookId(book_id);
};

export const getCommentById = async (id: number): Promise<Comment | null> => {
  return await repo.findById(id);
};

export const createComment = async (data: NewComment): Promise<Comment> => {
  if (data.rating < 1 || data.rating > 5) {
    throw new Error("Rating must be between 1 and 5");
  }
  return await repo.create(data);
};

export const updateComment = async (
  id: number,
  user_id: number,
  user_role: string,
  updates: UpdateComment
): Promise<Comment | null> => {
  const comment = await repo.findById(id);
  if (!comment) return null;

  // Only owner or admin can update
if (comment.user_id !== user_id && user_role.toLowerCase() !== "admin") {
    return null; // not authorized
  }

  return await repo.update(id, updates);
};

export const deleteComment = async (
  id: number,
  user_id: number,
  user_role: string
): Promise<boolean> => {
  const comment = await repo.findById(id);
  if (!comment) return false;

  if (comment.user_id !== user_id && user_role.toLowerCase() !== "admin") {
    throw new Error("You can only delete your own comments");
  }

  await repo.remove(id);
  return true;
};
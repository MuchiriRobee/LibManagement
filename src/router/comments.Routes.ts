// src/router/comments.Routes.ts
import { Router } from "express";
import * as commentController from "../controllers/comments.Controllers";
import { isAuthenticated } from "../Middlewares/bearAuth";

const router = Router();

// Public — anyone can read
router.get("/comments", commentController.getAllComments);
router.get("/comments/book/:book_id", commentController.getCommentsByBook); // Bonus: by book
router.get("/comments/:id", commentController.getCommentById);

// Protected — must be logged in
router.post("/comments", isAuthenticated, commentController.createComment);
router.put("/comments/:id", isAuthenticated, commentController.updateComment);
router.delete("/comments/:id", isAuthenticated, commentController.deleteComment);

export default router;
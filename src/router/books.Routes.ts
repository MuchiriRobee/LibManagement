// src/router/books.Routes.ts
import { Router } from "express";
import * as bookCtrl from "../controllers/books.Controllers";
import { isAuthenticated } from "../Middlewares/bearAuth";
import { authorize } from "../Middlewares/roleAuth";

const router = Router();

// Public — anyone can browse books
router.get("/books", bookCtrl.getAllBooks);
router.get("/books/:id", bookCtrl.getBookById);

// Admin only — manage books
router.post("/books", isAuthenticated, authorize, bookCtrl.createBook);
router.put("/books/:id", isAuthenticated, authorize, bookCtrl.updateBook);
router.delete("/books/:id", isAuthenticated, authorize, bookCtrl.deleteBook);

export default router;
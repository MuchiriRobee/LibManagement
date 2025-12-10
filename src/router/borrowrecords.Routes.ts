// src/router/borrowrecords.Routes.ts
import { Router } from "express";
import * as borrowController from "../controllers/borrowrecords.Controllers";
import { isAuthenticated } from "../Middlewares/bearAuth";
import { authorize } from "../Middlewares/roleAuth";

const router = Router();

// Public + Member routes
router.post("/borrow", isAuthenticated, borrowController.borrowBook);                    // Member borrows
router.get("/borrow/my", isAuthenticated, borrowController.getMyBorrows);               // Member sees own
router.patch("/borrow/return/:borrow_id", isAuthenticated, borrowController.returnBook); // Member returns

// Admin only
router.get("/borrow", isAuthenticated, authorize, borrowController.getAllBorrows);
router.get("/borrow/:borrow_id", isAuthenticated, authorize, borrowController.getBorrowById);
router.delete("/borrow/:borrow_id", isAuthenticated, authorize, borrowController.deleteBorrow);

export default router;
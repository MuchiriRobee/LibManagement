// src/router/categories.Routes.ts
import { Router } from "express";
import * as catCtrl from "../controllers/categories.Controllers";
import { isAuthenticated } from "../Middlewares/bearAuth";
import { authorize } from "../Middlewares/roleAuth";

const router = Router();

// Public — anyone can browse categories
router.get("/categories", catCtrl.getAllCategories);
router.get("/categories/:id", catCtrl.getCategoryById);

// Admin only — create, update, delete
router.post("/categories", isAuthenticated, authorize, catCtrl.createCategory);
router.put("/categories/:id", isAuthenticated, authorize, catCtrl.updateCategory);
router.delete("/categories/:id", isAuthenticated, authorize, catCtrl.deleteCategory);

export default router;
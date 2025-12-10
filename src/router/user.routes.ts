// src/router/user.routes.ts
import { Router } from "express";
import * as userController from "../controllers/users.Controllers";
import { validateLoginUser, validateUser } from "../Middlewares/userValidate";
import { isAuthenticated } from "../Middlewares/bearAuth";
import { authorize } from "../Middlewares/roleAuth";

const userRouter = Router();

// Public routes
userRouter.post("/users/login", validateLoginUser, userController.userLogin);
userRouter.post("/users/register", validateUser, userController.createUser);

// Protected + Admin only
userRouter.get("/users", isAuthenticated, authorize, userController.getAllUsers);
userRouter.get("/users/admins", isAuthenticated, authorize, userController.getAdmins);
userRouter.get("/users/members", isAuthenticated, authorize, userController.getMembers);
userRouter.get("/users/:id", isAuthenticated, authorize, userController.getUserById);
userRouter.get("/users/email", isAuthenticated, userController.getUserByEmail); // ?email=...
userRouter.put("/users/:id", isAuthenticated, authorize, userController.updateUserRole);
userRouter.delete("/users/:id", isAuthenticated, authorize, userController.deleteUser);

export default userRouter;
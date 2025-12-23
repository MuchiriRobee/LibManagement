// src/controllers/users.Controllers.ts
import { Request, Response } from "express";
import * as userService from "../services/users.Service";

export const createUser = async (req: Request, res: Response) => {
  const result = await userService.registerUser(req.body);

  if (!result.success) {
    return res.status(400).json(result);
  }

  return res.status(201).json(result);
};

export const userLogin = async (req: Request, res: Response) => {
  try {
    const result = await userService.loginUser(req.body);
    return res.status(200).json(result);
  } catch (error: any) {
    return res.status(401).json({
      success: false,
      message: error.message || "Invalid credentials",
    });
  }
};

export const getAllUsers = async (req: Request, res: Response) => {
  try {
    const users = await userService.getAllUsers();
    return res.status(200).json({ success: true, data: users });
  } catch (error: any) {
    return res.status(500).json({ success: false, message: error.message });
  }
};

export const getAdmins = async (req: Request, res: Response) => {
  try {
    const admins = await userService.getAdmins();
    return res.status(200).json({ success: true, data: admins });
  } catch (error: any) {
    return res.status(500).json({ success: false, message: error.message });
  }
};

export const getMembers = async (req: Request, res: Response) => {
  try {
    const members = await userService.getMembers();
    return res.status(200).json({ success: true, data: members });
  } catch (error: any) {
    return res.status(500).json({ success: false, message: error.message });
  }
};

export const getUserById = async (req: Request, res: Response) => {
  try {
    const id = parseInt(req.params.id);
    if (isNaN(id)) return res.status(400).json({ success: false, message: "Invalid user ID" });

    const user = await userService.getUserById(id);
    if (!user) return res.status(404).json({ success: false, message: "User not found" });

    return res.status(200).json({ success: true, data: user });
  } catch (error: any) {
    return res.status(500).json({ success: false, message: error.message });
  }
};

export const getUserByEmail = async (req: Request, res: Response) => {
  try {
    const email = req.query.email as string;
    if (!email) return res.status(400).json({ success: false, message: "Email query parameter is required" });

    const user = await userService.getUserByEmail(email);
    if (!user) return res.status(404).json({ success: false, message: "User not found" });

    return res.status(200).json({ success: true, data: user });
  } catch (error: any) {
    return res.status(500).json({ success: false, message: error.message });
  }
};

export const updateProfile = async (req: Request, res: Response) => {
  try {
    const userId = (req as any).user?.id; // set by isAuthenticated middleware
    if (!userId) {
      return res.status(401).json({ success: false, message: "Unauthorized" });
    }

    const { username, email, oldPassword, newPassword } = req.body;

    if (!username && !email && !newPassword) {
      return res.status(400).json({ success: false, message: "No changes provided" });
    }

    const result = await userService.updateProfile(userId, {
      username,
      email,
      oldPassword,
      newPassword,
    });

    if (!result.success) {
      return res.status(result.status || 400).json(result);
    }

    return res.status(200).json(result);
  } catch (error: any) {
    return res.status(500).json({ success: false, message: error.message || "Server error" });
  }
};

export const updateUserRole = async (req: Request, res: Response) => {
  try {
    const id = parseInt(req.params.id);
    if (isNaN(id)) return res.status(400).json({ success: false, message: "Invalid user ID" });

    const { role } = req.body;
    if (!["Admin", "Member"].includes(role)) {
      return res.status(400).json({ success: false, message: "Invalid role" });
    }

    const updated = await userService.updateUserRole(id, role);
    if (!updated) return res.status(404).json({ success: false, message: "User not found" });

    return res.status(200).json({ success: true, data: updated });
  } catch (error: any) {
    return res.status(500).json({ success: false, message: error.message });
  }
};

export const deleteUser = async (req: Request, res: Response) => {
  try {
    const id = parseInt(req.params.id);
    if (isNaN(id)) return res.status(400).json({ success: false, message: "Invalid user ID" });

    await userService.deleteUser(id);
    return res.status(200).json({ success: true, message: "User deleted successfully" });
  } catch (error: any) {
    return res.status(500).json({ success: false, message: error.message });
  }
};

export const getUsersCount = async (req: Request, res: Response) => {
  try {
    const count = await userService.getTotalUsersCount();
    return res.status(200).json({ success: true, count });
  } catch (error: any) {
    return res.status(500).json({ success: false, message: error.message });
  }
};
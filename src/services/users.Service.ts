// src/services/users.Service.ts
import * as userRepo from "../repositories/user.Repository";
import { NewUser, LoginUser, User, updateUser } from "../types/users.types";
import bcrypt from "bcrypt";
import jwt from "jsonwebtoken";

const JWT_SECRET = process.env.JWT_SECRET || "fallback-secret-change-in-prod";

interface ProfileUpdateData {
  username?: string;
  email?: string;
  oldPassword?: string;
  newPassword?: string;
}

export const registerUser = async (userData: NewUser) => {
  const existing = await userRepo.findByEmail(userData.email);
  if (existing) {
    return { success: false, message: "Email already registered" };
  }

  const hashedPassword = await bcrypt.hash(userData.password, 12);
  const newUser: NewUser = {
    ...userData,
    password: hashedPassword,
    role: userData.role || "Member",
    created_at: new Date(),
  };

  const createdUser = await userRepo.createUser(newUser);
  delete (createdUser as any).password_hash;

  return {
    success: true,
    message: "User registered successfully",
    data: createdUser,
  };
};

export const loginUser = async (credentials: LoginUser) => {
  const user = await userRepo.findByEmail(credentials.email);
  if (!user || !user.password_hash) {
    throw new Error("Invalid email or password");
  }

  const isValid = await bcrypt.compare(credentials.password, user.password_hash);
  if (!isValid) {
    throw new Error("Invalid email or password");
  }

  const token = jwt.sign(
    {
      id: user.user_id,
      email: user.email,
      role: user.role,
    },
    JWT_SECRET,
    { expiresIn: "24h" }
  );

  delete (user as any).password_hash;

  return {
    success: true,
    message: "Login successful",
    data: { user, token },
  };
};

export const getAllUsers = async (): Promise<User[]> => {
  const users = await userRepo.findAll();
  return users.map(({ password_hash, ...u }) => u);
};

export const getAdmins = async (): Promise<User[]> => {
  const admins = await userRepo.findByRole("Admin");
  return admins.map(({ password_hash, ...a }) => a);
};

export const getMembers = async (): Promise<User[]> => {
  const members = await userRepo.findByRole("Member");
  return members.map(({ password_hash, ...m }) => m);
};

export const getUserById = async (id: number): Promise<User | null> => {
  const user = await userRepo.findById(id);
  if (user) delete (user as any).password_hash;
  return user;
};

export const getUserByEmail = async (email: string): Promise<User | null> => {
  const user = await userRepo.findByEmail(email);
  if (user) delete (user as any).password_hash;
  return user;
};

export const updateProfile = async (
  userId: number,
  data: ProfileUpdateData
): Promise<{ success: true; data: User } | { success: false; message: string; status?: number }> => {
  const user = await userRepo.findById(userId);
  if (!user) {
    return { success: false, message: "User not found", status: 404 };
  }

  // Ensure password_hash exists (should always be true for local accounts)
  if (!user.password_hash) {
    return { success: false, message: "Password authentication not available for this account", status: 400 };
  }

  const updates: Partial<User> = {};

  // Username update
  if (data.username !== undefined && data.username.trim() !== "" && data.username !== user.username) {
    updates.username = data.username.trim();
  }

  // Email update
  if (data.email !== undefined && data.email.trim() !== "" && data.email !== user.email) {
    const existing = await userRepo.findByEmail(data.email.trim());
    if (existing && existing.user_id !== userId) {
      return { success: false, message: "Email already in use by another account", status: 409 };
    }
    updates.email = data.email.trim();
  }

  // Password change
  if (data.newPassword) {
    // Trim and validate new password
    const newPass = data.newPassword.trim();
    if (newPass.length < 6) {
      return { success: false, message: "New password must be at least 6 characters" };
    }

    // Require old password
    if (!data.oldPassword || data.oldPassword.trim() === "") {
      return { success: false, message: "Current password is required to change password" };
    }

    // Verify old password
    const isValid = await bcrypt.compare(data.oldPassword, user.password_hash);
    if (!isValid) {
      return { success: false, message: "Current password is incorrect" };
    }

    // Hash new password safely
    updates.password_hash = await bcrypt.hash(newPass, 12);
  }

  // If no updates, return early
  if (Object.keys(updates).length === 0) {
    return { success: false, message: "No changes to save" };
  }

  // Perform DB update
  const updatedUser = await userRepo.updateProfile(userId, updates);

  // Remove password from response
  delete (updatedUser as any).password_hash;

  return {
    success: true,
    data: updatedUser,
  };
};

export const updateUserRole = async (id: number, role: "Admin" | "Member"): Promise<User | null> => {
  const updated = await userRepo.updateUserRole(id, role);
  if (updated) delete (updated as any).password_hash;
  return updated;
};

export const deleteUser = async (id: number): Promise<void> => {
  const user = await userRepo.findById(id);
  if (!user) throw new Error("User not found");
  await userRepo.remove(id);
};

export const getTotalUsersCount = async (): Promise<number> => {
  return await userRepo.countAllUsers();
};
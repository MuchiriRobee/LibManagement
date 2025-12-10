// src/services/users.Service.ts
import * as userRepo from "../repositories/user.Repository";
import { NewUser, LoginUser, User, updateUser } from "../types/users.types";
import bcrypt from "bcrypt";
import jwt from "jsonwebtoken";

const JWT_SECRET = process.env.JWT_SECRET || "fallback-secret-change-in-prod";

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
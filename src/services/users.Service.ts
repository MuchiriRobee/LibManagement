// src/services/users.Service.ts
import * as userRepo from "../repositories/user.Repository";
import { NewUser, LoginUser, User, updateUser } from "../types/users.types";
import bcrypt from "bcrypt";
import jwt from "jsonwebtoken";
import crypto from 'crypto';
import { sendVerificationEmail, sendPasswordResetEmail } from '../utils/emails';
import { getPool } from "../config/database";
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

  // Generate secure token
  const verificationToken = crypto.randomBytes(32).toString('hex');
  const verificationExpires = new Date(Date.now() + 24 * 60 * 60 * 1000); // 24 hours

  const newUser = {
    username: userData.username,
    email: userData.email,
    password_hash: hashedPassword,   // note renamed field
    role: userData.role || "Member",
    created_at: new Date(),
    is_verified: false,
    verification_token: verificationToken,
    verification_expires: verificationExpires,
  };

  const created = await userRepo.createUser(newUser);

  // Send email (fire-and-forget in production → use queue)
  sendVerificationEmail(created.email, verificationToken).catch(err => {
    console.error("Email send failed:", err);
  });

  const safeUser = { ...created };
  delete (safeUser as any).password_hash;
  delete (safeUser as any).verification_token;     // never return token
  delete (safeUser as any).verification_expires;

  return {
    success: true,
    message: "Registration successful! Please check your email to verify your account.",
    data: safeUser,
  };
};

export const verifyEmail = async (token: string) => {
  console.log("[verifyEmail] Received token:", token);

  const user = await userRepo.findByVerificationToken(token);

  if (user) {
    if (user.is_verified) {
      console.log("[verifyEmail] Already verified user:", user.user_id);
      return {
        success: true,
        message: "Your email is already verified. You can log in now.",
      };
    }

    console.log("[verifyEmail] Verifying user:", user.user_id);
    await userRepo.markEmailVerified(user.user_id);
    return {
      success: true,
      message: "Email verified successfully! You can now log in.",
    };
  }

  // No match → check if token was ever used (optional but nice)
  const pool = await getPool()
  const used = await pool.query(
    `SELECT user_id FROM users WHERE verification_token = $1 AND is_verified = TRUE`,
    [token]
  );

if ((used.rowCount ?? 0) > 0) {
    console.log("[verifyEmail] Token was already used");
    return {
      success: true,
      message: "This verification link has already been used. Your email is verified.",
    };
  }

  console.log("[verifyEmail] No matching record found");
  return {
    success: false,
    message: "Invalid or expired verification link.",
  };
};

export const resendVerification = async (email: string) => {
  const user = await userRepo.findByEmail(email);
  if (!user) {
    return { success: true }; // fake success to prevent enumeration
  }

  if (user.is_verified) {
    return { success: false, message: "Email is already verified" };
  }

  const token = crypto.randomBytes(32).toString('hex');
  const expires = new Date(Date.now() + 24 * 60 * 60 * 1000);

   const pool = await getPool();     // now it's Pool
   await pool.query(
    `UPDATE users SET verification_token = $1, verification_expires = $2 WHERE user_id = $3`,
    [token, expires, user.user_id]
  );

  await sendVerificationEmail(email, token);

  return { success: true, message: "Verification email resent" };
};

export const requestPasswordReset = async (email: string) => {
  const user = await userRepo.findByEmail(email);
  if (!user) {
    // Still return success to prevent email enumeration
    return { success: true, message: "If the email exists, a reset link has been sent." };
  }

  const resetToken = crypto.randomBytes(32).toString('hex');
  const expires = new Date(Date.now() + 60 * 60 * 1000); // 1 hour

  await userRepo.setResetToken(user.user_id, resetToken, expires);

  sendPasswordResetEmail(email, resetToken).catch(console.error);

  return { success: true, message: "If the email exists, a reset link has been sent." };
};

export const resetPassword = async (token: string, newPassword: string) => {
  if (newPassword.length < 6) {
    return { success: false, message: "Password must be at least 6 characters" };
  }

  const user = await userRepo.findByResetToken(token);
  if (!user) {
    return { success: false, message: "Invalid or expired reset token" };
  }

  const hashed = await bcrypt.hash(newPassword, 12);
  await userRepo.updateProfile(user.user_id, { password_hash: hashed });
  await userRepo.clearResetToken(user.user_id);

  return { success: true, message: "Password reset successfully. Please log in." };
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
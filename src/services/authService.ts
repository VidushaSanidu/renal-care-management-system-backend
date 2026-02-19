import jwt from "jsonwebtoken";
import crypto from "crypto";

import User from "../models/User.js";

import type { IUser } from "../models/User.js";
import type { HydratedDocument, Types } from "mongoose";
import envConfig from "../config/env.config.js";

/*
|--------------------------------------------------------------------------
| Types
|--------------------------------------------------------------------------
*/

export interface AuthResponse {
  token: string;
  user: {
    id: Types.ObjectId;
    name: string;
    email: string;
    role: string;
    phoneNumber?: string;
    department?: string;
    lastLogin?: Date;
  };
}

export interface RegisterInput {
  name: string;
  email: string;
  password: string;
  role: string;
  phoneNumber?: string;
  department?: string;
  licenseNumber?: string;
  specialization?: string;
}

export interface LoginInput {
  email: string;
  password: string;
}

/*
|--------------------------------------------------------------------------
| Service
|--------------------------------------------------------------------------
*/

class AuthService {
  /*
  |--------------------------------------------------------------------------
  | Generate JWT token
  |--------------------------------------------------------------------------
  */

  generateToken(user: HydratedDocument<IUser>): string {
    return jwt.sign(
      {
        id: user._id.toString(),
        role: user.role,
      },
      envConfig.JWT_SECRET,
      {
        expiresIn: envConfig.JWT_EXPIRE as jwt.SignOptions["expiresIn"],
      },
    );
  }

  /*
  |--------------------------------------------------------------------------
  | Register
  |--------------------------------------------------------------------------
  */

  async registerUser(input: RegisterInput): Promise<AuthResponse> {
    const existingUser = await User.findOne({
      email: input.email,
    });

    if (existingUser) {
      throw new Error("User already exists");
    }

    const user = await User.create(input);

    const token = this.generateToken(user);

    return {
      token,

      user: {
        id: user._id,
        name: user.name,
        email: user.email,
        role: user.role,
        phoneNumber: user.phoneNumber,
        department: user.department,
      },
    };
  }

  /*
  |--------------------------------------------------------------------------
  | Login
  |--------------------------------------------------------------------------
  */

  async loginUser(input: LoginInput): Promise<AuthResponse> {
    const user = await User.findOne({
      email: input.email,
    }).select("+password");

    if (!user) {
      throw new Error("Invalid credentials");
    }

    if (!user.isActive) {
      throw new Error("Account deactivated");
    }

    const isMatch = await user.comparePassword(input.password);

    if (!isMatch) {
      throw new Error("Invalid credentials");
    }

    user.lastLogin = new Date();

    await user.save();

    const token = this.generateToken(user);

    return {
      token,

      user: {
        id: user._id,
        name: user.name,
        email: user.email,
        role: user.role,
        phoneNumber: user.phoneNumber,
        department: user.department,
        lastLogin: user.lastLogin,
      },
    };
  }

  /*
  |--------------------------------------------------------------------------
  | Get user
  |--------------------------------------------------------------------------
  */

  async getUserById(userId: string | Types.ObjectId) {
    const user = await User.findById(userId);

    if (!user) {
      throw new Error("User not found");
    }

    return {
      id: user._id,
      name: user.name,
      email: user.email,
      role: user.role,
      phoneNumber: user.phoneNumber,
      department: user.department,
      licenseNumber: user.licenseNumber,
      specialization: user.specialization,
      profilePicture: user.profilePicture,
      lastLogin: user.lastLogin,
      emailVerified: user.emailVerified,
      notifications: user.notifications,
      createdAt: user.createdAt,
    };
  }

  /*
  |--------------------------------------------------------------------------
  | Update profile
  |--------------------------------------------------------------------------
  */

  async updateUserProfile(
    userId: string | Types.ObjectId,
    updates: Partial<IUser>,
  ) {
    const allowedFields: readonly (keyof IUser)[] = [
      "name",
      "phoneNumber",
      "department",
      "notifications",
    ];

    const filteredUpdates = Object.fromEntries(
      allowedFields
        .filter((field) => updates[field] !== undefined)
        .map((field) => [field, updates[field]]),
    ) as Partial<IUser>;

    const user = await User.findByIdAndUpdate(userId, filteredUpdates, {
      new: true,
      runValidators: true,
    }).lean();

    if (!user) throw new Error("User not found");

    return {
      id: user._id.toString(),
      name: user.name,
      email: user.email,
      role: user.role,
      phoneNumber: user.phoneNumber,
      department: user.department,
      notifications: user.notifications,
    };
  }

  /*
  |--------------------------------------------------------------------------
  | Change password
  |--------------------------------------------------------------------------
  */

  async changePassword(
    userId: string | Types.ObjectId,

    currentPassword: string,

    newPassword: string,
  ) {
    const user = await User.findById(userId).select("+password");

    if (!user) {
      throw new Error("User not found");
    }

    const isMatch = await user.comparePassword(currentPassword);

    if (!isMatch) {
      throw new Error("Incorrect password");
    }

    user.password = newPassword;

    await user.save();

    return {
      message: "Password changed successfully",
    };
  }

  /*
  |--------------------------------------------------------------------------
  | Generate reset token
  |--------------------------------------------------------------------------
  */

  async generateResetToken(email: string) {
    const user = await User.findOne({
      email,
    });

    if (!user) {
      throw new Error("User not found");
    }

    const resetToken = user.getResetPasswordToken();

    await user.save({
      validateBeforeSave: false,
    });

    return {
      resetToken,
      message: "Reset token generated",
    };
  }

  /*
  |--------------------------------------------------------------------------
  | Reset password
  |--------------------------------------------------------------------------
  */

  async resetPassword(
    token: string,

    newPassword: string,
  ) {
    const hashedToken = crypto.createHash("sha256").update(token).digest("hex");

    const user = await User.findOne({
      resetPasswordToken: hashedToken,

      resetPasswordExpire: {
        $gt: Date.now(),
      },
    });

    if (!user) {
      throw new Error("Invalid or expired token");
    }

    user.password = newPassword;

    user.resetPasswordToken = undefined;

    user.resetPasswordExpire = undefined;

    await user.save();

    return {
      message: "Password reset successful",
    };
  }
}

export default new AuthService();

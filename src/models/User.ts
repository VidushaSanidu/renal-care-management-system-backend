import crypto from "crypto";

import type { Document, Model, HydratedDocument } from "mongoose";
import mongoose, { Schema } from "mongoose";
import bcrypt from "bcryptjs";

/*
|--------------------------------------------------------------------------
| Types
|--------------------------------------------------------------------------
*/

export type UserRole = "NURSE" | "DOCTOR" | "ADMIN";

export const validUserRoles: UserRole[] = ["NURSE", "DOCTOR", "ADMIN"];

export interface IUser extends Document {
  name: string;

  email: string;

  password: string;

  role: UserRole;

  isActive: boolean;

  lastLogin?: Date;

  profilePicture?: string | null;

  phoneNumber?: string;

  department?: string;

  licenseNumber?: string;

  specialization?: string;

  notifications: {
    email: boolean;
    sms: boolean;
    push: boolean;
  };

  resetPasswordToken?: string;

  resetPasswordExpire?: Date;

  emailVerificationToken?: string;

  emailVerified: boolean;

  createdAt: Date;
  updatedAt: Date;

  comparePassword(candidatePassword: string): Promise<boolean>;

  getResetPasswordToken(): string;
}

/*
|--------------------------------------------------------------------------
| Schema
|--------------------------------------------------------------------------
*/

const userSchema = new Schema<IUser>(
  {
    name: {
      type: String,
      required: true,
      trim: true,
      maxlength: 100,
    },

    email: {
      type: String,
      required: true,
      unique: true,
      lowercase: true,
      trim: true,

      match: [
        /^\w+([.-]?\w+)*@\w+([.-]?\w+)*(\.\w{2,3})+$/,
        "Please enter valid email",
      ],
    },

    password: {
      type: String,
      required: true,
      minlength: 6,
      select: false,
    },

    role: {
      type: String,
      enum: ["NURSE", "DOCTOR", "ADMIN"],
      required: true,
    },

    isActive: {
      type: Boolean,
      default: true,
    },

    lastLogin: Date,

    profilePicture: {
      type: String,
      default: null,
    },

    phoneNumber: String,

    department: String,

    licenseNumber: {
      type: String,
      sparse: true,
    },

    specialization: String,

    notifications: {
      email: {
        type: Boolean,
        default: true,
      },

      sms: {
        type: Boolean,
        default: false,
      },

      push: {
        type: Boolean,
        default: true,
      },
    },

    resetPasswordToken: String,

    resetPasswordExpire: Date,

    emailVerificationToken: String,

    emailVerified: {
      type: Boolean,
      default: false,
    },
  },

  {
    timestamps: true,

    toJSON: { virtuals: true },

    toObject: { virtuals: true },
  },
);

/*
|--------------------------------------------------------------------------
| Indexes
|--------------------------------------------------------------------------
*/

// userSchema.index({ email: 1 });

userSchema.index({ role: 1 });

userSchema.index({ isActive: 1 });

/*
|--------------------------------------------------------------------------
| Hash password middleware
|--------------------------------------------------------------------------
*/

userSchema.pre("save", async function (this: HydratedDocument<IUser>) {
  if (!this.isModified("password")) {
    return;
  }

  const salt = await bcrypt.genSalt(12);

  this.password = await bcrypt.hash(this.password, salt);
});

/*
|--------------------------------------------------------------------------
| Compare password method
|--------------------------------------------------------------------------
*/

userSchema.methods.comparePassword = async function (
  candidatePassword: string,
): Promise<boolean> {
  return bcrypt.compare(candidatePassword, this.password);
};

/*
|--------------------------------------------------------------------------
| Reset password token
|--------------------------------------------------------------------------
*/

userSchema.methods.getResetPasswordToken = function (): string {
  const resetToken = crypto.randomBytes(20).toString("hex");

  this.resetPasswordToken = crypto
    .createHash("sha256")
    .update(resetToken)
    .digest("hex");

  this.resetPasswordExpire = new Date(Date.now() + 10 * 60 * 1000);

  return resetToken;
};

/*
|--------------------------------------------------------------------------
| Safe export
|--------------------------------------------------------------------------
*/

const User: Model<IUser> =
  mongoose.models.User || mongoose.model<IUser>("User", userSchema);

export default User;

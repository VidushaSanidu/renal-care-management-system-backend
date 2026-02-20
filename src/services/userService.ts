import { Types } from "mongoose";

import type { IUser, UserRole } from "../models/User.js";
import User from "../models/User.js";

/*
|--------------------------------------------------------------------------
| Types
|--------------------------------------------------------------------------
*/

interface GetUsersQuery {
  page?: number;
  limit?: number;
  role?: UserRole;
  isActive?: string;
  search?: string;
}

interface CreateUserInput {
  name: string;
  email: string;
  password: string;
  role: UserRole;
  phoneNumber?: string;
  department?: string;
  licenseNumber?: string;
  specialization?: string;
}

interface UpdateUserInput {
  name?: string;
  email?: string;
  role?: UserRole;
  phoneNumber?: string;
  department?: string;
  licenseNumber?: string;
  specialization?: string;
  isActive?: boolean;
}

/*
|--------------------------------------------------------------------------
| Service
|--------------------------------------------------------------------------
*/

class UserService {
  /*
  |--------------------------------------------------------------------------
  | Get all users
  |--------------------------------------------------------------------------
  */

  async getAllUsers(queryParams: GetUsersQuery) {
    const page = Number(queryParams.page ?? 1);
    const limit = Number(queryParams.limit ?? 10);
    const skip = (page - 1) * limit;

    const query: Record<string, unknown> = {};

    if (queryParams.role) {
      query.role = queryParams.role;
    }

    if (queryParams.isActive !== undefined) {
      query.isActive = queryParams.isActive === "true";
    }

    if (queryParams.search) {
      query.$or = [
        {
          name: {
            $regex: queryParams.search,
            $options: "i",
          },
        },
        {
          email: {
            $regex: queryParams.search,
            $options: "i",
          },
        },
      ];
    }

    const users = await User.find(query)
      .select("-password")
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit)
      .lean();

    const total = await User.countDocuments(query);

    return {
      users,
      total,
      page,
      limit,
      pages: Math.ceil(total / limit),
    };
  }

  /*
  |--------------------------------------------------------------------------
  | Get user by ID
  |--------------------------------------------------------------------------
  */

  async getUserById(userId: string) {
    if (!Types.ObjectId.isValid(userId)) {
      throw new Error("Invalid user ID");
    }

    const user = await User.findById(userId).select("-password").lean();

    if (!user) {
      throw new Error("User not found");
    }

    return user;
  }

  /*
  |--------------------------------------------------------------------------
  | Create user
  |--------------------------------------------------------------------------
  */

  async createUser(userData: CreateUserInput) {
    const existingUser = await User.findOne({
      email: userData.email,
    });

    if (existingUser) {
      throw new Error("User already exists");
    }

    const user = await User.create(userData);

    return {
      id: user._id.toString(),
      name: user.name,
      email: user.email,
      role: user.role,
      phoneNumber: user.phoneNumber,
      department: user.department,
      licenseNumber: user.licenseNumber,
      specialization: user.specialization,
      isActive: user.isActive,
      createdAt: user.createdAt,
    };
  }

  /*
  |--------------------------------------------------------------------------
  | Update user
  |--------------------------------------------------------------------------
  */

  async updateUser(userId: string, updateData: UpdateUserInput) {
    if (!Types.ObjectId.isValid(userId)) {
      throw new Error("Invalid user ID");
    }

    if (updateData.email) {
      const existingUser = await User.findOne({
        email: updateData.email,
        _id: { $ne: userId },
      });

      if (existingUser) {
        throw new Error("Email already exists");
      }
    }

    const user = await User.findByIdAndUpdate(userId, updateData, {
      new: true,
      runValidators: true,
    })
      .select("-password")
      .lean();

    if (!user) {
      throw new Error("User not found");
    }

    return user;
  }

  /*
  |--------------------------------------------------------------------------
  | Soft delete user
  |--------------------------------------------------------------------------
  */

  async deleteUser(userId: string, currentUserId: string) {
    if (userId === currentUserId) {
      throw new Error("You cannot delete your own account");
    }

    const user = await User.findById(userId);

    if (!user) {
      throw new Error("User not found");
    }

    user.isActive = false;

    await user.save();

    return {
      message: "User deactivated successfully",
    };
  }

  /*
  |--------------------------------------------------------------------------
  | Activate user
  |--------------------------------------------------------------------------
  */

  async activateUser(userId: string) {
    const user = await User.findByIdAndUpdate(
      userId,
      { isActive: true },
      { new: true },
    )
      .select("-password")
      .lean();

    if (!user) {
      throw new Error("User not found");
    }

    return user;
  }

  /*
  |--------------------------------------------------------------------------
  | Get users by role
  |--------------------------------------------------------------------------
  */

  async getUsersByRole(role: UserRole) {
    const users = await User.find({
      role,
      isActive: true,
    })
      .select("name email phoneNumber department specialization")
      .lean();

    return users;
  }

  /*
  |--------------------------------------------------------------------------
  | Stats
  |--------------------------------------------------------------------------
  */

  async getUserStats() {
    const totalUsers = await User.countDocuments();

    const activeUsers = await User.countDocuments({
      isActive: true,
    });

    const inactiveUsers = await User.countDocuments({
      isActive: false,
    });

    const usersByRole = await User.aggregate([
      {
        $group: {
          _id: "$role",
          count: { $sum: 1 },
        },
      },
    ]);

    const recentUsers = await User.find({
      isActive: true,
    })
      .select("name email role createdAt")
      .sort({ createdAt: -1 })
      .limit(5)
      .lean();

    return {
      totalUsers,
      activeUsers,
      inactiveUsers,
      usersByRole,
      recentUsers,
    };
  }

  /*
  |--------------------------------------------------------------------------
  | Access control
  |--------------------------------------------------------------------------
  */

  checkUserAccess(requestingUser: IUser, targetUserId: string) {
    if (
      requestingUser.role !== "ADMIN" &&
      requestingUser._id.toString() !== targetUserId
    ) {
      throw new Error("Not authorized");
    }

    return true;
  }
}

export default new UserService();

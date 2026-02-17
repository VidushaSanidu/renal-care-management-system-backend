const User = require("../models/User");

class UserService {
  // Get all users with filtering and pagination
  async getAllUsers(queryParams) {
    const { page = 1, limit = 10, role, isActive, search } = queryParams;
    const skip = (page - 1) * limit;

    const query = {};

    // Filter by role
    if (role) {
      query.role = role;
    }

    // Filter by active status
    if (isActive !== undefined) {
      query.isActive = isActive === "true";
    }

    // Search by name or email
    if (search) {
      query.$or = [
        { name: { $regex: search, $options: "i" } },
        { email: { $regex: search, $options: "i" } },
      ];
    }

    const users = await User.find(query)
      .select("-password")
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(parseInt(limit));

    const total = await User.countDocuments(query);

    return {
      users,
      total,
      page: parseInt(page),
      limit: parseInt(limit),
      pages: Math.ceil(total / limit),
    };
  }

  // Get user by ID
  async getUserById(userId) {
    const user = await User.findById(userId).select("-password");

    if (!user) {
      throw new Error("User not found");
    }

    return user;
  }

  // Create new user
  async createUser(userData) {
    const {
      name,
      email,
      password,
      role,
      phoneNumber,
      department,
      licenseNumber,
      specialization,
      shift,
    } = userData;

    // Check if user already exists
    const existingUser = await User.findOne({ email });
    if (existingUser) {
      throw new Error("User already exists");
    }

    const user = await User.create({
      name,
      email,
      password,
      role,
      phoneNumber,
      department,
      licenseNumber,
      specialization,
      shift,
    });

    return {
      id: user._id,
      name: user.name,
      email: user.email,
      role: user.role,
      phoneNumber: user.phoneNumber,
      department: user.department,
      licenseNumber: user.licenseNumber,
      specialization: user.specialization,
      shift: user.shift,
      isActive: user.isActive,
      createdAt: user.createdAt,
    };
  }

  // Update user
  async updateUser(userId, updateData) {
    const allowedFields = [
      "name",
      "email",
      "role",
      "phoneNumber",
      "department",
      "licenseNumber",
      "specialization",
      "shift",
      "isActive",
    ];

    const updates = {};
    allowedFields.forEach((field) => {
      if (updateData[field] !== undefined) {
        updates[field] = updateData[field];
      }
    });

    // Check if email is being updated and if it already exists
    if (updates.email) {
      const existingUser = await User.findOne({
        email: updates.email,
        _id: { $ne: userId },
      });
      if (existingUser) {
        throw new Error("Email already exists");
      }
    }

    const user = await User.findByIdAndUpdate(userId, updates, {
      new: true,
      runValidators: true,
    }).select("-password");

    if (!user) {
      throw new Error("User not found");
    }

    return user;
  }

  // Delete user (soft delete - deactivate)
  async deleteUser(userId, currentUserId) {
    const user = await User.findById(userId);

    if (!user) {
      throw new Error("User not found");
    }

    // Prevent admin from deleting themselves
    if (user.id === currentUserId) {
      throw new Error("You cannot delete your own account");
    }

    // Soft delete - deactivate user instead of actual deletion
    user.isActive = false;
    await user.save();

    return { message: "User deactivated successfully" };
  }

  // Activate user
  async activateUser(userId) {
    const user = await User.findByIdAndUpdate(
      userId,
      { isActive: true },
      { new: true },
    ).select("-password");

    if (!user) {
      throw new Error("User not found");
    }

    return user;
  }

  // Get users by role
  async getUsersByRole(role) {
    if (!["nurse", "doctor", "admin"].includes(role)) {
      throw new Error("Invalid role");
    }

    const users = await User.find({
      role,
      isActive: true,
    }).select("name email phoneNumber department specialization");

    return users;
  }

  // Get user statistics
  async getUserStats() {
    const totalUsers = await User.countDocuments();
    const activeUsers = await User.countDocuments({ isActive: true });
    const inactiveUsers = await User.countDocuments({ isActive: false });

    const usersByRole = await User.aggregate([
      {
        $group: {
          _id: "$role",
          count: { $sum: 1 },
        },
      },
    ]);

    const recentUsers = await User.find({ isActive: true })
      .select("name email role createdAt")
      .sort({ createdAt: -1 })
      .limit(5);

    return {
      totalUsers,
      activeUsers,
      inactiveUsers,
      usersByRole,
      recentUsers,
    };
  }

  // Check user access permissions
  checkUserAccess(requestingUser, targetUserId) {
    // Allow users to view their own profile or admin to view any
    if (requestingUser.role !== "admin" && requestingUser.id !== targetUserId) {
      throw new Error("Not authorized to access this profile");
    }
    return true;
  }
}

module.exports = new UserService();

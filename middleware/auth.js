const jwt = require("jsonwebtoken");
const User = require("../models/User");

// Protect routes
exports.protect = async (req, res, next) => {
  let token;

  if (
    req.headers.authorization &&
    req.headers.authorization.startsWith("Bearer")
  ) {
    token = req.headers.authorization.split(" ")[1];
  }

  if (!token) {
    return res.status(401).json({
      success: false,
      message: "Not authorized to access this route",
    });
  }

  try {
    // Verify token
    const decoded = jwt.verify(token, process.env.JWT_SECRET);

    // Get user from token
    req.user = await User.findById(decoded.id).select("-password");

    if (!req.user) {
      return res.status(401).json({
        success: false,
        message: "Not authorized to access this route",
      });
    }

    // Check if user is active
    if (!req.user.isActive) {
      return res.status(401).json({
        success: false,
        message: "User account is deactivated",
      });
    }

    next();
  } catch (error) {
    return res.status(401).json({
      success: false,
      message: "Not authorized to access this route",
    });
  }
};

// Grant access to specific roles
exports.authorize = (...roles) => {
  return (req, res, next) => {
    if (!roles.includes(req.user.role)) {
      return res.status(403).json({
        success: false,
        message: `User role ${req.user.role} is not authorized to access this route`,
      });
    }
    next();
  };
};

// Check if user owns the resource or has admin privileges
exports.checkOwnership = (resourceField = "user") => {
  return (req, res, next) => {
    // Admin can access all resources
    if (req.user.role === "admin") {
      return next();
    }

    // For other roles, check ownership
    const resourceId = req.params.id;

    // This middleware assumes the resource has a user field
    // You may need to customize this based on your specific needs
    if (req.user.id !== resourceId && req.user.role !== "admin") {
      return res.status(403).json({
        success: false,
        message: "Not authorized to access this resource",
      });
    }

    next();
  };
};

// Check patient assignment (for nurses and doctors)
exports.checkPatientAssignment = async (req, res, next) => {
  try {
    const Patient = require("../models/Patient");
    const patientId = req.params.patientId || req.params.id;

    if (!patientId) {
      return res.status(400).json({
        success: false,
        message: "Patient ID is required",
      });
    }

    const patient = await Patient.findById(patientId);

    if (!patient) {
      return res.status(404).json({
        success: false,
        message: "Patient not found",
      });
    }

    // Admin can access all patients
    if (req.user.role === "admin") {
      return next();
    }

    // Check if doctor is assigned to patient
    if (
      req.user.role === "doctor" &&
      patient.assignedDoctor.toString() === req.user.id
    ) {
      return next();
    }

    // Check if nurse is assigned to patient
    if (
      req.user.role === "nurse" &&
      patient.assignedNurse &&
      patient.assignedNurse.toString() === req.user.id
    ) {
      return next();
    }

    return res.status(403).json({
      success: false,
      message: "Not authorized to access this patient",
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: "Error checking patient assignment",
    });
  }
};

// Optional auth - doesn't require token but adds user if present
exports.optionalAuth = async (req, res, next) => {
  let token;

  if (
    req.headers.authorization &&
    req.headers.authorization.startsWith("Bearer")
  ) {
    token = req.headers.authorization.split(" ")[1];
  }

  if (token) {
    try {
      const decoded = jwt.verify(token, process.env.JWT_SECRET);
      req.user = await User.findById(decoded.id).select("-password");
    } catch (error) {
      // Token is invalid, but we continue without user
      req.user = null;
    }
  }

  next();
};

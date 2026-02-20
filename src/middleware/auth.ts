import { Request, Response, NextFunction } from "express";
import jwt from "jsonwebtoken";
import User from "../models/User.js";
import Patient from "../models/Patient.js";
import envConfig from "../config/env.config.js";
import type { TokenPayload } from "../types/auth.js";

/**
 * Protect routes middleware
 */
export const protect = async (
  req: Request,
  res: Response,
  next: NextFunction,
): Promise<Response | void> => {
  let token: string | undefined;

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
    const decoded = jwt.verify(token, envConfig.JWT_SECRET) as TokenPayload;

    const user = await User.findById(decoded.id).select("-password");

    if (!user) {
      return res.status(401).json({
        success: false,
        message: "User not found",
      });
    }

    if (!user.isActive) {
      return res.status(401).json({
        success: false,
        message: "User account is deactivated",
      });
    }

    req.user = user;

    next();
  } catch {
    return res.status(401).json({
      success: false,
      message: "Invalid token",
    });
  }
};

/**
 * Role authorization middleware
 */
export const authorize =
  (...roles: string[]) =>
  (req: Request, res: Response, next: NextFunction): Response | void => {
    if (!req.user || !roles.includes(req.user.role)) {
      return res.status(403).json({
        success: false,
        message: `Role ${req.user?.role} not authorized`,
      });
    }

    next();
  };

/**
 * Resource ownership check
 */
export const checkOwnership =
  (resourceField = "user") =>
  (req: Request, res: Response, next: NextFunction): Response | void => {
    if (req.user?.role === "admin") {
      return next();
    }

    const resourceId = req.params.id as string;

    if (req.user?.id !== resourceId) {
      return res.status(403).json({
        success: false,
        message: "Not authorized",
      });
    }

    next();
  };

/**
 * Patient assignment check
 */
export const checkPatientAssignment = async (
  req: Request,
  res: Response,
  next: NextFunction,
): Promise<Response | void> => {
  try {
    const patientId = (req.params.patientId || req.params.id) as string;

    if (!patientId) {
      return res.status(400).json({
        success: false,
        message: "Patient ID required",
      });
    }

    const patient = await Patient.findById(patientId);

    if (!patient) {
      return res.status(404).json({
        success: false,
        message: "Patient not found",
      });
    }

    if (req.user?.role === "admin") {
      return next();
    }

    if (
      req.user?.role === "doctor" &&
      patient.assignedDoctor?.toString() === req.user.id
    ) {
      return next();
    }

    if (
      req.user?.role === "nurse" &&
      patient.assignedNurse?.toString() === req.user.id
    ) {
      return next();
    }

    return res.status(403).json({
      success: false,
      message: "Not authorized",
    });
  } catch {
    return res.status(500).json({
      success: false,
      message: "Error checking assignment",
    });
  }
};

/**
 * Optional authentication
 */
export const optionalAuth = async (
  req: Request,
  next: NextFunction,
): Promise<void> => {
  let token: string | undefined;

  if (
    req.headers.authorization &&
    req.headers.authorization.startsWith("Bearer")
  ) {
    token = req.headers.authorization.split(" ")[1];
  }

  if (token) {
    try {
      const decoded = jwt.verify(token, envConfig.JWT_SECRET) as TokenPayload;

      const user = await User.findById(decoded.id).select("-password");

      if (user) {
        req.user = user;
      }
    } catch {
      console.warn("Invalid token in optionalAuth middleware");
      // User token is invalid, leave req.user as is
    }
  }

  next();
};

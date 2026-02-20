import type { Request, Response } from "express";
import { validationResult } from "express-validator";

import AIPredictionService from "../services/aiPredictionService.js";

/**
 * Extract Bearer token safely
 */
const extractToken = (req: Request): string | null => {
  const authHeader = req.headers.authorization;

  if (authHeader?.startsWith("Bearer ")) {
    return authHeader.replace("Bearer ", "");
  }

  if (typeof req.query.token === "string") {
    return req.query.token;
  }

  return null;
};

/**
 * Predict Hemoglobin
 */
export const predictHemoglobin = async (
  req: Request,
  res: Response,
): Promise<Response> => {
  try {
    const errors = validationResult(req);

    if (!errors.isEmpty()) {
      return res.status(400).json({
        success: false,
        errors: errors.array(),
      });
    }

    const { patientId } = req.params as { patientId: string };

    if (!patientId) {
      return res.status(400).json({
        success: false,
        message: "Patient ID required",
      });
    }

    const patientData =
      await AIPredictionService.getPatientDataForHbPrediction(patientId);

    if (!patientData) {
      return res.status(404).json({
        success: false,
        message: "Patient data not found",
      });
    }

    const token = extractToken(req);

    if (!token) {
      return res.status(401).json({
        success: false,
        message: "Authentication token required",
      });
    }

    const prediction = await AIPredictionService.predictHemoglobin(
      patientData.predictionData,
      token,
    );

    return res.json({
      success: true,
      patient: patientData.patient,
      prediction,
      requestedBy: req.user?.id,
      requestedAt: new Date().toISOString(),
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Server error";

    return res.status(500).json({
      success: false,
      message,
      error: message,
    });
  }
};

/**
 * Predict URR
 */
export const predictURR = async (
  req: Request,
  res: Response,
): Promise<Response> => {
  try {
    const { patientId } = req.params as { patientId: string };

    const patientData =
      await AIPredictionService.getPatientDataForUrrPrediction(patientId);

    const token = extractToken(req);

    if (!token) {
      return res.status(401).json({
        success: false,
        message: "Token required",
      });
    }

    const prediction = await AIPredictionService.predictURR(
      patientData.predictionData,
      token,
    );

    return res.json({
      success: true,
      patient: patientData.patient,
      prediction,
      requestedBy: req.user?.id,
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Server error";

    return res.status(500).json({
      success: false,
      message,
    });
  }
};

/**
 * Predict Dry Weight
 */
export const predictDryWeight = async (
  req: Request,
  res: Response,
): Promise<Response> => {
  try {
    const { patientId } = req.params as { patientId: string };

    const patientData =
      await AIPredictionService.getPatientDataForDryWeightPrediction(patientId);

    const token = extractToken(req);

    if (!token) {
      return res.status(401).json({
        success: false,
        message: "Token required",
      });
    }

    const prediction = await AIPredictionService.predictDryWeight(
      patientData.predictionData,
      token,
    );

    return res.json({
      success: true,
      patient: patientData.patient,
      prediction,
      requestedBy: req.user?.id,
      timestamp: new Date().toISOString(),
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Server error";

    return res.status(500).json({
      success: false,
      message,
    });
  }
};

/**
 * Check ML Server Health
 */
export const checkMLServerHealth = async (
  req: Request,
  res: Response,
): Promise<Response> => {
  try {
    const token = extractToken(req);

    if (!token) {
      return res.status(401).json({
        success: false,
        message: "Token required",
      });
    }

    const health = await AIPredictionService.checkMLServerHealth(token);

    return res.json({
      success: true,
      health,
      checkedAt: new Date().toISOString(),
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Server error";

    return res.status(500).json({
      success: false,
      message,
    });
  }
};

/**
 * Get ML Models Info
 */
export const getMLModelsInfo = async (
  req: Request,
  res: Response,
): Promise<Response> => {
  try {
    const token = extractToken(req);

    if (!token) {
      return res.status(401).json({
        success: false,
        message: "Token required",
      });
    }

    const models = await AIPredictionService.getMLModelsInfo(token);

    return res.json({
      success: true,
      models: models.available_models,
      endpoints: models.endpoints,
      retrievedAt: new Date().toISOString(),
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Server error";

    return res.status(500).json({
      success: false,
      message,
    });
  }
};

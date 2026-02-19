import express, { Router } from "express";

import { protect, authorize } from "../middleware/auth.js";

import {
  validatePatientIdParam,
} from "../middleware/aiPredictionValidation.js";

import {
  predictHemoglobin,
  predictURR,
  predictDryWeight,
  checkMLServerHealth,
  getMLModelsInfo,
} from "../controllers/aiPredictionController.js";

const router: Router = express.Router();

/**
 * @swagger
 * /api/ai-predictions/predict/hb/{patientId}:
 *   get:
 *     summary: Predict Hemoglobin levels using patient's latest monthly investigation data
 *     tags: [AI Predictions]
 *     security:
 *       - bearerAuth: []
 */
router.get(
  "/predict/hb/:patientId",
  protect,
  authorize("doctor", "nurse"),
  validatePatientIdParam,
  predictHemoglobin,
);

/**
 * @swagger
 * /api/ai-predictions/predict/urr/{patientId}:
 *   get:
 *     summary: Predict URR risk using patient's latest monthly investigation data
 *     tags: [AI Predictions]
 */
router.get(
  "/predict/urr/:patientId",
  protect,
  authorize("doctor", "nurse"),
  validatePatientIdParam,
  predictURR,
);

/**
 * @swagger
 * /api/ai-predictions/predict/dry-weight/{patientId}:
 *   get:
 *     summary: Predict dry weight changes using patient's latest dialysis session data
 *     tags: [AI Predictions]
 */
router.get(
  "/predict/dry-weight/:patientId",
  protect,
  authorize("doctor", "nurse"),
  validatePatientIdParam,
  predictDryWeight,
);

/**
 * @swagger
 * /api/ai-predictions/health:
 *   get:
 *     summary: Check ML server health status
 *     tags: [AI Predictions]
 */
router.get("/health", protect, checkMLServerHealth);

/**
 * @swagger
 * /api/ai-predictions/models:
 *   get:
 *     summary: Get detailed information about available ML models
 *     tags: [AI Predictions]
 */
router.get("/models", protect, getMLModelsInfo);

export default router;

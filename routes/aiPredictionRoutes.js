const express = require("express");
const { protect, authorize } = require("../middleware/auth");
const {
  validateHbPrediction,
  validateWeightLogic,
  validatePatientIdParam,
} = require("../middleware/aiPredictionValidation");
const {
  predictHemoglobin,
  predictURR,
  predictDryWeight,
  checkMLServerHealth,
  getMLModelsInfo,
} = require("../controllers/aiPredictionController");

const router = express.Router();

/**
 * @swagger
 * /api/ai-predictions/predict/hb/{patientId}:
 *   get:
 *     summary: Predict Hemoglobin levels using patient's latest monthly investigation data
 *     tags: [AI Predictions]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: patientId
 *         required: true
 *         schema:
 *           type: string
 *         description: Patient ID
 *     responses:
 *       200:
 *         description: Hemoglobin prediction completed successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                 message:
 *                   type: string
 *                 patient:
 *                   $ref: '#/components/schemas/PatientInfo'
 *                 inputData:
 *                   $ref: '#/components/schemas/HbPredictionInput'
 *                 prediction:
 *                   $ref: '#/components/schemas/HbPredictionResult'
 *                 requestedBy:
 *                   type: string
 *                 requestedAt:
 *                   type: string
 *                   format: date-time
 *       400:
 *         description: No investigation data available for prediction
 *       404:
 *         description: Patient not found
 *       500:
 *         description: ML server error or internal server error
 *       503:
 *         description: ML server is unavailable
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
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: patientId
 *         required: true
 *         schema:
 *           type: string
 *         description: Patient ID
 *     responses:
 *       200:
 *         description: URR prediction completed successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                 message:
 *                   type: string
 *                 patient:
 *                   type: object
 *                 prediction:
 *                   type: object
 *       400:
 *         description: Missing required data or validation error
 *       503:
 *         description: ML server unavailable
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
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: patientId
 *         required: true
 *         schema:
 *           type: string
 *         description: Patient ID
 *     responses:
 *       200:
 *         description: Dry weight prediction completed successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                 message:
 *                   type: string
 *                 patient:
 *                   type: object
 *                 prediction:
 *                   type: object
 *       400:
 *         description: Missing required data or validation error
 *       503:
 *         description: ML server unavailable
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
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: ML server is online and healthy
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                 message:
 *                   type: string
 *                 status:
 *                   type: string
 *                 serverInfo:
 *                   type: object
 *                 checkedAt:
 *                   type: string
 *                   format: date-time
 *       503:
 *         description: ML server is offline or unavailable
 */
router.get("/health", protect, checkMLServerHealth);

/**
 * @swagger
 * /api/ai-predictions/models:
 *   get:
 *     summary: Get detailed information about available ML models
 *     tags: [AI Predictions]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Model information retrieved successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                 message:
 *                   type: string
 *                 models:
 *                   type: object
 *                   properties:
 *                     dry_weight:
 *                       type: object
 *                       description: Dry weight prediction model information
 *                     urr:
 *                       type: object
 *                       description: URR prediction model information
 *                     hb:
 *                       type: object
 *                       description: Hemoglobin prediction model information
 *                 endpoints:
 *                   type: object
 *                   description: Available prediction endpoints
 *                 retrievedAt:
 *                   type: string
 *                   format: date-time
 *       503:
 *         description: ML server is unavailable
 */
router.get("/models", protect, getMLModelsInfo);

module.exports = router;

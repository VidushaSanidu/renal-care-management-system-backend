const { validationResult } = require("express-validator");
const AIPredictionService = require("../services/aiPredictionService");

/**
 * @desc    Predict Hemoglobin levels using patient's latest data
 * @route   GET /api/ai-predictions/predict/hb/:patientId
 * @access  Private
 */
const predictHemoglobin = async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        success: false,
        message: "Validation errors",
        errors: errors.array(),
      });
    }
    const { patientId } = req.params;
    if (!patientId) {
      return res.status(400).json({
        success: false,
        message: "Patient ID is required",
      });
    }

    // Get patient data and latest monthly investigation
    const patientDataResult =
      await AIPredictionService.getPatientDataForHbPrediction(patientId);

    if (!patientDataResult.success) {
      return res.status(404).json({
        success: false,
        message: "Patient data not found or incomplete",
      });
    }

    // Extract token from request headers
    const authToken =
      req.headers.authorization?.replace("Bearer ", "") || req.query.token;

    if (!authToken) {
      return res.status(401).json({
        success: false,
        message: "Authentication token is required for ML server access",
      });
    }

    // Make prediction request to ML server using patient's actual data
    const predictionResult = await AIPredictionService.predictHemoglobin(
      patientDataResult.predictionData,
      authToken,
    );

    res.json({
      success: true,
      message: "Hemoglobin prediction completed successfully",
      patient: patientDataResult.patientInfo,
      prediction: predictionResult,
      requestedBy: req.user.id,
      requestedAt: new Date().toISOString(),
    });
  } catch (error) {
    console.error("Hemoglobin prediction error:", error.message);

    // Handle specific error types
    if (error.message.includes("Patient not found")) {
      return res.status(404).json({
        success: false,
        message: "Patient not found",
        error: error.message,
      });
    }

    if (error.message.includes("No monthly investigation data")) {
      return res.status(400).json({
        success: false,
        message: "No investigation data available for prediction",
        error: error.message,
      });
    }

    res.status(500).json({
      success: false,
      message: "Failed to get hemoglobin prediction",
      error: error.message,
    });
  }
};

/**
 * @desc    Check ML server health status
 * @route   GET /api/ai-predictions/health
 * @access  Private
 */
const checkMLServerHealth = async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        success: false,
        message: "Validation errors",
        errors: errors.array(),
      });
    }
    // Extract token from request headers
    const authToken =
      req.headers.authorization?.replace("Bearer ", "") || req.query.token;

    if (!authToken) {
      return res.status(401).json({
        success: false,
        message: "Authentication token is required for ML server access",
      });
    }

    const healthStatus =
      await AIPredictionService.checkMLServerHealth(authToken);

    if (healthStatus.success) {
      res.json({
        success: true,
        message: "ML server is online",
        status: healthStatus.status,
        serverInfo: healthStatus.serverResponse,
        checkedAt: new Date().toISOString(),
      });
    } else {
      res.status(503).json({
        success: false,
        message: "ML server is offline",
        status: healthStatus.status,
        error: healthStatus.error,
        checkedAt: new Date().toISOString(),
      });
    }
  } catch (error) {
    console.error("ML server health check error:", error.message);

    res.status(500).json({
      success: false,
      message: "Failed to check ML server status",
      error: error.message,
    });
  }
};

/**
 * @desc    Predict URR risk using patient's latest data
 * @route   GET /api/ai-predictions/predict/urr/:patientId
 * @access  Private
 */
const predictURR = async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        success: false,
        message: "Validation errors",
        errors: errors.array(),
      });
    }
    const { patientId } = req.params;

    if (!patientId) {
      return res.status(400).json({
        success: false,
        message: "Patient ID is required",
      });
    }

    // Get patient data and latest monthly investigation
    const patientDataResult =
      await AIPredictionService.getPatientDataForUrrPrediction(patientId);

    // Extract token from request headers
    const authToken =
      req.headers.authorization?.replace("Bearer ", "") || req.query.token;

    if (!authToken) {
      return res.status(401).json({
        success: false,
        message: "Authentication token is required for ML server access",
      });
    }

    // Make prediction request to ML server using patient's actual data
    const predictionResult = await AIPredictionService.predictURR(
      patientDataResult.predictionData,
      authToken,
    );

    res.json({
      success: true,
      message: "URR prediction completed successfully",
      patient: patientDataResult.patient,
      prediction: predictionResult,
      requestedBy: req.user.id,
      requestedAt: new Date().toISOString(),
    });
  } catch (error) {
    console.error("URR prediction error:", error.message);

    // Check if this is a validation error or data missing error
    if (
      error.message.includes("Missing required") ||
      error.message.includes("not found")
    ) {
      return res.status(400).json({
        success: false,
        message: error.message,
        type: "validation_error",
      });
    }

    // Check if this is an ML server error
    if (
      error.message.includes("ML Server Error") ||
      error.message.includes("ML prediction server")
    ) {
      return res.status(503).json({
        success: false,
        message: error.message,
        type: "ml_server_error",
      });
    }

    // General server error
    res.status(500).json({
      success: false,
      message: "Failed to predict URR levels",
      error: error.message,
    });
  }
};

/**
 * @desc    Predict Dry Weight changes using patient's latest dialysis session data
 * @route   GET /api/ai-predictions/predict/dry-weight/:patientId
 * @access  Private
 */
const predictDryWeight = async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        success: false,
        message: "Validation errors",
        errors: errors.array(),
      });
    }
    const { patientId } = req.params;

    if (!patientId) {
      return res.status(400).json({
        success: false,
        message: "Patient ID is required",
      });
    }

    // Get patient data and latest dialysis session
    const patientDataResult =
      await AIPredictionService.getPatientDataForDryWeightPrediction(patientId);

    // Extract token from request headers
    const authToken =
      req.headers.authorization?.replace("Bearer ", "") || req.query.token;

    if (!authToken) {
      return res.status(401).json({
        success: false,
        message: "Authentication token is required for ML server access",
      });
    }

    // Make prediction request to ML server using patient's dialysis session data
    const predictionResult = await AIPredictionService.predictDryWeight(
      patientDataResult.predictionData,
      authToken,
    );

    res.json({
      success: true,
      message: "Dry weight prediction completed successfully",
      patient: patientDataResult.patient,
      prediction: predictionResult,
      requestedBy: req.user.id,
      timestamp: new Date().toISOString(),
    });
  } catch (error) {
    console.error("Dry Weight Prediction Error:", error.message);

    // Handle different types of errors
    if (error.message.includes("Patient not found")) {
      return res.status(404).json({
        success: false,
        message: "Patient not found",
        error: error.message,
      });
    }

    if (error.message.includes("No dialysis session data")) {
      return res.status(400).json({
        success: false,
        message: "No dialysis session data available",
        error: error.message,
      });
    }

    if (error.message.includes("Missing required")) {
      return res.status(400).json({
        success: false,
        message: "Incomplete dialysis session data",
        error: error.message,
      });
    }

    if (
      error.message.includes("ML Server Error") ||
      error.message.includes("ML prediction server")
    ) {
      return res.status(503).json({
        success: false,
        message: "ML prediction service temporarily unavailable",
        error: error.message,
      });
    }

    // Generic server error
    res.status(500).json({
      success: false,
      message: "An error occurred during dry weight prediction",
      error:
        process.env.NODE_ENV === "development"
          ? error.message
          : "Internal server error",
    });
  }
};

/**
 * @desc    Get detailed information about available ML models
 * @route   GET /api/ai-predictions/models
 * @access  Private
 */
const getMLModelsInfo = async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        success: false,
        message: "Validation errors",
        errors: errors.array(),
      });
    }
    // Extract token from request headers
    const authToken =
      req.headers.authorization?.replace("Bearer ", "") || req.query.token;

    if (!authToken) {
      return res.status(401).json({
        success: false,
        message: "Authentication token is required for ML server access",
      });
    }

    // Get models info from ML server
    const modelsInfo = await AIPredictionService.getMLModelsInfo(authToken);

    res.json({
      success: true,
      message: "ML models information retrieved successfully",
      models: modelsInfo.available_models,
      endpoints: modelsInfo.endpoints,
      retrievedAt: new Date().toISOString(),
    });
  } catch (error) {
    console.error("Error getting ML models info:", error);

    if (
      error.message.includes("ML Server is not reachable") ||
      error.message.includes("ECONNREFUSED")
    ) {
      return res.status(503).json({
        success: false,
        message: "ML server is currently unavailable",
        error: "Cannot connect to ML prediction service",
      });
    }

    if (error.message.includes("ML Server Error")) {
      return res.status(503).json({
        success: false,
        message: "ML server error",
        error: error.message,
      });
    }

    // Generic server error
    res.status(500).json({
      success: false,
      message: "An error occurred while retrieving model information",
      error:
        process.env.NODE_ENV === "development"
          ? error.message
          : "Internal server error",
    });
  }
};

module.exports = {
  predictHemoglobin,
  predictURR,
  predictDryWeight,
  checkMLServerHealth,
  getMLModelsInfo,
};

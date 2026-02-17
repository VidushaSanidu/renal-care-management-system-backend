/**
 * Validation utilities for the renal care management system
 */

class ValidationUtils {
  /**
   * Validate email format
   * @param {string} email - Email to validate
   * @returns {boolean} - True if valid email
   */
  static isValidEmail(email) {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
  }

  /**
   * Validate phone number format
   * @param {string} phone - Phone number to validate
   * @returns {boolean} - True if valid phone number
   */
  static isValidPhone(phone) {
    const phoneRegex = /^\+?[\d\s-()]{10,}$/;
    return phoneRegex.test(phone);
  }

  /**
   * Validate password strength
   * @param {string} password - Password to validate
   * @returns {Object} - Validation result with isValid and messages
   */
  static validatePassword(password) {
    const result = {
      isValid: true,
      messages: [],
    };

    if (password.length < 8) {
      result.isValid = false;
      result.messages.push("Password must be at least 8 characters long");
    }

    if (!/[a-z]/.test(password)) {
      result.isValid = false;
      result.messages.push(
        "Password must contain at least one lowercase letter",
      );
    }

    if (!/[A-Z]/.test(password)) {
      result.isValid = false;
      result.messages.push(
        "Password must contain at least one uppercase letter",
      );
    }

    if (!/\d/.test(password)) {
      result.isValid = false;
      result.messages.push("Password must contain at least one number");
    }

    if (!/[!@#$%^&*(),.?":{}|<>]/.test(password)) {
      result.isValid = false;
      result.messages.push(
        "Password must contain at least one special character",
      );
    }

    return result;
  }

  /**
   * Validate patient ID format
   * @param {string} patientId - Patient ID to validate
   * @returns {boolean} - True if valid patient ID
   */
  static isValidPatientId(patientId) {
    // Format: RHD_THP_XXX (e.g., RHD_THP_001)
    const patientIdRegex = /^RHD_THP_\d{3}$/;
    return patientIdRegex.test(patientId);
  }

  /**
   * Validate date range
   * @param {Date} startDate - Start date
   * @param {Date} endDate - End date
   * @returns {Object} - Validation result
   */
  static validateDateRange(startDate, endDate) {
    const result = {
      isValid: true,
      messages: [],
    };

    if (!(startDate instanceof Date) || isNaN(startDate.getTime())) {
      result.isValid = false;
      result.messages.push("Invalid start date");
    }

    if (!(endDate instanceof Date) || isNaN(endDate.getTime())) {
      result.isValid = false;
      result.messages.push("Invalid end date");
    }

    if (result.isValid && startDate > endDate) {
      result.isValid = false;
      result.messages.push("Start date must be before end date");
    }

    return result;
  }

  /**
   * Validate dialysis session data
   * @param {Object} sessionData - Session data to validate
   * @returns {Object} - Validation result
   */
  static validateDialysisSession(sessionData) {
    const result = {
      isValid: true,
      messages: [],
    };

    // Required fields
    if (!sessionData.patient) {
      result.isValid = false;
      result.messages.push("Patient is required");
    }

    if (!sessionData.date) {
      result.isValid = false;
      result.messages.push("Date is required");
    }

    // Validate weight values
    if (
      sessionData.preWeight &&
      (sessionData.preWeight < 20 || sessionData.preWeight > 200)
    ) {
      result.isValid = false;
      result.messages.push("Pre-weight must be between 20 and 200 kg");
    }

    if (
      sessionData.postWeight &&
      (sessionData.postWeight < 20 || sessionData.postWeight > 200)
    ) {
      result.isValid = false;
      result.messages.push("Post-weight must be between 20 and 200 kg");
    }

    if (
      sessionData.preWeight &&
      sessionData.postWeight &&
      sessionData.postWeight > sessionData.preWeight
    ) {
      result.isValid = false;
      result.messages.push("Post-weight cannot be greater than pre-weight");
    }

    // Validate duration
    if (
      sessionData.duration &&
      (sessionData.duration < 0 || sessionData.duration > 8)
    ) {
      result.isValid = false;
      result.messages.push("Duration must be between 0 and 8 hours");
    }

    // Validate URR
    if (sessionData.urr && (sessionData.urr < 0 || sessionData.urr > 100)) {
      result.isValid = false;
      result.messages.push("URR must be between 0 and 100%");
    }

    // Validate blood pressure
    if (sessionData.bloodPressure) {
      if (
        sessionData.bloodPressure.systolic &&
        (sessionData.bloodPressure.systolic < 60 ||
          sessionData.bloodPressure.systolic > 250)
      ) {
        result.isValid = false;
        result.messages.push(
          "Systolic blood pressure must be between 60 and 250 mmHg",
        );
      }

      if (
        sessionData.bloodPressure.diastolic &&
        (sessionData.bloodPressure.diastolic < 30 ||
          sessionData.bloodPressure.diastolic > 150)
      ) {
        result.isValid = false;
        result.messages.push(
          "Diastolic blood pressure must be between 30 and 150 mmHg",
        );
      }
    }

    return result;
  }

  /**
   * Validate monthly investigation data
   * @param {Object} investigationData - Investigation data to validate
   * @returns {Object} - Validation result
   */
  static validateMonthlyInvestigation(investigationData) {
    const result = {
      isValid: true,
      messages: [],
    };

    // Required fields
    if (!investigationData.patient) {
      result.isValid = false;
      result.messages.push("Patient is required");
    }

    if (!investigationData.date) {
      result.isValid = false;
      result.messages.push("Date is required");
    }

    // Validate lab values
    const labValues = {
      hemoglobin: { min: 3, max: 25, unit: "g/dL" },
      urr: { min: 0, max: 100, unit: "%" },
      urea: { min: 10, max: 200, unit: "mg/dL" },
      creatinine: { min: 0.5, max: 20, unit: "mg/dL" },
      sodium: { min: 120, max: 160, unit: "mEq/L" },
      potassium: { min: 2, max: 8, unit: "mEq/L" },
      bicarbonate: { min: 10, max: 35, unit: "mEq/L" },
      chloride: { min: 80, max: 120, unit: "mEq/L" },
      calcium: { min: 6, max: 12, unit: "mg/dL" },
      phosphate: { min: 2, max: 10, unit: "mg/dL" },
      albumin: { min: 2, max: 6, unit: "g/dL" },
      totalProtein: { min: 5, max: 9, unit: "g/dL" },
      alkalinePhosphatase: { min: 20, max: 500, unit: "U/L" },
    };

    Object.keys(labValues).forEach((key) => {
      if (
        investigationData[key] !== undefined &&
        investigationData[key] !== null
      ) {
        const value = investigationData[key];
        const range = labValues[key];

        if (value < range.min || value > range.max) {
          result.isValid = false;
          result.messages.push(
            `${key} must be between ${range.min} and ${range.max} ${range.unit}`,
          );
        }
      }
    });

    return result;
  }

  /**
   * Validate clinical decision data
   * @param {Object} decisionData - Decision data to validate
   * @returns {Object} - Validation result
   */
  static validateClinicalDecision(decisionData) {
    const result = {
      isValid: true,
      messages: [],
    };

    // Required fields
    if (!decisionData.patient) {
      result.isValid = false;
      result.messages.push("Patient is required");
    }

    if (!decisionData.type) {
      result.isValid = false;
      result.messages.push("Decision type is required");
    }

    if (!decisionData.decision) {
      result.isValid = false;
      result.messages.push("Decision details are required");
    }

    // Validate enum values
    const validTypes = [
      "medication",
      "dialysis_adjustment",
      "treatment_plan",
      "dietary_advice",
      "follow_up",
    ];
    if (decisionData.type && !validTypes.includes(decisionData.type)) {
      result.isValid = false;
      result.messages.push("Invalid decision type");
    }

    const validPriorities = ["low", "medium", "high", "urgent"];
    if (
      decisionData.priority &&
      !validPriorities.includes(decisionData.priority)
    ) {
      result.isValid = false;
      result.messages.push("Invalid priority level");
    }

    const validStatuses = ["pending", "implemented", "cancelled"];
    if (decisionData.status && !validStatuses.includes(decisionData.status)) {
      result.isValid = false;
      result.messages.push("Invalid status");
    }

    return result;
  }

  /**
   * Validate AI prediction data
   * @param {Object} predictionData - Prediction data to validate
   * @returns {Object} - Validation result
   */
  static validateAIPrediction(predictionData) {
    const result = {
      isValid: true,
      messages: [],
    };

    // Required fields
    if (!predictionData.patient) {
      result.isValid = false;
      result.messages.push("Patient is required");
    }

    if (!predictionData.predictionType) {
      result.isValid = false;
      result.messages.push("Prediction type is required");
    }

    if (!predictionData.modelUsed) {
      result.isValid = false;
      result.messages.push("Model used is required");
    }

    // Validate enum values
    const validPredictionTypes = [
      "dry_weight",
      "hemoglobin",
      "urr",
      "mortality_risk",
      "hospitalization_risk",
    ];
    if (
      predictionData.predictionType &&
      !validPredictionTypes.includes(predictionData.predictionType)
    ) {
      result.isValid = false;
      result.messages.push("Invalid prediction type");
    }

    // Validate confidence score
    if (
      predictionData.confidence &&
      (predictionData.confidence < 0 || predictionData.confidence > 1)
    ) {
      result.isValid = false;
      result.messages.push("Confidence must be between 0 and 1");
    }

    // Validate accuracy score
    if (
      predictionData.accuracy &&
      (predictionData.accuracy < 0 || predictionData.accuracy > 1)
    ) {
      result.isValid = false;
      result.messages.push("Accuracy must be between 0 and 1");
    }

    return result;
  }

  /**
   * Sanitize string input
   * @param {string} input - Input string to sanitize
   * @returns {string} - Sanitized string
   */
  static sanitizeString(input) {
    if (typeof input !== "string") return input;

    return input
      .trim()
      .replace(/[<>]/g, "") // Remove potential HTML tags
      .replace(/javascript:/gi, "") // Remove javascript: protocol
      .replace(/on\w+=/gi, ""); // Remove event handlers
  }

  /**
   * Validate and sanitize user input
   * @param {Object} data - Data object to validate and sanitize
   * @param {Array} stringFields - Array of field names that should be sanitized
   * @returns {Object} - Sanitized data object
   */
  static sanitizeUserInput(data, stringFields = []) {
    const sanitized = { ...data };

    stringFields.forEach((field) => {
      if (sanitized[field]) {
        sanitized[field] = this.sanitizeString(sanitized[field]);
      }
    });

    return sanitized;
  }
}

module.exports = ValidationUtils;

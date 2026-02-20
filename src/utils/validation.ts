/**
 * Validation utilities for the renal care management system
 */

interface ValidationResult {
  isValid: boolean;
  messages: string[];
}

interface BloodPressure {
  systolic?: number;
  diastolic?: number;
}

interface DialysisSessionValidationInput {
  patient?: string;
  date?: Date;
  preWeight?: number;
  postWeight?: number;
  duration?: number;
  urr?: number;
  bloodPressure?: BloodPressure;
}

interface AIPredictionValidationInput {
  patient?: string;
  predictionType?: string;
  modelUsed?: string;
  confidence?: number;
  accuracy?: number;
}

export default class ValidationUtils {
  /*
  |--------------------------------------------------------------------------
  | Email validation
  |--------------------------------------------------------------------------
  */

  static isValidEmail(email: string): boolean {
    const regex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return regex.test(email);
  }

  /*
  |--------------------------------------------------------------------------
  | Phone validation
  |--------------------------------------------------------------------------
  */

  static isValidPhone(phone: string): boolean {
    const regex = /^\+?[\d\s-()]{10,}$/;
    return regex.test(phone);
  }

  /*
  |--------------------------------------------------------------------------
  | Password validation
  |--------------------------------------------------------------------------
  */

  static validatePassword(password: string): ValidationResult {
    const result: ValidationResult = {
      isValid: true,
      messages: [],
    };

    if (password.length < 8) {
      result.isValid = false;
      result.messages.push("Password must be at least 8 characters long");
    }

    if (!/[a-z]/.test(password)) {
      result.isValid = false;
      result.messages.push("Password must contain lowercase letter");
    }

    if (!/[A-Z]/.test(password)) {
      result.isValid = false;
      result.messages.push("Password must contain uppercase letter");
    }

    if (!/\d/.test(password)) {
      result.isValid = false;
      result.messages.push("Password must contain number");
    }

    if (!/[!@#$%^&*(),.?":{}|<>]/.test(password)) {
      result.isValid = false;
      result.messages.push("Password must contain special character");
    }

    return result;
  }

  /*
  |--------------------------------------------------------------------------
  | Patient ID validation
  |--------------------------------------------------------------------------
  */

  static isValidPatientId(patientId: string): boolean {
    return /^RHD_THP_\d{3}$/.test(patientId);
  }

  /*
  |--------------------------------------------------------------------------
  | Date range validation
  |--------------------------------------------------------------------------
  */

  static validateDateRange(startDate: Date, endDate: Date): ValidationResult {
    const result: ValidationResult = {
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

  /*
  |--------------------------------------------------------------------------
  | Dialysis session validation
  |--------------------------------------------------------------------------
  */

  static validateDialysisSession(
    data: DialysisSessionValidationInput,
  ): ValidationResult {
    const result: ValidationResult = {
      isValid: true,
      messages: [],
    };

    if (!data.patient) {
      result.isValid = false;
      result.messages.push("Patient is required");
    }

    if (!data.date) {
      result.isValid = false;
      result.messages.push("Date is required");
    }

    if (data.preWeight && (data.preWeight < 20 || data.preWeight > 200)) {
      result.isValid = false;
      result.messages.push("Pre-weight must be between 20 and 200 kg");
    }

    if (data.postWeight && (data.postWeight < 20 || data.postWeight > 200)) {
      result.isValid = false;
      result.messages.push("Post-weight must be between 20 and 200 kg");
    }

    if (data.preWeight && data.postWeight && data.postWeight > data.preWeight) {
      result.isValid = false;
      result.messages.push("Post-weight cannot exceed pre-weight");
    }

    if (data.duration && (data.duration < 0 || data.duration > 8)) {
      result.isValid = false;
      result.messages.push("Duration must be between 0 and 8 hours");
    }

    if (data.urr && (data.urr < 0 || data.urr > 100)) {
      result.isValid = false;
      result.messages.push("URR must be between 0 and 100%");
    }

    return result;
  }

  /*
  |--------------------------------------------------------------------------
  | AI prediction validation
  |--------------------------------------------------------------------------
  */

  static validateAIPrediction(
    data: AIPredictionValidationInput,
  ): ValidationResult {
    const result: ValidationResult = {
      isValid: true,
      messages: [],
    };

    if (!data.patient) {
      result.messages.push("Patient required");
      result.isValid = false;
    }

    if (!data.predictionType) {
      result.messages.push("Prediction type required");
      result.isValid = false;
    }

    if (data.confidence !== undefined) {
      if (data.confidence < 0 || data.confidence > 1) {
        result.messages.push("Confidence must be between 0 and 1");
        result.isValid = false;
      }
    }

    return result;
  }

  /*
  |--------------------------------------------------------------------------
  | Sanitize string
  |--------------------------------------------------------------------------
  */

  static sanitizeString(input: string): string {
    return input
      .trim()
      .replace(/[<>]/g, "")
      .replace(/javascript:/gi, "")
      .replace(/on\w+=/gi, "");
  }

  /*
  |--------------------------------------------------------------------------
  | Sanitize object
  |--------------------------------------------------------------------------
  */

  static sanitizeUserInput<T extends Record<string, unknown>>(
    data: T,
    fields: (keyof T)[],
  ): T {
    const sanitized = { ...data };

    for (const field of fields) {
      if (typeof sanitized[field] === "string") {
        sanitized[field] = this.sanitizeString(
          sanitized[field] as string,
        ) as T[keyof T];
      }
    }

    return sanitized;
  }
}

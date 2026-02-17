const axios = require("axios");
const Patient = require("../models/Patient");
const MonthlyInvestigation = require("../models/MonthlyInvestigation");
const DialysisSession = require("../models/DialysisSession");

class AIPredictionService {
  static ML_SERVER_BASE_URL =
    process.env.ML_SERVER_URL || "http://127.0.0.1:8001";

  /**
   * Get patient data and latest monthly investigation for Hb prediction
   * @param {String} patientId - Patient ID
   * @returns {Object} Patient data formatted for ML prediction
   */
  static async getPatientDataForHbPrediction(patientId) {
    try {
      // Get patient basic information
      const patient = await Patient.findOne({ patientId }).select(
        "patientId name",
      );

      if (!patient) {
        throw new Error("Patient not found");
      }

      // Get latest monthly investigation
      const latestInvestigation = await MonthlyInvestigation.findOne({
        patient: patient._id,
      }).sort({ date: -1 });

      if (!latestInvestigation) {
        throw new Error("No monthly investigation data found for this patient");
      }

      // Check for required fields and collect missing ones
      const requiredFields = [
        { field: "albumin", value: latestInvestigation.albumin },
        { field: "bu_post_hd", value: latestInvestigation.bu_post_hd },
        { field: "bu_pre_hd", value: latestInvestigation.bu_pre_hd },
        { field: "s_ca", value: latestInvestigation.sCa },
        { field: "scr_post_hd", value: latestInvestigation.scrPostHD },
        { field: "scr_pre_hd", value: latestInvestigation.scrPreHD },
        { field: "serum_k_post_hd", value: latestInvestigation.serumKPostHD },
        { field: "serum_k_pre_hd", value: latestInvestigation.serumKPreHD },
        { field: "serum_na_pre_hd", value: latestInvestigation.serumNaPreHD },
        { field: "ua", value: latestInvestigation.ua },
        { field: "hb", value: latestInvestigation.hb },
      ];

      const missingFields = requiredFields
        .filter(
          (item) =>
            item.value === null ||
            item.value === undefined ||
            item.value === "",
        )
        .map((item) => item.field);

      if (missingFields.length > 0) {
        throw new Error(
          `Missing required laboratory values in latest monthly investigation: ${missingFields.join(", ")}. Please ensure all required lab values are recorded before making a prediction.`,
        );
      }

      // Format data for ML server - only required fields for Hb prediction
      const predictionData = {
        albumin: latestInvestigation.albumin,
        bu_post_hd: latestInvestigation.bu_post_hd,
        bu_pre_hd: latestInvestigation.bu_pre_hd,
        s_ca: latestInvestigation.sCa,
        scr_post_hd: latestInvestigation.scrPostHD,
        scr_pre_hd: latestInvestigation.scrPreHD,
        serum_k_post_hd: latestInvestigation.serumKPostHD,
        serum_k_pre_hd: latestInvestigation.serumKPreHD,
        serum_na_pre_hd: latestInvestigation.serumNaPreHD,
        ua: latestInvestigation.ua,
        hb_diff: 0,
        hb: latestInvestigation.hb,
      };

      // Calculate Hb difference if we have previous investigation data
      if (latestInvestigation.hb) {
        const previousInvestigation = await MonthlyInvestigation.findOne({
          patient: patient._id,
          date: { $lt: latestInvestigation.date },
        })
          .sort({ date: -1 })
          .select("hb");

        if (previousInvestigation && previousInvestigation.hb) {
          predictionData.hb_diff =
            latestInvestigation.hb - previousInvestigation.hb;
          predictionData.hb_diff = Math.max(
            -5.0,
            Math.min(5.0, predictionData.hb_diff),
          );
        }
      }

      return {
        success: true,
        patientInfo: {
          patientId: patient.patientId,
          name: patient.name,
          latestInvestigationDate: latestInvestigation.date,
        },
        predictionData,
      };
    } catch (error) {
      throw new Error(`Failed to get patient data: ${error.message}`);
    }
  }

  /**
   * Predict Hemoglobin (Hb) levels using ML server
   * @param {Object} patientData - Patient data for prediction
   * @param {String} authToken - Authentication token from frontend
   * @returns {Object} Prediction result from ML server
   */
  static async predictHemoglobin(patientData, authToken) {
    try {
      const response = await axios.post(
        `${this.ML_SERVER_BASE_URL}/api/ml/predict/hb/`,
        patientData,
        {
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${authToken}`,
          },
          timeout: 30000, // 30 seconds timeout
        },
      );

      return {
        success: true,
        prediction: response.data,
        timestamp: new Date().toISOString(),
      };
    } catch (error) {
      console.error("ML Server Error:", error.message);

      if (error.response) {
        // ML server responded with an error
        const baseMessage = `ML Server Error: ${error.response.status} - ${error.response.data?.message || "Unknown error"}`;

        // Parse validation details if available
        if (error.response.data?.details) {
          const details = error.response.data.details;
          const validationErrors = [];

          // Format validation errors for better readability
          for (const [field, messages] of Object.entries(details)) {
            if (Array.isArray(messages)) {
              messages.forEach((message) => {
                validationErrors.push(`${field}: ${message}`);
              });
            } else {
              validationErrors.push(`${field}: ${messages}`);
            }
          }

          if (validationErrors.length > 0) {
            // Create a more structured error message
            const formattedMessage = `${baseMessage}. Validation issues: ${validationErrors.join("; ")}`;
            throw new Error(formattedMessage);
          }
        }

        throw new Error(baseMessage);
      } else if (error.request) {
        // ML server is not reachable
        throw new Error(
          "ML Server is not reachable. Please check if the ML server is running.",
        );
      } else {
        // Other error
        throw new Error(`Prediction service error: ${error.message}`);
      }
    }
  }

  /**
   * Get patient data and latest monthly investigation for URR prediction
   * @param {String} patientId - Patient ID
   * @returns {Object} Patient data formatted for URR ML prediction
   */
  static async getPatientDataForUrrPrediction(patientId) {
    try {
      // Get patient basic information
      const patient = await Patient.findOne({ patientId }).select(
        "patientId name",
      );

      if (!patient) {
        throw new Error("Patient not found");
      }

      // Get latest monthly investigation
      const latestInvestigation = await MonthlyInvestigation.findOne({
        patient: patient._id,
      }).sort({ date: -1 });

      if (!latestInvestigation) {
        throw new Error("No monthly investigation data found for this patient");
      }

      // Check for required fields for URR prediction (URR will be calculated)
      const requiredFields = [
        { field: "albumin", value: latestInvestigation.albumin },
        { field: "hb", value: latestInvestigation.hb },
        { field: "s_ca", value: latestInvestigation.sCa },
        { field: "serum_na_pre_hd", value: latestInvestigation.serumNaPreHD },
        { field: "serum_k_pre_hd", value: latestInvestigation.serumKPreHD },
        { field: "serum_k_post_hd", value: latestInvestigation.serumKPostHD },
        { field: "bu_pre_hd", value: latestInvestigation.bu_pre_hd },
        { field: "bu_post_hd", value: latestInvestigation.bu_post_hd },
        { field: "scr_pre_hd", value: latestInvestigation.scrPreHD },
        { field: "scr_post_hd", value: latestInvestigation.scrPostHD },
      ];

      const missingFields = requiredFields
        .filter(
          (item) =>
            item.value === null ||
            item.value === undefined ||
            item.value === "",
        )
        .map((item) => item.field);

      if (missingFields.length > 0) {
        throw new Error(
          `Missing required laboratory values for URR prediction: ${missingFields.join(", ")}. Please ensure all required lab values are recorded before making a prediction.`,
        );
      }

      // Calculate URR using formula: URR = (BU_pre_HD - BU_post_HD) / BU_pre_HD * 100%
      const buPreHD = latestInvestigation.bu_pre_hd;
      const buPostHD = latestInvestigation.bu_post_hd;

      if (buPreHD <= 0) {
        throw new Error(
          "Invalid BU Pre-HD value. Cannot calculate URR with zero or negative BU Pre-HD.",
        );
      }

      const currentURR = ((buPreHD - buPostHD) / buPreHD) * 100;

      // Format data for ML server - required fields for URR prediction
      const predictionData = {
        patient_id: patientId,
        albumin: latestInvestigation.albumin,
        hb: latestInvestigation.hb,
        s_ca: latestInvestigation.sCa,
        serum_na_pre_hd: latestInvestigation.serumNaPreHD,
        urr: currentURR,
        serum_k_pre_hd: latestInvestigation.serumKPreHD,
        serum_k_post_hd: latestInvestigation.serumKPostHD,
        bu_pre_hd: latestInvestigation.bu_pre_hd,
        bu_post_hd: latestInvestigation.bu_post_hd,
        scr_pre_hd: latestInvestigation.scrPreHD,
        scr_post_hd: latestInvestigation.scrPostHD,
      };

      // Calculate URR_diff from previous investigation
      const previousInvestigation = await MonthlyInvestigation.findOne({
        patient: patient._id,
        date: { $lt: latestInvestigation.date },
      }).sort({ date: -1 });

      if (
        previousInvestigation &&
        previousInvestigation.bu_pre_hd &&
        previousInvestigation.bu_post_hd
      ) {
        // Calculate previous URR
        const previousURR =
          ((previousInvestigation.bu_pre_hd -
            previousInvestigation.bu_post_hd) /
            previousInvestigation.bu_pre_hd) *
          100;
        predictionData.urr_diff = currentURR - previousURR;
        // Clamp URR diff to reasonable range
        predictionData.urr_diff = Math.max(
          -30.0,
          Math.min(30.0, predictionData.urr_diff),
        );
      } else {
        // Default URR diff if no previous data
        predictionData.urr_diff = 0.0;
      }

      return {
        patient: {
          patientId: patient.patientId,
          name: patient.name,
          latestInvestigationDate: latestInvestigation.date,
          calculatedURR: Math.round(currentURR * 100) / 100, // Round to 2 decimal places
        },
        predictionData,
      };
    } catch (error) {
      throw new Error(
        `Failed to prepare patient data for URR prediction: ${error.message}`,
      );
    }
  }

  /**
   * Predict URR risk using ML server
   * @param {Object} patientData - Patient data for URR prediction
   * @param {String} authToken - Authentication token from frontend
   * @returns {Object} URR prediction result from ML server
   */
  static async predictURR(patientData, authToken) {
    try {
      const response = await axios.post(
        `${this.ML_SERVER_BASE_URL}/api/ml/predict/urr/`,
        patientData,
        {
          headers: {
            Authorization: `Bearer ${authToken}`,
            "Content-Type": "application/json",
          },
          timeout: 15000, // 15 seconds timeout for prediction
        },
      );

      return {
        success: true,
        prediction: response.data,
        timestamp: new Date().toISOString(),
      };
    } catch (error) {
      if (error.response) {
        // ML server responded with error
        const errorData = error.response.data;
        throw new Error(
          `ML Server Error (${error.response.status}): ${errorData.message || errorData.error || "Unknown error"}`,
        );
      } else if (error.code === "ECONNREFUSED") {
        // ML server is not available
        throw new Error(
          "ML prediction server is currently unavailable. Please try again later.",
        );
      } else if (error.code === "ENOTFOUND") {
        // DNS resolution failed
        throw new Error(
          "Cannot connect to ML prediction server. Please check server configuration.",
        );
      } else if (error.code === "ETIMEDOUT") {
        // Request timeout
        throw new Error(
          "ML prediction request timed out. The server may be overloaded.",
        );
      } else {
        // Other error
        throw new Error(`URR prediction service error: ${error.message}`);
      }
    }
  }

  /**
   * Get patient data and latest dialysis sessions for dry weight prediction
   * @param {String} patientId - Patient ID
   * @returns {Object} Patient data formatted for dry weight ML prediction
   */
  static async getPatientDataForDryWeightPrediction(patientId) {
    try {
      // Get patient basic information
      const patient = await Patient.findOne({ patientId }).select(
        "patientId name",
      );

      if (!patient) {
        throw new Error("Patient not found");
      }

      // Get latest dialysis session
      const latestSession = await DialysisSession.findOne({
        patient: patient._id,
      }).sort({ date: -1 });

      if (!latestSession) {
        throw new Error("No dialysis session data found for this patient");
      }

      // Check for required fields for dry weight prediction
      const requiredFields = [
        {
          field: "ap",
          value: latestSession.ap,
          label: "Arterial Pressure (AP)",
        },
        { field: "auf", value: latestSession.auf, label: "Achieved UF (AUF)" },
        {
          field: "bfr",
          value: latestSession.bfr,
          label: "Blood Flow Rate (BFR)",
        },
        {
          field: "hdDuration",
          value: latestSession.hdDuration,
          label: "HD Duration",
        },
        {
          field: "puf",
          value: latestSession.puf,
          label: "Prescribed UF (PUF)",
        },
        {
          field: "tmp",
          value: latestSession.tmp,
          label: "Transmembrane Pressure (TMP)",
        },
        { field: "vp", value: latestSession.vp, label: "Venous Pressure (VP)" },
        {
          field: "preHDDryWeight",
          value: latestSession.preHDDryWeight,
          label: "Pre-HD Weight",
        },
        {
          field: "postHDDryWeight",
          value: latestSession.postHDDryWeight,
          label: "Post-HD Weight",
        },
        {
          field: "dryWeight",
          value: latestSession.dryWeight,
          label: "Dry Weight",
        },
        {
          field: "bloodPressure.systolic",
          value: latestSession.bloodPressure?.systolic,
          label: "Systolic BP",
        },
        {
          field: "bloodPressure.diastolic",
          value: latestSession.bloodPressure?.diastolic,
          label: "Diastolic BP",
        },
      ];

      const missingFields = requiredFields
        .filter(
          (item) =>
            item.value === null ||
            item.value === undefined ||
            item.value === "",
        )
        .map((item) => item.label);

      if (missingFields.length > 0) {
        throw new Error(
          `Missing required dialysis session parameters: ${missingFields.join(", ")}. Please ensure all required parameters are recorded before making a prediction.`,
        );
      }

      // Calculate weight gain
      const weightGain = latestSession.preHDDryWeight - latestSession.dryWeight;

      // Get previous sessions for rolling averages (last 3 sessions)
      const previousSessions = await DialysisSession.find({
        patient: patient._id,
        date: { $lt: latestSession.date },
      })
        .sort({ date: -1 })
        .limit(3)
        .select("preHDDryWeight dryWeight bloodPressure");

      // Calculate rolling averages
      let weightGainAvg3 = weightGain;
      let sysAvg3 = latestSession.bloodPressure.systolic;

      if (previousSessions.length > 0) {
        const weightGains = [weightGain];
        const systolicValues = [latestSession.bloodPressure.systolic];

        previousSessions.forEach((session) => {
          if (session.preHDDryWeight && session.dryWeight) {
            weightGains.push(session.preHDDryWeight - session.dryWeight);
          }
          if (session.bloodPressure?.systolic) {
            systolicValues.push(session.bloodPressure.systolic);
          }
        });

        weightGainAvg3 =
          weightGains.reduce((sum, val) => sum + val, 0) / weightGains.length;
        sysAvg3 =
          systolicValues.reduce((sum, val) => sum + val, 0) /
          systolicValues.length;
      }

      // Format data for ML server - required fields for dry weight prediction
      const predictionData = {
        patient_id: patientId,
        ap: latestSession.ap,
        auf: latestSession.auf,
        bfr: latestSession.bfr,
        hd_duration: latestSession.hdDuration / 60, // Convert minutes to hours
        puf: latestSession.puf,
        tmp: latestSession.tmp,
        vp: latestSession.vp,
        weight_gain: weightGain,
        sys: latestSession.bloodPressure.systolic,
        dia: latestSession.bloodPressure.diastolic,
        pre_hd_weight: latestSession.preHDDryWeight,
        post_hd_weight: latestSession.postHDDryWeight,
        dry_weight: latestSession.dryWeight,
        weight_gain_avg_3: Math.round(weightGainAvg3 * 100) / 100,
        sys_avg_3: Math.round(sysAvg3 * 100) / 100,
      };

      return {
        patient: {
          patientId: patient.patientId,
          name: patient.name,
          latestSessionDate: latestSession.date,
          weightGain: Math.round(weightGain * 100) / 100,
        },
        predictionData,
      };
    } catch (error) {
      throw new Error(
        `Failed to prepare patient data for dry weight prediction: ${error.message}`,
      );
    }
  }

  /**
   * Predict dry weight change using ML server
   * @param {Object} patientData - Patient data for dry weight prediction
   * @param {String} authToken - Authentication token from frontend
   * @returns {Object} Dry weight prediction result from ML server
   */
  static async predictDryWeight(patientData, authToken) {
    try {
      const response = await axios.post(
        `${this.ML_SERVER_BASE_URL}/api/ml/predict/dry-weight/`,
        patientData,
        {
          headers: {
            Authorization: `Bearer ${authToken}`,
            "Content-Type": "application/json",
          },
          timeout: 15000, // 15 seconds timeout for prediction
        },
      );

      return {
        success: true,
        prediction: response.data,
        timestamp: new Date().toISOString(),
      };
    } catch (error) {
      if (error.response) {
        // ML server responded with error
        const errorData = error.response.data;
        throw new Error(
          `ML Server Error (${error.response.status}): ${errorData.message || errorData.error || "Unknown error"}`,
        );
      } else if (error.code === "ECONNREFUSED") {
        // ML server is not available
        throw new Error(
          "ML prediction server is currently unavailable. Please try again later.",
        );
      } else if (error.code === "ENOTFOUND") {
        // DNS resolution failed
        throw new Error(
          "Cannot connect to ML prediction server. Please check server configuration.",
        );
      } else if (error.code === "ETIMEDOUT") {
        // Request timeout
        throw new Error(
          "ML prediction request timed out. The server may be overloaded.",
        );
      } else {
        // Other error
        throw new Error(
          `Dry weight prediction service error: ${error.message}`,
        );
      }
    }
  }

  /**
   * Check if ML server is available
   * @param {String} authToken - Authentication token from frontend
   * @returns {Object} Health status of ML server
   */
  static async checkMLServerHealth(authToken) {
    try {
      const response = await axios.get(`${this.ML_SERVER_BASE_URL}/health/`, {
        headers: {
          Authorization: `Bearer ${authToken}`,
        },
        timeout: 5000, // 5 seconds timeout
      });

      return {
        success: true,
        status: "online",
        serverResponse: response.data,
      };
    } catch (error) {
      return {
        success: false,
        status: "offline",
        error: error.message,
      };
    }
  }

  /**
   * Get detailed information about available ML models from ML server
   * @param {String} authToken - Authentication token from frontend
   * @returns {Object} Models information from ML server
   */
  static async getMLModelsInfo(authToken) {
    try {
      const response = await axios.get(
        `${this.ML_SERVER_BASE_URL}/api/ml/models/`,
        {
          headers: {
            Authorization: `Bearer ${authToken}`,
          },
          timeout: 10000, // 10 seconds timeout
        },
      );

      return response.data;
    } catch (error) {
      console.error("ML Models Info Error:", error.message);

      if (error.response) {
        // ML server responded with an error
        throw new Error(
          `ML Server Error: ${error.response.status} - ${error.response.data?.message || error.response.data?.error || "Unknown error"}`,
        );
      } else if (error.request) {
        // ML server is not reachable
        throw new Error(
          "ML Server is not reachable. Please check if the ML server is running.",
        );
      } else {
        // Other error
        throw new Error(`Models info service error: ${error.message}`);
      }
    }
  }
}

module.exports = AIPredictionService;

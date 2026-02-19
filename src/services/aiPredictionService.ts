import axios, { AxiosError } from "axios";

import Patient from "../models/Patient.js";
import MonthlyInvestigation from "../models/MonthlyInvestigation.js";
import envConfig from "../config/env.config.js";

/*
|--------------------------------------------------------------------------
| Types
|--------------------------------------------------------------------------
*/

interface PredictionResponse<T = unknown> {
  success: boolean;
  prediction: T;
  timestamp: string;
}

interface MLHealthResponse {
  success: boolean;
  status: "online" | "offline";
  serverResponse?: unknown;
  error?: string;
}

/*
|--------------------------------------------------------------------------
| Service
|--------------------------------------------------------------------------
*/

class AIPredictionService {
  static readonly ML_SERVER_BASE_URL = envConfig.ML_SERVER_URL;

  /*
  |--------------------------------------------------------------------------
  | Get Hb prediction data
  |--------------------------------------------------------------------------
  */

  static async getPatientDataForHbPrediction(patientId: string) {
    const patient = await Patient.findOne({
      patientId,
    }).select("patientId name");

    if (!patient) {
      throw new Error("Patient not found");
    }

    const latestInvestigation = await MonthlyInvestigation.findOne({
      patient: patient._id,
    }).sort({
      date: -1,
    });

    if (!latestInvestigation) {
      throw new Error("No investigation data found");
    }

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
      hb: latestInvestigation.hb,
      hb_diff: 0,
    };

    const previous = await MonthlyInvestigation.findOne({
      patient: patient._id,
      date: {
        $lt: latestInvestigation.date,
      },
    }).select("hb");

    if (previous?.hb && latestInvestigation.hb) {
      predictionData.hb_diff = Math.max(
        -5,
        Math.min(5, latestInvestigation.hb - previous.hb),
      );
    }

    return {
      patient: {
        patientId: patient.patientId,
        name: patient.name,
        latestInvestigationDate: latestInvestigation.date,
      },

      predictionData,
    };
  }

  /*
  |--------------------------------------------------------------------------
  | Predict Hb
  |--------------------------------------------------------------------------
  */

  static async predictHemoglobin<T = unknown>(
    data: unknown,
    authToken: string,
  ): Promise<PredictionResponse<T>> {
    try {
      const response = await axios.post<T>(
        `${this.ML_SERVER_BASE_URL}/api/ml/predict/hb/`,
        data,
        {
          headers: {
            Authorization: `Bearer ${authToken}`,
            "Content-Type": "application/json",
          },

          timeout: 30000,
        },
      );

      return {
        success: true,
        prediction: response.data,
        timestamp: new Date().toISOString(),
      };
    } catch (err) {
      throw this.handleAxiosError(err);
    }
  }

  /*
  |--------------------------------------------------------------------------
  | Predict URR
  |--------------------------------------------------------------------------
  */

  static async predictURR<T = unknown>(
    data: unknown,
    authToken: string,
  ): Promise<PredictionResponse<T>> {
    try {
      const response = await axios.post<T>(
        `${this.ML_SERVER_BASE_URL}/api/ml/predict/urr/`,
        data,
        {
          headers: {
            Authorization: `Bearer ${authToken}`,
          },
        },
      );

      return {
        success: true,
        prediction: response.data,
        timestamp: new Date().toISOString(),
      };
    } catch (err) {
      throw this.handleAxiosError(err);
    }
  }

  /*
  |--------------------------------------------------------------------------
  | Predict Dry Weight
  |--------------------------------------------------------------------------
  */

  static async predictDryWeight<T = unknown>(
    data: unknown,
    authToken: string,
  ): Promise<PredictionResponse<T>> {
    try {
      const response = await axios.post<T>(
        `${this.ML_SERVER_BASE_URL}/api/ml/predict/dry-weight/`,
        data,
        {
          headers: {
            Authorization: `Bearer ${authToken}`,
          },
        },
      );

      return {
        success: true,
        prediction: response.data,
        timestamp: new Date().toISOString(),
      };
    } catch (err) {
      throw this.handleAxiosError(err);
    }
  }

  /*
  |--------------------------------------------------------------------------
  | Health check
  |--------------------------------------------------------------------------
  */

  static async checkMLServerHealth(
    authToken: string,
  ): Promise<MLHealthResponse> {
    try {
      const response = await axios.get(`${this.ML_SERVER_BASE_URL}/health/`, {
        headers: {
          Authorization: `Bearer ${authToken}`,
        },
      });

      return {
        success: true,
        status: "online",
        serverResponse: response.data,
      };
    } catch (err) {
      return {
        success: false,
        status: "offline",
        error: err instanceof Error ? err.message : "Unknown error",
      };
    }
  }

  /*
  |--------------------------------------------------------------------------
  | Get models info
  |--------------------------------------------------------------------------
  */

  static async getMLModelsInfo(authToken: string) {
    try {
      const response = await axios.get(
        `${this.ML_SERVER_BASE_URL}/api/ml/models/`,
        {
          headers: {
            Authorization: `Bearer ${authToken}`,
          },
        },
      );

      return response.data;
    } catch (err) {
      throw this.handleAxiosError(err);
    }
  }

  /*
  |--------------------------------------------------------------------------
  | Error handler
  |--------------------------------------------------------------------------
  */

  private static handleAxiosError(err: unknown): Error {
    if (axios.isAxiosError(err)) {
      const error = err as AxiosError<any>;

      if (error.response) {
        return new Error(
          `ML Server Error (${error.response.status}): ${
            error.response.data?.message ?? "Unknown error"
          }`,
        );
      }

      if (error.code === "ECONNREFUSED") {
        return new Error("ML server offline");
      }

      return new Error(error.message);
    }

    return new Error("Unknown prediction error");
  }
}

export default AIPredictionService;

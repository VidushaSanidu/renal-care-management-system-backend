import axios, { AxiosError } from "axios";

import Patient from "../models/Patient.js";
import MonthlyInvestigation from "../models/MonthlyInvestigation.js";
import envConfig from "../config/env.config.js";
import DialysisSession from "../models/DialysisSession.js";

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
  | Get Hb prediction data
  |--------------------------------------------------------------------------
  */

  static async getPatientDataForUrrPrediction(patientId: string) {
    try {
      const patient = await Patient.findOne({ patientId })
        .select("patientId name")
        .lean();

      if (!patient) throw new Error("Patient not found");

      const latestInvestigation = await MonthlyInvestigation.findOne({
        patient: patient._id,
      })
        .sort({ date: -1 })
        .lean();

      if (!latestInvestigation)
        throw new Error("No monthly investigation data found");

      const requiredFields = {
        albumin: latestInvestigation.albumin,
        hb: latestInvestigation.hb,
        s_ca: latestInvestigation.sCa,

        serum_na_pre_hd: latestInvestigation.serumNaPreHD,

        serum_k_pre_hd: latestInvestigation.serumKPreHD,
        serum_k_post_hd: latestInvestigation.serumKPostHD,

        bu_pre_hd: latestInvestigation.bu_pre_hd,
        bu_post_hd: latestInvestigation.bu_post_hd,

        scr_pre_hd: latestInvestigation.scrPreHD,
        scr_post_hd: latestInvestigation.scrPostHD,
      };

      const missing = Object.entries(requiredFields)
        .filter(
          ([_, value]) =>
            value === null || value === undefined || Number.isNaN(value),
        )
        .map(([key]) => key);

      if (missing.length > 0)
        throw new Error(`Missing required lab values: ${missing.join(", ")}`);

      const buPreHD = latestInvestigation.bu_pre_hd;
      const buPostHD = latestInvestigation.bu_post_hd;

      if (buPreHD === null || buPreHD === undefined || Number.isNaN(buPreHD))
        throw new Error("Invalid BU Pre-HD value");

      if (buPostHD === null || buPostHD === undefined || Number.isNaN(buPostHD))
        throw new Error("Invalid BU Post-HD value");

      if (buPreHD <= 0) throw new Error("Invalid BU Pre-HD value");

      const currentURR = ((buPreHD - buPostHD) / buPreHD) * 100;

      const predictionData: any = {
        patient_id: patientId,

        albumin: latestInvestigation.albumin,
        hb: latestInvestigation.hb,

        s_ca: latestInvestigation.sCa,

        serum_na_pre_hd: latestInvestigation.serumNaPreHD,

        urr: Number(currentURR.toFixed(2)),

        serum_k_pre_hd: latestInvestigation.serumKPreHD,
        serum_k_post_hd: latestInvestigation.serumKPostHD,

        bu_pre_hd: latestInvestigation.bu_pre_hd,
        bu_post_hd: latestInvestigation.bu_post_hd,

        scr_pre_hd: latestInvestigation.scrPreHD,
        scr_post_hd: latestInvestigation.scrPostHD,
      };

      const previousInvestigation = await MonthlyInvestigation.findOne({
        patient: patient._id,

        date: { $lt: latestInvestigation.date },
      })
        .sort({ date: -1 })
        .lean();

      if (
        previousInvestigation &&
        previousInvestigation.bu_pre_hd !== null &&
        previousInvestigation.bu_pre_hd !== undefined &&
        previousInvestigation.bu_pre_hd > 0 &&
        previousInvestigation.bu_post_hd !== null &&
        previousInvestigation.bu_post_hd !== undefined
      ) {
        const previousURR =
          ((previousInvestigation.bu_pre_hd -
            previousInvestigation.bu_post_hd) /
            previousInvestigation.bu_pre_hd) *
          100;

        let urrDiff = currentURR - previousURR;

        urrDiff = Math.max(-30, Math.min(30, urrDiff));

        predictionData.urr_diff = Number(urrDiff.toFixed(2));
      } else {
        predictionData.urr_diff = 0;
      }

      return {
        patient: {
          patientId: patient.patientId,

          name: patient.name,

          latestInvestigationDate: latestInvestigation.date,

          calculatedURR: Number(currentURR.toFixed(2)),
        },

        predictionData,
      };
    } catch (error: unknown) {
      if (error instanceof Error)
        throw new Error(
          `Failed to prepare URR prediction data: ${error.message}`,
        );

      throw new Error("Failed to prepare URR prediction data");
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
| Get DryWeight prediction data
|--------------------------------------------------------------------------
*/

  static async getPatientDataForDryWeightPrediction(patientId: string) {
    try {
      const patient = await Patient.findOne({ patientId })
        .select("patientId name")
        .lean();

      if (!patient) throw new Error("Patient not found");

      const latestSession = await DialysisSession.findOne({
        patient: patient._id,
      })
        .sort({ date: -1 })
        .lean();

      if (!latestSession) throw new Error("No dialysis session data found");

      const requiredFields = [
        latestSession.ap,
        latestSession.auf,
        latestSession.bfr,
        latestSession.hdDuration,
        latestSession.puf,
        latestSession.tmp,
        latestSession.vp,
        latestSession.preHDDryWeight,
        latestSession.postHDDryWeight,
        latestSession.dryWeight,
        latestSession.bloodPressure?.systolic,
        latestSession.bloodPressure?.diastolic,
      ];

      if (requiredFields.some((v) => v === null || v === undefined))
        throw new Error("Missing required dialysis parameters");

      const fluidOverload =
        latestSession.preHDDryWeight - latestSession.dryWeight;

      const previousSessions = await DialysisSession.find({
        patient: patient._id,
        date: { $lt: latestSession.date },
      })
        .sort({ date: -1 })
        .limit(3)
        .select("preHDDryWeight dryWeight bloodPressure")
        .lean();

      const weightValues = [
        fluidOverload,
        ...previousSessions
          .map((s) => s.preHDDryWeight - s.dryWeight)
          .filter((v) => !Number.isNaN(v)),
      ];

      const sysValues = [
        latestSession.bloodPressure?.systolic ?? 0,
        ...previousSessions
          .map((s) => s.bloodPressure?.systolic)
          .filter(Boolean),
      ];

      const weightGainAvg3 =
        weightValues.reduce((a, b) => a + b, 0) / weightValues.length;

      const sysAvg3 = sysValues.reduce((a, b) => a + b, 0) / sysValues.length;

      const predictionData = {
        patient_id: patientId,

        ap: latestSession.ap,
        auf: latestSession.auf,
        bfr: latestSession.bfr,

        hd_duration: latestSession.hdDuration / 60,

        puf: latestSession.puf,
        tmp: latestSession.tmp,
        vp: latestSession.vp,

        weight_gain: fluidOverload,

        sys: latestSession.bloodPressure.systolic,
        dia: latestSession.bloodPressure.diastolic,

        pre_hd_weight: latestSession.preHDDryWeight,
        post_hd_weight: latestSession.postHDDryWeight,
        dry_weight: latestSession.dryWeight,

        weight_gain_avg_3: Number(weightGainAvg3.toFixed(2)),
        sys_avg_3: Number(sysAvg3.toFixed(2)),
      };

      return {
        patient: {
          patientId: patient.patientId,
          name: patient.name,
          latestSessionDate: latestSession.date,
          fluidOverload: Number(fluidOverload.toFixed(2)),
        },
        predictionData,
      };
    } catch (error: unknown) {
      if (error instanceof Error)
        throw new Error(`Prediction preparation failed: ${error.message}`);

      throw new Error("Prediction preparation failed");
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

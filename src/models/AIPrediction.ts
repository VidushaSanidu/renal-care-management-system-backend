import mongoose, {
  Schema,
  Types,
  Document,
  Model,
  HydratedDocument,
} from "mongoose";

import notificationService from "../services/notificationService.js";
import Patient from "./Patient.js";
import User from "./User.js";

/*
|--------------------------------------------------------------------------
| Types
|--------------------------------------------------------------------------
*/

export type PredictionSeverity = "LOW" | "MODERATE" | "HIGH" | "CRITICAL";

export type PredictionTimeframe =
  | "IMMEDIATE"
  | "HOURS"
  | "DAYS"
  | "WEEKS"
  | "MONTHS";

export type PredictionType =
  | "HYPOTENSION_RISK"
  | "FLUID_OVERLOAD"
  | "ACCESS_FAILURE"
  | "INADEQUATE_DIALYSIS"
  | "CARDIOVASCULAR_EVENT"
  | "HOSPITALIZATION_RISK"
  | "MORTALITY_RISK"
  | "MINERAL_BONE_DISORDER"
  | "ANEMIA_RISK"
  | "INFECTION_RISK"
  | "MEDICATION_ADHERENCE"
  | "QUALITY_OF_LIFE"
  | "TRANSPLANT_READINESS"
  | "DIETARY_ADHERENCE"
  | "PSYCHOLOGICAL_HEALTH";

/*
|--------------------------------------------------------------------------
| Main Interface
|--------------------------------------------------------------------------
*/

export interface IAIPrediction extends Document {
  predictionId: string;

  patient: Types.ObjectId;

  predictionType: PredictionType;

  prediction: {
    outcome: string;
    probability: number;
    confidence: number;
    severity: PredictionSeverity;
    timeframe: PredictionTimeframe;
    specificTimeframe?: {
      value: number;
      unit: "MINUTES" | "HOURS" | "DAYS" | "WEEKS" | "MONTHS";
    };
  };

  modelInfo: {
    name: string;
    version: string;
    type: "RANDOM_FOREST" | "XGBOOST" | "NEURAL_NETWORK" | "SVM" | "ENSEMBLE";
    trainingDate?: Date;
    accuracy?: number;
    precision?: number;
    recall?: number;
    f1Score?: number;
    auc?: number;
  };

  status:
    | "GENERATED"
    | "REVIEWED"
    | "APPROVED"
    | "IMPLEMENTED"
    | "MONITORED"
    | "COMPLETED"
    | "CANCELLED";

  workflow: {
    generatedAt: Date;
    generatedBy: string;
  };

  createdAt: Date;
  updatedAt: Date;
}

/*
|--------------------------------------------------------------------------
| Schema
|--------------------------------------------------------------------------
*/

const aiPredictionSchema = new Schema<IAIPrediction>(
  {
    predictionId: {
      type: String,
      unique: true,
      uppercase: true,
    },

    patient: {
      type: Schema.Types.ObjectId,
      ref: "Patient",
      required: true,
    },

    predictionType: {
      type: String,
      required: true,
      enum: [
        "HYPOTENSION_RISK",
        "FLUID_OVERLOAD",
        "ACCESS_FAILURE",
        "INADEQUATE_DIALYSIS",
        "CARDIOVASCULAR_EVENT",
        "HOSPITALIZATION_RISK",
        "MORTALITY_RISK",
        "MINERAL_BONE_DISORDER",
        "ANEMIA_RISK",
        "INFECTION_RISK",
        "MEDICATION_ADHERENCE",
        "QUALITY_OF_LIFE",
        "TRANSPLANT_READINESS",
        "DIETARY_ADHERENCE",
        "PSYCHOLOGICAL_HEALTH",
      ],
    },

    prediction: {
      outcome: { type: String, required: true },

      probability: {
        type: Number,
        required: true,
        min: 0,
        max: 100,
      },

      confidence: {
        type: Number,
        required: true,
        min: 0,
        max: 100,
      },

      severity: {
        type: String,
        enum: ["LOW", "MODERATE", "HIGH", "CRITICAL"],
        required: true,
      },

      timeframe: {
        type: String,
        enum: ["IMMEDIATE", "HOURS", "DAYS", "WEEKS", "MONTHS"],
        required: true,
      },

      specificTimeframe: {
        value: Number,

        unit: {
          type: String,
          enum: ["MINUTES", "HOURS", "DAYS", "WEEKS", "MONTHS"],
        },
      },
    },

    modelInfo: {
      name: { type: String, required: true },
      version: { type: String, required: true },

      type: {
        type: String,
        required: true,
        enum: ["RANDOM_FOREST", "XGBOOST", "NEURAL_NETWORK", "SVM", "ENSEMBLE"],
      },

      trainingDate: Date,

      accuracy: Number,
      precision: Number,
      recall: Number,
      f1Score: Number,
      auc: Number,
    },

    status: {
      type: String,
      default: "GENERATED",
      enum: [
        "GENERATED",
        "REVIEWED",
        "APPROVED",
        "IMPLEMENTED",
        "MONITORED",
        "COMPLETED",
        "CANCELLED",
      ],
    },

    workflow: {
      generatedAt: {
        type: Date,
        default: Date.now,
      },

      generatedBy: {
        type: String,
        default: "AI_SYSTEM",
      },
    },
  },

  {
    timestamps: true,
  },
);

/*
|--------------------------------------------------------------------------
| Indexes
|--------------------------------------------------------------------------
*/

aiPredictionSchema.index({ predictionId: 1 });
aiPredictionSchema.index({ patient: 1 });
aiPredictionSchema.index({ predictionType: 1 });
aiPredictionSchema.index({ "prediction.severity": 1 });
aiPredictionSchema.index({ status: 1 });

/*
|--------------------------------------------------------------------------
| Generate Prediction ID
|--------------------------------------------------------------------------
*/

aiPredictionSchema.pre("save", function () {
  if (!this.predictionId) {
    const dateStr = new Date().toISOString().slice(0, 10).replace(/-/g, "");

    const random = Math.random().toString(36).substring(2, 6).toUpperCase();

    this.predictionId = `AI${dateStr}${random}`;
  }
});

/*
|--------------------------------------------------------------------------
| Notifications Middleware
|--------------------------------------------------------------------------
*/

aiPredictionSchema.post(
  "save",
  async function (doc: HydratedDocument<IAIPrediction>) {
    try {
      // IMPORTANT FIX:
      // use doc.$isNew instead of doc.isNew
      if (
        !doc.isNew &&
        doc.prediction.severity !== "HIGH" &&
        doc.prediction.severity !== "CRITICAL"
      ) {
        return;
      }

      const patient = await Patient.findById(doc.patient).populate(
        "assignedDoctor",
      );

      if (!patient) return;

      let notificationType = "INFO";
      let priority = "MEDIUM";

      if (
        doc.prediction.severity === "HIGH" ||
        doc.prediction.probability > 80
      ) {
        notificationType = "WARNING";
        priority = "HIGH";
      }

      if (
        doc.prediction.severity === "CRITICAL" ||
        doc.prediction.probability > 90
      ) {
        notificationType = "CRITICAL";
        priority = "URGENT";
      }

      if (patient.assignedDoctor) {
        await notificationService.createNotification({
          title: `AI Prediction: ${doc.predictionType}`,
          message: `${doc.prediction.outcome} (${doc.prediction.probability}%)`,
          type: notificationType,
          priority,
          recipient: patient.assignedDoctor._id,
        });
      }

      if (notificationType === "CRITICAL") {
        const staff = await User.find({
          role: { $in: ["nurse", "admin"] },
          isActive: true,
        });

        await Promise.all(
          staff.map((s) =>
            notificationService.createNotification({
              title: `Critical AI Alert`,
              message: `${doc.predictionType}: ${doc.prediction.outcome}`,
              type: "CRITICAL",
              priority: "URGENT",
              recipient: s._id,
            }),
          ),
        );
      }
    } catch (err) {
      console.error("Notification error:", err);
    }
  },
);

/*
|--------------------------------------------------------------------------
| Model Export (Safe for hot reload)
|--------------------------------------------------------------------------
*/

const AIPrediction: Model<IAIPrediction> =
  mongoose.models.AIPrediction ||
  mongoose.model<IAIPrediction>("AIPrediction", aiPredictionSchema);

export default AIPrediction;

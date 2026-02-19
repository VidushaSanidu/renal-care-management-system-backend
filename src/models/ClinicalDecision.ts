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

export type DecisionStatus =
  | "DRAFT"
  | "PENDING_REVIEW"
  | "APPROVED"
  | "IMPLEMENTED"
  | "MODIFIED"
  | "CANCELLED";

export interface IClinicalDecision extends Document {
  decisionId: string;

  patient: Types.ObjectId;

  doctor: Types.ObjectId;

  date: Date;

  diagnosis: {
    primary: string;
    secondary?: string[];
  };

  status: DecisionStatus;

  createdAt: Date;
  updatedAt: Date;
}

/*
|--------------------------------------------------------------------------
| Schema
|--------------------------------------------------------------------------
*/

const clinicalDecisionSchema = new Schema<IClinicalDecision>(
  {
    decisionId: {
      type: String,
      unique: true,
      uppercase: true,
    },

    patient: {
      type: Schema.Types.ObjectId,
      ref: "Patient",
      required: true,
    },

    doctor: {
      type: Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },

    date: {
      type: Date,
      required: true,
      default: Date.now,
    },

    diagnosis: {
      primary: {
        type: String,
        required: true,
      },

      secondary: [String],
    },

    status: {
      type: String,
      enum: [
        "DRAFT",
        "PENDING_REVIEW",
        "APPROVED",
        "IMPLEMENTED",
        "MODIFIED",
        "CANCELLED",
      ],
      default: "DRAFT",
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

clinicalDecisionSchema.index({ decisionId: 1 });
clinicalDecisionSchema.index({ patient: 1 });
clinicalDecisionSchema.index({ doctor: 1 });
clinicalDecisionSchema.index({ date: -1 });
clinicalDecisionSchema.index({ status: 1 });

/*
|--------------------------------------------------------------------------
| Generate decision ID
|--------------------------------------------------------------------------
*/

clinicalDecisionSchema.pre("save", function () {
  if (!this.decisionId) {
    const dateStr = this.date.toISOString().slice(0, 10).replace(/-/g, "");

    const random = Math.random().toString(36).substring(2, 6).toUpperCase();

    this.decisionId = `CD${dateStr}${random}`;
  }
});

/*
|--------------------------------------------------------------------------
| Notifications middleware
|--------------------------------------------------------------------------
*/

clinicalDecisionSchema.post(
  "save",
  async function (doc: HydratedDocument<IClinicalDecision>) {
    try {
      const patient = await Patient.findById(doc.patient);

      if (!patient) return;

      /*
      |--------------------------------------------------------------------------
      | New Decision
      |--------------------------------------------------------------------------
      */

      if (doc.isNew) {
        if (doc.status === "DRAFT") {
          await notificationService.createNotification({
            title: "Clinical Decision Saved",
            message: `Clinical decision for ${patient.name} saved as draft`,
            type: "INFO",
            priority: "LOW",
            recipient: doc.doctor,
          });
        }
      }

      /*
      |--------------------------------------------------------------------------
      | Approved Decision
      |--------------------------------------------------------------------------
      */

      if (doc.status === "APPROVED") {
        const nurses = await User.find({
          role: "nurse",
          isActive: true,
        });

        await Promise.all(
          nurses.map((nurse) =>
            notificationService.createNotification({
              title: "Clinical Decision Approved",
              message: `Decision approved for ${patient.name}`,
              type: "SUCCESS",
              priority: "MEDIUM",
              recipient: nurse._id,
            }),
          ),
        );
      }

      /*
      |--------------------------------------------------------------------------
      | Critical diagnosis alert
      |--------------------------------------------------------------------------
      */

      if (
        doc.diagnosis?.primary &&
        doc.diagnosis.primary.toLowerCase().includes("critical")
      ) {
        const staff = await User.find({
          role: { $in: ["doctor", "nurse"] },
          isActive: true,
        });

        await Promise.all(
          staff.map((user) =>
            notificationService.createNotification({
              title: "Critical Clinical Decision",
              message: `${patient.name}: ${doc.diagnosis.primary}`,
              type: "CRITICAL",
              priority: "URGENT",
              recipient: user._id,
            }),
          ),
        );
      }
    } catch (err) {
      console.error("ClinicalDecision notification error:", err);
    }
  },
);

/*
|--------------------------------------------------------------------------
| Model export (Safe)
|--------------------------------------------------------------------------
*/

const ClinicalDecision: Model<IClinicalDecision> =
  mongoose.models.ClinicalDecision ||
  mongoose.model<IClinicalDecision>("ClinicalDecision", clinicalDecisionSchema);

export default ClinicalDecision;

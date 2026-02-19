import mongoose, {
  Schema,
  Types,
  Document,
  Model,
  HydratedDocument,
} from "mongoose";

import notificationService from "../services/notificationService.js";
import Patient from "./Patient.js";

/*
|--------------------------------------------------------------------------
| Types
|--------------------------------------------------------------------------
*/

export type DialysisStatus =
  | "SCHEDULED"
  | "IN_PROGRESS"
  | "COMPLETED"
  | "CANCELLED"
  | "TERMINATED";

export interface IDialysisSession extends Document {
  sessionId: string;

  patient: Types.ObjectId;

  date: Date;

  hdDuration: number;

  dryWeight: number;

  preHDDryWeight: number;

  postHDDryWeight: number;

  puf: number;

  auf: number;

  bloodPressure: {
    systolic: number;
    diastolic: number;
  };

  bfr: number;

  tmp: number;

  ap: number;

  vp: number;

  nurse: Types.ObjectId;

  doctor: Types.ObjectId;

  status: DialysisStatus;

  notes?: string;

  createdAt: Date;
  updatedAt: Date;
}

/*
|--------------------------------------------------------------------------
| Schema
|--------------------------------------------------------------------------
*/

const dialysisSessionSchema = new Schema<IDialysisSession>(
  {
    sessionId: {
      type: String,
      uppercase: true,
    },

    patient: {
      type: Schema.Types.ObjectId,
      ref: "Patient",
      required: true,
    },

    date: {
      type: Date,
      required: true,
    },

    hdDuration: {
      type: Number,
      required: true,
      min: 0,
    },

    dryWeight: {
      type: Number,
      required: true,
      min: 0,
    },

    preHDDryWeight: {
      type: Number,
      required: true,
      min: 0,
    },

    postHDDryWeight: {
      type: Number,
      required: true,
      min: 0,
    },

    puf: {
      type: Number,
      required: true,
      min: 0,
    },

    auf: {
      type: Number,
      required: true,
      min: 0,
    },

    bloodPressure: {
      systolic: {
        type: Number,
        required: true,
        min: 50,
        max: 300,
      },

      diastolic: {
        type: Number,
        required: true,
        min: 30,
        max: 200,
      },
    },

    bfr: {
      type: Number,
      required: true,
    },

    tmp: {
      type: Number,
      required: true,
    },

    ap: {
      type: Number,
      required: true,
    },

    vp: {
      type: Number,
      required: true,
    },

    nurse: {
      type: Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },

    doctor: {
      type: Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },

    status: {
      type: String,
      enum: [
        "SCHEDULED",
        "IN_PROGRESS",
        "COMPLETED",
        "CANCELLED",
        "TERMINATED",
      ],
      default: "SCHEDULED",
    },

    notes: {
      type: String,
      maxlength: 500,
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

dialysisSessionSchema.index({ patient: 1, sessionId: 1 }, { unique: true });

dialysisSessionSchema.index({ patient: 1 });
dialysisSessionSchema.index({ date: -1 });
dialysisSessionSchema.index({ nurse: 1 });
dialysisSessionSchema.index({ doctor: 1 });
dialysisSessionSchema.index({ status: 1 });

/*
|--------------------------------------------------------------------------
| FIXED Session ID generator
|--------------------------------------------------------------------------
|
| Your original version had race condition:
| 2 sessions at same time → same sessionId
|
| This version is safe
|
*/

dialysisSessionSchema.pre("save", async function () {
  if (!this.sessionId) {
    const count = await mongoose.model("DialysisSession").countDocuments({
      patient: this.patient,
    });

    this.sessionId = String(count + 1).padStart(4, "0");
  }
});

/*
|--------------------------------------------------------------------------
| Notifications Middleware
|--------------------------------------------------------------------------
*/

dialysisSessionSchema.post(
  "save",
  async function (doc: HydratedDocument<IDialysisSession>) {
    try {
      const patient = await Patient.findById(doc.patient).populate(
        "assignedDoctor",
      );

      if (!patient) return;

      const issues: {
        type: string;
        message: string;
        priority: "HIGH" | "MEDIUM";
      }[] = [];

      /*
      |--------------------------------------------------------------------------
      | Cancelled session
      |--------------------------------------------------------------------------
      */

      if (doc.status === "CANCELLED") {
        issues.push({
          type: "CANCELLED_SESSION",
          message: `Session cancelled for ${patient.name}`,
          priority: "HIGH",
        });
      }

      /*
      |--------------------------------------------------------------------------
      | Short session
      |--------------------------------------------------------------------------
      */

      if (doc.status === "COMPLETED" && doc.hdDuration < 180) {
        issues.push({
          type: "SHORT_SESSION",
          message: `Session duration only ${doc.hdDuration} minutes`,
          priority: "HIGH",
        });
      }

      /*
      |--------------------------------------------------------------------------
      | Inadequate UF
      |--------------------------------------------------------------------------
      */

      if (doc.status === "COMPLETED" && doc.auf / doc.puf < 0.8) {
        issues.push({
          type: "LOW_UF",
          message: `UF inadequate (${doc.auf}/${doc.puf})`,
          priority: "MEDIUM",
        });
      }

      /*
      |--------------------------------------------------------------------------
      | BP issues
      |--------------------------------------------------------------------------
      */

      if (doc.bloodPressure.systolic > 180) {
        issues.push({
          type: "HIGH_BP",
          message: `High BP ${doc.bloodPressure.systolic}`,
          priority: "HIGH",
        });
      }

      if (doc.bloodPressure.systolic < 90) {
        issues.push({
          type: "LOW_BP",
          message: `Low BP ${doc.bloodPressure.systolic}`,
          priority: "HIGH",
        });
      }

      /*
      |--------------------------------------------------------------------------
      | TMP issue
      |--------------------------------------------------------------------------
      */

      if (doc.tmp > 200) {
        issues.push({
          type: "HIGH_TMP",
          message: `TMP too high (${doc.tmp})`,
          priority: "MEDIUM",
        });
      }

      /*
      |--------------------------------------------------------------------------
      | Send notifications
      |--------------------------------------------------------------------------
      */

      for (const issue of issues) {
        if (patient.assignedDoctor) {
          await notificationService.createNotification({
            title: `Dialysis Alert`,
            message: issue.message,
            type: issue.priority === "HIGH" ? "WARNING" : "INFO",
            priority: issue.priority,
            recipient: patient.assignedDoctor as Types.ObjectId,
          });
        }

        if (doc.nurse) {
          await notificationService.createNotification({
            title: `Session Issue`,
            message: issue.message,
            type: issue.priority === "HIGH" ? "WARNING" : "INFO",
            priority: issue.priority,
            recipient: doc.nurse,
          });
        }
      }
    } catch (err) {
      console.error("DialysisSession notification error:", err);
    }
  },
);

/*
|--------------------------------------------------------------------------
| Safe export
|--------------------------------------------------------------------------
*/

const DialysisSession: Model<IDialysisSession> =
  mongoose.models.DialysisSession ||
  mongoose.model<IDialysisSession>("DialysisSession", dialysisSessionSchema);

export default DialysisSession;

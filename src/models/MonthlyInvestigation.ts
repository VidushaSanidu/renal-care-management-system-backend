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

export type InvestigationStatus =
  | "ORDERED"
  | "COLLECTED"
  | "PROCESSING"
  | "COMPLETED"
  | "CANCELLED";

export interface IAdditionalTest {
  testName: string;
  value: unknown;
  unit?: string;
  normalRange?: string;
  flag?: "NORMAL" | "HIGH" | "LOW" | "CRITICAL";
}

export interface IMonthlyInvestigation extends Document {
  investigationId: string;

  patient: Types.ObjectId;

  date: Date;

  scrPreHD?: number;
  scrPostHD?: number;

  bu_pre_hd?: number;
  bu_post_hd?: number;

  hb?: number;

  serumNaPreHD?: number;
  serumNaPostHD?: number;

  serumKPreHD?: number;
  serumKPostHD?: number;

  sCa?: number;
  sPhosphate?: number;

  albumin?: number;

  ua?: number;

  hco?: number;

  al?: number;

  hbA1C?: number;

  pth?: number;

  vitD?: number;

  serumIron?: number;

  serumFerritin?: number;

  additionalTests?: IAdditionalTest[];

  laboratoryInfo: {
    requestedBy: Types.ObjectId;
    performedBy?: Types.ObjectId;
    reportedBy?: Types.ObjectId;
    testingMethod?: string;
  };

  notes?: string;

  status: InvestigationStatus;

  createdAt: Date;
  updatedAt: Date;
}

/*
|--------------------------------------------------------------------------
| Schema
|--------------------------------------------------------------------------
*/

const monthlyInvestigationSchema = new Schema<IMonthlyInvestigation>(
  {
    investigationId: {
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

    scrPreHD: Number,
    scrPostHD: Number,

    bu_pre_hd: Number,
    bu_post_hd: Number,

    hb: Number,

    serumNaPreHD: Number,
    serumNaPostHD: Number,

    serumKPreHD: Number,
    serumKPostHD: Number,

    sCa: Number,

    sPhosphate: Number,

    albumin: Number,

    ua: Number,

    hco: Number,

    al: Number,

    hbA1C: Number,

    pth: Number,

    vitD: Number,

    serumIron: Number,

    serumFerritin: Number,

    additionalTests: [
      {
        testName: { type: String, required: true },

        value: { type: Schema.Types.Mixed, required: true },

        unit: String,

        normalRange: String,

        flag: {
          type: String,
          enum: ["NORMAL", "HIGH", "LOW", "CRITICAL"],
        },
      },
    ],

    laboratoryInfo: {
      requestedBy: {
        type: Schema.Types.ObjectId,
        ref: "User",
        required: true,
      },

      performedBy: {
        type: Schema.Types.ObjectId,
        ref: "User",
      },

      reportedBy: {
        type: Schema.Types.ObjectId,
        ref: "User",
      },

      testingMethod: String,
    },

    notes: {
      type: String,
      maxlength: 1000,
    },

    status: {
      type: String,
      enum: ["ORDERED", "COLLECTED", "PROCESSING", "COMPLETED", "CANCELLED"],
      default: "ORDERED",
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

monthlyInvestigationSchema.index(
  { patient: 1, investigationId: 1 },
  { unique: true },
);

monthlyInvestigationSchema.index({ patient: 1 });
monthlyInvestigationSchema.index({ date: -1 });
monthlyInvestigationSchema.index({
  "laboratoryInfo.requestedBy": 1,
});
monthlyInvestigationSchema.index({ status: 1 });

/*
|--------------------------------------------------------------------------
| FIXED Investigation ID generator
|--------------------------------------------------------------------------
*/

monthlyInvestigationSchema.pre("save", async function () {
  if (!this.investigationId) {
    const count = await mongoose.model("MonthlyInvestigation").countDocuments({
      patient: this.patient,
    });

    this.investigationId = String(count + 1).padStart(4, "0");
  }
});

/*
|--------------------------------------------------------------------------
| Notifications middleware
|--------------------------------------------------------------------------
*/

monthlyInvestigationSchema.post(
  "save",
  async function (doc: HydratedDocument<IMonthlyInvestigation>) {
    try {
      const patient = await Patient.findById(doc.patient).populate(
        "assignedDoctor",
      );

      if (!patient) return;

      const criticalValues: {
        parameter: string;
        value: string;
      }[] = [];

      /*
      |--------------------------------------------------------------------------
      | Critical checks
      |--------------------------------------------------------------------------
      */

      if (doc.hb && (doc.hb < 7 || doc.hb > 18)) {
        criticalValues.push({
          parameter: "Hemoglobin",
          value: `${doc.hb} g/dL`,
        });
      }

      if (doc.scrPreHD && doc.scrPreHD > 1200) {
        criticalValues.push({
          parameter: "Creatinine",
          value: `${doc.scrPreHD}`,
        });
      }

      if (doc.serumKPreHD && (doc.serumKPreHD < 2.5 || doc.serumKPreHD > 6.5)) {
        criticalValues.push({
          parameter: "Potassium",
          value: `${doc.serumKPreHD}`,
        });
      }

      if (doc.sPhosphate && doc.sPhosphate > 2.5) {
        criticalValues.push({
          parameter: "Phosphate",
          value: `${doc.sPhosphate}`,
        });
      }

      /*
      |--------------------------------------------------------------------------
      | Send notifications
      |--------------------------------------------------------------------------
      */

      for (const value of criticalValues) {
        if (patient.assignedDoctor) {
          await notificationService.createNotification({
            title: "Critical Lab Result",
            message: `${patient.name}: ${value.parameter} ${value.value}`,
            type: "CRITICAL",
            priority: "URGENT",
            recipient: patient.assignedDoctor._id,
          });
        }

        const staff = await User.find({
          role: { $in: ["doctor", "nurse", "admin"] },
          isActive: true,
        });

        await Promise.all(
          staff.map((user) =>
            notificationService.createNotification({
              title: "Critical Lab Alert",
              message: `${patient.name}: ${value.parameter} ${value.value}`,
              type: "CRITICAL",
              priority: "URGENT",
              recipient: user._id,
            }),
          ),
        );
      }
    } catch (err) {
      console.error("MonthlyInvestigation notification error:", err);
    }
  },
);

/*
|--------------------------------------------------------------------------
| Safe export
|--------------------------------------------------------------------------
*/

const MonthlyInvestigation: Model<IMonthlyInvestigation> =
  mongoose.models.MonthlyInvestigation ||
  mongoose.model<IMonthlyInvestigation>(
    "MonthlyInvestigation",
    monthlyInvestigationSchema,
  );

export default MonthlyInvestigation;

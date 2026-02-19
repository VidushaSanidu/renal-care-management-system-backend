import mongoose, {
  Schema,
  Types,
  Document,
  Model,
  HydratedDocument,
} from "mongoose";

import notificationService from "../services/notificationService.js";

/*
|--------------------------------------------------------------------------
| Sub Types
|--------------------------------------------------------------------------
*/

export type Gender = "Male" | "Female" | "Other";

export type PatientStatus = "ACTIVE" | "INACTIVE" | "DISCHARGED" | "DECEASED";

export interface IMedicalProblem {
  problem: string;
  diagnosedDate?: Date;
  status: "ACTIVE" | "RESOLVED" | "MANAGED";
}

export interface IPatient extends Document {
  patientId: string;

  name: string;

  dateOfBirth: Date;

  gender: Gender;

  bloodType?: string;

  contactNumber?: string;

  address?: {
    street?: string;
    city?: string;
    state?: string;
    zipCode?: string;
    country?: string;
  };

  medicalHistory?: {
    renalDiagnosis?: string;
    medicalProblems?: IMedicalProblem[];
  };

  dialysisInfo?: {
    dialysisType?: string;
    startDate?: Date;
    dryWeight?: number;
  };

  assignedDoctor?: Types.ObjectId;

  assignedNurse?: Types.ObjectId;

  status: PatientStatus;

  lastUpdated: Date;

  createdAt: Date;
  updatedAt: Date;

  age: number;

  fullAddress: string;
}

/*
|--------------------------------------------------------------------------
| MedicalProblem Schema
|--------------------------------------------------------------------------
*/

const medicalProblemSchema = new Schema<IMedicalProblem>(
  {
    problem: {
      type: String,
      required: true,
      trim: true,
    },

    diagnosedDate: Date,

    status: {
      type: String,
      enum: ["ACTIVE", "RESOLVED", "MANAGED"],
      default: "ACTIVE",
    },
  },
  { _id: false },
);

/*
|--------------------------------------------------------------------------
| Patient Schema
|--------------------------------------------------------------------------
*/

const patientSchema = new Schema<IPatient>(
  {
    patientId: {
      type: String,
      required: true,
      unique: true,
      uppercase: true,
      trim: true,
    },

    name: {
      type: String,
      required: true,
      trim: true,
      maxlength: 100,
    },

    dateOfBirth: {
      type: Date,
      required: true,
    },

    gender: {
      type: String,
      enum: ["Male", "Female", "Other"],
      required: true,
    },

    bloodType: String,

    contactNumber: String,

    address: {
      street: String,
      city: String,
      state: String,
      zipCode: String,

      country: {
        type: String,
        default: "Sri Lanka",
      },
    },

    medicalHistory: {
      renalDiagnosis: String,

      medicalProblems: [medicalProblemSchema],
    },

    dialysisInfo: {
      dialysisType: {
        type: String,
        enum: ["HEMODIALYSIS", "PERITONEAL_DIALYSIS"],
        default: "HEMODIALYSIS",
      },

      startDate: Date,

      dryWeight: Number,
    },

    assignedDoctor: {
      type: Schema.Types.ObjectId,
      ref: "User",
    },

    assignedNurse: {
      type: Schema.Types.ObjectId,
      ref: "User",
    },

    status: {
      type: String,
      enum: ["ACTIVE", "INACTIVE", "DISCHARGED", "DECEASED"],
      default: "ACTIVE",
    },

    lastUpdated: {
      type: Date,
      default: Date.now,
    },
  },

  {
    timestamps: true,

    toJSON: { virtuals: true },

    toObject: { virtuals: true },
  },
);

/*
|--------------------------------------------------------------------------
| Virtuals
|--------------------------------------------------------------------------
*/

patientSchema.virtual("age").get(function (this: IPatient) {
  if (!this.dateOfBirth) return 0;

  return Math.floor(
    (Date.now() - this.dateOfBirth.getTime()) / (1000 * 60 * 60 * 24 * 365.25),
  );
});

patientSchema.virtual("fullAddress").get(function (this: IPatient) {
  if (!this.address) return "";

  const { street, city, state, zipCode, country } = this.address;

  return [street, city, state, zipCode, country].filter(Boolean).join(", ");
});

/*
|--------------------------------------------------------------------------
| Indexes
|--------------------------------------------------------------------------
*/

patientSchema.index({ patientId: 1 });

patientSchema.index({ name: 1 });

patientSchema.index({ assignedDoctor: 1 });

patientSchema.index({ assignedNurse: 1 });

patientSchema.index({ status: 1 });

patientSchema.index({
  "dialysisInfo.dialysisType": 1,
});

/*
|--------------------------------------------------------------------------
| Update lastUpdated
|--------------------------------------------------------------------------
*/

patientSchema.pre("save", function () {
  this.lastUpdated = new Date();
});

/*
|--------------------------------------------------------------------------
| Notifications Middleware
|--------------------------------------------------------------------------
*/

patientSchema.post("save", async function (doc: HydratedDocument<IPatient>) {
  try {
    // Skip new patient
    if (doc.isNew) return;

    /*
      |--------------------------------------------------------------------------
      | Status change notifications
      |--------------------------------------------------------------------------
      */

    if (doc.isModified("status") && doc.assignedDoctor) {
      await notificationService.createNotification({
        title: "Patient Status Updated",

        message: `${doc.name} status changed to ${doc.status}`,

        type: doc.status === "DECEASED" ? "WARNING" : "INFO",

        priority: doc.status === "DECEASED" ? "HIGH" : "MEDIUM",

        category: "PATIENT_ALERT",

        recipient: doc.assignedDoctor,

        relatedEntity: {
          entityType: "Patient",
          entityId: doc._id,
        },
      });
    }

    /*
      |--------------------------------------------------------------------------
      | Doctor assignment change
      |--------------------------------------------------------------------------
      */

    if (doc.isModified("assignedDoctor") && doc.assignedDoctor) {
      await notificationService.createNotification({
        title: "New Patient Assigned",

        message: `You are now assigned to ${doc.name}`,

        type: "INFO",

        priority: "MEDIUM",

        category: "PATIENT_ALERT",

        recipient: doc.assignedDoctor,

        relatedEntity: {
          entityType: "Patient",
          entityId: doc._id,
        },
      });
    }
  } catch (err) {
    console.error("Patient notification error:", err);
  }
});

/*
|--------------------------------------------------------------------------
| Safe export
|--------------------------------------------------------------------------
*/

const Patient: Model<IPatient> =
  mongoose.models.Patient || mongoose.model<IPatient>("Patient", patientSchema);

export default Patient;

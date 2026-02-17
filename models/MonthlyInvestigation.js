const mongoose = require("mongoose");

const monthlyInvestigationSchema = new mongoose.Schema(
  {
    investigationId: {
      type: String,
      required: false,
      uppercase: true,
    },
    patient: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Patient",
      required: true,
    },
    date: {
      type: Date,
      required: [true, "Investigation date is required"],
    },

    // Laboratory Parameters
    scrPreHD: {
      type: Number,
      min: 0,
      max: 2000,
      required: false,
    },
    scrPostHD: {
      type: Number,
      min: 0,
      max: 1500,
      required: false,
    },
    bu_pre_hd: {
      type: Number,
      min: 0,
      max: 100,
      required: false,
    },
    bu_post_hd: {
      type: Number,
      min: 0,
      max: 50,
      required: false,
    },
    hb: {
      type: Number,
      min: 0,
      max: 25,
      required: false,
    },
    serumNaPreHD: {
      type: Number,
      min: 0,
      max: 150,
      required: false,
    },
    serumNaPostHD: {
      type: Number,
      min: 0,
      max: 150,
      required: false,
    },
    serumKPreHD: {
      type: Number,
      min: 0,
      max: 8.0,
      required: false,
    },
    serumKPostHD: {
      type: Number,
      min: 0,
      max: 7.0,
      required: false,
    },
    sCa: {
      type: Number,
      min: 1.5,
      max: 10,
      required: false,
    },
    sPhosphate: {
      type: Number,
      min: 0,
      max: 10,
      required: false,
    },
    albumin: {
      type: Number,
      min: 10,
      max: 60,
      required: false,
    },
    ua: {
      type: Number,
      min: 0,
      max: 1000,
      required: false,
    },
    hco: {
      type: Number,
      min: 10,
      max: 35,
      required: false,
    },
    al: {
      type: Number,
      min: 0,
      max: 500,
      required: false,
    },
    hbA1C: {
      type: Number,
      min: 4.0,
      max: 15.0,
      required: false,
    },
    pth: {
      type: Number,
      min: 0,
      max: 2000,
      required: false,
    },
    vitD: {
      type: Number,
      min: 0,
      max: 200,
      required: false,
    },
    serumIron: {
      type: Number,
      min: 0,
      max: 300,
      required: false,
    },
    serumFerritin: {
      type: Number,
      min: 0,
      max: 5000,
      required: false,
    },

    // Additional Tests (optional)
    additionalTests: [
      {
        testName: {
          type: String,
          required: true,
        },
        value: {
          type: mongoose.Schema.Types.Mixed,
          required: true,
        },
        unit: String,
        normalRange: String,
        flag: {
          type: String,
          enum: ["NORMAL", "HIGH", "LOW", "CRITICAL"],
        },
      },
    ],

    // Laboratory Information
    laboratoryInfo: {
      requestedBy: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "User",
        required: true,
      },
      performedBy: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "User",
      },
      reportedBy: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "User",
      },
      testingMethod: String,
    },

    // Notes and Comments
    notes: {
      type: String,
      maxlength: [1000, "Notes cannot exceed 1000 characters"],
    },

    // Status
    status: {
      type: String,
      enum: ["ORDERED", "COLLECTED", "PROCESSING", "COMPLETED", "CANCELLED"],
      default: "ORDERED",
    },
  },
  {
    timestamps: true,
    toJSON: { virtuals: true },
    toObject: { virtuals: true },
  },
);

// Indexes for performance
monthlyInvestigationSchema.index(
  { patient: 1, investigationId: 1 },
  { unique: true },
); // Unique per patient
monthlyInvestigationSchema.index({ patient: 1 });
monthlyInvestigationSchema.index({ date: 1 });
monthlyInvestigationSchema.index({ "laboratoryInfo.requestedBy": 1 });
monthlyInvestigationSchema.index({ status: 1 });
monthlyInvestigationSchema.index({ patient: 1, date: -1 });

// Generate investigation ID and create notifications for critical values
monthlyInvestigationSchema.pre("save", async function (next) {
  if (!this.investigationId) {
    try {
      // Count existing investigations for this patient and add 1
      const investigationCount = await this.constructor.countDocuments({
        patient: this.patient,
      });
      this.investigationId = String(investigationCount + 1);
    } catch (error) {
      return next(error);
    }
  }
  next();
});

// Post-save middleware to create notifications for critical lab values
monthlyInvestigationSchema.post("save", async function (doc) {
  try {
    const notificationService = require("../services/notificationService");
    const Patient = require("./Patient");
    const User = require("./User");

    // Get patient information
    const patient = await Patient.findById(doc.patient).populate(
      "assignedDoctor",
    );
    if (!patient) return;

    // Check for critical lab values and create notifications
    const criticalValues = [];

    // Hemoglobin - Critical if < 7.0 or > 18.0
    if (doc.hb && (doc.hb < 7.0 || doc.hb > 18.0)) {
      criticalValues.push({
        parameter: "Hemoglobin",
        value: `${doc.hb} g/dL`,
        normalRange: "12.0-15.5 g/dL",
        flag: "CRITICAL",
      });
    }

    // Serum Creatinine Pre-HD - Critical if > 1200 µmol/L
    if (doc.scrPreHD && doc.scrPreHD > 1200) {
      criticalValues.push({
        parameter: "Serum Creatinine Pre-HD",
        value: `${doc.scrPreHD} µmol/L`,
        normalRange: "60-120 µmol/L",
        flag: "CRITICAL",
      });
    }

    // Serum Potassium - Critical if < 2.5 or > 6.5
    if (doc.serumKPreHD && (doc.serumKPreHD < 2.5 || doc.serumKPreHD > 6.5)) {
      criticalValues.push({
        parameter: "Serum Potassium Pre-HD",
        value: `${doc.serumKPreHD} mmol/L`,
        normalRange: "3.5-5.0 mmol/L",
        flag: "CRITICAL",
      });
    }

    // Serum Phosphate - Critical if > 2.5
    if (doc.sPhosphate && doc.sPhosphate > 2.5) {
      criticalValues.push({
        parameter: "Serum Phosphate",
        value: `${doc.sPhosphate} mmol/L`,
        normalRange: "0.8-1.5 mmol/L",
        flag: "CRITICAL",
      });
    }

    // Create notifications for critical values
    for (const criticalValue of criticalValues) {
      // Notify assigned doctor
      if (patient.assignedDoctor) {
        await notificationService.createNotification({
          title: `Critical Lab Result: ${criticalValue.parameter}`,
          message: `Patient ${patient.name} has critical ${criticalValue.parameter} level: ${criticalValue.value}. Immediate attention required.`,
          type: "CRITICAL",
          priority: "URGENT",
          category: "LAB_RESULT",
          recipient: patient.assignedDoctor._id,
          relatedEntity: {
            entityType: "Patient",
            entityId: patient._id,
          },
          data: {
            actionRequired: true,
            labValue: criticalValue,
            actionUrl: `/patients/${patient._id}/investigations`,
          },
          expiresAt: new Date(Date.now() + 24 * 60 * 60 * 1000), // 24 hours
        });
      }

      // Notify all active doctors, nurses, and admins for critical values
      const medicalStaff = await User.find({
        role: { $in: ["doctor", "nurse", "admin"] },
        isActive: true,
      });

      for (const staff of medicalStaff) {
        if (staff._id.toString() !== patient.assignedDoctor?._id.toString()) {
          await notificationService.createNotification({
            title: `Critical Lab Alert: ${patient.name}`,
            message: `Critical ${criticalValue.parameter}: ${criticalValue.value}. Patient requires immediate medical attention.`,
            type: "CRITICAL",
            priority: "URGENT",
            category: "PATIENT_ALERT",
            recipient: staff._id,
            relatedEntity: {
              entityType: "Patient",
              entityId: patient._id,
            },
            data: {
              actionRequired: staff.role === "admin" ? false : true, // Admins get notified but may not need to take direct action
              labValue: criticalValue,
            },
            expiresAt: new Date(
              Date.now() + (staff.role === "admin" ? 24 : 12) * 60 * 60 * 1000,
            ), // 24 hours for admins, 12 for staff
          });
        }
      }
    }
  } catch (error) {
    console.error("Error creating lab result notifications:", error);
  }
});

module.exports = mongoose.model(
  "MonthlyInvestigation",
  monthlyInvestigationSchema,
);

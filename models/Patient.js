const mongoose = require("mongoose");

const medicalProblemSchema = new mongoose.Schema(
  {
    problem: {
      type: String,
      required: true,
      trim: true,
    },
    diagnosedDate: {
      type: Date,
    },
    status: {
      type: String,
      enum: ["ACTIVE", "RESOLVED", "MANAGED"],
      default: "ACTIVE",
    },
  },
  { _id: false },
);

const patientSchema = new mongoose.Schema(
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
      required: [true, "Patient name is required"],
      trim: true,
      maxlength: [100, "Name cannot exceed 100 characters"],
    },
    dateOfBirth: {
      type: Date,
      required: [true, "Date of birth is required"],
    },
    gender: {
      type: String,
      enum: ["Male", "Female", "Other"],
      required: [true, "Gender is required"],
    },
    bloodType: {
      type: String,
      enum: ["A+", "A-", "B+", "B-", "AB+", "AB-", "O+", "O-"],
      required: false,
    },
    contactNumber: {
      type: String,
      required: false,
      trim: true,
    },
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
    emergencyContact: {
      name: {
        type: String,
        required: false,
      },
      relationship: {
        type: String,
        required: false,
      },
      phone: {
        type: String,
        required: false,
      },
      email: String,
    },
    medicalHistory: {
      renalDiagnosis: {
        type: String,
        required: false,
        trim: true,
      },

      medicalProblems: [medicalProblemSchema],
      allergies: [
        {
          allergen: String,
          severity: {
            type: String,
            enum: ["MILD", "MODERATE", "SEVERE"],
            default: "MILD",
          },
          reaction: String,
        },
      ],
      medications: [
        {
          name: String,
          dosage: String,
          frequency: String,
          prescribedBy: String,
          startDate: Date,
          endDate: Date,
          status: {
            type: String,
            enum: ["ACTIVE", "DISCONTINUED", "COMPLETED"],
            default: "ACTIVE",
          },
        },
      ],
    },

    dialysisInfo: {
      dialysisType: {
        type: String,
        enum: ["HEMODIALYSIS", "PERITONEAL_DIALYSIS"],
        default: "HEMODIALYSIS",
      },
      startDate: {
        type: Date,
        required: false,
      },
      frequency: {
        type: String,
        enum: ["THRICE_WEEKLY", "TWICE_WEEKLY", "DAILY"],
        default: "THRICE_WEEKLY",
      },
      accessType: {
        type: String,
        enum: ["AVF", "AVG", "CENTRAL_CATHETER", "PERITONEAL_CATHETER"],
        required: false,
      },
      accessSite: String,
      dryWeight: {
        type: Number,
        required: false,
        min: 0,
      },
      targetUfr: {
        type: Number,
        min: 0,
      },
    },
    assignedDoctor: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: false,
    },
    assignedNurse: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
    },
    status: {
      type: String,
      enum: ["ACTIVE", "INACTIVE", "DISCHARGED", "DECEASED"],
      default: "ACTIVE",
    },
    registrationDate: {
      type: Date,
      default: Date.now,
    },
    lastUpdated: {
      type: Date,
      default: Date.now,
    },
    notes: [
      {
        content: String,
        addedBy: {
          type: mongoose.Schema.Types.ObjectId,
          ref: "User",
        },
        addedAt: {
          type: Date,
          default: Date.now,
        },
        type: {
          type: String,
          enum: ["GENERAL", "MEDICAL", "ADMINISTRATIVE"],
          default: "GENERAL",
        },
      },
    ],
  },
  {
    timestamps: true,
    toJSON: { virtuals: true },
    toObject: { virtuals: true },
  },
);

// Virtual for patient age
patientSchema.virtual("age").get(function () {
  if (!this.dateOfBirth) return null;
  return Math.floor(
    (Date.now() - this.dateOfBirth.getTime()) / (1000 * 60 * 60 * 24 * 365.25),
  );
});

// Virtual for full address
patientSchema.virtual("fullAddress").get(function () {
  if (!this.address) return "";
  const { street, city, state, zipCode, country } = this.address;
  return [street, city, state, zipCode, country].filter(Boolean).join(", ");
});

// Indexes for performance
patientSchema.index({ patientId: 1 });
patientSchema.index({ name: 1 });
patientSchema.index({ assignedDoctor: 1 });
patientSchema.index({ assignedNurse: 1 });
patientSchema.index({ status: 1 });
patientSchema.index({ "dialysisInfo.dialysisType": 1 });

// Update lastUpdated before saving
patientSchema.pre("save", function (next) {
  this.lastUpdated = Date.now();
  next();
});

// Post-save middleware to create notifications for patient status changes
patientSchema.post("save", async function (doc) {
  try {
    const notificationService = require("../services/notificationService");
    const User = require("./User");

    // Only create notifications if this is an existing patient being updated
    if (doc.isNew) return;

    // Get the original document to compare changes
    const originalDoc = doc.$__original;
    if (!originalDoc) return;

    // Check for status changes
    if (originalDoc.status !== doc.status) {
      let notificationMessage = "";
      let notificationType = "INFO";
      let notificationPriority = "MEDIUM";

      switch (doc.status) {
        case "INACTIVE":
          notificationMessage = `Patient ${doc.name} has been marked as INACTIVE.`;
          notificationType = "WARNING";
          notificationPriority = "HIGH";
          break;
        case "TRANSFERRED":
          notificationMessage = `Patient ${doc.name} has been TRANSFERRED to another facility.`;
          notificationType = "INFO";
          notificationPriority = "MEDIUM";
          break;
        case "DECEASED":
          notificationMessage = `Patient ${doc.name} status updated to DECEASED.`;
          notificationType = "INFO";
          notificationPriority = "HIGH";
          break;
        case "ACTIVE":
          notificationMessage = `Patient ${doc.name} has been reactivated.`;
          notificationType = "SUCCESS";
          notificationPriority = "MEDIUM";
          break;
      }

      if (notificationMessage) {
        // Notify assigned doctor
        if (doc.assignedDoctor) {
          await notificationService.createNotification({
            title: "Patient Status Change",
            message: notificationMessage,
            type: notificationType,
            priority: notificationPriority,
            category: "PATIENT_ALERT",
            recipient: doc.assignedDoctor,
            relatedEntity: {
              entityType: "Patient",
              entityId: doc._id,
            },
            data: {
              actionRequired:
                doc.status === "INACTIVE" || doc.status === "DECEASED",
              actionUrl: `/patients/${doc._id}`,
            },
          });
        }

        // For critical status changes, notify relevant staff
        if (doc.status === "INACTIVE" || doc.status === "DECEASED") {
          const relevantStaff = await User.find({
            role: { $in: ["doctor", "nurse"] },
            isActive: true,
          }).limit(5); // Limit to avoid spam

          for (const staff of relevantStaff) {
            if (staff._id.toString() !== doc.assignedDoctor?.toString()) {
              await notificationService.createNotification({
                title: `Patient Status Update: ${doc.name}`,
                message:
                  notificationMessage +
                  " Please review patient records and update care plans accordingly.",
                type: notificationType,
                priority: notificationPriority,
                category: "PATIENT_ALERT",
                recipient: staff._id,
                relatedEntity: {
                  entityType: "Patient",
                  entityId: doc._id,
                },
                data: {
                  actionRequired: false,
                },
              });
            }
          }
        }
      }
    }

    // Check for doctor assignment changes
    if (
      originalDoc.assignedDoctor?.toString() !== doc.assignedDoctor?.toString()
    ) {
      // Notify new assigned doctor
      if (doc.assignedDoctor) {
        await notificationService.createNotification({
          title: "New Patient Assignment",
          message: `You have been assigned as the primary doctor for patient ${doc.name}.`,
          type: "INFO",
          priority: "MEDIUM",
          category: "PATIENT_ALERT",
          recipient: doc.assignedDoctor,
          relatedEntity: {
            entityType: "Patient",
            entityId: doc._id,
          },
          data: {
            actionRequired: true,
            actionUrl: `/patients/${doc._id}`,
          },
        });
      }

      // Notify previous assigned doctor
      if (originalDoc.assignedDoctor) {
        await notificationService.createNotification({
          title: "Patient Assignment Change",
          message: `Patient ${doc.name} has been reassigned to another doctor. Please ensure proper handover.`,
          type: "INFO",
          priority: "MEDIUM",
          category: "PATIENT_ALERT",
          recipient: originalDoc.assignedDoctor,
          relatedEntity: {
            entityType: "Patient",
            entityId: doc._id,
          },
          data: {
            actionRequired: true,
          },
        });
      }
    }
  } catch (error) {
    console.error("Error creating patient status change notifications:", error);
  }
});

module.exports = mongoose.model("Patient", patientSchema);

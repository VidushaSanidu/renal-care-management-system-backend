const mongoose = require("mongoose");

const notificationSchema = new mongoose.Schema(
  {
    title: {
      type: String,
      required: [true, "Notification title is required"],
      trim: true,
      maxlength: [200, "Title cannot exceed 200 characters"],
    },
    message: {
      type: String,
      required: [true, "Notification message is required"],
      trim: true,
      maxlength: [500, "Message cannot exceed 500 characters"],
    },
    type: {
      type: String,
      enum: ["INFO", "WARNING", "CRITICAL", "SUCCESS"],
      required: true,
      default: "INFO",
    },
    priority: {
      type: String,
      enum: ["LOW", "MEDIUM", "HIGH", "URGENT"],
      default: "MEDIUM",
    },
    category: {
      type: String,
      enum: [
        "PATIENT_ALERT",
        "LAB_RESULT",
        "APPOINTMENT_REMINDER",
        "DIALYSIS_ALERT",
        "AI_PREDICTION",
        "SYSTEM_ALERT",
      ],
      required: true,
    },

    // Recipient
    recipient: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },

    // Read status
    isRead: {
      type: Boolean,
      default: false,
    },
    readAt: {
      type: Date,
    },

    // Related entity (optional)
    relatedEntity: {
      entityType: {
        type: String,
        enum: ["Patient", "DialysisSession", "MonthlyInvestigation", "User"],
      },
      entityId: {
        type: mongoose.Schema.Types.ObjectId,
        refPath: "relatedEntity.entityType",
      },
    },

    // Additional data (optional)
    data: {
      actionRequired: {
        type: Boolean,
        default: false,
      },
      actionUrl: String,

      // For lab results
      labValue: {
        parameter: String,
        value: String,
        normalRange: String,
        flag: {
          type: String,
          enum: ["NORMAL", "HIGH", "LOW", "CRITICAL"],
        },
      },

      // For appointments
      appointmentDate: Date,
      appointmentType: String,
    },

    // Created by
    createdBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
    },

    // Expiration (optional)
    expiresAt: {
      type: Date,
    },
  },
  {
    timestamps: true,
  },
);

// Indexes for performance
notificationSchema.index({ recipient: 1 });
notificationSchema.index({ recipient: 1, isRead: 1 });
notificationSchema.index({ type: 1 });
notificationSchema.index({ priority: 1 });
notificationSchema.index({ category: 1 });
notificationSchema.index({ createdAt: -1 });
notificationSchema.index({ expiresAt: 1 }, { expireAfterSeconds: 0 });

// Virtual for checking if notification is expired
notificationSchema.virtual("isExpired").get(function () {
  return this.expiresAt && this.expiresAt < new Date();
});

module.exports = mongoose.model("Notification", notificationSchema);

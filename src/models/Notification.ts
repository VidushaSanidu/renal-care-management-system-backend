import type { Types, Model } from "mongoose";
import mongoose, { Schema } from "mongoose";

/*
|--------------------------------------------------------------------------
| Types
|--------------------------------------------------------------------------
*/

export type NotificationType = "INFO" | "WARNING" | "CRITICAL" | "SUCCESS";

export type NotificationPriority = "LOW" | "MEDIUM" | "HIGH" | "URGENT";

export type NotificationCategory =
  | "PATIENT_ALERT"
  | "LAB_RESULT"
  | "APPOINTMENT_REMINDER"
  | "DIALYSIS_ALERT"
  | "AI_PREDICTION"
  | "SYSTEM_ALERT";

export type RelatedEntityType =
  | "Patient"
  | "DialysisSession"
  | "MonthlyInvestigation"
  | "User";

export interface INotification {
  title: string;

  message: string;

  type: NotificationType;

  priority: NotificationPriority;

  category: NotificationCategory;

  recipient: Types.ObjectId;

  isRead: boolean;

  readAt?: Date;

  relatedEntity?: {
    entityType: RelatedEntityType;
    entityId: Types.ObjectId;
  };

  data?: {
    actionRequired?: boolean;
    actionUrl?: string;

    labValue?: {
      parameter?: string;
      value?: string;
      normalRange?: string;
      flag?: "NORMAL" | "HIGH" | "LOW" | "CRITICAL";
    };

    appointmentDate?: Date;
    appointmentType?: string;
  };

  createdBy?: Types.ObjectId;

  expiresAt?: Date;

  createdAt: Date;
  updatedAt: Date;

  isExpired: boolean;
}

/*
|--------------------------------------------------------------------------
| Schema
|--------------------------------------------------------------------------
*/

const notificationSchema = new Schema<INotification>(
  {
    title: {
      type: String,
      required: true,
      trim: true,
      maxlength: 200,
    },

    message: {
      type: String,
      required: true,
      trim: true,
      maxlength: 500,
    },

    type: {
      type: String,
      enum: ["INFO", "WARNING", "CRITICAL", "SUCCESS"],
      default: "INFO",
      required: true,
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

    recipient: {
      type: Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },

    isRead: {
      type: Boolean,
      default: false,
    },

    readAt: Date,

    relatedEntity: {
      entityType: {
        type: String,
        enum: ["Patient", "DialysisSession", "MonthlyInvestigation", "User"],
      },

      entityId: {
        type: Schema.Types.ObjectId,
        refPath: "relatedEntity.entityType",
      },
    },

    data: {
      actionRequired: {
        type: Boolean,
        default: false,
      },

      actionUrl: String,

      labValue: {
        parameter: String,
        value: String,
        normalRange: String,

        flag: {
          type: String,
          enum: ["NORMAL", "HIGH", "LOW", "CRITICAL"],
        },
      },

      appointmentDate: Date,

      appointmentType: String,
    },

    createdBy: {
      type: Schema.Types.ObjectId,
      ref: "User",
    },

    expiresAt: Date,
  },

  {
    timestamps: true,

    toJSON: { virtuals: true },

    toObject: { virtuals: true },
  },
);

/*
|--------------------------------------------------------------------------
| Indexes
|--------------------------------------------------------------------------
*/

notificationSchema.index({ recipient: 1 });

notificationSchema.index({ recipient: 1, isRead: 1 });

notificationSchema.index({ type: 1 });

notificationSchema.index({ priority: 1 });

notificationSchema.index({ category: 1 });

notificationSchema.index({ createdAt: -1 });

notificationSchema.index({ expiresAt: 1 }, { expireAfterSeconds: 0 });

/*
|--------------------------------------------------------------------------
| Virtual — isExpired
|--------------------------------------------------------------------------
*/

notificationSchema.virtual("isExpired").get(function (this: INotification) {
  return !!(this.expiresAt && this.expiresAt.getTime() < Date.now());
});

/*
|--------------------------------------------------------------------------
| Safe export
|--------------------------------------------------------------------------
*/

const Notification: Model<INotification> =
  mongoose.models.Notification ||
  mongoose.model<INotification>("Notification", notificationSchema);

export default Notification;

const mongoose = require("mongoose");

const aiPredictionSchema = new mongoose.Schema(
  {
    predictionId: {
      type: String,
      required: false,
      unique: true,
      uppercase: true,
    },
    patient: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Patient",
      required: true,
    },

    // Prediction Details
    predictionType: {
      type: String,
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
      required: true,
    },

    prediction: {
      outcome: {
        type: String,
        required: true,
      },
      probability: {
        type: Number,
        min: 0,
        max: 100,
        required: true,
      },
      confidence: {
        type: Number,
        min: 0,
        max: 100,
        required: true,
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

    // Model Information
    model: {
      name: {
        type: String,
        required: true,
      },
      version: {
        type: String,
        required: true,
      },
      type: {
        type: String,
        enum: ["RANDOM_FOREST", "XGBOOST", "NEURAL_NETWORK", "SVM", "ENSEMBLE"],
        required: true,
      },
      trainingDate: Date,
      accuracy: {
        type: Number,
        min: 0,
        max: 100,
      },
      precision: {
        type: Number,
        min: 0,
        max: 100,
      },
      recall: {
        type: Number,
        min: 0,
        max: 100,
      },
      f1Score: {
        type: Number,
        min: 0,
        max: 100,
      },
      auc: {
        type: Number,
        min: 0,
        max: 1,
      },
    },

    // Input Data
    inputData: {
      dialysisSession: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "DialysisSession",
      },
      monthlyInvestigation: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "MonthlyInvestigation",
      },

      // Clinical parameters used in prediction
      clinicalParameters: {
        demographics: {
          age: Number,
          gender: String,
          bmi: Number,
          diabetic: Boolean,
          hypertensive: Boolean,
          cardiovascularDisease: Boolean,
        },

        dialysisHistory: {
          vintageMonths: Number,
          accessType: String,
          frequencyPerWeek: Number,
          averageSessionDuration: Number,
          averageUfRate: Number,
        },

        recentVitals: {
          preDialysisWeight: Number,
          postDialysisWeight: Number,
          weightGain: Number,
          systolicBP: Number,
          diastolicBP: Number,
          heartRate: Number,
          temperature: Number,
        },

        labValues: {
          hemoglobin: Number,
          hematocrit: Number,
          albumin: Number,
          creatinine: Number,
          potassium: Number,
          phosphorus: Number,
          calcium: Number,
          sodium: Number,
          ktv: Number,
          urr: Number,
        },

        medications: [
          {
            name: String,
            adherence: Number,
          },
        ],

        historicalTrends: {
          weightTrend: String,
          bpTrend: String,
          labTrend: String,
          adherenceTrend: String,
        },
      },

      // Feature importance
      featureImportance: [
        {
          feature: String,
          importance: Number,
          impact: {
            type: String,
            enum: ["POSITIVE", "NEGATIVE", "NEUTRAL"],
          },
        },
      ],

      // Data quality metrics
      dataQuality: {
        completeness: {
          type: Number,
          min: 0,
          max: 100,
        },
        accuracy: {
          type: Number,
          min: 0,
          max: 100,
        },
        timeliness: {
          type: Number,
          min: 0,
          max: 100,
        },
        consistency: {
          type: Number,
          min: 0,
          max: 100,
        },
        missingValues: Number,
        outliers: Number,
      },
    },

    // Recommendations
    recommendations: [
      {
        category: {
          type: String,
          enum: [
            "MEDICATION",
            "DIALYSIS",
            "MONITORING",
            "LIFESTYLE",
            "INVESTIGATION",
            "REFERRAL",
          ],
        },
        action: {
          type: String,
          required: true,
        },
        priority: {
          type: String,
          enum: ["LOW", "MEDIUM", "HIGH", "URGENT"],
          default: "MEDIUM",
        },
        urgency: {
          type: String,
          enum: ["IMMEDIATE", "WITHIN_HOURS", "WITHIN_DAYS", "ROUTINE"],
        },
        evidence: String,
        expectedBenefit: String,
        riskIfIgnored: String,

        // Implementation details
        implementation: {
          who: String,
          when: String,
          where: String,
          how: String,
          duration: String,
        },

        // Follow-up
        followUp: {
          required: {
            type: Boolean,
            default: false,
          },
          timeframe: String,
          parameters: [String],
        },
      },
    ],

    // Explainability
    explainability: {
      shap: {
        values: [
          {
            feature: String,
            value: Number,
            contribution: Number,
          },
        ],
        baseValue: Number,
        expectedValue: Number,
      },

      lime: {
        explanation: String,
        localImportance: [
          {
            feature: String,
            importance: Number,
          },
        ],
      },

      naturalLanguage: {
        summary: String,
        keyFactors: [String],
        reasoning: String,
        uncertainty: String,
      },

      // Visualization data
      visualizations: {
        charts: [
          {
            type: String,
            data: mongoose.Schema.Types.Mixed,
            config: mongoose.Schema.Types.Mixed,
          },
        ],

        similarCases: [
          {
            patientId: String,
            similarity: Number,
            outcome: String,
            description: String,
          },
        ],
      },
    },

    // Validation and Performance
    validation: {
      crossValidation: {
        folds: Number,
        avgAccuracy: Number,
        stdAccuracy: Number,
      },

      retrospectiveValidation: {
        tested: {
          type: Boolean,
          default: false,
        },
        accuracy: Number,
        falsePositives: Number,
        falseNegatives: Number,
        truePositives: Number,
        trueNegatives: Number,
      },

      realWorldValidation: {
        tested: {
          type: Boolean,
          default: false,
        },
        outcome: String,
        actualResult: String,
        accuracy: Boolean,
        timeToEvent: Number,
        notes: String,
      },
    },

    // Clinical Context
    clinicalContext: {
      currentCondition: String,
      comorbidities: [String],
      medications: [String],
      recentEvents: [String],
      socialFactors: [String],

      // Risk factors
      riskFactors: [
        {
          factor: String,
          presence: Boolean,
          severity: String,
          modifiable: Boolean,
        },
      ],

      // Protective factors
      protectiveFactors: [
        {
          factor: String,
          presence: Boolean,
          strength: String,
        },
      ],
    },

    // Decision Support
    decisionSupport: {
      alerts: [
        {
          level: {
            type: String,
            enum: ["INFO", "WARNING", "CRITICAL"],
          },
          message: String,
          actionRequired: Boolean,
          deadline: Date,
        },
      ],

      guidelines: [
        {
          source: String,
          recommendation: String,
          evidenceLevel: String,
          applicability: String,
        },
      ],

      protocols: [
        {
          name: String,
          triggered: Boolean,
          steps: [String],
        },
      ],
    },

    // Outcome Tracking
    outcomeTracking: {
      predicted: {
        type: Boolean,
        default: false,
      },
      actual: {
        occurred: Boolean,
        date: Date,
        severity: String,
        description: String,
      },

      // Intervention tracking
      interventions: [
        {
          type: String,
          implemented: Boolean,
          implementedAt: Date,
          implementedBy: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "User",
          },
          effectiveness: String,
          notes: String,
        },
      ],

      // Follow-up outcomes
      followUpOutcomes: [
        {
          parameter: String,
          baseline: Number,
          target: Number,
          actual: Number,
          date: Date,
          improved: Boolean,
        },
      ],
    },

    // Status and Workflow
    status: {
      type: String,
      enum: [
        "GENERATED",
        "REVIEWED",
        "APPROVED",
        "IMPLEMENTED",
        "MONITORED",
        "COMPLETED",
        "CANCELLED",
      ],
      default: "GENERATED",
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

      reviewedBy: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "User",
      },
      reviewedAt: Date,
      reviewComments: String,

      approvedBy: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "User",
      },
      approvedAt: Date,

      implementedBy: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "User",
      },
      implementedAt: Date,

      dismissed: {
        type: Boolean,
        default: false,
      },
      dismissedBy: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "User",
      },
      dismissedAt: Date,
      dismissalReason: String,
    },

    // Audit and Compliance
    audit: {
      actions: [
        {
          action: String,
          performedBy: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "User",
          },
          performedAt: {
            type: Date,
            default: Date.now,
          },
          details: String,
        },
      ],

      compliance: {
        regulatoryCompliance: {
          type: Boolean,
          default: true,
        },
        ethicalCompliance: {
          type: Boolean,
          default: true,
        },
        qualityStandards: {
          type: Boolean,
          default: true,
        },
      },

      dataGovernance: {
        dataSource: String,
        dataConsent: Boolean,
        dataRetention: String,
        dataSharing: String,
      },
    },

    // Feedback and Learning
    feedback: {
      clinicalFeedback: [
        {
          feedbackBy: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "User",
          },
          rating: {
            type: Number,
            min: 1,
            max: 5,
          },
          usefulness: {
            type: Number,
            min: 1,
            max: 5,
          },
          accuracy: {
            type: Number,
            min: 1,
            max: 5,
          },
          comments: String,
          suggestions: String,
          providedAt: {
            type: Date,
            default: Date.now,
          },
        },
      ],

      modelImprovement: {
        contributed: {
          type: Boolean,
          default: false,
        },
        improvements: [String],
        retrainingTriggered: {
          type: Boolean,
          default: false,
        },
      },
    },
  },
  {
    timestamps: true,
    toJSON: { virtuals: true },
    toObject: { virtuals: true },
  },
);

// Indexes for performance
aiPredictionSchema.index({ predictionId: 1 });
aiPredictionSchema.index({ patient: 1 });
aiPredictionSchema.index({ predictionType: 1 });
aiPredictionSchema.index({ "prediction.severity": 1 });
aiPredictionSchema.index({ status: 1 });
aiPredictionSchema.index({ patient: 1, createdAt: -1 });
aiPredictionSchema.index({ "workflow.generatedAt": -1 });

// Generate prediction ID
aiPredictionSchema.pre("save", function (next) {
  if (!this.predictionId) {
    const date = new Date();
    const dateStr = date.toISOString().slice(0, 10).replace(/-/g, "");
    const random = Math.random().toString(36).substr(2, 4).toUpperCase();
    this.predictionId = `AI${dateStr}${random}`;
  }
  next();
});

// Post-save middleware to create notifications for high-risk AI predictions
aiPredictionSchema.post("save", async function (doc) {
  try {
    const notificationService = require("../services/notificationService");
    const Patient = require("./Patient");
    const User = require("./User");

    // Only create notifications for new predictions or high-risk predictions
    if (
      !doc.isNew &&
      doc.prediction.severity !== "HIGH" &&
      doc.prediction.severity !== "CRITICAL"
    ) {
      return;
    }

    // Get patient information
    const patient = await Patient.findById(doc.patient).populate(
      "assignedDoctor",
    );
    if (!patient) return;

    // Determine notification priority based on prediction severity and probability
    let notificationType = "INFO";
    let notificationPriority = "MEDIUM";

    if (doc.prediction.severity === "HIGH" || doc.prediction.probability > 80) {
      notificationType = "WARNING";
      notificationPriority = "HIGH";
    }

    if (
      doc.prediction.severity === "CRITICAL" ||
      doc.prediction.probability > 90
    ) {
      notificationType = "CRITICAL";
      notificationPriority = "URGENT";
    }

    // Create notification for assigned doctor
    if (patient.assignedDoctor) {
      await notificationService.createNotification({
        title: `AI Prediction: ${doc.predictionType.replace("_", " ")}`,
        message: `${doc.prediction.outcome} (${doc.prediction.probability}% probability, ${doc.prediction.confidence}% confidence)`,
        type: notificationType,
        priority: notificationPriority,
        category: "AI_PREDICTION",
        recipient: patient.assignedDoctor._id,
        relatedEntity: {
          entityType: "Patient",
          entityId: patient._id,
        },
        data: {
          actionRequired:
            doc.prediction.severity === "HIGH" ||
            doc.prediction.severity === "CRITICAL",
          actionUrl: `/patients/${patient._id}/predictions/${doc._id}`,
        },
      });
    }

    // For critical predictions, also notify nurses and admins
    if (
      doc.prediction.severity === "CRITICAL" ||
      doc.prediction.probability > 90
    ) {
      const medicalStaff = await User.find({
        role: { $in: ["nurse", "admin"] },
        isActive: true,
      });

      for (const staff of medicalStaff) {
        await notificationService.createNotification({
          title: `Critical AI Alert: ${patient.name}`,
          message: `High-risk prediction for ${doc.predictionType.replace("_", " ")}: ${doc.prediction.outcome}`,
          type: "CRITICAL",
          priority: "URGENT",
          category: "AI_PREDICTION",
          recipient: staff._id,
          relatedEntity: {
            entityType: "Patient",
            entityId: patient._id,
          },
          data: {
            actionRequired: staff.role === "admin" ? false : true, // Admins get notified but may not need to take direct action
            actionUrl: `/patients/${patient._id}/predictions/${doc._id}`,
          },
          expiresAt: new Date(
            Date.now() + (staff.role === "admin" ? 24 : 8) * 60 * 60 * 1000,
          ), // 24 hours for admins, 8 for nurses
        });
      }
    }
  } catch (error) {
    console.error("Error creating AI prediction notifications:", error);
  }
});

module.exports = mongoose.model("AIPrediction", aiPredictionSchema);
